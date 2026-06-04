import { useEffect, useMemo, useState } from "react";
import { businessTypes, timeSlots } from "../data/seed.js";
import { currency } from "../utils/format.js";

function generateSlots(schedule) {
  if (!schedule?.slotInterval) return timeSlots;
  const [startHour, startMinute] = (schedule.startTime ?? "08:00").split(":").map(Number);
  const [endHour, endMinute] = (schedule.endTime ?? "18:00").split(":").map(Number);
  const slots = [];
  let current = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;

  while (current < end) {
    const hour = String(Math.floor(current / 60)).padStart(2, "0");
    const minute = String(current % 60).padStart(2, "0");
    slots.push(`${hour}:${minute}`);
    current += Number(schedule.slotInterval);
  }

  return slots;
}

export default function ClientePage({ businesses, addBooking, selectedBusinessId }) {
  const [businessId, setBusinessId] = useState(selectedBusinessId ?? businesses[0]?.id ?? "");
  const selectedBusiness = useMemo(
    () => businesses.find((business) => business.id === businessId) ?? businesses[0],
    [businessId, businesses]
  );
  const isStoreLocked = Boolean(selectedBusinessId);

  useEffect(() => {
    if (selectedBusinessId) {
      setBusinessId(selectedBusinessId);
    }
  }, [selectedBusinessId]);

  if (!selectedBusiness) {
    return (
      <section className="panel">
        <p className="eyebrow">Loja nao encontrada</p>
        <h1>Esse link de agendamento nao existe.</h1>
        <p>Confira o slug da loja ou cadastre o negocio no super admin.</p>
      </section>
    );
  }

  if (selectedBusiness.active === false) {
    return (
      <section className="panel">
        <p className="eyebrow">Loja indisponivel</p>
        <h1>{selectedBusiness.name}</h1>
        <p>Essa loja esta temporariamente desativada e nao aceita novos agendamentos.</p>
      </section>
    );
  }

  const slots = generateSlots(selectedBusiness.schedule);

  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const service = selectedBusiness.services.find((item) => item.name === form.get("service"));
    const date = form.get("date");
    const weekday = new Date(`${date}T12:00:00`).getDay();

    if (!(selectedBusiness.schedule?.workDays ?? []).includes(weekday)) {
      alert("Essa loja nao aceita agendamento nesse dia da semana.");
      return;
    }

    if ((selectedBusiness.schedule?.closedDates ?? []).includes(date)) {
      alert("Essa data esta bloqueada pela loja.");
      return;
    }

    addBooking({
      client: form.get("client"),
      phone: form.get("phone"),
      businessId: selectedBusiness.id,
      service: service.name,
      date,
      time: form.get("time"),
      professional: form.get("professional"),
      status: "pendente",
      notes: form.get("notes"),
      price: service.price,
      duration: service.duration
    });

    event.currentTarget.reset();
  }

  return (
    <section className="page-grid">
      <div className="booking-hero">
        <p className="eyebrow">{businessTypes[selectedBusiness.type]}</p>
        <h1>{selectedBusiness.name}</h1>
        <p>
          Link publico da loja para o cliente escolher servico, profissional e horario sem acessar
          o painel interno.
        </p>
        <div className="trust-row">
          <span>Formulario publico</span>
          <span>Instalavel como app</span>
          <span>Entra no admin do negocio</span>
        </div>
      </div>

      <aside className="panel">
        <div className="panel-header">
          <div>
            <h2>Fazer agendamento</h2>
            <p>Reserva enviada para o dono do negocio.</p>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <label>
            Nome completo
            <input name="client" placeholder="Ex: Maria Souza" required />
          </label>
          <label>
            WhatsApp
            <input name="phone" placeholder="Ex: (11) 99999-0000" required />
          </label>
          {isStoreLocked ? (
            <div className="locked-store">
              <span>Estabelecimento</span>
              <strong>{selectedBusiness.name}</strong>
              <small>/loja/{selectedBusiness.id}</small>
            </div>
          ) : (
            <label>
              Estabelecimento
              <select name="businessId" onChange={(event) => setBusinessId(event.target.value)} value={selectedBusiness.id}>
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name} - {businessTypes[business.type]}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Servico
            <select name="service" required>
              {selectedBusiness.services.map((service) => (
                <option key={service.name} value={service.name}>
                  {service.name} - {currency.format(service.price)}
                </option>
              ))}
            </select>
          </label>
          <div className="form-row">
            <label>
              Data
              <input defaultValue="2026-06-04" name="date" required type="date" />
            </label>
            <label>
              Horario
              <select name="time" required>
                {slots.map((slot) => (
                  <option key={slot}>{slot}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Profissional
            <select name="professional" required>
              {selectedBusiness.professionals.map((professional) => (
                <option key={professional}>{professional}</option>
              ))}
            </select>
          </label>
          <label>
            Observacao
            <input name="notes" placeholder="Ex: carro SUV, unha em gel, corte degradado" />
          </label>
          <button className="primary-button full" type="submit">
            Confirmar agendamento
          </button>
        </form>
      </aside>

      <section className="panel wide-panel">
        <div className="panel-header">
          <div>
            <h2>Outros links de lojas</h2>
            <p>Cada negocio tem uma URL publica propria.</p>
          </div>
        </div>
        <div className="business-grid">
          {businesses.map((business) => (
            <article className="business-card" key={business.id}>
              <span className="tag business-badge">{businessTypes[business.type]}</span>
              <strong>{business.name}</strong>
              <p>
                {business.professionals.length} profissionais, servicos a partir de{" "}
                {currency.format(business.services[0].price)}.
              </p>
              <a className="store-link" href={`/loja/${business.id}`}>
                /loja/{business.id}
              </a>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
