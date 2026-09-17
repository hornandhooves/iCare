-- iCare — initial schema
-- Covers: organizations/branches, roles & privileges (§24), staff, services,
-- patients & appointments (§03), field definitions & per-branch patient
-- grants (§04/§02 privacy model), lab results/medications/notes, audit log.
--
-- Deliberately out of scope here (see build plan): WhatsApp integration,
-- CFDI invoicing, till, metrics, automations, patient-portal auth.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type staff_status as enum ('invited', 'active');

create type appointment_status as enum (
  'agendada', 'primera_vez', 'confirmada', 'en_consulta',
  'completada', 'riesgo_no_show', 'cancelada'
);

create type confirmed_via as enum ('whatsapp', 'staff');

create type field_type as enum ('texto', 'texto_largo', 'numero', 'lista', 'fecha');

create type field_sensitivity as enum ('contacto', 'clinico', 'critico', 'sellado');

create type field_source as enum ('manual', 'ocr', 'whatsapp');

create type lab_source as enum ('photo_ocr', 'manual');

create type privilege_grant_state as enum ('granted', 'limited', 'denied');

create type audit_justification as enum (
  'con_cita', 'sin_cita', 'fuera_de_horario', 'administrativo', 'automatico'
);

-- The 7 permission categories from §04/§02: 6 toggleable + the always-on
-- contact category. 'mental' and 'sexual' are sealed (never shown even as
-- a locked placeholder to a business that lacks the grant).
create type permission_category as enum (
  'labs', 'notas', 'medicamentos', 'mensajes', 'mental', 'sexual', 'contacto'
);

-- The 12 privilege keys from §24's role matrix.
create type privilege_key as enum (
  'view_own_agenda',
  'view_all_agenda',
  'book_appointments',
  'charge_payments',
  'close_daily_till',
  'view_clinical_record',
  'write_clinical_note_prescription',
  'view_business_metrics',
  'edit_services_prices',
  'manage_staff_roles',
  'import_export_data',
  'view_phi_audit_log'
);

-- ---------------------------------------------------------------------------
-- Organizations, branches
-- ---------------------------------------------------------------------------

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  verticals text[] not null default '{}',
  whatsapp_number text,
  -- Set once onboarding step 3 is reached, whether the number was entered
  -- or the step was skipped ("Hacerlo después") — step 3 never blocks
  -- finishing setup, per §14.
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table branches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  location text,
  biz_start_hour integer not null default 8,
  biz_end_hour integer not null default 20,
  -- Index 0=Sunday..6=Saturday (matches JS Date#getDay() and staff_hours.weekday).
  biz_days boolean[] not null default '{false,true,true,true,true,true,true}',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Roles & privileges (§24) — seeded per org at onboarding, not owner-editable
-- in this pass (that admin screen is deferred).
-- ---------------------------------------------------------------------------

create table roles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  key text not null,
  name text not null,
  is_builtin boolean not null default true,
  created_at timestamptz not null default now(),
  unique (org_id, key)
);

create table role_privileges (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references roles(id) on delete cascade,
  privilege_key privilege_key not null,
  grant_state privilege_grant_state not null default 'denied',
  limit_note text,
  unique (role_id, privilege_key)
);

-- ---------------------------------------------------------------------------
-- Staff
-- ---------------------------------------------------------------------------

create table staff (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  phone text,
  status staff_status not null default 'invited',
  specialty text,
  created_at timestamptz not null default now()
);

create table staff_branches (
  staff_id uuid not null references staff(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  primary key (staff_id, branch_id)
);

create table staff_roles (
  staff_id uuid not null references staff(id) on delete cascade,
  role_id uuid not null references roles(id) on delete cascade,
  primary key (staff_id, role_id)
);

create table staff_hours (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff(id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null
);

-- ---------------------------------------------------------------------------
-- Services, patients, appointments (§03)
-- ---------------------------------------------------------------------------

create table services (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  key text not null,
  name text not null,
  price_cents integer not null,
  duration_minutes integer not null,
  bookable boolean not null default true,
  default_staff_id uuid references staff(id) on delete set null,
  recall_interval_months integer,
  unique (org_id, key)
);

create table patients (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  age integer,
  sex text,
  phone text,
  folio text,
  created_at timestamptz not null default now()
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  staff_id uuid not null references staff(id) on delete cascade,
  service_id uuid not null references services(id),
  start_at timestamptz not null,
  end_at timestamptz not null,
  status appointment_status not null default 'agendada',
  confirmed_via confirmed_via,
  declined boolean not null default false,
  -- Distinct from 'cancelada' (cancelled in advance): true when the patient
  -- simply didn't show for a completed slot. This, not cancellation, is
  -- what the "missed 2 of the last 4" rule (decision #5) counts.
  no_show boolean not null default false,
  created_at timestamptz not null default now()
);

create index appointments_branch_start_idx on appointments (branch_id, start_at);
create index appointments_staff_start_idx on appointments (staff_id, start_at);
create index appointments_patient_idx on appointments (patient_id);

-- ---------------------------------------------------------------------------
-- Expediente: field definitions, values, per-branch patient grants (§04/§02)
-- ---------------------------------------------------------------------------

create table field_definitions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  key text not null,
  label text not null,
  type field_type not null,
  sensitivity field_sensitivity not null,
  category_key permission_category not null,
  vertical text,
  unique (org_id, key)
);

create table patient_field_values (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  field_key text not null,
  value jsonb,
  source field_source not null default 'manual',
  confirmed boolean not null default true,
  confirmed_by uuid references staff(id),
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create index patient_field_values_patient_idx on patient_field_values (patient_id);

-- Grants are per BRANCH, never per organization — deliberately overrides the
-- natural org-level default (decision #1 in §02).
create table patient_grants (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  category_key permission_category not null,
  granted boolean not null default false,
  granted_at timestamptz,
  expires_at timestamptz,
  unique (patient_id, branch_id, category_key)
);

create index patient_grants_lookup_idx on patient_grants (patient_id, branch_id);

create table lab_results (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  source lab_source not null default 'manual',
  result_values jsonb not null default '{}',
  confirmed boolean not null default false,
  image_url text,
  created_at timestamptz not null default now()
);

create table medications (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  drug_name text not null,
  dose text,
  frequency text,
  since_date date,
  patient_reported boolean not null default false
);

create table consultation_notes (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id) on delete set null,
  patient_id uuid not null references patients(id) on delete cascade,
  staff_id uuid not null references staff(id),
  body text,
  signed_at timestamptz,
  signed_by uuid references staff(id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Audit log — every clinical-record open, unconditional (§24: "no privilege
-- that hides you from the audit log"). Written only via the service-role
-- client (see lib/permissions.ts), never directly by staff, so it can't be
-- tampered with by the person being audited.
-- ---------------------------------------------------------------------------

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  actor_staff_id uuid references staff(id) on delete set null,
  actor_role text,
  patient_id uuid not null references patients(id) on delete cascade,
  what text not null,
  justification audit_justification not null,
  created_at timestamptz not null default now()
);

create index audit_log_patient_idx on audit_log (patient_id);

-- ---------------------------------------------------------------------------
-- Helper functions for RLS
-- ---------------------------------------------------------------------------

create function current_staff_id() returns uuid
  language sql stable security definer set search_path = public as $$
    select id from staff where user_id = auth.uid()
  $$;

create function current_org_id() returns uuid
  language sql stable security definer set search_path = public as $$
    select org_id from staff where user_id = auth.uid()
  $$;

-- ---------------------------------------------------------------------------
-- Row-level security — org isolation on every table. Staff can read and
-- write within their own organization; nothing crosses tenants.
-- ---------------------------------------------------------------------------

alter table organizations enable row level security;
alter table branches enable row level security;
alter table roles enable row level security;
alter table role_privileges enable row level security;
alter table staff enable row level security;
alter table staff_branches enable row level security;
alter table staff_roles enable row level security;
alter table staff_hours enable row level security;
alter table services enable row level security;
alter table patients enable row level security;
alter table appointments enable row level security;
alter table field_definitions enable row level security;
alter table patient_field_values enable row level security;
alter table patient_grants enable row level security;
alter table lab_results enable row level security;
alter table medications enable row level security;
alter table consultation_notes enable row level security;
alter table audit_log enable row level security;

create policy "org members can view their org" on organizations
  for select using (id = current_org_id());

create policy "org members can manage their branches" on branches
  for all using (org_id = current_org_id()) with check (org_id = current_org_id());

create policy "org members can view their roles" on roles
  for select using (org_id = current_org_id());

create policy "org members can view their role privileges" on role_privileges
  for select using (role_id in (select id from roles where org_id = current_org_id()));

create policy "org members can view their org's staff" on staff
  for select using (org_id = current_org_id());

create policy "org members can view staff_branches" on staff_branches
  for select using (staff_id in (select id from staff where org_id = current_org_id()));

create policy "org members can view staff_roles" on staff_roles
  for select using (staff_id in (select id from staff where org_id = current_org_id()));

create policy "org members can view staff_hours" on staff_hours
  for select using (staff_id in (select id from staff where org_id = current_org_id()));

create policy "org members can manage their services" on services
  for all using (org_id = current_org_id()) with check (org_id = current_org_id());

create policy "org members can manage their patients" on patients
  for all using (org_id = current_org_id()) with check (org_id = current_org_id());

create policy "org members can manage their appointments" on appointments
  for all using (branch_id in (select id from branches where org_id = current_org_id()))
  with check (branch_id in (select id from branches where org_id = current_org_id()));

create policy "org members can view field definitions" on field_definitions
  for select using (org_id = current_org_id());

-- Clinical data below: SELECT is scoped to org, but application code in
-- lib/permissions.ts still filters by patient_grants before shaping the
-- response — RLS here is the tenant-isolation floor, not the per-category
-- consent logic itself (decision #2: filtering is a query-shape concern).
create policy "org members can view their patients' field values" on patient_field_values
  for select using (patient_id in (select id from patients where org_id = current_org_id()));

create policy "org members can insert patient field values" on patient_field_values
  for insert with check (patient_id in (select id from patients where org_id = current_org_id()));

-- Grants are patient-controlled. Staff can read them (needed to render the
-- locked-category card) but cannot write them here — writes belong to the
-- future patient-portal/access-request flow, done via the service-role
-- client so a business can never grant itself access.
create policy "org members can view patient grants" on patient_grants
  for select using (org_id = current_org_id());

create policy "org members can view lab results" on lab_results
  for select using (patient_id in (select id from patients where org_id = current_org_id()));

create policy "org members can view medications" on medications
  for select using (patient_id in (select id from patients where org_id = current_org_id()));

create policy "org members can view consultation notes" on consultation_notes
  for select using (patient_id in (select id from patients where org_id = current_org_id()));

-- Staff may read their org's audit trail; only the service-role client
-- (see lib/permissions.ts) may insert, so the audit log can't be edited or
-- suppressed by the person it records.
create policy "org members can view their audit log" on audit_log
  for select using (org_id = current_org_id());
