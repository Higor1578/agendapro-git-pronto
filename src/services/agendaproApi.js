import { supabase, isSupabaseConfigured } from "./supabaseClient.js";

function toBusiness(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    owner: row.owner,
    ownerEmail: row.owner_email ?? "",
    ownerUserId: row.owner_user_id ?? "",
    plan: row.plan,
    monthly: row.monthly,
    active: row.active,
    trialDays: row.trial_days,
    schedule: row.schedule,
    contact: row.contact ?? {},
    expenses: row.expenses ?? [],
    opportunities: row.opportunities ?? [],
    professionals: row.professionals ?? [],
    services: row.services ?? []
  };
}

function toBooking(row) {
  return {
    id: row.id,
    client: row.client,
    phone: row.phone,
    businessId: row.business_id,
    service: row.service,
    date: row.date,
    time: row.time,
    professional: row.professional,
    status: row.status,
    notes: row.notes ?? "",
    price: row.price,
    duration: row.duration
  };
}

function fromBusiness(business) {
  return {
    id: business.id,
    name: business.name,
    type: business.type,
    owner: business.owner,
    owner_email: business.ownerEmail ?? "",
    owner_user_id: business.ownerUserId || null,
    plan: business.plan,
    monthly: business.monthly,
    active: business.active,
    trial_days: business.trialDays,
    schedule: business.schedule,
    contact: business.contact ?? {},
    expenses: business.expenses ?? [],
    opportunities: business.opportunities ?? [],
    professionals: business.professionals,
    services: business.services
  };
}

function fromBooking(booking) {
  return {
    client: booking.client,
    phone: booking.phone,
    business_id: booking.businessId,
    service: booking.service,
    date: booking.date,
    time: booking.time,
    professional: booking.professional,
    status: booking.status,
    notes: booking.notes,
    price: booking.price,
    duration: booking.duration
  };
}

export async function fetchAgendaData() {
  if (!isSupabaseConfigured) {
    return null;
  }

  const [businessesResult, bookingsResult] = await Promise.all([
    supabase.from("businesses").select("*").order("name", { ascending: true }),
    supabase.from("bookings").select("*").order("date", { ascending: true }).order("time", { ascending: true })
  ]);

  if (businessesResult.error) throw businessesResult.error;
  if (bookingsResult.error) throw bookingsResult.error;

  return {
    businesses: businessesResult.data.map(toBusiness),
    bookings: bookingsResult.data.map(toBooking)
  };
}

export async function createRemoteBooking(booking) {
  if (!isSupabaseConfigured) {
    return null;
  }

  const { data, error } = await supabase.from("bookings").insert(fromBooking(booking)).select("*").single();
  if (error) throw error;

  await supabase.from("notification_jobs").insert({
    business_id: data.business_id,
    booking_id: data.id,
    channel: "push",
    recipient: data.business_id,
    template: "booking-created",
    payload: {
      title: "Novo agendamento",
      body: `${data.client} agendou ${data.service} em ${data.date} as ${data.time}.`,
      url: `/admin/${data.business_id}`
    }
  });

  supabase.functions.invoke("send-push-notification", {
    body: { businessId: data.business_id }
  });

  return toBooking(data);
}

export async function updateRemoteBookingStatus(id, status) {
  if (!isSupabaseConfigured) {
    return null;
  }

  const { data, error } = await supabase.from("bookings").update({ status }).eq("id", id).select("*").single();
  if (error) throw error;
  return toBooking(data);
}

export async function createRemoteBusiness(business) {
  if (!isSupabaseConfigured) {
    return null;
  }

  const { data, error } = await supabase.functions.invoke("create-business", {
    body: { business: fromBusiness(business) }
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  return toBusiness(data.business);
}
