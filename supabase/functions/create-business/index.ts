import { handleCors } from "../_shared/cors.ts";
import { jsonResponse } from "../_shared/http.ts";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";

type BusinessInput = {
  id?: string;
  name?: string;
  type?: string;
  owner?: string;
  owner_email?: string;
  owner_user_id?: string | null;
  plan?: string;
  monthly?: number;
  active?: boolean;
  trial_days?: number;
  schedule?: Record<string, unknown>;
  contact?: Record<string, unknown>;
  expenses?: Array<Record<string, unknown>>;
  opportunities?: Array<Record<string, unknown>>;
  professionals?: string[];
  services?: Array<Record<string, unknown>>;
};

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const supabase = createAdminClient();
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return jsonResponse({ error: "Token de login obrigatorio." }, 401);
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return jsonResponse({ error: "Login invalido." }, 401);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (profile?.role !== "super_admin") {
      return jsonResponse({ error: "Somente super admin pode cadastrar loja." }, 403);
    }

    const input = await req.json() as { business?: BusinessInput };
    const business = input.business;

    if (!business?.id || !business.name || !business.type || !business.owner || !business.plan) {
      return jsonResponse({ error: "Dados obrigatorios da loja ausentes." }, 400);
    }

    const payload = {
      id: business.id,
      name: business.name,
      type: business.type,
      owner: business.owner,
      owner_email: business.owner_email ?? "",
      owner_user_id: business.owner_user_id || null,
      plan: business.plan,
      monthly: business.monthly ?? 0,
      active: business.active ?? true,
      trial_days: business.trial_days ?? 7,
      schedule: business.schedule ?? {},
      contact: business.contact ?? {},
      expenses: business.expenses ?? [],
      opportunities: business.opportunities ?? [],
      professionals: business.professionals ?? [business.owner],
      services: business.services ?? [],
    };

    const inserted = await insertBusiness(supabase, payload);
    await maybeCreateMembership(supabase, inserted, payload.owner_email, payload.owner_user_id);

    return jsonResponse({ business: inserted });
  } catch (error) {
    return jsonResponse({ error: error.message ?? "Erro ao cadastrar loja." }, 500);
  }
});

async function insertBusiness(supabase: any, payload: Record<string, unknown>) {
  let { data, error } = await supabase.from("businesses").insert(payload).select("*").single();

  if (error?.message?.includes("owner_email")) {
    const fallback = { ...payload };
    delete fallback.owner_email;
    const retry = await supabase.from("businesses").insert(fallback).select("*").single();
    data = retry.data;
    error = retry.error;
  }

  if (error) throw error;
  return data;
}

async function maybeCreateMembership(supabase: any, business: any, email?: string, userId?: string | null) {
  let finalUserId = userId || "";
  const cleanEmail = email?.trim().toLowerCase();

  if (!finalUserId && cleanEmail) {
    finalUserId = await findUserIdByEmail(supabase, cleanEmail);
  }

  if (!finalUserId) return;

  await supabase.from("profiles").upsert({
    id: finalUserId,
    full_name: business.owner,
    role: "store_admin",
    must_change_password: false,
  });

  await supabase.from("business_members").upsert({
    business_id: business.id,
    user_id: finalUserId,
    role: "owner",
  });

  await supabase.from("businesses").update({ owner_user_id: finalUserId }).eq("id", business.id);
}

async function findUserIdByEmail(supabase: any, email: string) {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;

  const user = data.users.find((item: any) => item.email?.toLowerCase() === email);
  return user?.id ?? "";
}
