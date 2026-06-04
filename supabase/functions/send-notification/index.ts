import { handleCors } from "../_shared/cors.ts";
import { jsonResponse } from "../_shared/http.ts";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const supabase = createAdminClient();
    const { data: jobs, error } = await supabase
      .from("notification_jobs")
      .select("*")
      .eq("status", "pending")
      .limit(10);

    if (error) throw error;

    for (const job of jobs) {
      try {
        if (job.channel === "email") {
          await sendEmail(job);
        } else {
          await sendWhatsApp(job);
        }

        await supabase
          .from("notification_jobs")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", job.id);
      } catch (jobError) {
        await supabase
          .from("notification_jobs")
          .update({ status: "failed", error: jobError.message })
          .eq("id", job.id);
      }
    }

    return jsonResponse({ processed: jobs.length });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
});

async function sendEmail(job: any) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: Deno.env.get("EMAIL_FROM") ?? "AgendaPro <onboarding@resend.dev>",
      to: job.recipient,
      subject: "AgendaPro: acesso da sua loja",
      html: `<p>Sua loja foi criada.</p><p>Link: ${job.payload.publicLink ?? ""}</p>`,
    }),
  });

  if (!response.ok) throw new Error(await response.text());
}

async function sendWhatsApp(job: any) {
  const webhookUrl = Deno.env.get("WHATSAPP_WEBHOOK_URL");
  if (!webhookUrl) return;

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: job.recipient,
      message: job.payload.message ?? `AgendaPro: ${job.template}`,
      payload: job.payload,
    }),
  });

  if (!response.ok) throw new Error(await response.text());
}
