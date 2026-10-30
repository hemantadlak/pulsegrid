-- PULSEGRID simulation schema. It contains fictional capability and incident data only.
-- Run this once in the Supabase SQL Editor before adding the VITE_ variables.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Simulation user',
  role text not null default 'emergency_user' check (role in ('emergency_user', 'hospital_coordinator')),
  created_at timestamptz not null default now()
);

create table if not exists public.hospitals (
  id text primary key,
  name text not null,
  eta_minutes integer not null check (eta_minutes > 0),
  icu_beds integer not null default 0 check (icu_beds >= 0),
  cardiac_specialist boolean not null default false,
  er_status text not null default 'accepting' check (er_status in ('accepting', 'limited', 'diverting')),
  lat double precision not null,
  lng double precision not null,
  facilities text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.hospital_members (
  user_id uuid not null references auth.users(id) on delete cascade,
  hospital_id text not null references public.hospitals(id) on delete cascade,
  primary key (user_id, hospital_id)
);

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  condition_id text not null,
  destination_id text references public.hospitals(id),
  journey_status text not null default 'en-route' check (journey_status in ('en-route', 'reroute-required', 'rerouted', 'accepted', 'rejected')),
  simulated_eta_minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references public.incidents(id) on delete cascade,
  patient_id uuid not null references auth.users(id) on delete cascade,
  event_text text not null,
  source text not null default 'system' check (source in ('system', 'emergency_user', 'hospital_coordinator')),
  tone text not null default 'blue' check (tone in ('blue', 'green', 'amber', 'red')),
  created_at timestamptz not null default now()
);

create index if not exists incidents_patient_id_idx on public.incidents(patient_id);
create index if not exists audit_events_patient_id_idx on public.audit_events(patient_id, created_at desc);
create index if not exists hospital_members_user_id_idx on public.hospital_members(user_id);

alter table public.profiles enable row level security;
alter table public.hospitals enable row level security;
alter table public.hospital_members enable row level security;
alter table public.incidents enable row level security;
alter table public.audit_events enable row level security;

create or replace function public.is_hospital_member(target_hospital_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.hospital_members where user_id = auth.uid() and hospital_id = target_hospital_id);
$$;

create policy "Profiles: users read their own" on public.profiles for select to authenticated using (id = auth.uid());
create policy "Profiles: users update their own name" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated;
grant update(display_name) on public.profiles to authenticated;
create policy "Hospitals: signed-in users can read fictional capability data" on public.hospitals for select to authenticated using (true);
create policy "Hospitals: assigned coordinators can update their hospital" on public.hospitals for update to authenticated using (public.is_hospital_member(id)) with check (public.is_hospital_member(id));
create policy "Membership: users read their own memberships" on public.hospital_members for select to authenticated using (user_id = auth.uid());
create policy "Incidents: patient or assigned coordinator can read" on public.incidents for select to authenticated using (patient_id = auth.uid() or public.is_hospital_member(destination_id));
create policy "Incidents: patient can create" on public.incidents for insert to authenticated with check (patient_id = auth.uid());
create policy "Incidents: patient or assigned coordinator can update" on public.incidents for update to authenticated using (patient_id = auth.uid() or public.is_hospital_member(destination_id)) with check (patient_id = auth.uid() or public.is_hospital_member(destination_id));
create policy "Audit: patient or assigned coordinator can read" on public.audit_events for select to authenticated using (patient_id = auth.uid() or exists (select 1 from public.incidents where incidents.id = audit_events.incident_id and public.is_hospital_member(incidents.destination_id)));
create policy "Audit: patient can create their events" on public.audit_events for insert to authenticated with check (patient_id = auth.uid());

-- A profile is created automatically from the role selected at sign-up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', 'Simulation user'),
    case when new.raw_user_meta_data ->> 'role' = 'hospital_coordinator' then 'hospital_coordinator' else 'emergency_user' end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

insert into public.hospitals (id, name, eta_minutes, icu_beds, cardiac_specialist, er_status, lat, lng, facilities) values
  ('northstar', 'Northstar Medical', 6, 3, false, 'accepting', 30.7398, 76.782, array['Emergency Medicine','Orthopedics','X-Ray']),
  ('metro', 'Metro Care Centre', 11, 1, true, 'accepting', 30.7262, 76.7888, array['Cardiac ICU','Cardiologist','Defibrillator','Cath Lab','Emergency Medicine','ICU','CT Scanner']),
  ('riverbend', 'Riverbend Hospital', 15, 2, true, 'accepting', 30.7462, 76.7985, array['Cardiac ICU','Cardiologist','Defibrillator','Cath Lab','Emergency Medicine','ICU','CT Scanner','Trauma Bay','Blood Bank','General Surgery','Orthopedics','X-Ray','Ventilator','Oxygen Supply','Neurology','Stroke Unit'])
on conflict (id) do update set name = excluded.name, eta_minutes = excluded.eta_minutes, icu_beds = excluded.icu_beds, cardiac_specialist = excluded.cardiac_specialist, er_status = excluded.er_status, facilities = excluded.facilities, updated_at = now();

-- Enable the simple Postgres Changes simulation stream. RLS still controls rows each client can receive.
do $$ begin alter publication supabase_realtime add table public.hospitals; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.incidents; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.audit_events; exception when duplicate_object then null; end $$;
