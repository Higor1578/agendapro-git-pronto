import { businessTypes } from "../data/seed.js";
import { currency } from "../utils/format.js";

export default function LandingPage({ businesses, plans, setRoute }) {
  return (
    <section>
      <div className="sales-hero">
        <div>
          <p className="eyebrow">AgendaPro SaaS</p>
          <h1>Sistema de agendamento online para negocios locais</h1>
          <p>
            Venda assinaturas para lava jato, barbearia, manicure e salao. Cada cliente ganha uma
            pagina propria de agendamento, painel administrativo e link para enviar aos clientes.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => setRoute("/super-admin")} type="button">
              Gerenciar plataforma
            </button>
          </div>
        </div>
        <div className="hero-preview">
          <span>Fluxo automatico</span>
          <strong>Venda → cria loja → envia link → recebe agendamentos</strong>
          <p>Preparado para automacao futura com checkout, webhook, Supabase e liberacao de acesso.</p>
        </div>
      </div>

      <section className="panel landing-section">
        <div className="panel-header">
          <div>
            <h2>Modelos de loja</h2>
            <p>Links publicos que seus clientes poderao enviar.</p>
          </div>
        </div>
        <div className="business-grid">
          {businesses.map((business) => (
            <article className="business-card" key={business.id}>
              <span className={`store-status ${business.active ? "active" : "inactive"}`}>
                {business.active ? "Ativa" : "Desativada"}
              </span>
              <strong>{business.name}</strong>
              <p>{businessTypes[business.type]} com agenda a cada {business.schedule?.slotInterval ?? 60} min.</p>
              <button className="secondary-button full" onClick={() => setRoute(`/loja/${business.id}`)} type="button">
                Abrir modelo
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="plans-grid">
        {plans.map((plan) => (
          <article className="panel plan-card" key={plan.id}>
            <span>{plan.name}</span>
            <strong>{currency.format(plan.price)}/mes</strong>
            <p>{plan.trialDays} dias gratis, {plan.bookingsLimit} agendamentos e ate {plan.storesLimit} loja(s).</p>
          </article>
        ))}
      </section>
    </section>
  );
}
