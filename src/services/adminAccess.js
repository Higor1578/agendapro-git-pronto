import { isSupabaseConfigured, supabase } from "./supabaseClient.js";

async function getFunctionErrorMessage(error) {
  const response = error?.context;
  if (response?.json) {
    try {
      const payload = await response.clone().json();
      return payload?.error || payload?.message || error.message;
    } catch {
      return error.message;
    }
  }

  return error?.message ?? "Erro desconhecido na Edge Function.";
}

export async function grantStoreAccess({ businessId, email, userId, role = "owner" }) {
  if (!isSupabaseConfigured) {
    return { skipped: true };
  }

  const { data, error } = await supabase.functions.invoke("grant-store-access", {
    body: {
      businessId,
      email: email || null,
      userId: userId || null,
      role
    }
  });

  if (error) throw new Error(await getFunctionErrorMessage(error));
  if (data?.error) throw new Error(data.error);
  return data;
}
