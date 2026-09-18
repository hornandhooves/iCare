import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, PermissionCategory } from "@/types/database";
import type { ExpedienteData } from "@/features/expediente/data";

export interface LinkedBusiness {
  patientId: string;
  orgId: string;
  orgName: string;
}

export async function getLinkedBusinesses(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<LinkedBusiness[]> {
  const { data } = (await supabase
    .from("patients")
    .select("id, org_id, organizations(name)")
    .eq("user_id", userId)) as unknown as {
    data: { id: string; org_id: string; organizations: { name: string } | null }[] | null;
  };

  return (data ?? []).map((r) => ({
    patientId: r.id,
    orgId: r.org_id,
    orgName: r.organizations?.name ?? "",
  }));
}

export interface BranchGrants {
  branchId: string;
  branchName: string;
  grants: Partial<Record<PermissionCategory, boolean>>; // present key = a row exists
}

const TOGGLEABLE: PermissionCategory[] = ["labs", "notas", "medicamentos", "mensajes", "mental", "sexual"];

// Branches a patient can grant/revoke access at — anywhere they've actually
// been seen, plus anywhere a grant already exists (covers a grant made
// before any appointment was ever recorded).
export async function getBranchGrants(
  supabase: SupabaseClient<Database>,
  patientId: string,
  orgId: string,
): Promise<BranchGrants[]> {
  const { data: visited } = await supabase
    .from("appointments")
    .select("branch_id")
    .eq("patient_id", patientId);
  const { data: grantRows } = await supabase
    .from("patient_grants")
    .select("branch_id, category_key, granted")
    .eq("patient_id", patientId);

  const branchIds = new Set<string>();
  for (const v of visited ?? []) branchIds.add(v.branch_id);
  for (const g of grantRows ?? []) branchIds.add(g.branch_id);
  if (branchIds.size === 0) return [];

  const { data: branches } = await supabase
    .from("branches")
    .select("id, name")
    .in("id", Array.from(branchIds))
    .eq("org_id", orgId);

  return (branches ?? []).map((b) => {
    const grants: Partial<Record<PermissionCategory, boolean>> = {};
    for (const g of grantRows ?? []) {
      if (g.branch_id === b.id) grants[g.category_key] = g.granted;
    }
    return { branchId: b.id, branchName: b.name, grants };
  });
}

export { TOGGLEABLE as TOGGLEABLE_CATEGORIES };

// The patient's own view of their record — unlike the staff-facing
// Expediente, nothing here is gated by category. Sensitivity tiers and
// grants control what a *business* can see; a patient can always see
// everything about themselves. No audit log entry either — that log exists
// to track business staff opening a record, not a patient looking at their
// own data.
export async function getOwnRecordData(
  supabase: SupabaseClient<Database>,
  patientId: string,
): Promise<ExpedienteData> {
  const { data: patient } = await supabase
    .from("patients")
    .select("id, name, age, sex, folio")
    .eq("id", patientId)
    .single();

  const { data: fieldValues } = await supabase
    .from("patient_field_values")
    .select("field_key, value")
    .eq("patient_id", patientId);

  const { data: fieldDefs } = patient
    ? await supabase.from("field_definitions").select("key, label, sensitivity")
    : { data: null };
  const valueByKey = new Map((fieldValues ?? []).map((v) => [v.field_key, v.value]));

  const criticalFields = (fieldDefs ?? [])
    .filter((f) => f.sensitivity === "critico" && valueByKey.has(f.key))
    .map((f) => ({ label: f.label, value: valueByKey.get(f.key) }));
  const contactFields = (fieldDefs ?? [])
    .filter((f) => f.sensitivity === "contacto" && valueByKey.has(f.key))
    .map((f) => ({ label: f.label, value: valueByKey.get(f.key) }));

  const { data: noteRows } = (await supabase
    .from("consultation_notes")
    .select("id, body, signed_at, staff:staff_id(name)")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })) as unknown as {
    data: { id: string; body: string | null; signed_at: string | null; staff: { name: string } | null }[] | null;
  };
  const notes = (noteRows ?? []).map((n) => ({
    id: n.id,
    body: n.body,
    signedAt: n.signed_at,
    staffName: n.staff?.name ?? "",
  }));

  const { data: labRows } = await supabase
    .from("lab_results")
    .select("id, result_values, confirmed")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  const labs = (labRows ?? []).map((l) => ({ id: l.id, resultValues: l.result_values, confirmed: l.confirmed }));

  const { data: medRows } = await supabase
    .from("medications")
    .select("id, drug_name, dose, frequency")
    .eq("patient_id", patientId);
  const medications = (medRows ?? []).map((m) => ({
    id: m.id,
    drugName: m.drug_name,
    dose: m.dose,
    frequency: m.frequency,
  }));

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

  return {
    patient: patient ?? { id: patientId, name: "", age: null, sex: null, folio: null },
    hasClinicalAccess: true,
    criticalFields,
    contactFields,
    categoryVisibility: { labs: "granted", notas: "granted", medicamentos: "granted", mensajes: "granted" },
    notes,
    labs,
    medications,
    visits,
  };
}
