// Plain HH:MM <-> minutes-since-midnight helpers. Deliberately avoid `Date`
// for this arithmetic: constructing `new Date("YYYY-MM-DDTHH:MM:00")` parses
// as the server process's local timezone, and `.toISOString()` then shifts
// the digits to UTC — which would silently break the invariant the rest of
// the app relies on, that a stored timestamp's HH:MM digits equal the
// branch's local wall-clock time (see availability.ts). Single-timezone
// (Mexico) assumption for this pass; revisit if the product spans zones.

export function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function addMinutes(hhmm: string, minutesToAdd: number): string {
  return formatTime(parseTime(hhmm) + minutesToAdd);
}

export function wallClockTimestamp(dateStr: string, hhmm: string): string {
  return `${dateStr}T${hhmm}:00`;
}
