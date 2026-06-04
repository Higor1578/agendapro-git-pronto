create extension if not exists "pgcrypto";

create table if not exists public.businesses (
  id text primary key,
  name text not null,
  type text not null check (type in ('lava-jato', 'barbearia', 'manicure', 'salao')),
  owner text not null,
  plan text not null check (plan in ('Essencial', 'Profissional', 'Premium')),
  monthly integer not null default 79,
  active boolean not null default true,
  trial_days integer not null default 7,
  schedule jsonb not null default '{"slotInterval":60,"workDays":[1,2,3,4,5,6],"closedDates":[],"startTime":"08:00","endTime":"18:00"}'::jsonb,
  professionals jsonb not null default '[]'::jsonb,
  services jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.businesses add column if not exists active boolean not null default true;
alter table public.businesses add column if not exists trial_days integer not null default 7;
alter table public.businesses add column if not exists schedule jsonb not null default '{"slotInterval":60,"workDays":[1,2,3,4,5,6],"closedDates":[],"startTime":"08:00","endTime":"18:00"}'::jsonb;

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

alter table public.businesses enable row level security;
alter table public.bookings enable row level security;

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

insert into public.businesses (id, name, type, owner, plan, monthly, active, trial_days, schedule, professionals, services)
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
