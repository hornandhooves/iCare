"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { getSlotsForService, bookAppointment } from "./actions";
import type { Dictionary } from "@/lib/i18n/dictionaries";

interface Service {
  id: string;
  name: string;
  bookable: boolean;
}
interface Patient {
  id: string;
  name: string;
}

export function NewAppointmentDialog({
  dict,
  branchId,
  dateStr,
  services,
  patients,
}: {
  dict: Dictionary;
  branchId: string;
  dateStr: string;
  services: Service[];
  patients: Patient[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [patientId, setPatientId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [staffName, setStaffName] = useState("");
  const [isPending, startTransition] = useTransition();

  function onServiceChange(id: string) {
    setServiceId(id);
    setTime("");
    setSlots([]);
    if (!id) return;
    startTransition(async () => {
      const result = await getSlotsForService(id, branchId, dateStr);
      setSlots(result?.slots ?? []);
      setStaffName(result?.staffName ?? "");
    });
  }

  function reset() {
    setPatientId("");
    setServiceId("");
    setTime("");
    setSlots([]);
  }

  const canBook = Boolean(patientId && serviceId && time);
  const bookableServices = services.filter((s) => s.bookable);

  return (
    <>
      <Button onClick={() => dialogRef.current?.showModal()}>{dict.agenda.newAppointment}</Button>
      <dialog
        ref={dialogRef}
        className="w-full max-w-[440px] rounded-2xl border border-hairline p-0 backdrop:bg-black/30"
        onClose={reset}
      >
        <form
          action={(formData) => {
            startTransition(async () => {
              await bookAppointment(formData);
              dialogRef.current?.close();
              reset();
            });
          }}
          className="flex flex-col gap-4 p-6"
        >
          <h2 className="text-lg font-bold text-text">{dict.agenda.newAppointmentDialog.title}</h2>

          <input type="hidden" name="branchId" value={branchId} />
          <input type="hidden" name="date" value={dateStr} />

          <div>
            <label className="mb-1.5 block text-xs font-bold text-text-secondary">
              {dict.agenda.newAppointmentDialog.patient}
            </label>
            <select
              name="patientId"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-field px-3 text-sm text-text"
            >
              <option value="">{dict.agenda.newAppointmentDialog.selectPatient}</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-text-secondary">
              {dict.agenda.newAppointmentDialog.service}
            </label>
            <select
              name="serviceId"
              value={serviceId}
              onChange={(e) => onServiceChange(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-field px-3 text-sm text-text"
            >
              <option value="">{dict.agenda.newAppointmentDialog.selectService}</option>
              {bookableServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {serviceId && (
            <div>
              <label className="mb-1.5 block text-xs font-bold text-text-secondary">
                {dict.agenda.newAppointmentDialog.time}
                {staffName ? ` · ${staffName}` : ""}
              </label>
              {slots.length === 0 ? (
                <p className="text-xs text-text-tertiary">{dict.agenda.newAppointmentDialog.noSlots}</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {slots.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTime(s)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                        time === s
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-surface text-text"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <input type="hidden" name="time" value={time} />
            </div>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => dialogRef.current?.close()}>
              {dict.common.cancel}
            </Button>
            <Button type="submit" disabled={!canBook || isPending}>
              {dict.agenda.newAppointmentDialog.book}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
