import { useMemo, useState } from "react";
import BookingCard from "../components/BookingCard.jsx";
import MetricCard from "../components/MetricCard.jsx";
import { businessTypes } from "../data/seed.js";
import { currency, sortBookings } from "../utils/format.js";

const weekDays = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sab" }
];

export default function AdminNegocioPage({ businesses, bookings, updateBusiness, updateBookingStatus }) {
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

  function publicLink() {
    return `${window.location.origin}/loja/${business.id}`;
  }

  function addService(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const service = {
      name: form.get("name"),
      price: Number(form.get("price")),
      duration: Number(form.get("duration"))
    };
    updateBusiness(business.id, { services: [...business.services, service] });
    event.currentTarget.reset();
  }

  function updateService(index, field, value) {
    const services = business.services.map((service, serviceIndex) =>
      serviceIndex === index ? { ...service, [field]: field === "name" ? value : Number(value) } : service
    );
    updateBusiness(business.id, { services });
  }

  function removeService(index) {
    updateBusiness(business.id, { services: business.services.filter((_, serviceIndex) => serviceIndex !== index) });
  }

  function toggleWorkDay(day) {
    const currentDays = business.schedule?.workDays ?? [];
    const workDays = currentDays.includes(day)
      ? currentDays.filter((item) => item !== day)
      : [...currentDays, day].sort((a, b) => a - b);

    updateBusiness(business.id, { schedule: { ...business.schedule, workDays } });
  }

  function updateSchedule(field, value) {
    updateBusiness(business.id, { schedule: { ...business.schedule, [field]: value } });
  }

  function addClosedDate(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const date = form.get("closedDate");
    if (!date) return;
    updateSchedule("closedDates", [...(business.schedule?.closedDates ?? []), date]);
    event.currentTarget.reset();
  }

  function removeClosedDate(date) {
    updateSchedule(
      "closedDates",
      (business.schedule?.closedDates ?? []).filter((item) => item !== date)
    );
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

      <section className="admin-grid settings-area">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Link para clientes</h2>
              <p>Esse e o link que o dono envia pelo WhatsApp, Instagram ou site.</p>
            </div>
          </div>
          <div className="copy-box">
            <strong>{publicLink()}</strong>
            <button className="secondary-button" onClick={() => navigator.clipboard?.writeText(publicLink())} type="button">
              Copiar link
            </button>
          </div>

          <div className="panel-header inner-header">
            <div>
              <h2>Servicos e precos</h2>
              <p>Adicionar, remover e alterar valores.</p>
            </div>
          </div>
          <div className="service-editor">
            {business.services.map((service, index) => (
              <div className="service-row" key={`${service.name}-${index}`}>
                <input value={service.name} onChange={(event) => updateService(index, "name", event.target.value)} />
                <input
                  min="0"
                  type="number"
                  value={service.price}
                  onChange={(event) => updateService(index, "price", event.target.value)}
                />
                <input
                  min="15"
                  step="15"
                  type="number"
                  value={service.duration}
                  onChange={(event) => updateService(index, "duration", event.target.value)}
                />
                <button className="secondary-button" onClick={() => removeService(index)} type="button">
                  Remover
                </button>
              </div>
            ))}
          </div>
          <form className="inline-form" onSubmit={addService}>
            <input name="name" placeholder="Novo servico" required />
            <input min="0" name="price" placeholder="Preco" required type="number" />
            <input min="15" name="duration" placeholder="Minutos" required step="15" type="number" />
            <button className="primary-button" type="submit">
              Adicionar
            </button>
          </form>
        </div>

        <aside className="panel">
          <div className="panel-header">
            <div>
              <h2>Agenda da loja</h2>
              <p>Dias de trabalho, bloqueios e intervalo.</p>
            </div>
          </div>
          <label>
            Intervalo entre horarios
            <select
              onChange={(event) => updateSchedule("slotInterval", Number(event.target.value))}
              value={business.schedule?.slotInterval ?? 60}
            >
              <option value="30">De 30 em 30 minutos</option>
              <option value="45">De 45 em 45 minutos</option>
              <option value="60">De 1 em 1 hora</option>
              <option value="90">De 1h30 em 1h30</option>
            </select>
          </label>
          <div className="weekday-grid">
            {weekDays.map((day) => (
              <label className="check-tile" key={day.value}>
                <input
                  checked={(business.schedule?.workDays ?? []).includes(day.value)}
                  onChange={() => toggleWorkDay(day.value)}
                  type="checkbox"
                />
                {day.label}
              </label>
            ))}
          </div>
          <form className="inline-form one-line" onSubmit={addClosedDate}>
            <input name="closedDate" type="date" />
            <button className="secondary-button" type="submit">
              Bloquear data
            </button>
          </form>
          <div className="tag-list">
            {(business.schedule?.closedDates ?? []).map((date) => (
              <button className="tag removable" key={date} onClick={() => removeClosedDate(date)} type="button">
                {date} x
              </button>
            ))}
          </div>
        </aside>
      </section>
    </section>
  );
}
