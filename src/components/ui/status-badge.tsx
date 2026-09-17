import { STATUS_STYLES } from "@/lib/appointment-status";
import type { AppointmentStatus } from "@/types/database";

export function StatusBadge({ status, label }: { status: AppointmentStatus; label: string }) {
  const { bg, fg } = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${bg} ${fg}`}>
      {label}
    </span>
  );
}
