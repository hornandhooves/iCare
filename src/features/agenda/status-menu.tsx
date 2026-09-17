"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal } from "lucide-react";
import { updateAppointmentStatus } from "./actions";
import { ALL_STATUSES, PRIMARY_NEXT_STATUS } from "@/lib/appointment-status";
import type { AppointmentStatus } from "@/types/database";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function StatusMenu({
  appointmentId,
  status,
  dict,
}: {
  appointmentId: string;
  status: AppointmentStatus;
  dict: Dictionary;
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const primaryNext = PRIMARY_NEXT_STATUS[status];
  const otherStatuses = ALL_STATUSES.filter((s) => s !== status && s !== primaryNext);

  function apply(next: AppointmentStatus) {
    setOpen(false);
    startTransition(() => updateAppointmentStatus(appointmentId, next));
  }

  return (
    <div className="relative flex items-center gap-1">
      {primaryNext && (
        <button
          type="button"
          onClick={() => apply(primaryNext)}
          className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white"
        >
          {dict.agenda.status[primaryNext]}
        </button>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="grid h-8 w-8 place-items-center rounded-full text-text-tertiary hover:bg-field"
      >
        <MoreHorizontal size={16} strokeWidth={2.75} />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-10 w-44 rounded-xl border border-hairline bg-surface py-1 shadow-[0_3px_10px_rgba(16,24,40,.13)]">
          {otherStatuses.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => apply(s)}
              className="block w-full px-3 py-2 text-left text-xs font-semibold text-text hover:bg-field"
            >
              {dict.agenda.status[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
