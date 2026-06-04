create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'store_admin' check (role in ('super_admin', 'store_admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.businesses (
  id text primary key,
  name text not null,
  type text not null check (type in ('lava-jato', 'barbearia', 'manicure', 'salao')),
  owner text not null,
  plan text not null check (plan in ('Essencial', 'Profissional', 'Premium')),
  monthly integer not null default 79,
  active boolean not null default true,
  trial_days integer not null default 7,
  trial_ends_at timestamptz,
  owner_user_id uuid references auth.users(id) on delete set null,
  schedule jsonb not null default '{"slotInterval":60,"workDays":[1,2,3,4,5,6],"closedDates":[],"startTime":"08:00","endTime":"18:00"}'::jsonb,
  contact jsonb not null default '{}'::jsonb,
  expenses jsonb not null default '[]'::jsonb,
  opportunities jsonb not null default '[]'::jsonb,
  professionals jsonb not null default '[]'::jsonb,
  services jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.businesses add column if not exists active boolean not null default true;
alter table public.businesses add column if not exists trial_days integer not null default 7;
alter table public.businesses add column if not exists trial_ends_at timestamptz;
alter table public.businesses add column if not exists owner_user_id uuid references auth.users(id) on delete set null;
alter table public.businesses add column if not exists schedule jsonb not null default '{"slotInterval":60,"workDays":[1,2,3,4,5,6],"closedDates":[],"startTime":"08:00","endTime":"18:00"}'::jsonb;
alter table public.businesses add column if not exists contact jsonb not null default '{}'::jsonb;
alter table public.businesses add column if not exists expenses jsonb not null default '[]'::jsonb;
alter table public.businesses add column if not exists opportunities jsonb not null default '[]'::jsonb;

create table if not exists public.business_members (
  business_id text not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

create table if not exists public.saas_plans (
  id text primary key,
  name text not null,
  price integer not null default 0,
  trial_days integer not null default 7,
  stores_limit integer not null default 1,
  bookings_limit integer not null default 100,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id text not null references public.businesses(id) on delete cascade,
  plan_id text not null references public.saas_plans(id),
  provider text not null check (provider in ('stripe', 'mercadopago', 'manual')),
  provider_customer_id text,
  provider_subscription_id text,
  status text not null default 'trialing' check (status in ('trialing', 'active', 'past_due', 'canceled', 'expired')),
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('stripe', 'mercadopago')),
  plan_id text not null references public.saas_plans(id),
  business_name text not null,
  business_type text not null,
  owner_name text not null,
  owner_email text not null,
  owner_phone text,
  status text not null default 'created' check (status in ('created', 'paid', 'failed', 'expired')),
  checkout_url text,
  provider_session_id text,
  business_id text references public.businesses(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('stripe', 'mercadopago')),
  event_id text,
  event_type text,
  processed boolean not null default false,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  client text not null,
  phone text not null,
  business_id text not null references public.businesses(id) on delete cascade,
  service text not null,
  date date not null,
  time text not null,
  professional text not null,
  status text not null default 'pendente' check (status in ('pendente', 'confirmado', 'concluido', 'cancelado')),
  notes text default '',
  price integer not null default 0,
  duration integer not null default 30,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_jobs (
  id uuid primary key default gen_random_uuid(),
  business_id text references public.businesses(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade,
  channel text not null check (channel in ('email', 'whatsapp')),
  recipient text not null,
  template text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

alter table public.businesses enable row level security;
alter table public.bookings enable row level security;
alter table public.profiles enable row level security;
alter table public.business_members enable row level security;
alter table public.saas_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.checkout_sessions enable row level security;
alter table public.payment_events enable row level security;
alter table public.notification_jobs enable row level security;

drop policy if exists "demo businesses read" on public.businesses;
drop policy if exists "demo businesses insert" on public.businesses;
drop policy if exists "demo bookings read" on public.bookings;
drop policy if exists "demo bookings insert" on public.bookings;
drop policy if exists "demo bookings update" on public.bookings;

create policy "demo businesses read"
on public.businesses for select
to anon
using (true);

create policy "demo businesses insert"
on public.businesses for insert
to anon
with check (true);

create policy "demo bookings read"
on public.bookings for select
to anon
using (true);

create policy "demo bookings insert"
on public.bookings for insert
to anon
with check (true);

create policy "demo bookings update"
on public.bookings for update
to anon
using (true)
with check (true);

drop policy if exists "demo plans read" on public.saas_plans;
create policy "demo plans read"
on public.saas_plans for select
to anon
using (active = true);

drop policy if exists "admins read own profile" on public.profiles;
create policy "admins read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists "members read own memberships" on public.business_members;
create policy "members read own memberships"
on public.business_members for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "members read own subscriptions" on public.subscriptions;
create policy "members read own subscriptions"
on public.subscriptions for select
to authenticated
using (
  exists (
    select 1 from public.business_members bm
    where bm.business_id = subscriptions.business_id
    and bm.user_id = auth.uid()
  )
);

insert into public.saas_plans (id, name, price, trial_days, stores_limit, bookings_limit)
values
  ('Essencial', 'Essencial', 79, 7, 1, 120),
  ('Profissional', 'Profissional', 149, 14, 3, 500),
  ('Premium', 'Premium', 249, 30, 10, 2000)
on conflict (id) do update set
  name = excluded.name,
  price = excluded.price,
  trial_days = excluded.trial_days,
  stores_limit = excluded.stores_limit,
  bookings_limit = excluded.bookings_limit;

insert into public.businesses (id, name, type, owner, plan, monthly, active, trial_days, schedule, contact, expenses, opportunities, professionals, services)
values
  (
    'brilho-car',
    'Brilho Car Lava Jato',
    'lava-jato',
    'Marcos',
    'Profissional',
    149,
    true,
    14,
    '{"slotInterval":60,"workDays":[1,2,3,4,5,6],"closedDates":["2026-06-07"],"startTime":"08:00","endTime":"18:00"}',
    '{"whatsapp":"5511999991111","instagram":"https://instagram.com/brilhocar","confirmationMessage":"Ola, seu agendamento na Brilho Car Lava Jato foi recebido. Vamos confirmar em instantes."}',
    '[{"id":"exp-1","name":"Produtos de limpeza","category":"Insumos","amount":320,"date":"2026-06-04"},{"id":"exp-2","name":"Agua e energia","category":"Operacional","amount":180,"date":"2026-06-04"}]',
    '[{"id":"opp-1","client":"Joao Pereira","note":"Oferecer plano de lavagem mensal","value":180,"status":"aberta"}]',
    '["Marcos", "Diego", "Paula"]',
    '[{"name":"Lavagem simples","price":45,"duration":40},{"name":"Lavagem completa + cera","price":95,"duration":75},{"name":"Higienizacao interna","price":180,"duration":150}]'
  ),
  (
    'navalha-fina',
    'Navalha Fina Barbearia',
    'barbearia',
    'Rafael',
    'Essencial',
    79,
    true,
    7,
    '{"slotInterval":30,"workDays":[2,3,4,5,6],"closedDates":["2026-06-07"],"startTime":"08:00","endTime":"18:00"}',
    '{"whatsapp":"5511999993333","instagram":"https://instagram.com/navalhafina","confirmationMessage":"Ola, seu horario na Navalha Fina Barbearia foi recebido. Obrigado pela preferencia."}',
    '[{"id":"exp-3","name":"Pomadas e laminas","category":"Insumos","amount":140,"date":"2026-06-04"}]',
    '[{"id":"opp-2","client":"Bruno Santos","note":"Vender assinatura quinzenal","value":120,"status":"aberta"}]',
    '["Rafael", "Andre", "Lucas"]',
    '[{"name":"Corte masculino","price":45,"duration":35},{"name":"Barba","price":35,"duration":30},{"name":"Corte + barba","price":85,"duration":55}]'
  ),
  (
    'bella-maos',
    'Bella Maos Studio',
    'manicure',
    'Ana',
    'Premium',
    249,
    true,
    30,
    '{"slotInterval":45,"workDays":[1,2,3,4,5],"closedDates":["2026-06-07"],"startTime":"08:00","endTime":"18:00"}',
    '{"whatsapp":"5511999992222","instagram":"https://instagram.com/bellamaosstudio","confirmationMessage":"Ola, seu agendamento na Bella Maos Studio foi recebido. Em breve confirmaremos."}',
    '[{"id":"exp-4","name":"Esmaltes","category":"Insumos","amount":210,"date":"2026-06-04"}]',
    '[{"id":"opp-3","client":"Camila Rocha","note":"Retorno para manutencao em 20 dias","value":70,"status":"aberta"}]',
    '["Ana", "Camila", "Nina"]',
    '[{"name":"Manicure tradicional","price":38,"duration":45},{"name":"Pedicure","price":45,"duration":50},{"name":"Esmaltacao em gel","price":70,"duration":60}]'
  ),
  (
    'luz-beauty',
    'Luz Beauty Salao',
    'salao',
    'Bianca',
    'Profissional',
    149,
    false,
    14,
    '{"slotInterval":60,"workDays":[1,2,3,4,5],"closedDates":["2026-06-07"],"startTime":"08:00","endTime":"18:00"}',
    '{"whatsapp":"5511999994444","instagram":"https://instagram.com/luzbeautysalao","confirmationMessage":"Ola, seu agendamento no Luz Beauty Salao foi recebido."}',
    '[]',
    '[]',
    '["Bianca", "Priscila", "Joana"]',
    '[{"name":"Escova","price":60,"duration":45},{"name":"Hidratacao","price":95,"duration":70},{"name":"Coloracao","price":190,"duration":150}]'
  )
on conflict (id) do nothing;

insert into public.bookings (client, phone, business_id, service, date, time, professional, status, notes, price, duration)
values
  ('Joao Pereira', '(11) 99999-1111', 'brilho-car', 'Lavagem completa + cera', '2026-06-04', '08:30', 'Marcos', 'confirmado', 'Carro SUV', 95, 75),
  ('Camila Rocha', '(11) 99999-2222', 'bella-maos', 'Esmaltacao em gel', '2026-06-04', '09:15', 'Ana', 'pendente', '', 70, 60),
  ('Bruno Santos', '(11) 99999-3333', 'navalha-fina', 'Corte + barba', '2026-06-04', '10:00', 'Rafael', 'confirmado', 'Corte degradado', 85, 55),
  ('Patricia Lima', '(11) 99999-4444', 'luz-beauty', 'Hidratacao', '2026-06-04', '11:30', 'Bianca', 'concluido', '', 95, 70);
