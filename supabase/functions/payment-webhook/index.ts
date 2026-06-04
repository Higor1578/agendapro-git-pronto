import Stripe from "npm:stripe@17";
import { handleCors } from "../_shared/cors.ts";
import { jsonResponse } from "../_shared/http.ts";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";
import { provisionStore } from "../_shared/storeProvisioning.ts";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const provider = new URL(req.url).searchParams.get("provider") ?? "stripe";
  const supabase = createAdminClient();

  try {
    const payloadText = await req.text();
    const event = provider === "mercadopago"
      ? await parseMercadoPagoEvent(payloadText)
      : await parseStripeEvent(req, payloadText);

    const { data: storedEvent, error: eventError } = await supabase
      .from("payment_events")
      .insert({
        provider,
        event_id: event.id,
        event_type: event.type,
        payload: event.raw,
      })
      .select("*")
      .single();

    if (eventError) throw eventError;

    if (event.checkoutSessionId && event.paid) {
      await completeCheckout(supabase, event.checkoutSessionId, provider, event);
      await supabase.from("payment_events").update({ processed: true }).eq("id", storedEvent.id);
    }

    return jsonResponse({ received: true });
  } catch (error) {
    return jsonResponse({ error: error.message }, 400);
  }
});

async function parseStripeEvent(req: Request, payloadText: string) {
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const signature = req.headers.get("stripe-signature");

  let stripeEvent: any;
  if (secret && signature) {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2024-12-18.acacia",
    });
    stripeEvent = await stripe.webhooks.constructEventAsync(payloadText, signature, secret);
  } else {
    stripeEvent = JSON.parse(payloadText);
  }

  const object = stripeEvent.data?.object ?? {};
  return {
    id: stripeEvent.id,
    type: stripeEvent.type,
    raw: stripeEvent,
    paid: stripeEvent.type === "checkout.session.completed" || object.payment_status === "paid",
    checkoutSessionId: object.metadata?.checkout_session_id,
    providerCustomerId: object.customer,
    providerSubscriptionId: object.subscription,
  };
}

async function parseMercadoPagoEvent(payloadText: string) {
  const payload = JSON.parse(payloadText || "{}");
  const paymentId = payload.data?.id ?? payload.id;
  let payment = payload;

  if (paymentId && Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")) {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")}`,
      },
    });
    if (response.ok) payment = await response.json();
  }

  return {
    id: String(payment.id ?? crypto.randomUUID()),
    type: String(payload.type ?? payload.action ?? "payment"),
    raw: payment,
    paid: payment.status === "approved",
    checkoutSessionId: payment.external_reference ?? payment.metadata?.checkout_session_id,
    providerCustomerId: payment.payer?.id ? String(payment.payer.id) : undefined,
    providerSubscriptionId: payment.preapproval_id ? String(payment.preapproval_id) : undefined,
  };
}

async function completeCheckout(supabase: any, checkoutSessionId: string, provider: string, event: any) {
  const { data: session, error } = await supabase
    .from("checkout_sessions")
    .select("*")
    .eq("id", checkoutSessionId)
    .single();

  if (error) throw error;
  if (session.status === "paid" && session.business_id) return;

  const provisioned = await provisionStore(supabase, {
    businessName: session.business_name,
    businessType: session.business_type,
    ownerName: session.owner_name,
    ownerEmail: session.owner_email,
    ownerPhone: session.owner_phone,
    planId: session.plan_id,
    provider,
    providerCustomerId: event.providerCustomerId,
    providerSubscriptionId: event.providerSubscriptionId,
  });

  await supabase
    .from("checkout_sessions")
    .update({
      status: "paid",
      business_id: provisioned.businessId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", checkoutSessionId);
}
