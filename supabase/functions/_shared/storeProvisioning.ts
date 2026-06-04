import { slugify } from "./text.ts";

type ProvisionInput = {
  businessName: string;
  businessType: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  planId: string;
  provider: "stripe" | "mercadopago" | "manual";
  providerCustomerId?: string;
  providerSubscriptionId?: string;
};

export async function provisionStore(supabase: any, input: ProvisionInput) {
  const { data: plan, error: planError } = await supabase
    .from("saas_plans")
    .select("*")
    .eq("id", input.planId)
    .single();

  if (planError) throw planError;

  const password = crypto.randomUUID();
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: input.ownerEmail,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: input.ownerName,
      phone: input.ownerPhone,
      role: "store_admin",
      must_change_password: true,
    },
  });

  if (authError && !authError.message.includes("already registered")) {
    throw authError;
  }

  const userId = authData?.user?.id ?? await findUserIdByEmail(supabase, input.ownerEmail);
  const businessId = await uniqueBusinessSlug(supabase, input.businessName);
  const trialEndsAt = new Date(Date.now() + Number(plan.trial_days) * 24 * 60 * 60 * 1000).toISOString();

  const { error: businessError } = await supabase.from("businesses").insert({
    id: businessId,
    name: input.businessName,
    type: input.businessType,
    owner: input.ownerName,
    owner_user_id: userId,
    plan: plan.id,
    monthly: plan.price,
    active: true,
    trial_days: plan.trial_days,
    trial_ends_at: trialEndsAt,
    schedule: {
      slotInterval: 60,
      workDays: [1, 2, 3, 4, 5, 6],
      closedDates: [],
      startTime: "08:00",
      endTime: "18:00",
    },
    contact: {
      whatsapp: input.ownerPhone ?? "",
      instagram: "",
      confirmationMessage: `Ola, seu agendamento em ${input.businessName} foi recebido. Em breve confirmaremos o horario.`,
    },
    expenses: [],
    opportunities: [],
    professionals: [input.ownerName],
    services: defaultServices(input.businessType),
  });

  if (businessError) throw businessError;

  await supabase.from("profiles").upsert({
    id: userId,
    full_name: input.ownerName,
    role: "store_admin",
    must_change_password: true,
  });

  await supabase.from("business_members").upsert({
    business_id: businessId,
    user_id: userId,
    role: "owner",
  });

  const { error: subscriptionError } = await supabase.from("subscriptions").insert({
    business_id: businessId,
    plan_id: plan.id,
    provider: input.provider,
    provider_customer_id: input.providerCustomerId,
    provider_subscription_id: input.providerSubscriptionId,
    status: "trialing",
    trial_ends_at: trialEndsAt,
  });

  if (subscriptionError) throw subscriptionError;

  await supabase.from("notification_jobs").insert({
    business_id: businessId,
    channel: "email",
    recipient: input.ownerEmail,
    template: "welcome-store-admin",
    payload: {
      businessName: input.businessName,
      publicLink: `/loja/${businessId}`,
      adminLink: `/admin/${businessId}`,
      temporaryPassword: password,
    },
  });

  return { businessId, userId, trialEndsAt };
}

async function findUserIdByEmail(supabase: any, email: string) {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;

  const user = data.users.find((item: any) => item.email === email);
  if (!user) throw new Error("User already registered but not found in auth list");
  return user.id;
}

async function uniqueBusinessSlug(supabase: any, name: string) {
  const base = slugify(name);
  let candidate = base;
  let suffix = 1;

  while (true) {
    const { data } = await supabase.from("businesses").select("id").eq("id", candidate).maybeSingle();
    if (!data) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

function defaultServices(type: string) {
  const map: Record<string, Array<{ name: string; price: number; duration: number }>> = {
    "lava-jato": [{ name: "Lavagem completa", price: 80, duration: 60 }],
    barbearia: [{ name: "Corte masculino", price: 45, duration: 45 }],
    manicure: [{ name: "Manicure tradicional", price: 40, duration: 45 }],
    salao: [{ name: "Escova", price: 60, duration: 60 }],
  };

  return map[type] ?? map.barbearia;
}
