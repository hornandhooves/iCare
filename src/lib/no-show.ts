// Decision #5 (§02/§03): no-show risk is a deterministic rule, not a model —
// "missed 2 of the last 4 appointments". Do not replace this with a score.

const LOOKBACK = 4;
const THRESHOLD = 2;

export function isNoShowRisk(
  pastAppointments: { start_at: string; no_show: boolean }[],
): boolean {
  const missedCount = pastAppointments
    .slice()
    .sort((a, b) => b.start_at.localeCompare(a.start_at))
    .slice(0, LOOKBACK)
    .filter((a) => a.no_show).length;

  return missedCount >= THRESHOLD;
}
