"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAvailableSlots } from "@/lib/availability";
import { addMinutes, wallClockTimestamp } from "@/lib/time";
import type { AppointmentStatus } from "@/types/database";

export async function getSlotsForService(
  serviceId: string,
  branchId: string,
  dateStr: string,
): Promise<{ staffId: string; staffName: string; slots: string[] } | null> {
  const supabase = await createClient();
  const { data: service } = (await supabase
    .from("services")
    .select("default_staff_id, duration_minutes, staff:default_staff_id(name)")
    .eq("id", serviceId)
    .single()) as unknown as {
    data: { default_staff_id: string | null; duration_minutes: number; staff: { name: string } | null } | null;
  };

  if (!service?.default_staff_id) return null;

  const slots = await getAvailableSlots({
    supabase,
    branchId,
    staffId: service.default_staff_id,
    dateStr,
    durationMinutes: service.duration_minutes,
  });

  return { staffId: service.default_staff_id, staffName: service.staff?.name ?? "", slots };
}

export async function bookAppointment(formData: FormData) {
  const supabase = await createClient();
  const branchId = String(formData.get("branchId"));
  const patientId = String(formData.get("patientId"));
  const serviceId = String(formData.get("serviceId"));
  const time = String(formData.get("time"));
  const dateStr = String(formData.get("date"));

  if (!patientId || !serviceId || !time || !dateStr) return;

  const { data: service } = await supabase
    .from("services")
    .select("default_staff_id, duration_minutes")
    .eq("id", serviceId)
    .single();
  if (!service?.default_staff_id) return;

  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("id", patientId)
    .single();
  if (!patient) return;

  const { count: priorVisits } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("patient_id", patientId);

  const status: AppointmentStatus = priorVisits && priorVisits > 0 ? "agendada" : "primera_vez";

  await supabase.from("appointments").insert({
    branch_id: branchId,
    patient_id: patientId,
    staff_id: service.default_staff_id,
    service_id: serviceId,
    start_at: wallClockTimestamp(dateStr, time),
    end_at: wallClockTimestamp(dateStr, addMinutes(time, service.duration_minutes)),
    status,
  });

  revalidatePath("/agenda");
}

export async function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
  const supabase = await createClient();
  await supabase.from("appointments").update({ status }).eq("id", appointmentId);
  revalidatePath("/agenda");
}
