import { handleCors } from "../_shared/cors.ts";
import { jsonResponse } from "../_shared/http.ts";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";

type GrantInput = {
  businessId?: string;
  email?: string | null;
  userId?: string | null;
  role?: "owner" | "manager" | "staff";
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
      return jsonResponse({ error: "Somente super admin pode liberar acesso." }, 403);
    }

    const input = await req.json() as GrantInput;
    const businessId = input.businessId?.trim();
    const email = input.email?.trim().toLowerCase();
    let userId = input.userId?.trim() || "";
    const role = input.role ?? "owner";

    if (!businessId) {
      return jsonResponse({ error: "Informe a loja." }, 400);
    }

    if (!userId && !email) {
      return jsonResponse({ error: "Informe o e-mail ou o ID do usuario." }, 400);
    }

    const { data: business } = await supabase.from("businesses").select("id").eq("id", businessId).maybeSingle();
    if (!business) {
      return jsonResponse({ error: "Loja nao encontrada." }, 404);
    }

    if (!userId && email) {
      userId = await findUserIdByEmail(supabase, email);
    }

    await supabase.from("profiles").upsert({
      id: userId,
      full_name: email ?? "Admin da loja",
      role: "store_admin",
      must_change_password: false,
    });

    const { error: membershipError } = await supabase.from("business_members").upsert({
      business_id: businessId,
      user_id: userId,
      role,
    });

    if (membershipError) throw membershipError;

    const { error: businessError } = await supabase
      .from("businesses")
      .update({
        owner_user_id: userId,
        owner_email: email,
      })
      .eq("id", businessId);

    if (businessError) throw businessError;

    return jsonResponse({ ok: true, businessId, userId, email, role });
  } catch (error) {
    return jsonResponse({ error: error.message ?? "Erro ao liberar acesso." }, 500);
  }
});

async function findUserIdByEmail(supabase: any, email: string) {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;

  const user = data.users.find((item: any) => item.email?.toLowerCase() === email);
  if (!user) {
    throw new Error("Usuario nao encontrado no Auth. Crie o login no Supabase Auth ou informe o ID.");
  }

  return user.id;
}
