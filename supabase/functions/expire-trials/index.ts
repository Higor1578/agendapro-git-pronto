import { handleCors } from "../_shared/cors.ts";
import { jsonResponse } from "../_shared/http.ts";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const cronSecret = Deno.env.get("CRON_SECRET");
    if (cronSecret && req.headers.get("x-cron-secret") !== cronSecret) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabase = createAdminClient();
    const now = new Date().toISOString();

    const { data: expiredSubscriptions, error } = await supabase
      .from("subscriptions")
      .select("id,business_id")
      .eq("status", "trialing")
      .lt("trial_ends_at", now);

    if (error) throw error;

    const businessIds = expiredSubscriptions.map((item: any) => item.business_id);
    if (businessIds.length) {
      await supabase.from("businesses").update({ active: false }).in("id", businessIds);
      await supabase.from("subscriptions").update({ status: "expired" }).in("business_id", businessIds);
    }

    return jsonResponse({ expired: businessIds.length, businessIds });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
});
