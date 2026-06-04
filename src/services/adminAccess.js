import { isSupabaseConfigured, supabase } from "./supabaseClient.js";

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

  if (error) throw error;
  return data;
}
