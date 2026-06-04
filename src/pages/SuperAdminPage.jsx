import { useState } from "react";
import MetricCard from "../components/MetricCard.jsx";
import { businessTypes, planPrices } from "../data/seed.js";
import { grantStoreAccess } from "../services/adminAccess.js";
import { currency, slugify } from "../utils/format.js";

const defaultServices = {
  "lava-jato": [{ name: "Lavagem completa", price: 80, duration: 70 }],
  barbearia: [{ name: "Corte masculino", price: 45, duration: 35 }],
  manicure: [{ name: "Manicure tradicional", price: 38, duration: 45 }],
  salao: [{ name: "Escova", price: 60, duration: 45 }]
};

export default function SuperAdminPage({
  businesses,
  bookings,
  addBusiness,
  plans,
  theme,
  setTheme,
  updateBusiness,
  updatePlan
}) {
  const [accessMessage, setAccessMessage] = useState("");
  const mrr = businesses.reduce((sum, business) => sum + business.monthly, 0);
  const revenue = bookings.reduce((sum, booking) => sum + booking.price, 0);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = form.get("name");
    const type = form.get("type");
    const plan = form.get("plan");
    const owner = form.get("owner");
    const ownerEmail = form.get("ownerEmail");
    const ownerUserId = form.get("ownerUserId");
    const whatsapp = form.get("whatsapp");
    const instagram = form.get("instagram");

    setAccessMessage("");

    const savedBusiness = await addBusiness({
      id: slugify(`${name}-${Date.now()}`),
      name,
      type,
      owner,
      ownerEmail,
      ownerUserId,
      plan,
      monthly: plans.find((item) => item.id === plan)?.price ?? planPrices[plan],
      active: true,
      trialDays: plans.find((item) => item.id === plan)?.trialDays ?? 7,
      schedule: {
        slotInterval: 60,
        workDays: [1, 2, 3, 4, 5, 6],
        closedDates: [],
        startTime: "08:00",
        endTime: "18:00"
      },
      contact: {
        whatsapp,
        instagram,
        confirmationMessage: `Ola, seu agendamento em ${name} foi recebido. Em breve confirmaremos o horario.`
      },
      professionals: [owner],
      expenses: [],
      opportunities: [],
      services: defaultServices[type]
    });

    if (savedBusiness && (ownerEmail || ownerUserId)) {
      try {
        await grantStoreAccess({
          businessId: savedBusiness.id,
          email: ownerEmail,
          userId: ownerUserId,
          role: "owner"
        });
        setAccessMessage("Permissao de admin da loja vinculada ao usuario informado.");
      } catch (error) {
        setAccessMessage(`Loja criada, mas a permissao nao foi vinculada: ${error.message}`);
      }
    }

    event.currentTarget.reset();
  }

  async function handleGrantAccess(event, businessId) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = form.get("email");
    const userId = form.get("userId");

    setAccessMessage("");

    try {
      await grantStoreAccess({ businessId, email, userId, role: "owner" });
      updateBusiness(businessId, { ownerEmail: email, ownerUserId: userId });
      setAccessMessage("Permissao atualizada para esta loja.");
      event.currentTarget.reset();
    } catch (error) {
      setAccessMessage(`Nao consegui vincular permissao: ${error.message}`);
    }
  }

  return (
    <section>
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Super admin</p>
          <h1>Sua area para gerenciar todos os negocios do SaaS</h1>
        </div>
        <span className="pill">Plataforma</span>
      </div>

      <section className="metric-grid">
        <MetricCard detail="Clientes usando o sistema" label="Negocios ativos" value={businesses.length} />
        <MetricCard detail="Reservas da plataforma" label="Agendamentos totais" value={bookings.length} />
        <MetricCard detail="Mensalidade dos negocios" label="MRR simulado" value={currency.format(mrr)} />
        <MetricCard detail="Servicos agendados" label="Receita dos clientes" value={currency.format(revenue)} />
      </section>

      <section className="admin-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Negocios cadastrados</h2>
              <p>Controle dos assinantes da sua plataforma.</p>
            </div>
          </div>
          <div className="tenant-list">
            {businesses.map((business) => {
              const tenantBookings = bookings.filter((booking) => booking.businessId === business.id);
              const tenantRevenue = tenantBookings.reduce((sum, booking) => sum + booking.price, 0);

              return (
                <article className="tenant-card" key={business.id}>
                  <div>
                    <span className="tag business-badge">{businessTypes[business.type]}</span>
                    <strong>{business.name}</strong>
                    <p>
                      {business.owner} - Plano {business.plan} - {business.trialDays ?? 0} dias gratis
                    </p>
                    {business.ownerEmail || business.ownerUserId ? (
                      <p>
                        Login: {business.ownerEmail || "sem e-mail"} {business.ownerUserId ? `- ID ${business.ownerUserId}` : ""}
                      </p>
                    ) : null}
                    <a className="store-link" href={`/loja/${business.id}`}>
                      Cliente: /loja/{business.id}
                    </a>
                    <a className="store-link" href={`/admin/${business.id}`}>
                      Admin: /admin/{business.id}
                    </a>
                    <form className="inline-access-form" onSubmit={(event) => handleGrantAccess(event, business.id)}>
                      <label>
                        E-mail com acesso
                        <input name="email" placeholder="cliente@email.com" type="email" />
                      </label>
                      <label>
                        ID do usuario
                        <input name="userId" placeholder="UUID do Supabase" />
                      </label>
                      <button className="secondary-button" type="submit">
                        Liberar acesso
                      </button>
                    </form>
                  </div>
                  <div className="tenant-stats">
                    <button
                      className={`status-button ${business.active === false ? "inactive" : "active"}`}
                      onClick={() => updateBusiness(business.id, { active: business.active === false })}
                      type="button"
                    >
                      {business.active === false ? "Desativada" : "Ativa"}
                    </button>
                    <label>
                      Dias gratis
                      <input
                        min="0"
                        type="number"
                        value={business.trialDays ?? 0}
                        onChange={(event) => updateBusiness(business.id, { trialDays: Number(event.target.value) })}
                      />
                    </label>
                    <span>{tenantBookings.length} agendamentos</span>
                    <strong>{currency.format(tenantRevenue)}</strong>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="panel">
          <div className="panel-header">
            <div>
              <h2>Cadastrar negocio</h2>
              <p>Somente o super admin acessa isso.</p>
            </div>
          </div>
          <form onSubmit={handleSubmit}>
            <label>
              Nome do negocio
              <input name="name" placeholder="Ex: Barbearia Premium" required />
            </label>
            <label>
              Segmento
              <select name="type" required>
                <option value="lava-jato">Lava jato</option>
                <option value="barbearia">Barbearia</option>
                <option value="manicure">Manicure</option>
                <option value="salao">Salao de beleza</option>
              </select>
            </label>
            <label>
              Plano
              <select name="plan" required>
                <option value="Essencial">Essencial - R$ 79</option>
                <option value="Profissional">Profissional - R$ 149</option>
                <option value="Premium">Premium - R$ 249</option>
              </select>
            </label>
            <label>
              Responsavel
              <input name="owner" placeholder="Nome do dono" required />
            </label>
            <label>
              E-mail do admin
              <input name="ownerEmail" placeholder="cliente@email.com" required type="email" />
            </label>
            <label>
              ID do usuario Supabase
              <input name="ownerUserId" placeholder="Opcional: UUID do Auth" />
            </label>
            <label>
              WhatsApp da loja
              <input name="whatsapp" placeholder="Ex: 5511999999999" required />
            </label>
            <label>
              Instagram da loja
              <input name="instagram" placeholder="https://instagram.com/sualoja" />
            </label>
            <button className="primary-button full" type="submit">
              Salvar negocio
            </button>
            {accessMessage ? <strong className="form-feedback">{accessMessage}</strong> : null}
          </form>
        </aside>
      </section>

      <section className="panel landing-section">
        <div className="panel-header">
          <div>
            <h2>Aparencia</h2>
            <p>Escolha como o painel aparece no seu aparelho.</p>
          </div>
        </div>
        <div className="theme-control">
          <label>
            Tema da plataforma
            <select value={theme} onChange={(event) => setTheme(event.target.value)}>
              <option value="light">Claro</option>
              <option value="dark">Escuro</option>
            </select>
          </label>
        </div>
      </section>

      <section className="panel landing-section">
        <div className="panel-header">
          <div>
            <h2>Planos do SaaS</h2>
            <p>Voce controla valores, dias gratis e limites comerciais.</p>
          </div>
        </div>
        <div className="plans-editor">
          {plans.map((plan) => (
            <article className="plan-edit-card" key={plan.id}>
              <strong>{plan.name}</strong>
              <label>
                Valor mensal
                <input
                  min="0"
                  type="number"
                  value={plan.price}
                  onChange={(event) => updatePlan(plan.id, { price: Number(event.target.value) })}
                />
              </label>
              <label>
                Dias gratis
                <input
                  min="0"
                  type="number"
                  value={plan.trialDays}
                  onChange={(event) => updatePlan(plan.id, { trialDays: Number(event.target.value) })}
                />
              </label>
              <label>
                Limite de agendamentos
                <input
                  min="0"
                  type="number"
                  value={plan.bookingsLimit}
                  onChange={(event) => updatePlan(plan.id, { bookingsLimit: Number(event.target.value) })}
                />
              </label>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
