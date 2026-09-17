import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, PermissionCategory } from "@/types/database";
import {
  getCategoryVisibility,
  getPatientGrants,
  hasPrivilege,
  writeAuditLog,
  type CategoryVisibility,
  type StaffContext,
} from "@/lib/permissions";

export interface ExpedienteData {
  patient: { id: string; name: string; age: number | null; sex: string | null; folio: string | null };
  hasClinicalAccess: boolean;
  criticalFields: { label: string; value: unknown }[];
  contactFields: { label: string; value: unknown }[];
  categoryVisibility: Partial<Record<PermissionCategory, CategoryVisibility>>;
  notes: { id: string; body: string | null; signedAt: string | null; staffName: string }[];
  labs: { id: string; resultValues: Record<string, { value: number; unit: string; range: string }>; confirmed: boolean }[];
  medications: { id: string; drugName: string; dose: string | null; frequency: string | null }[];
  visits: { id: string; startAt: string; serviceName: string; status: string }[];
}

// §04's core rule: filtering happens server-side. A field whose category
// isn't granted is simply absent from this return shape — never a null
// placeholder or a count — so the UI can't leak that something was hidden.
export async function getExpedienteData(
  supabase: SupabaseClient<Database>,
  ctx: StaffContext,
  patientId: string,
  branchId: string,
): Promise<ExpedienteData | null> {
  const { data: patient } = await supabase
    .from("patients")
    .select("id, name, age, sex, folio")
    .eq("id", patientId)
    .single();
  if (!patient) return null;

  const grants = await getPatientGrants(supabase, patientId, branchId);
  const hasClinicalAccess = hasPrivilege(ctx, "view_clinical_record");

  const { data: fieldDefs } = await supabase
    .from("field_definitions")
    .select("key, label, sensitivity, category_key")
    .eq("org_id", ctx.orgId);

  const { data: fieldValues } = await supabase
    .from("patient_field_values")
    .select("field_key, value")
    .eq("patient_id", patientId);
  const valueByKey = new Map((fieldValues ?? []).map((v) => [v.field_key, v.value]));

  // Critical (e.g. allergies) and contact fields are always shown — never
  // gated by a grant. Critical's hide-behind-a-signed-warning exception is
  // §15, pending legal review; until that's resolved the safer fallback
  // (stated in the design handoff itself) is that critical fields cannot be
  // hidden at all.
  const criticalFields = (fieldDefs ?? [])
    .filter((f) => f.sensitivity === "critico" && valueByKey.has(f.key))
    .map((f) => ({ label: f.label, value: valueByKey.get(f.key) }));
  const contactFields = (fieldDefs ?? [])
    .filter((f) => f.sensitivity === "contacto" && valueByKey.has(f.key))
    .map((f) => ({ label: f.label, value: valueByKey.get(f.key) }));

  const categoryVisibility: Partial<Record<PermissionCategory, CategoryVisibility>> = {};
  for (const cat of ["labs", "notas", "medicamentos", "mensajes"] as PermissionCategory[]) {
    categoryVisibility[cat] = getCategoryVisibility(cat, grants);
  }

  let notes: ExpedienteData["notes"] = [];
  let labs: ExpedienteData["labs"] = [];
  let medications: ExpedienteData["medications"] = [];

  if (hasClinicalAccess) {
    if (categoryVisibility.notas === "granted") {
      const { data } = (await supabase
        .from("consultation_notes")
        .select("id, body, signed_at, staff:staff_id(name)")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })) as unknown as {
        data: { id: string; body: string | null; signed_at: string | null; staff: { name: string } | null }[] | null;
      };
      notes = (data ?? []).map((n) => ({
        id: n.id,
        body: n.body,
        signedAt: n.signed_at,
        staffName: n.staff?.name ?? "",
      }));
    }

    if (categoryVisibility.labs === "granted") {
      const { data } = await supabase
        .from("lab_results")
        .select("id, result_values, confirmed")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
      labs = (data ?? []).map((l) => ({
        id: l.id,
        resultValues: l.result_values,
        confirmed: l.confirmed,
      }));
    }

    if (categoryVisibility.medicamentos === "granted") {
      const { data } = await supabase
        .from("medications")
        .select("id, drug_name, dose, frequency")
        .eq("patient_id", patientId);
      medications = (data ?? []).map((m) => ({
        id: m.id,
        drugName: m.drug_name,
        dose: m.dose,
        frequency: m.frequency,
      }));
    }
  }

  const { data: visitRows } = (await supabase
    .from("appointments")
    .select("id, start_at, status, services(name)")
    .eq("patient_id", patientId)
    .order("start_at", { ascending: false })
    .limit(10)) as unknown as {
    data: { id: string; start_at: string; status: string; services: { name: string } | null }[] | null;
  };
  const visits = (visitRows ?? []).map((v) => ({
    id: v.id,
    startAt: v.start_at,
    serviceName: v.services?.name ?? "",
    status: v.status,
  }));

  const hasApptToday = visits.some((v) => v.startAt.slice(0, 10) === new Date().toISOString().slice(0, 10));

  await writeAuditLog({
    orgId: ctx.orgId,
    actorStaffId: ctx.staffId,
    actorRole: ctx.roleKey,
    patientId,
    what: hasClinicalAccess ? "Expediente clínico" : "Contacto y visitas",
    justification: hasApptToday ? "con_cita" : "sin_cita",
  });

  return {
    patient,
    hasClinicalAccess,
    criticalFields,
    contactFields,
    categoryVisibility,
    notes,
    labs,
    medications,
    visits,
  };
}
