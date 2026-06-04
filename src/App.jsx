import { useEffect, useMemo, useState } from "react";
import Layout from "./components/Layout.jsx";
import { initialBookings, initialBusinesses } from "./data/seed.js";
import AdminNegocioPage from "./pages/AdminNegocioPage.jsx";
import ClientePage from "./pages/ClientePage.jsx";
import SuperAdminPage from "./pages/SuperAdminPage.jsx";
import {
  createRemoteBooking,
  createRemoteBusiness,
  fetchAgendaData,
  updateRemoteBookingStatus
} from "./services/agendaproApi.js";
import { isSupabaseConfigured } from "./services/supabaseClient.js";

const routes = ["/cliente", "/admin", "/super-admin"];
const storageKeys = {
  businesses: "agendapro:businesses",
  bookings: "agendapro:bookings"
};

function getInitialRoute() {
  const hashRoute = window.location.hash.replace("#", "");
  return routes.includes(hashRoute) ? hashRoute : "/cliente";
}

function loadFromStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [route, setRouteState] = useState(getInitialRoute);
  const [businesses, setBusinesses] = useState(() => loadFromStorage(storageKeys.businesses, initialBusinesses));
  const [bookings, setBookings] = useState(() => loadFromStorage(storageKeys.bookings, initialBookings));
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [dataSource, setDataSource] = useState(isSupabaseConfigured ? "supabase" : "local");
  const [toast, setToast] = useState("");

  const businessesById = useMemo(
    () => Object.fromEntries(businesses.map((business) => [business.id, business])),
    [businesses]
  );

  function setRoute(nextRoute) {
    setRouteState(nextRoute);
    window.location.hash = nextRoute;
  }

  function notify(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  async function addBooking(booking) {
    if (isSupabaseConfigured) {
      try {
        const saved = await createRemoteBooking(booking);
        setBookings((current) => [...current, saved]);
        notify("Agendamento salvo no Supabase.");
        return;
      } catch (error) {
        notify(`Erro no Supabase: ${error.message}`);
      }
    }

    setBookings((current) => [
      ...current,
      {
        ...booking,
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now())
      }
    ]);
    notify("Agendamento criado e enviado para o admin do negocio.");
  }

  async function updateBookingStatus(id, status) {
    if (isSupabaseConfigured) {
      try {
        const saved = await updateRemoteBookingStatus(id, status);
        setBookings((current) => current.map((booking) => (booking.id === id ? saved : booking)));
        notify(`Status salvo no Supabase: ${status}.`);
        return;
      } catch (error) {
        notify(`Erro no Supabase: ${error.message}`);
      }
    }

    setBookings((current) => current.map((booking) => (booking.id === id ? { ...booking, status } : booking)));
    notify(`Status atualizado para ${status}.`);
  }

  async function addBusiness(business) {
    if (isSupabaseConfigured) {
      try {
        const saved = await createRemoteBusiness(business);
        setBusinesses((current) => [...current, saved]);
        notify("Negocio salvo no Supabase.");
        return;
      } catch (error) {
        notify(`Erro no Supabase: ${error.message}`);
      }
    }

    setBusinesses((current) => [...current, business]);
    notify("Negocio criado pelo super admin.");
  }

  useEffect(() => {
    const onHashChange = () => setRouteState(getInitialRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKeys.businesses, JSON.stringify(businesses));
  }, [businesses]);

  useEffect(() => {
    localStorage.setItem(storageKeys.bookings, JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    let ignore = false;

    async function loadRemoteData() {
      if (!isSupabaseConfigured) return;

      try {
        const data = await fetchAgendaData();
        if (ignore || !data) return;
        setBusinesses(data.businesses.length ? data.businesses : initialBusinesses);
        setBookings(data.bookings.length ? data.bookings : initialBookings);
        setDataSource("supabase");
      } catch (error) {
        setDataSource("local");
        notify(`Nao consegui conectar ao Supabase: ${error.message}`);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadRemoteData();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <Layout route={route} setRoute={setRoute}>
      <div className="system-banner">
        <span>{dataSource === "supabase" ? "Conectado ao Supabase" : "Modo local/demo"}</span>
        <strong>{isLoading ? "Carregando dados..." : "Pronto para usar"}</strong>
      </div>

      {route === "/cliente" ? <ClientePage addBooking={addBooking} businesses={businesses} /> : null}
      {route === "/admin" ? (
        <AdminNegocioPage
          bookings={bookings}
          businesses={businesses}
          businessesById={businessesById}
          updateBookingStatus={updateBookingStatus}
        />
      ) : null}
      {route === "/super-admin" ? (
        <SuperAdminPage addBusiness={addBusiness} bookings={bookings} businesses={businesses} />
      ) : null}

      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">
        {toast}
      </div>
    </Layout>
  );
}
