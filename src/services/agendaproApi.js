import { supabase, isSupabaseConfigured } from "./supabaseClient.js";

function toBusiness(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    owner: row.owner,
    plan: row.plan,
    monthly: row.monthly,
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
    plan: business.plan,
    monthly: business.monthly,
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

  const { data, error } = await supabase.from("businesses").insert(fromBusiness(business)).select("*").single();
  if (error) throw error;
  return toBusiness(data);
}
