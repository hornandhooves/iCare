"use client";

import { useTransition } from "react";
import { updateGrant } from "./actions";
import type { PermissionCategory } from "@/types/database";

export function GrantToggle({
  patientId,
  orgId,
  branchId,
  category,
  granted,
  sealed,
  label,
  onLabel,
  offLabel,
  sealedConfirmText,
}: {
  patientId: string;
  orgId: string;
  branchId: string;
  category: PermissionCategory;
  granted: boolean;
  sealed: boolean;
  label: string;
  onLabel: string;
  offLabel: string;
  sealedConfirmText: string;
}) {
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !granted;
    if (sealed && next && !window.confirm(sealedConfirmText)) return;

    const formData = new FormData();
    formData.set("patientId", patientId);
    formData.set("orgId", orgId);
    formData.set("branchId", branchId);
    formData.set("category", category);
    formData.set("granted", String(next));
    startTransition(() => updateGrant(formData));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-field disabled:opacity-60"
    >
      <span className="text-sm font-semibold text-text">{label}</span>
      <span
        className={`rounded-full px-3 py-1 text-xs font-bold ${
          granted ? "bg-primary text-white" : "bg-field text-text-tertiary"
        }`}
      >
        {granted ? onLabel : offLabel}
      </span>
    </button>
  );
}
