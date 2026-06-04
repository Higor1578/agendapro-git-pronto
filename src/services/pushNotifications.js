import { isSupabaseConfigured, supabase } from "./supabaseClient.js";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function canUsePushNotifications() {
  return Boolean("serviceWorker" in navigator && "PushManager" in window && "Notification" in window);
}

export async function registerStorePushSubscription(businessId) {
  if (!isSupabaseConfigured) {
    throw new Error("Configure Supabase para salvar notificacoes push.");
  }

  if (!canUsePushNotifications()) {
    throw new Error("Este navegador nao suporta notificacoes push.");
  }

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    throw new Error("Configure VITE_VAPID_PUBLIC_KEY no Vercel.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Permissao de notificacao nao concedida.");
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    }));

  const json = subscription.toJSON();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      business_id: businessId,
      endpoint: json.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
      user_agent: navigator.userAgent,
      active: true
    },
    { onConflict: "endpoint" }
  );

  if (error) throw error;
  return subscription;
}
