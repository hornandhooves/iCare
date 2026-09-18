import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppointmentStatus, Database } from "@/types/database";
import { isNoShowRisk } from "@/lib/no-show";

export interface AgendaRow {
  id: string;
  startAt: string;
  endAt: string;
  patientName: string;
  patientId: string;
  serviceName: string;
  priceCents: number;
  staffId: string;
  staffName: string;
  status: AppointmentStatus;
  displayStatus: AppointmentStatus;
  confirmedVia: string | null;
}

export async function getStaffForBranch(supabase: SupabaseClient<Database>, branchId: string) {
  const { data } = (await supabase
    .from("staff_branches")
    .select("staff:staff_id(id, name)")
    .eq("branch_id", branchId)) as unknown as {
    data: { staff: { id: string; name: string } | null }[] | null;
  };

  return (data ?? []).map((r) => r.staff).filter((s): s is { id: string; name: string } => !!s);
}

const PALETTE = ["#208aef", "#5aa9ea", "#7fc0ff", "#9fb2c9"];
export function colorForStaff(staffId: string, allStaffIds: string[]): string {
  const idx = allStaffIds.indexOf(staffId);
  return PALETTE[idx === -1 ? 0 : idx % PALETTE.length];
}

export async function getAgendaRows(
  supabase: SupabaseClient<Database>,
  params: { branchId: string; dateStr: string; staffId?: string },
): Promise<AgendaRow[]> {
  interface JoinedRow {
    id: string;
    start_at: string;
    end_at: string;
    status: AppointmentStatus;
    confirmed_via: string | null;
    staff_id: string;
    patient_id: string;
    patients: { name: string } | null;
    services: { name: string; price_cents: number } | null;
    staff: { name: string } | null;
  }

  let query = supabase
    .from("appointments")
    .select(
      "id, start_at, end_at, status, confirmed_via, staff_id, patient_id, patients(name), services(name, price_cents), staff:staff_id(name)",
    )
    .eq("branch_id", params.branchId)
    .gte("start_at", `${params.dateStr}T00:00:00`)
    .lt("start_at", `${params.dateStr}T23:59:59`)
    .order("start_at", { ascending: true });

  if (params.staffId) query = query.eq("staff_id", params.staffId);

  const { data } = (await query) as unknown as { data: JoinedRow[] | null };
  const rows = data ?? [];

  const result: AgendaRow[] = [];
  for (const r of rows) {
    const patient = r.patients;
    const service = r.services;
    const staff = r.staff;

    // Decision #5: no-show risk is a rule ("missed 2 of the last 4"),
    // computed here rather than trusted from a stored status.
    let displayStatus = r.status;
    if (["agendada", "primera_vez", "confirmada"].includes(r.status)) {
      const { data: past } = await supabase
        .from("appointments")
        .select("start_at, no_show")
        .eq("patient_id", r.patient_id)
        .lt("start_at", `${params.dateStr}T00:00:00`)
        .order("start_at", { ascending: false })
        .limit(4);
      if (past && isNoShowRisk(past)) displayStatus = "riesgo_no_show";
    }

    result.push({
      id: r.id,
      startAt: r.start_at,
      endAt: r.end_at,
      patientName: patient?.name ?? "—",
      patientId: r.patient_id,
      serviceName: service?.name ?? "—",
      priceCents: service?.price_cents ?? 0,
      staffId: r.staff_id,
      staffName: staff?.name ?? "—",
      status: r.status,
      displayStatus,
      confirmedVia: r.confirmed_via,
    });
  }

  return result;
}

export function getAgendaStats(rows: AgendaRow[]) {
  const nonCancelled = rows.filter((r) => r.status !== "cancelada");
  const unconfirmed = rows.filter((r) => ["agendada", "primera_vez"].includes(r.status)).length;
  const revenueCents = nonCancelled.reduce((sum, r) => sum + r.priceCents, 0);

  return {
    appointments: nonCancelled.length,
    unconfirmed,
    revenue: revenueCents / 100,
  };
}
