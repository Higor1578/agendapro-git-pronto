import { useEffect, useMemo, useState } from "react";
import Layout from "./components/Layout.jsx";
import AuthGate from "./components/AuthGate.jsx";
import { initialBookings, initialBusinesses, initialPlans } from "./data/seed.js";
import AdminNegocioPage from "./pages/AdminNegocioPage.jsx";
import ClientePage from "./pages/ClientePage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import SuperAdminPage from "./pages/SuperAdminPage.jsx";
import {
  createRemoteBooking,
  createRemoteBusiness,
  fetchAgendaData,
  updateRemoteBookingStatus
} from "./services/agendaproApi.js";
import { isSupabaseConfigured } from "./services/supabaseClient.js";

const adminRoutes = ["/admin", "/super-admin"];
const storageKeys = {
  businesses: "agendapro:businesses",
  bookings: "agendapro:bookings",
  plans: "agendapro:plans",
  theme: "agendapro:theme"
};

function getInitialRoute() {
  const pathRoute = window.location.pathname;
  if (pathRoute === "/") return "/";
  if (pathRoute.startsWith("/loja/")) return pathRoute;
  if (pathRoute.startsWith("/admin/")) return pathRoute;
  if (adminRoutes.includes(pathRoute)) return pathRoute;

  const hashRoute = window.location.hash.replace("#", "");
  if (hashRoute === "/cliente") return "/";
  if (hashRoute.startsWith("/loja/")) return hashRoute;
  if (hashRoute.startsWith("/admin/")) return hashRoute;
  if (adminRoutes.includes(hashRoute)) return hashRoute;

  return "/";
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
  const [plans, setPlans] = useState(() => loadFromStorage(storageKeys.plans, initialPlans));
  const [theme, setTheme] = useState(() => localStorage.getItem(storageKeys.theme) || "light");
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [dataSource, setDataSource] = useState(isSupabaseConfigured ? "supabase" : "local");
  const [toast, setToast] = useState("");

  const businessesById = useMemo(
    () => Object.fromEntries(businesses.map((business) => [business.id, business])),
    [businesses]
  );

  function setRoute(nextRoute) {
    setRouteState(nextRoute);
    window.history.pushState({}, "", nextRoute);
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
        return null;
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
        return { failed: true, message: error.message };
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
        return saved;
      } catch (error) {
        notify(`Erro no Supabase: ${error.message}`);
        return null;
      }
    }

    setBusinesses((current) => [...current, business]);
    notify("Negocio criado pelo super admin.");
    return business;
  }

  function updateBusiness(id, updates) {
    setBusinesses((current) =>
      current.map((business) => (business.id === id ? { ...business, ...updates } : business))
    );
    notify("Configuracao da loja atualizada.");
  }

  function updatePlan(id, updates) {
    setPlans((current) => current.map((plan) => (plan.id === id ? { ...plan, ...updates } : plan)));
    notify("Plano atualizado.");
  }

  useEffect(() => {
    const onPopState = () => setRouteState(getInitialRoute());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKeys.businesses, JSON.stringify(businesses));
  }, [businesses]);

  useEffect(() => {
    localStorage.setItem(storageKeys.bookings, JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem(storageKeys.plans, JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(storageKeys.theme, theme);
  }, [theme]);

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

  const publicStoreSlug = route.startsWith("/loja/") ? route.replace("/loja/", "") : null;
  const adminStoreSlug = route.startsWith("/admin/") ? route.replace("/admin/", "") : null;

  return (
    <Layout businesses={businesses} route={route} setRoute={setRoute}>
      {!publicStoreSlug ? (
        <div className="system-banner">
          <span>{dataSource === "supabase" ? "Conectado ao Supabase" : "Modo local/demo"}</span>
          <strong>{isLoading ? "Carregando dados..." : "Pronto para usar"}</strong>
        </div>
      ) : null}

      {route === "/" ? <LandingPage businesses={businesses} plans={plans} setRoute={setRoute} /> : null}
      {publicStoreSlug ? (
        <ClientePage addBooking={addBooking} businesses={businesses} selectedBusinessId={publicStoreSlug} />
      ) : null}
      {route === "/admin" || adminStoreSlug ? (
        <AuthGate requiredRole="store_admin" selectedBusinessId={adminStoreSlug}>
          <AdminNegocioPage
            selectedBusinessId={adminStoreSlug}
            bookings={bookings}
            businesses={businesses}
            businessesById={businessesById}
            updateBusiness={updateBusiness}
            updateBookingStatus={updateBookingStatus}
          />
        </AuthGate>
      ) : null}
      {route === "/super-admin" ? (
        <AuthGate requiredRole="super_admin">
          <SuperAdminPage
            addBusiness={addBusiness}
            bookings={bookings}
            businesses={businesses}
            plans={plans}
            theme={theme}
            setTheme={setTheme}
            updateBusiness={updateBusiness}
            updatePlan={updatePlan}
          />
        </AuthGate>
      ) : null}

      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">
        {toast}
      </div>
    </Layout>
  );
}
