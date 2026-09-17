"use client";

import { useState } from "react";
import { setVerticals } from "./actions";
import { Button } from "@/components/ui/button";
import { VERTICAL_GROUPS } from "@/lib/field-templates";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function Step2Form({ dict, orgName }: { dict: Dictionary; orgName: string }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-[400px] flex-none flex-col justify-between bg-primary-deep p-10 text-white">
        <div>
          <h2 className="mb-3 text-xl font-bold">{dict.onboarding.step2.sidebarHeading}</h2>
          <p className="mb-8 text-sm text-[#cfe4f8]">{dict.onboarding.step2.sidebarSubtext}</p>
          <ol className="flex flex-col gap-5">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-full bg-white text-xs font-bold text-primary-deep">
                ✓
              </span>
              <div>
                <div className="text-sm font-bold">{dict.onboarding.step2.stepBusiness}</div>
                <div className="text-xs text-[#cfe4f8]">{orgName}</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-full bg-white text-xs font-bold text-primary-deep">
                2
              </span>
              <div>
                <div className="text-sm font-bold">{dict.onboarding.step2.stepWhatYouDo}</div>
                <div className="text-xs text-[#cfe4f8]">{dict.onboarding.step2.stepWhatYouDoDetail}</div>
              </div>
            </li>
            <li className="flex items-start gap-3 opacity-60">
              <span className="mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-full border border-white text-xs font-bold">
                3
              </span>
              <div>
                <div className="text-sm font-bold">{dict.onboarding.step2.stepWhatsapp}</div>
                <div className="text-xs text-[#cfe4f8]">{dict.onboarding.step2.stepWhatsappDetail}</div>
              </div>
            </li>
          </ol>
        </div>
        <p className="text-xs text-[#cfe4f8]">{dict.onboarding.step2.sidebarFooter}</p>
      </aside>

      <div className="flex flex-1 items-center justify-center p-10">
        <form action={setVerticals} className="w-full max-w-[560px]">
          <h1 className="mb-1.5 text-2xl font-bold text-text">{dict.onboarding.step2.heading}</h1>
          <p className="mb-6 text-sm text-text-secondary">{dict.onboarding.step2.subtext}</p>

          {VERTICAL_GROUPS.map((group) => (
            <div key={group.key} className="mb-6">
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-text-tertiary">
                {group.key === "salud" ? dict.onboarding.step2.groupHealth : dict.onboarding.step2.groupWellness}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {group.verticals.map((v) => {
                  const copy = dict.onboarding.verticals[v];
                  const checked = selected.has(v);
                  return (
                    <label
                      key={v}
                      className={`flex cursor-pointer flex-col rounded-xl border p-3 ${
                        checked ? "border-primary bg-tint-wash" : "border-border bg-surface"
                      }`}
                    >
                      <input
                        type="checkbox"
                        name="verticals"
                        value={v}
                        checked={checked}
                        onChange={() => toggle(v)}
                        className="sr-only"
                      />
                      <span className="text-sm font-bold text-text">{copy.label}</span>
                      <span className="text-xs text-text-tertiary">{copy.hint}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          <p className="mb-6 rounded-xl bg-field p-3.5 text-xs leading-relaxed text-text-secondary">
            {dict.onboarding.step2.callout}
          </p>

          <div className="flex justify-end">
            <Button type="submit" disabled={selected.size === 0}>
              {dict.onboarding.step2.continueButton}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
