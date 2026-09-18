-- Patient portal: patients get their own Supabase Auth account and can sign
-- in directly (WhatsApp is now an additional channel, not the only one).
--
-- A single real person can have a separate `patients` row per organization
-- (each business's own local record of them), so `user_id` here is
-- deliberately NOT unique — one auth user links to many patient rows across
-- orgs, resolved at signup by matching phone number.

alter table patients add column user_id uuid references auth.users(id) on delete set null;
create index patients_user_id_idx on patients (user_id);

create function current_patient_ids() returns setof uuid
  language sql stable security definer set search_path = public as $$
    select id from patients where user_id = auth.uid()
  $$;

-- ---------------------------------------------------------------------------
-- Patient self-access. A patient sees everything about their own record
-- (sensitivity tiers only ever gate what a *business* sees, never the
-- patient themselves) but can only ever write their own grants — never
-- clinical data, and never another patient's row.
-- ---------------------------------------------------------------------------

create policy "patients can view their own patient rows" on patients
  for select using (user_id = auth.uid());

create policy "patients can view their own grants" on patient_grants
  for select using (patient_id in (select current_patient_ids()));

create policy "patients can grant new categories" on patient_grants
  for insert with check (patient_id in (select current_patient_ids()));

create policy "patients can change their own grants" on patient_grants
  for update using (patient_id in (select current_patient_ids()))
  with check (patient_id in (select current_patient_ids()));

create policy "patients can view their own field values" on patient_field_values
  for select using (patient_id in (select current_patient_ids()));

create policy "patients can view their own lab results" on lab_results
  for select using (patient_id in (select current_patient_ids()));

create policy "patients can view their own medications" on medications
  for select using (patient_id in (select current_patient_ids()));

create policy "patients can view their own consultation notes" on consultation_notes
  for select using (patient_id in (select current_patient_ids()));

create policy "patients can view their own appointments" on appointments
  for select using (patient_id in (select current_patient_ids()));

-- Read-only context a patient needs to render the portal (org/branch names,
-- the service and staff names on their own appointments/notes) — none of
-- this is itself sensitive.
create policy "patients can view orgs they belong to" on organizations
  for select using (id in (select org_id from patients where user_id = auth.uid()));

create policy "patients can view branches of their orgs" on branches
  for select using (org_id in (select org_id from patients where user_id = auth.uid()));

create policy "patients can view services of their orgs" on services
  for select using (org_id in (select org_id from patients where user_id = auth.uid()));

create policy "patients can view staff names at their orgs" on staff
  for select using (org_id in (select org_id from patients where user_id = auth.uid()));
