import webpush from "npm:web-push@3.6.7";
import { handleCors } from "../_shared/cors.ts";
import { jsonResponse } from "../_shared/http.ts";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const publicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const privateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const subject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com";

    if (!publicKey || !privateKey) {
      return jsonResponse({ error: "Configure VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY nos secrets." }, 500);
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const supabase = createAdminClient();

    let jobsQuery = supabase
      .from("notification_jobs")
      .select("*")
      .eq("channel", "push")
      .eq("status", "pending")
      .limit(20);

    if (body.businessId) {
      jobsQuery = jobsQuery.eq("business_id", body.businessId);
    }

    const { data: jobs, error: jobsError } = await jobsQuery;
    if (jobsError) throw jobsError;

    let sent = 0;
    for (const job of jobs) {
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("business_id", job.business_id)
        .eq("active", true);

      if (subscriptionsError) throw subscriptionsError;

      for (const subscription of subscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            JSON.stringify(job.payload)
          );
          sent += 1;
        } catch (error) {
          if ([404, 410].includes(error.statusCode)) {
            await supabase.from("push_subscriptions").update({ active: false }).eq("id", subscription.id);
          }
        }
      }

      await supabase
        .from("notification_jobs")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", job.id);
    }

    return jsonResponse({ jobs: jobs.length, sent });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
});
