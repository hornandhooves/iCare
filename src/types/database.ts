// Hand-written to match supabase/migrations/0001_init.sql. Regenerate with
// `supabase gen types typescript` once the project is linked, if preferred.

export type AppointmentStatus =
  | "agendada"
  | "primera_vez"
  | "confirmada"
  | "en_consulta"
  | "completada"
  | "riesgo_no_show"
  | "cancelada";

export type ConfirmedVia = "whatsapp" | "staff";
export type StaffStatus = "invited" | "active";
export type FieldType = "texto" | "texto_largo" | "numero" | "lista" | "fecha";
export type FieldSensitivity = "contacto" | "clinico" | "critico" | "sellado";
export type FieldSource = "manual" | "ocr" | "whatsapp";
export type LabSource = "photo_ocr" | "manual";
export type PrivilegeGrantState = "granted" | "limited" | "denied";
export type AuditJustification =
  | "con_cita"
  | "sin_cita"
  | "fuera_de_horario"
  | "administrativo"
  | "automatico";
export type PermissionCategory =
  | "labs"
  | "notas"
  | "medicamentos"
  | "mensajes"
  | "mental"
  | "sexual"
  | "contacto";
export type PrivilegeKey =
  | "view_own_agenda"
  | "view_all_agenda"
  | "book_appointments"
  | "charge_payments"
  | "close_daily_till"
  | "view_clinical_record"
  | "write_clinical_note_prescription"
  | "view_business_metrics"
  | "edit_services_prices"
  | "manage_staff_roles"
  | "import_export_data"
  | "view_phi_audit_log";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          verticals: string[];
          whatsapp_number: string | null;
          onboarding_completed_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["organizations"]["Row"]> & {
          name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Row"]>;
        Relationships: [];
      };
      branches: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          location: string | null;
          biz_start_hour: number;
          biz_end_hour: number;
          biz_days: boolean[];
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["branches"]["Row"]> & {
          org_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["branches"]["Row"]>;
        Relationships: [];
      };
      roles: {
        Row: {
          id: string;
          org_id: string;
          key: string;
          name: string;
          is_builtin: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["roles"]["Row"]> & {
          org_id: string;
          key: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["roles"]["Row"]>;
        Relationships: [];
      };
      role_privileges: {
        Row: {
          id: string;
          role_id: string;
          privilege_key: PrivilegeKey;
          grant_state: PrivilegeGrantState;
          limit_note: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["role_privileges"]["Row"]> & {
          role_id: string;
          privilege_key: PrivilegeKey;
        };
        Update: Partial<Database["public"]["Tables"]["role_privileges"]["Row"]>;
        Relationships: [];
      };
      staff: {
        Row: {
          id: string;
          org_id: string;
          user_id: string | null;
          name: string;
          phone: string | null;
          status: StaffStatus;
          specialty: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["staff"]["Row"]> & {
          org_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["staff"]["Row"]>;
        Relationships: [];
      };
      staff_branches: {
        Row: { staff_id: string; branch_id: string };
        Insert: Database["public"]["Tables"]["staff_branches"]["Row"];
        Update: Partial<Database["public"]["Tables"]["staff_branches"]["Row"]>;
        Relationships: [];
      };
      staff_roles: {
        Row: { staff_id: string; role_id: string };
        Insert: Database["public"]["Tables"]["staff_roles"]["Row"];
        Update: Partial<Database["public"]["Tables"]["staff_roles"]["Row"]>;
        Relationships: [];
      };
      staff_hours: {
        Row: {
          id: string;
          staff_id: string;
          weekday: number;
          start_time: string;
          end_time: string;
        };
        Insert: Partial<Database["public"]["Tables"]["staff_hours"]["Row"]> & {
          staff_id: string;
          weekday: number;
          start_time: string;
          end_time: string;
        };
        Update: Partial<Database["public"]["Tables"]["staff_hours"]["Row"]>;
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          org_id: string;
          key: string;
          name: string;
          price_cents: number;
          duration_minutes: number;
          bookable: boolean;
          default_staff_id: string | null;
          recall_interval_months: number | null;
        };
        Insert: Partial<Database["public"]["Tables"]["services"]["Row"]> & {
          org_id: string;
          key: string;
          name: string;
          price_cents: number;
          duration_minutes: number;
        };
        Update: Partial<Database["public"]["Tables"]["services"]["Row"]>;
        Relationships: [];
      };
      patients: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          age: number | null;
          sex: string | null;
          phone: string | null;
          folio: string | null;
          user_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["patients"]["Row"]> & {
          org_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["patients"]["Row"]>;
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          branch_id: string;
          patient_id: string;
          staff_id: string;
          service_id: string;
          start_at: string;
          end_at: string;
          status: AppointmentStatus;
          confirmed_via: ConfirmedVia | null;
          declined: boolean;
          no_show: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["appointments"]["Row"]> & {
          branch_id: string;
          patient_id: string;
          staff_id: string;
          service_id: string;
          start_at: string;
          end_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["appointments"]["Row"]>;
        Relationships: [];
      };
      field_definitions: {
        Row: {
          id: string;
          org_id: string;
          key: string;
          label: string;
          type: FieldType;
          sensitivity: FieldSensitivity;
          category_key: PermissionCategory;
          vertical: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["field_definitions"]["Row"]> & {
          org_id: string;
          key: string;
          label: string;
          type: FieldType;
          sensitivity: FieldSensitivity;
          category_key: PermissionCategory;
        };
        Update: Partial<Database["public"]["Tables"]["field_definitions"]["Row"]>;
        Relationships: [];
      };
      patient_field_values: {
        Row: {
          id: string;
          patient_id: string;
          field_key: string;
          value: unknown;
          source: FieldSource;
          confirmed: boolean;
          confirmed_by: string | null;
          confirmed_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["patient_field_values"]["Row"]> & {
          patient_id: string;
          field_key: string;
        };
        Update: Partial<Database["public"]["Tables"]["patient_field_values"]["Row"]>;
        Relationships: [];
      };
      patient_grants: {
        Row: {
          id: string;
          patient_id: string;
          org_id: string;
          branch_id: string;
          category_key: PermissionCategory;
          granted: boolean;
          granted_at: string | null;
          expires_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["patient_grants"]["Row"]> & {
          patient_id: string;
          org_id: string;
          branch_id: string;
          category_key: PermissionCategory;
        };
        Update: Partial<Database["public"]["Tables"]["patient_grants"]["Row"]>;
        Relationships: [];
      };
      lab_results: {
        Row: {
          id: string;
          patient_id: string;
          source: LabSource;
          result_values: Record<string, { value: number; unit: string; range: string }>;
          confirmed: boolean;
          image_url: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["lab_results"]["Row"]> & {
          patient_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["lab_results"]["Row"]>;
        Relationships: [];
      };
      medications: {
        Row: {
          id: string;
          patient_id: string;
          drug_name: string;
          dose: string | null;
          frequency: string | null;
          since_date: string | null;
          patient_reported: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["medications"]["Row"]> & {
          patient_id: string;
          drug_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["medications"]["Row"]>;
        Relationships: [];
      };
      consultation_notes: {
        Row: {
          id: string;
          appointment_id: string | null;
          patient_id: string;
          staff_id: string;
          body: string | null;
          signed_at: string | null;
          signed_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["consultation_notes"]["Row"]> & {
          patient_id: string;
          staff_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["consultation_notes"]["Row"]>;
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          org_id: string;
          actor_staff_id: string | null;
          actor_role: string | null;
          patient_id: string;
          what: string;
          justification: AuditJustification;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["audit_log"]["Row"]> & {
          org_id: string;
          patient_id: string;
          what: string;
          justification: AuditJustification;
        };
        Update: Partial<Database["public"]["Tables"]["audit_log"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
