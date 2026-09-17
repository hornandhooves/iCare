-- iCare — demo/seed data, mirroring the prototype's own demo state
-- (Clínica Sauce · Roma Norte) so the hard-to-see rules in the build plan
-- are actually checkable end to end.
--
-- IMPORTANT — linking your first login:
-- Staff rows need a real Supabase Auth user in `user_id` before that person
-- can sign in. This seed leaves `user_id` null. After you create a user
-- (Supabase dashboard → Authentication → Add user, or your own sign-up flow
-- later), run:
--
--   update staff set user_id = '<auth-user-uuid>', status = 'active'
--   where id = '44444444-4444-4444-4444-444444444444'; -- Alejandro Sauceda, owner
--
-- Fixed UUIDs are used throughout so this file is idempotent-ish and easy to
-- reference from the app or from psql while developing.

begin;

-- ---------------------------------------------------------------------------
-- Organization & branch
-- ---------------------------------------------------------------------------

insert into organizations (id, name, slug, verticals, whatsapp_number, onboarding_completed_at) values
  ('11111111-1111-1111-1111-111111111111', 'Clínica Sauce', 'clinica-sauce', array['medicina'], '+52 55 4188 0217', now());

insert into branches (id, org_id, name, location, biz_start_hour, biz_end_hour, biz_days) values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
   'Roma Norte', 'Roma Norte, CDMX', 8, 20, '{false,true,true,true,true,true,true}');

-- ---------------------------------------------------------------------------
-- Roles & privileges (§24 matrix, seeded verbatim)
-- ---------------------------------------------------------------------------

insert into roles (id, org_id, key, name, is_builtin) values
  ('33333333-3333-3333-3333-000000000001', '11111111-1111-1111-1111-111111111111', 'owner', 'Propietario', true),
  ('33333333-3333-3333-3333-000000000002', '11111111-1111-1111-1111-111111111111', 'admin', 'Admin', true),
  ('33333333-3333-3333-3333-000000000003', '11111111-1111-1111-1111-111111111111', 'recepcion', 'Recepción', true),
  ('33333333-3333-3333-3333-000000000004', '11111111-1111-1111-1111-111111111111', 'barbero', 'Barbero', true),
  ('33333333-3333-3333-3333-000000000005', '11111111-1111-1111-1111-111111111111', 'estilista', 'Estilista', true),
  ('33333333-3333-3333-3333-000000000006', '11111111-1111-1111-1111-111111111111', 'doctor', 'Doctor', true);

insert into role_privileges (role_id, privilege_key, grant_state, limit_note)
select r.id, v.privilege_key::privilege_key, v.grant_state::privilege_grant_state, v.limit_note
from (values
  ('owner',     'view_own_agenda',                  'granted', 'cannot be removed'),
  ('admin',     'view_own_agenda',                  'granted', 'cannot be removed'),
  ('recepcion', 'view_own_agenda',                  'granted', 'cannot be removed'),
  ('barbero',   'view_own_agenda',                  'granted', 'cannot be removed'),
  ('estilista', 'view_own_agenda',                  'granted', 'cannot be removed'),
  ('doctor',    'view_own_agenda',                  'granted', 'cannot be removed'),

  ('owner',     'view_all_agenda',                  'granted', null),
  ('admin',     'view_all_agenda',                  'granted', null),
  ('recepcion', 'view_all_agenda',                  'granted', null),
  ('barbero',   'view_all_agenda',                  'denied',  null),
  ('estilista', 'view_all_agenda',                  'denied',  null),
  ('doctor',    'view_all_agenda',                  'denied',  null),

  ('owner',     'book_appointments',                'granted', null),
  ('admin',     'book_appointments',                'granted', null),
  ('recepcion', 'book_appointments',                'granted', null),
  ('barbero',   'book_appointments',                'limited', 'the practitioner, only their own'),
  ('estilista', 'book_appointments',                'limited', 'the practitioner, only their own'),
  ('doctor',    'book_appointments',                'limited', 'the practitioner, only their own'),

  ('owner',     'charge_payments',                  'granted', null),
  ('admin',     'charge_payments',                  'granted', null),
  ('recepcion', 'charge_payments',                  'granted', null),
  ('barbero',   'charge_payments',                  'granted', null),
  ('estilista', 'charge_payments',                  'granted', null),
  ('doctor',    'charge_payments',                  'denied',  null),

  ('owner',     'close_daily_till',                 'granted', null),
  ('admin',     'close_daily_till',                 'granted', null),
  ('recepcion', 'close_daily_till',                 'granted', null),
  ('barbero',   'close_daily_till',                 'denied',  null),
  ('estilista', 'close_daily_till',                 'denied',  null),
  ('doctor',    'close_daily_till',                 'denied',  null),

  ('owner',     'view_clinical_record',             'denied',  'bound to the patient''s permission'),
  ('admin',     'view_clinical_record',             'denied',  'bound to the patient''s permission'),
  ('recepcion', 'view_clinical_record',              'denied', 'bound to the patient''s permission'),
  ('barbero',   'view_clinical_record',             'denied',  'bound to the patient''s permission'),
  ('estilista', 'view_clinical_record',             'denied',  'bound to the patient''s permission'),
  ('doctor',    'view_clinical_record',             'granted', 'bound to the patient''s permission'),

  ('owner',     'write_clinical_note_prescription', 'denied',  'only with a registered license (cédula)'),
  ('admin',     'write_clinical_note_prescription', 'denied',  'only with a registered license (cédula)'),
  ('recepcion', 'write_clinical_note_prescription', 'denied',  'only with a registered license (cédula)'),
  ('barbero',   'write_clinical_note_prescription', 'denied',  'only with a registered license (cédula)'),
  ('estilista', 'write_clinical_note_prescription', 'denied',  'only with a registered license (cédula)'),
  ('doctor',    'write_clinical_note_prescription', 'granted', 'only with a registered license (cédula)'),

  ('owner',     'view_business_metrics',            'granted', null),
  ('admin',     'view_business_metrics',            'granted', null),
  ('recepcion', 'view_business_metrics',            'denied',  null),
  ('barbero',   'view_business_metrics',            'denied',  null),
  ('estilista', 'view_business_metrics',            'denied',  null),
  ('doctor',    'view_business_metrics',            'denied',  null),

  ('owner',     'edit_services_prices',             'granted', null),
  ('admin',     'edit_services_prices',             'granted', null),
  ('recepcion', 'edit_services_prices',             'denied',  null),
  ('barbero',   'edit_services_prices',             'denied',  null),
  ('estilista', 'edit_services_prices',             'denied',  null),
  ('doctor',    'edit_services_prices',             'denied',  null),

  ('owner',     'manage_staff_roles',               'granted', 'the admin cannot edit the owner'),
  ('admin',     'manage_staff_roles',               'limited', 'the admin cannot edit the owner'),
  ('recepcion', 'manage_staff_roles',               'denied',  null),
  ('barbero',   'manage_staff_roles',               'denied',  null),
  ('estilista', 'manage_staff_roles',               'denied',  null),
  ('doctor',    'manage_staff_roles',               'denied',  null),

  ('owner',     'import_export_data',               'granted', 'admin imports, only the owner exports'),
  ('admin',     'import_export_data',               'limited', 'admin imports, only the owner exports'),
  ('recepcion', 'import_export_data',               'denied',  null),
  ('barbero',   'import_export_data',               'denied',  null),
  ('estilista', 'import_export_data',               'denied',  null),
  ('doctor',    'import_export_data',               'denied',  null),

  ('owner',     'view_phi_audit_log',               'granted', null),
  ('admin',     'view_phi_audit_log',               'denied',  null),
  ('recepcion', 'view_phi_audit_log',               'denied',  null),
  ('barbero',   'view_phi_audit_log',               'denied',  null),
  ('estilista', 'view_phi_audit_log',               'denied',  null),
  ('doctor',    'view_phi_audit_log',               'denied',  null)
) as v(role_key, privilege_key, grant_state, limit_note)
join roles r on r.key = v.role_key and r.org_id = '11111111-1111-1111-1111-111111111111';

-- ---------------------------------------------------------------------------
-- Staff (user_id left null — see linking instructions at top of file)
-- ---------------------------------------------------------------------------

insert into staff (id, org_id, name, phone, status, specialty) values
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Alejandro Sauceda', '+52 55 1000 0001', 'invited', 'Propietario'),
  ('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111', 'Dra. Fernanda Ruiz', '+52 55 1000 0002', 'invited', 'Medicina general'),
  ('44444444-4444-4444-4444-444444444442', '11111111-1111-1111-1111-111111111111', 'Dr. Emilio Nava', '+52 55 1000 0003', 'invited', 'Medicina general'),
  ('44444444-4444-4444-4444-444444444443', '11111111-1111-1111-1111-111111111111', 'Mariana Robles', '+52 55 1000 0004', 'invited', 'Recepción');

insert into staff_branches (staff_id, branch_id) values
  ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222'),
  ('44444444-4444-4444-4444-444444444441', '22222222-2222-2222-2222-222222222222'),
  ('44444444-4444-4444-4444-444444444442', '22222222-2222-2222-2222-222222222222'),
  ('44444444-4444-4444-4444-444444444443', '22222222-2222-2222-2222-222222222222');

insert into staff_roles (staff_id, role_id) values
  ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-000000000001'),
  ('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-000000000006'),
  ('44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-000000000006'),
  ('44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-000000000003');

-- Dra. Ruiz 09:00-17:00, Dr. Nava 09:00-13:00 + 16:00-18:00 (staggered so
-- their SLOTS differ, matching the prototype).
insert into staff_hours (staff_id, weekday, start_time, end_time) values
  ('44444444-4444-4444-4444-444444444441', 1, '09:00', '17:00'),
  ('44444444-4444-4444-4444-444444444441', 2, '09:00', '17:00'),
  ('44444444-4444-4444-4444-444444444441', 3, '09:00', '17:00'),
  ('44444444-4444-4444-4444-444444444441', 4, '09:00', '17:00'),
  ('44444444-4444-4444-4444-444444444441', 5, '09:00', '17:00'),
  ('44444444-4444-4444-4444-444444444442', 1, '09:00', '13:00'),
  ('44444444-4444-4444-4444-444444444442', 2, '09:00', '13:00'),
  ('44444444-4444-4444-4444-444444444442', 3, '09:00', '13:00'),
  ('44444444-4444-4444-4444-444444444442', 4, '09:00', '13:00'),
  ('44444444-4444-4444-4444-444444444442', 5, '09:00', '13:00');

insert into staff_hours (staff_id, weekday, start_time, end_time) values
  ('44444444-4444-4444-4444-444444444442', 1, '16:00', '18:00'),
  ('44444444-4444-4444-4444-444444444442', 2, '16:00', '18:00'),
  ('44444444-4444-4444-4444-444444444442', 3, '16:00', '18:00'),
  ('44444444-4444-4444-4444-444444444442', 4, '16:00', '18:00'),
  ('44444444-4444-4444-4444-444444444442', 5, '16:00', '18:00');

-- ---------------------------------------------------------------------------
-- Services (from the prototype's SERVICES catalogue)
-- ---------------------------------------------------------------------------

insert into services (id, org_id, key, name, price_cents, duration_minutes, bookable, default_staff_id, recall_interval_months) values
  ('55555555-5555-5555-5555-000000000001', '11111111-1111-1111-1111-111111111111', 'consulta', 'Consulta general', 80000, 30, true, '44444444-4444-4444-4444-444444444441', null),
  ('55555555-5555-5555-5555-000000000002', '11111111-1111-1111-1111-111111111111', 'primera', 'Consulta de primera vez', 110000, 45, true, '44444444-4444-4444-4444-444444444441', null),
  ('55555555-5555-5555-5555-000000000003', '11111111-1111-1111-1111-111111111111', 'certificado', 'Certificado médico', 45000, 20, true, '44444444-4444-4444-4444-444444444442', null),
  ('55555555-5555-5555-5555-000000000004', '11111111-1111-1111-1111-111111111111', 'seguimiento', 'Seguimiento hipertensión', 60000, 30, false, '44444444-4444-4444-4444-444444444441', 1),
  ('55555555-5555-5555-5555-000000000005', '11111111-1111-1111-1111-111111111111', 'labs', 'Revisión de laboratorios', 50000, 30, false, '44444444-4444-4444-4444-444444444441', null);

-- ---------------------------------------------------------------------------
-- Patients
-- ---------------------------------------------------------------------------

insert into patients (id, org_id, name, age, sex, phone, folio) values
  ('66666666-6666-6666-6666-000000000001', '11111111-1111-1111-1111-111111111111', 'Marisol Aguirre Tenorio', 34, 'F', '+52 55 2000 0001', 'CS-0428'),
  ('66666666-6666-6666-6666-000000000002', '11111111-1111-1111-1111-111111111111', 'Tomás Escalante Vidal', 51, 'M', '+52 55 2000 0002', 'CS-0195'),
  ('66666666-6666-6666-6666-000000000003', '11111111-1111-1111-1111-111111111111', 'Ricardo Peña Lomelí', 58, 'M', '+52 55 2000 0003', 'CS-0301'),
  ('66666666-6666-6666-6666-000000000004', '11111111-1111-1111-1111-111111111111', 'Valeria Ontiveros', 29, 'F', '+52 55 2000 0004', 'CS-0512'),
  ('66666666-6666-6666-6666-000000000005', '11111111-1111-1111-1111-111111111111', 'Iker Domínguez', 8, 'M', '+52 55 2000 0005', 'CS-0560');

-- ---------------------------------------------------------------------------
-- Appointments — today, Roma Norte. Tomás Escalante has 2 of his last 4
-- marked 'cancelada' (missed) so the no-show-risk rule has something to
-- flag; his appointment today should surface as 'riesgo_no_show'.
-- ---------------------------------------------------------------------------

insert into appointments (branch_id, patient_id, staff_id, service_id, start_at, end_at, status, confirmed_via) values
  ('22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-000000000004', '44444444-4444-4444-4444-444444444441', '55555555-5555-5555-5555-000000000001', current_date + time '08:30', current_date + time '09:00', 'completada', 'staff'),
  ('22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-000000000003', '44444444-4444-4444-4444-444444444441', '55555555-5555-5555-5555-000000000004', current_date + time '09:15', current_date + time '09:45', 'en_consulta', 'staff'),
  ('22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-000000000001', '44444444-4444-4444-4444-444444444441', '55555555-5555-5555-5555-000000000005', current_date + time '10:45', current_date + time '11:15', 'confirmada', 'whatsapp'),
  ('22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-000000000002', '44444444-4444-4444-4444-444444444441', '55555555-5555-5555-5555-000000000001', current_date + time '11:30', current_date + time '12:00', 'riesgo_no_show', null),
  ('22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-000000000005', '44444444-4444-4444-4444-444444444442', '55555555-5555-5555-5555-000000000003', current_date + time '13:30', current_date + time '13:50', 'agendada', null);

-- Tomás's appointment history: 2 of the last 4 (before today's) were missed
-- without notice (no_show), not cancelled in advance.
insert into appointments (branch_id, patient_id, staff_id, service_id, start_at, end_at, status, confirmed_via, no_show) values
  ('22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-000000000002', '44444444-4444-4444-4444-444444444441', '55555555-5555-5555-5555-000000000001', (current_date + time '11:00') - interval '7 days', (current_date + time '11:30') - interval '7 days', 'completada', null, true),
  ('22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-000000000002', '44444444-4444-4444-4444-444444444441', '55555555-5555-5555-5555-000000000001', (current_date + time '11:00') - interval '14 days', (current_date + time '11:30') - interval '14 days', 'completada', null, false),
  ('22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-000000000002', '44444444-4444-4444-4444-444444444441', '55555555-5555-5555-5555-000000000001', (current_date + time '11:00') - interval '21 days', (current_date + time '11:30') - interval '21 days', 'completada', null, true),
  ('22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-000000000002', '44444444-4444-4444-4444-444444444441', '55555555-5555-5555-5555-000000000001', (current_date + time '11:00') - interval '28 days', (current_date + time '11:30') - interval '28 days', 'completada', null, false);

-- ---------------------------------------------------------------------------
-- Field definitions (§11 sensitivity table)
-- ---------------------------------------------------------------------------

insert into field_definitions (org_id, key, label, type, sensitivity, category_key, vertical) values
  ('11111111-1111-1111-1111-111111111111', 'allergies', 'Alergias', 'texto', 'critico', 'medicamentos', 'medicina'),
  ('11111111-1111-1111-1111-111111111111', 'contraindications', 'Contraindicaciones', 'texto', 'critico', 'medicamentos', 'medicina'),
  ('11111111-1111-1111-1111-111111111111', 'consult_notes', 'Notas de consulta', 'texto_largo', 'clinico', 'notas', 'medicina'),
  ('11111111-1111-1111-1111-111111111111', 'fasting_glucose', 'Glucosa en ayunas', 'numero', 'clinico', 'labs', 'medicina'),
  ('11111111-1111-1111-1111-111111111111', 'medications', 'Medicamentos actuales', 'lista', 'clinico', 'medicamentos', 'medicina'),
  ('11111111-1111-1111-1111-111111111111', 'mental_health', 'Historial de salud mental', 'texto_largo', 'sellado', 'mental', 'medicina'),
  ('11111111-1111-1111-1111-111111111111', 'sexual_health', 'Salud sexual y reproductiva', 'texto_largo', 'sellado', 'sexual', 'medicina'),
  ('11111111-1111-1111-1111-111111111111', 'phone', 'Teléfono de contacto', 'texto', 'contacto', 'contacto', null);

-- ---------------------------------------------------------------------------
-- Patient grants — Marisol has granted the 4 non-sealed categories at Roma
-- Norte; mental/sexual are off. Contact is always on. Tomás and the others
-- are left ungranted-by-default (closed by default, per decision #1) except
-- contact, so their record read narrows to "locked" categories.
-- ---------------------------------------------------------------------------

insert into patient_grants (patient_id, org_id, branch_id, category_key, granted, granted_at) values
  ('66666666-6666-6666-6666-000000000001', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'labs', true, now()),
  ('66666666-6666-6666-6666-000000000001', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'notas', true, now()),
  ('66666666-6666-6666-6666-000000000001', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'medicamentos', true, now()),
  ('66666666-6666-6666-6666-000000000001', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'mensajes', true, now()),
  ('66666666-6666-6666-6666-000000000001', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'mental', false, null),
  ('66666666-6666-6666-6666-000000000001', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'sexual', false, null),
  ('66666666-6666-6666-6666-000000000001', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'contacto', true, now());

-- Other patients: only the always-on contact category has a grant row at
-- all. No row for labs/notas/medicamentos/mensajes means "never requested"
-- (renders as the locked/"Solicitar acceso" placeholder), which is
-- different from a row with granted=false ("asked and declined" — renders
-- with no trace at all, per decision #2). Mental/sexual are sealed
-- unconditionally regardless of row presence, so they're omitted too.
insert into patient_grants (patient_id, org_id, branch_id, category_key, granted, granted_at)
select p.id, '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'contacto', true, now()
from (select id from patients where id in (
  '66666666-6666-6666-6666-000000000002',
  '66666666-6666-6666-6666-000000000003',
  '66666666-6666-6666-6666-000000000004',
  '66666666-6666-6666-6666-000000000005'
)) p;

-- ---------------------------------------------------------------------------
-- Lab results, medications, notes — enough to render the Expediente timeline
-- ---------------------------------------------------------------------------

insert into lab_results (patient_id, source, result_values, confirmed) values
  ('66666666-6666-6666-6666-000000000001', 'photo_ocr',
   '{"glucosa_ayuno": {"value": 104, "unit": "mg/dL", "range": "70-100"}, "colesterol_total": {"value": 189, "unit": "mg/dL", "range": "<200"}, "hba1c": {"value": 5.7, "unit": "%", "range": "<5.7"}, "creatinina": {"value": 0.9, "unit": "mg/dL", "range": "0.6-1.3"}}'::jsonb,
   false);

insert into medications (patient_id, drug_name, dose, frequency, since_date, patient_reported) values
  ('66666666-6666-6666-6666-000000000003', 'Losartán', '50 mg', '1 vez al día', current_date - interval '90 days', false),
  ('66666666-6666-6666-6666-000000000001', 'Metformina', '500 mg', '2 veces al día', current_date - interval '30 days', true);

insert into consultation_notes (patient_id, staff_id, body, signed_at, signed_by) values
  ('66666666-6666-6666-6666-000000000003', '44444444-4444-4444-4444-444444444441',
   'Seguimiento de hipertensión. Refiere fatiga leve. Antecedente: DM2. Perfil de laboratorios ordenado.',
   now() - interval '30 days', '44444444-4444-4444-4444-444444444441');

commit;
