import { useMemo, useState } from "react";
import { businessTypes, timeSlots } from "../data/seed.js";
import { currency } from "../utils/format.js";

export default function ClientePage({ businesses, addBooking }) {
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const selectedBusiness = useMemo(
    () => businesses.find((business) => business.id === businessId) ?? businesses[0],
    [businessId, businesses]
  );

  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const service = selectedBusiness.services.find((item) => item.name === form.get("service"));

    addBooking({
      client: form.get("client"),
      phone: form.get("phone"),
      businessId: selectedBusiness.id,
      service: service.name,
      date: form.get("date"),
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
        <p className="eyebrow">Pagina separada do cliente</p>
        <h1>Cliente faz o agendamento sem acessar o painel interno</h1>
        <p>
          Essa tela e publica para Android, iPhone, iPad e Windows. O cliente escolhe o negocio,
          servico, profissional e horario.
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
                {timeSlots.map((slot) => (
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
            <h2>Negocios disponiveis</h2>
            <p>Cards publicos para o cliente escolher onde agendar.</p>
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
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
