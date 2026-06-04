import { createClient } from "npm:@supabase/supabase-js@2";
import { requireEnv } from "./http.ts";

export function createAdminClient() {
  const url = requireEnv("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? getDefaultSecretKey();

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEYS.default");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getDefaultSecretKey() {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!raw) return null;

  try {
    const keys = JSON.parse(raw);
    return keys.default ?? null;
  } catch {
    return null;
  }
}
