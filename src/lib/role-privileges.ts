import type { PrivilegeGrantState, PrivilegeKey } from "@/types/database";

// §24's privilege matrix, seeded verbatim for every new organization at
// onboarding. The role-management UI to edit this per-org is a later pass —
// for now every org starts with exactly these 6 roles.
export const DEFAULT_ROLES = [
  { key: "owner", name: "Propietario" },
  { key: "admin", name: "Admin" },
  { key: "recepcion", name: "Recepción" },
  { key: "barbero", name: "Barbero" },
  { key: "estilista", name: "Estilista" },
  { key: "doctor", name: "Doctor" },
] as const;

interface PrivilegeRow {
  roleKey: (typeof DEFAULT_ROLES)[number]["key"];
  privilegeKey: PrivilegeKey;
  grantState: PrivilegeGrantState;
  limitNote: string | null;
}

function row(
  roleKey: PrivilegeRow["roleKey"],
  privilegeKey: PrivilegeKey,
  grantState: PrivilegeGrantState,
  limitNote: string | null = null,
): PrivilegeRow {
  return { roleKey, privilegeKey, grantState, limitNote };
}

export const DEFAULT_ROLE_PRIVILEGES: PrivilegeRow[] = [
  ...(["owner", "admin", "recepcion", "barbero", "estilista", "doctor"] as const).map((r) =>
    row(r, "view_own_agenda", "granted", "cannot be removed"),
  ),

  row("owner", "view_all_agenda", "granted"),
  row("admin", "view_all_agenda", "granted"),
  row("recepcion", "view_all_agenda", "granted"),
  row("barbero", "view_all_agenda", "denied"),
  row("estilista", "view_all_agenda", "denied"),
  row("doctor", "view_all_agenda", "denied"),

  row("owner", "book_appointments", "granted"),
  row("admin", "book_appointments", "granted"),
  row("recepcion", "book_appointments", "granted"),
  row("barbero", "book_appointments", "limited", "the practitioner, only their own"),
  row("estilista", "book_appointments", "limited", "the practitioner, only their own"),
  row("doctor", "book_appointments", "limited", "the practitioner, only their own"),

  row("owner", "charge_payments", "granted"),
  row("admin", "charge_payments", "granted"),
  row("recepcion", "charge_payments", "granted"),
  row("barbero", "charge_payments", "granted"),
  row("estilista", "charge_payments", "granted"),
  row("doctor", "charge_payments", "denied"),

  row("owner", "close_daily_till", "granted"),
  row("admin", "close_daily_till", "granted"),
  row("recepcion", "close_daily_till", "granted"),
  row("barbero", "close_daily_till", "denied"),
  row("estilista", "close_daily_till", "denied"),
  row("doctor", "close_daily_till", "denied"),

  ...(["owner", "admin", "recepcion", "barbero", "estilista"] as const).map((r) =>
    row(r, "view_clinical_record", "denied", "bound to the patient's permission"),
  ),
  row("doctor", "view_clinical_record", "granted", "bound to the patient's permission"),

  ...(["owner", "admin", "recepcion", "barbero", "estilista"] as const).map((r) =>
    row(r, "write_clinical_note_prescription", "denied", "only with a registered license (cédula)"),
  ),
  row("doctor", "write_clinical_note_prescription", "granted", "only with a registered license (cédula)"),

  row("owner", "view_business_metrics", "granted"),
  row("admin", "view_business_metrics", "granted"),
  row("recepcion", "view_business_metrics", "denied"),
  row("barbero", "view_business_metrics", "denied"),
  row("estilista", "view_business_metrics", "denied"),
  row("doctor", "view_business_metrics", "denied"),

  row("owner", "edit_services_prices", "granted"),
  row("admin", "edit_services_prices", "granted"),
  row("recepcion", "edit_services_prices", "denied"),
  row("barbero", "edit_services_prices", "denied"),
  row("estilista", "edit_services_prices", "denied"),
  row("doctor", "edit_services_prices", "denied"),

  row("owner", "manage_staff_roles", "granted", "the admin cannot edit the owner"),
  row("admin", "manage_staff_roles", "limited", "the admin cannot edit the owner"),
  row("recepcion", "manage_staff_roles", "denied"),
  row("barbero", "manage_staff_roles", "denied"),
  row("estilista", "manage_staff_roles", "denied"),
  row("doctor", "manage_staff_roles", "denied"),

  row("owner", "import_export_data", "granted", "admin imports, only the owner exports"),
  row("admin", "import_export_data", "limited", "admin imports, only the owner exports"),
  row("recepcion", "import_export_data", "denied"),
  row("barbero", "import_export_data", "denied"),
  row("estilista", "import_export_data", "denied"),
  row("doctor", "import_export_data", "denied"),

  row("owner", "view_phi_audit_log", "granted"),
  row("admin", "view_phi_audit_log", "denied"),
  row("recepcion", "view_phi_audit_log", "denied"),
  row("barbero", "view_phi_audit_log", "denied"),
  row("estilista", "view_phi_audit_log", "denied"),
  row("doctor", "view_phi_audit_log", "denied"),
];
