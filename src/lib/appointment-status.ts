import type { AppointmentStatus } from "@/types/database";

export const STATUS_STYLES: Record<AppointmentStatus, { bg: string; fg: string }> = {
  agendada: { bg: "bg-field", fg: "text-text-secondary" },
  primera_vez: { bg: "bg-field", fg: "text-text-secondary" },
  confirmada: { bg: "bg-tint-wash", fg: "text-primary-deep" },
  en_consulta: { bg: "bg-primary", fg: "text-white" },
  completada: { bg: "bg-success-wash", fg: "text-success" },
  riesgo_no_show: { bg: "bg-warning-wash", fg: "text-warning" },
  cancelada: { bg: "bg-danger-wash", fg: "text-danger" },
};

// §03 "what changed": only the likely next action shows on the row; the
// rest move to an overflow menu instead of rendering every legal
// transition as its own button.
export const PRIMARY_NEXT_STATUS: Partial<Record<AppointmentStatus, AppointmentStatus>> = {
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
