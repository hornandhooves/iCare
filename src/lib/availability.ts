import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { parseTime, formatTime } from "@/lib/time";

// Decision #4 (§02/§03): availability is the intersection of three things —
// the branch is open, the practitioner is on shift, and the practitioner has
// no overlapping appointment. All three must pass; this is the one place
// that computes it, so the booking dialog and (later) the WhatsApp bot never
// disagree about what's free.

const SLOT_GRANULARITY_MINUTES = 15;

// Local wall-clock minutes-since-midnight for a `YYYY-MM-DDTHH:MM` string —
// avoids UTC-shift bugs from parsing with `Date` for plain local times.
function minutesFromIso(iso: string, dateStr: string): number | null {
  const datePart = iso.slice(0, 10);
  if (datePart !== dateStr) return null;
  return parseTime(iso.slice(11, 16));
}

interface AvailabilityParams {
  supabase: SupabaseClient<Database>;
  branchId: string;
  staffId: string;
  dateStr: string; // YYYY-MM-DD, local to the branch
  durationMinutes: number;
}

export async function getAvailableSlots({
  supabase,
  branchId,
  staffId,
  dateStr,
  durationMinutes,
}: AvailabilityParams): Promise<string[]> {
  const weekday = new Date(`${dateStr}T00:00:00`).getDay();

  const { data: branch } = await supabase
    .from("branches")
    .select("biz_start_hour, biz_end_hour, biz_days")
    .eq("id", branchId)
    .single();

  if (!branch || !branch.biz_days[weekday]) return [];

  const bizStart = branch.biz_start_hour * 60;
  const bizEnd = branch.biz_end_hour * 60;

  const { data: shifts } = await supabase
    .from("staff_hours")
    .select("start_time, end_time")
    .eq("staff_id", staffId)
    .eq("weekday", weekday);

  if (!shifts || shifts.length === 0) return [];

  const { data: existing } = await supabase
    .from("appointments")
    .select("start_at, end_at")
    .eq("staff_id", staffId)
    .neq("status", "cancelada")
    .gte("start_at", `${dateStr}T00:00:00`)
    .lt("start_at", `${dateStr}T23:59:59`);

  const busy = (existing ?? [])
    .map((a) => ({
      start: minutesFromIso(a.start_at, dateStr),
      end: minutesFromIso(a.end_at, dateStr),
    }))
    .filter((r): r is { start: number; end: number } => r.start !== null && r.end !== null);

  const slots: string[] = [];

  for (const shift of shifts) {
    // Business open ∩ staff on shift.
    const windowStart = Math.max(bizStart, parseTime(shift.start_time.slice(0, 5)));
    const windowEnd = Math.min(bizEnd, parseTime(shift.end_time.slice(0, 5)));

    for (
      let candidate = windowStart;
      candidate + durationMinutes <= windowEnd;
      candidate += SLOT_GRANULARITY_MINUTES
    ) {
      const candidateEnd = candidate + durationMinutes;
      const overlaps = busy.some((b) => candidate < b.end && candidateEnd > b.start);
      if (!overlaps) slots.push(formatTime(candidate));
    }
  }

  return Array.from(new Set(slots)).sort();
}
