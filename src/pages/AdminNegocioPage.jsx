import { useMemo, useState } from "react";
import BookingCard from "../components/BookingCard.jsx";
import MetricCard from "../components/MetricCard.jsx";
import { businessTypes } from "../data/seed.js";
import { currency, sortBookings } from "../utils/format.js";

export default function AdminNegocioPage({ businesses, bookings, updateBookingStatus }) {
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const [status, setStatus] = useState("todos");
  const [professional, setProfessional] = useState("todos");
  const business = businesses.find((item) => item.id === businessId) ?? businesses[0];

  const filteredBookings = useMemo(
    () =>
      sortBookings(
        bookings
          .filter((booking) => booking.businessId === business.id)
          .filter((booking) => status === "todos" || booking.status === status)
          .filter((booking) => professional === "todos" || booking.professional === professional)
      ),
    [bookings, business.id, status, professional]
  );

  const revenue = filteredBookings.reduce((sum, booking) => sum + booking.price, 0);
  const duration = filteredBookings.reduce((sum, booking) => sum + booking.duration, 0);
  const confirmed = filteredBookings.filter((booking) => booking.status === "confirmado").length;
  const confirmationRate = filteredBookings.length ? Math.round((confirmed / filteredBookings.length) * 100) : 0;

  function handleBusinessChange(event) {
    setBusinessId(event.target.value);
    setProfessional("todos");
  }

  return (
    <section>
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Admin do negocio</p>
          <h1>Painel separado para o dono ver todos os agendamentos</h1>
        </div>
        <span className="pill">{businessTypes[business.type]}</span>
      </div>

      <section className="filters" aria-label="Filtros do admin do negocio">
        <label>
          Meu negocio
          <select onChange={handleBusinessChange} value={business.id}>
            {businesses.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select onChange={(event) => setStatus(event.target.value)} value={status}>
            <option value="todos">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="confirmado">Confirmado</option>
            <option value="concluido">Concluido</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </label>
        <label>
          Profissional
          <select onChange={(event) => setProfessional(event.target.value)} value={professional}>
            <option value="todos">Todos</option>
            {business.professionals.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="metric-grid">
        <MetricCard detail="Total filtrado" label="Agendamentos" value={filteredBookings.length} />
        <MetricCard detail="Valor dos servicos" label="Receita prevista" value={currency.format(revenue)} />
        <MetricCard detail="Taxa de confirmacao" label="Confirmados" value={`${confirmationRate}%`} />
        <MetricCard detail="Tempo de atendimento" label="Horas ocupadas" value={`${Math.round((duration / 60) * 10) / 10}h`} />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Agenda completa</h2>
            <p>O dono altera status e acompanha cada cliente.</p>
          </div>
        </div>
        <div className="booking-list">
          {filteredBookings.length ? (
            filteredBookings.map((booking) => (
              <BookingCard
                booking={booking}
                business={business}
                key={booking.id}
                onStatusChange={updateBookingStatus}
              />
            ))
          ) : (
            <div className="empty-state">Nenhum agendamento encontrado.</div>
          )}
        </div>
      </section>
    </section>
  );
}
