import { useEffect, useMemo, useState } from "react";
import BookingCard from "../components/BookingCard.jsx";
import MetricCard from "../components/MetricCard.jsx";
import { businessTypes } from "../data/seed.js";
import { registerStorePushSubscription } from "../services/pushNotifications.js";
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

export default function AdminNegocioPage({ businesses, bookings, selectedBusinessId, updateBusiness, updateBookingStatus }) {
  const [businessId, setBusinessId] = useState(selectedBusinessId ?? businesses[0]?.id ?? "");
  const [status, setStatus] = useState("todos");
  const [professional, setProfessional] = useState("todos");
  const [pushStatus, setPushStatus] = useState("");
  const business = businesses.find((item) => item.id === businessId) ?? businesses[0];
  const isAdminLocked = Boolean(selectedBusinessId);

  useEffect(() => {
    if (selectedBusinessId) {
      setBusinessId(selectedBusinessId);
    }
  }, [selectedBusinessId]);

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
  const expensesTotal = (business.expenses ?? []).reduce((sum, expense) => sum + Number(expense.amount), 0);
  const opportunitiesTotal = (business.opportunities ?? [])
    .filter((opportunity) => opportunity.status !== "ganha")
    .reduce((sum, opportunity) => sum + Number(opportunity.value), 0);
  const profit = revenue - expensesTotal;
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

  function adminLink() {
    return `${window.location.origin}/admin/${business.id}`;
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

  function updateContact(field, value) {
    updateBusiness(business.id, { contact: { ...(business.contact ?? {}), [field]: value } });
  }

  async function enablePushNotifications() {
    try {
      setPushStatus("Solicitando permissao...");
      await registerStorePushSubscription(business.id);
      setPushStatus("Notificacoes ativadas neste aparelho.");
    } catch (error) {
      setPushStatus(error.message);
    }
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

  function addExpense(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const expense = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: form.get("name"),
      category: form.get("category"),
      amount: Number(form.get("amount")),
      date: form.get("date")
    };

    updateBusiness(business.id, { expenses: [...(business.expenses ?? []), expense] });
    event.currentTarget.reset();
  }

  function removeExpense(id) {
    updateBusiness(business.id, { expenses: (business.expenses ?? []).filter((expense) => expense.id !== id) });
  }

  function addOpportunity(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const opportunity = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      client: form.get("client"),
      note: form.get("note"),
      value: Number(form.get("value")),
      status: "aberta"
    };

    updateBusiness(business.id, { opportunities: [...(business.opportunities ?? []), opportunity] });
    event.currentTarget.reset();
  }

  function updateOpportunity(id, updates) {
    updateBusiness(business.id, {
      opportunities: (business.opportunities ?? []).map((opportunity) =>
        opportunity.id === id ? { ...opportunity, ...updates } : opportunity
      )
    });
  }

  const customers = Array.from(new Set(filteredBookings.map((booking) => booking.client)));

  return (
    <section>
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Admin do negocio</p>
          <h1>Dashboard e controle da loja</h1>
        </div>
        <span className="pill">{businessTypes[business.type]}</span>
      </div>

      <section className="filters" aria-label="Filtros do admin do negocio">
        <label>
          Meu negocio
          <select disabled={isAdminLocked} onChange={handleBusinessChange} value={business.id}>
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
        <MetricCard detail="Despesas cadastradas" label="Gastos" value={currency.format(expensesTotal)} />
        <MetricCard detail="Receita menos gastos" label="Saldo estimado" value={currency.format(profit)} />
        <MetricCard detail="Oportunidades abertas" label="Oportunidades" value={currency.format(opportunitiesTotal)} />
      </section>

      <section className="metric-grid compact-metrics">
        <MetricCard detail="Taxa de confirmacao" label="Confirmados" value={`${confirmationRate}%`} />
        <MetricCard detail="Tempo de atendimento" label="Horas ocupadas" value={`${Math.round((duration / 60) * 10) / 10}h`} />
        <MetricCard detail="Clientes com agendamento" label="Clientes" value={customers.length} />
        <MetricCard detail="Link interno da loja" label="Admin" value={`/admin/${business.id}`} />
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
          <div className="copy-box subtle-box">
            <strong>{adminLink()}</strong>
            <button className="secondary-button" onClick={() => navigator.clipboard?.writeText(adminLink())} type="button">
              Copiar admin
            </button>
          </div>
          <div className="copy-box subtle-box">
            <strong>Receber alerta quando entrar agendamento</strong>
            <button className="secondary-button" onClick={enablePushNotifications} type="button">
              Ativar notificacoes
            </button>
          </div>
          {pushStatus ? <div className="auth-warning">{pushStatus}</div> : null}

          <div className="panel-header inner-header">
            <div>
              <h2>Contato da loja</h2>
              <p>Esses dados aparecem na pagina publica.</p>
            </div>
          </div>
          <div className="contact-editor">
            <label>
              WhatsApp da loja
              <input
                value={business.contact?.whatsapp ?? ""}
                onChange={(event) => updateContact("whatsapp", event.target.value)}
                placeholder="5511999999999"
              />
            </label>
            <label>
              Instagram
              <input
                value={business.contact?.instagram ?? ""}
                onChange={(event) => updateContact("instagram", event.target.value)}
                placeholder="https://instagram.com/sualoja"
              />
            </label>
            <label>
              Mensagem apos agendamento
              <input
                value={business.contact?.confirmationMessage ?? ""}
                onChange={(event) => updateContact("confirmationMessage", event.target.value)}
                placeholder="Ola, seu agendamento foi recebido."
              />
            </label>
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

      <section className="admin-grid settings-area">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Controle de gastos</h2>
              <p>Registre despesas para acompanhar quanto a loja esta gastando.</p>
            </div>
          </div>
          <form className="inline-form expense-form" onSubmit={addExpense}>
            <input name="name" placeholder="Descricao" required />
            <input name="category" placeholder="Categoria" required />
            <input min="0" name="amount" placeholder="Valor" required type="number" />
            <input name="date" required type="date" />
            <button className="primary-button" type="submit">Adicionar gasto</button>
          </form>
          <div className="finance-list">
            {(business.expenses ?? []).map((expense) => (
              <article className="finance-row" key={expense.id}>
                <div>
                  <strong>{expense.name}</strong>
                  <span>{expense.category} - {expense.date}</span>
                </div>
                <div className="finance-actions">
                  <strong>{currency.format(expense.amount)}</strong>
                  <button className="secondary-button" onClick={() => removeExpense(expense.id)} type="button">
                    Remover
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="panel">
          <div className="panel-header">
            <div>
              <h2>Clientes e oportunidades</h2>
              <p>Crie lembretes comerciais para vender mais.</p>
            </div>
          </div>
          <form onSubmit={addOpportunity}>
            <label>
              Cliente
              <select name="client" required>
                {customers.length ? customers.map((client) => <option key={client}>{client}</option>) : <option>Novo cliente</option>}
              </select>
            </label>
            <label>
              Oportunidade
              <input name="note" placeholder="Ex: oferecer pacote mensal" required />
            </label>
            <label>
              Valor previsto
              <input min="0" name="value" placeholder="120" required type="number" />
            </label>
            <button className="primary-button full" type="submit">Adicionar oportunidade</button>
          </form>
          <div className="opportunity-list">
            {(business.opportunities ?? []).map((opportunity) => (
              <article className="opportunity-card" key={opportunity.id}>
                <strong>{opportunity.client}</strong>
                <span>{opportunity.note}</span>
                <div>
                  <small>{currency.format(opportunity.value)}</small>
                  <select
                    onChange={(event) => updateOpportunity(opportunity.id, { status: event.target.value })}
                    value={opportunity.status}
                  >
                    <option value="aberta">Aberta</option>
                    <option value="ganha">Ganha</option>
                    <option value="perdida">Perdida</option>
                  </select>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </section>
    </section>
  );
}
