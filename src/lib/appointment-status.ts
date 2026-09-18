import type { AppointmentStatus } from "@/types/database";

// Matches the prototype: neutral gray for ordinary/informational states,
// tint-wash blue for "confirmed and on track", and solid primary blue
// reserved for the one status that should actually catch the eye
// (no-show risk) — not, as you'd guess, for "in progress".
export const STATUS_STYLES: Record<AppointmentStatus, { bg: string; fg: string }> = {
  agendada: { bg: "bg-field", fg: "text-text-secondary" },
  primera_vez: { bg: "bg-field", fg: "text-text-secondary" },
  confirmada: { bg: "bg-tint-wash", fg: "text-primary-deep" },
  en_consulta: { bg: "bg-tint-wash", fg: "text-primary-deep" },
  completada: { bg: "bg-field", fg: "text-text-secondary" },
  riesgo_no_show: { bg: "bg-primary", fg: "text-white" },
  cancelada: { bg: "bg-danger-wash", fg: "text-danger" },
};

// The only three targets a primary action button can move a row to — kept
// as its own type so dict.agenda.actions (verb labels) only needs to cover
// these, not every AppointmentStatus.
export type ActionableStatus = "confirmada" | "en_consulta" | "completada";

// §03 "what changed": only the likely next action shows on the row; the
// rest move to an overflow menu instead of rendering every legal
// transition as its own button.
export const PRIMARY_NEXT_STATUS: Partial<Record<AppointmentStatus, ActionableStatus>> = {
  agendada: "confirmada",
  primera_vez: "confirmada",
  confirmada: "en_consulta",
  en_consulta: "completada",
  riesgo_no_show: "confirmada",
};

export const ALL_STATUSES: AppointmentStatus[] = [
  "agendada",
  "primera_vez",
  "confirmada",
  "en_consulta",
  "completada",
  "riesgo_no_show",
  "cancelada",
];
