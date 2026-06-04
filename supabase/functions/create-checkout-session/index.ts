import { handleCors } from "../_shared/cors.ts";
import { jsonResponse, requireEnv } from "../_shared/http.ts";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const provider = body.provider ?? "stripe";
    const supabase = createAdminClient();

    const { data: plan, error: planError } = await supabase
      .from("saas_plans")
      .select("*")
      .eq("id", body.planId)
      .single();

    if (planError) throw planError;

    const { data: session, error: sessionError } = await supabase
      .from("checkout_sessions")
      .insert({
        provider,
        plan_id: plan.id,
        business_name: body.businessName,
        business_type: body.businessType,
        owner_name: body.ownerName,
        owner_email: body.ownerEmail,
        owner_phone: body.ownerPhone,
        metadata: body,
      })
      .select("*")
      .single();

    if (sessionError) throw sessionError;

    const checkout = provider === "mercadopago"
      ? await createMercadoPagoPreference(plan, session, body)
      : await createStripeCheckout(plan, session, body);

    await supabase
      .from("checkout_sessions")
      .update({
        checkout_url: checkout.url,
        provider_session_id: checkout.providerSessionId,
      })
      .eq("id", session.id);

    return jsonResponse({ checkoutUrl: checkout.url, checkoutSessionId: session.id });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
});

async function createStripeCheckout(plan: any, session: any, body: any) {
  const stripeSecretKey = requireEnv("STRIPE_SECRET_KEY");
  const appUrl = requireEnv("APP_URL");
  const params = new URLSearchParams({
    mode: "subscription",
    success_url: `${appUrl}/admin?checkout=success`,
    cancel_url: `${appUrl}/?checkout=cancel`,
    customer_email: body.ownerEmail,
    "metadata[checkout_session_id]": session.id,
    "metadata[business_name]": body.businessName,
    "metadata[business_type]": body.businessType,
    "metadata[owner_name]": body.ownerName,
    "metadata[owner_phone]": body.ownerPhone ?? "",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "brl",
    "line_items[0][price_data][recurring][interval]": "month",
    "line_items[0][price_data][product_data][name]": `AgendaPro ${plan.name}`,
    "line_items[0][price_data][unit_amount]": String(Number(plan.price) * 100),
    subscription_data: "",
    "subscription_data[trial_period_days]": String(plan.trial_days),
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message ?? "Stripe checkout failed");
  return { url: data.url, providerSessionId: data.id };
}

async function createMercadoPagoPreference(plan: any, session: any, body: any) {
  const accessToken = requireEnv("MERCADOPAGO_ACCESS_TOKEN");
  const appUrl = requireEnv("APP_URL");
  const supabaseUrl = requireEnv("SUPABASE_URL");

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [
        {
          title: `AgendaPro ${plan.name}`,
          quantity: 1,
          unit_price: Number(plan.price),
          currency_id: "BRL",
        },
      ],
      payer: {
        email: body.ownerEmail,
        name: body.ownerName,
      },
      external_reference: session.id,
      notification_url: `${supabaseUrl}/functions/v1/payment-webhook?provider=mercadopago`,
      back_urls: {
        success: `${appUrl}/admin?checkout=success`,
        failure: `${appUrl}/?checkout=failure`,
        pending: `${appUrl}/?checkout=pending`,
      },
      auto_return: "approved",
      metadata: {
        checkout_session_id: session.id,
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? "Mercado Pago preference failed");
  return { url: data.init_point, providerSessionId: data.id };
}
