"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import type { ExpedienteData } from "./data";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { CategoryVisibility } from "@/lib/permissions";

export function ExpedienteTabs({
  data,
  dict,
}: {
  data: Pick<ExpedienteData, "notes" | "labs" | "categoryVisibility">;
  dict: Dictionary;
}) {
  const [tab, setTab] = useState<"notas" | "labs">("notas");

  const tabButton = (key: "notas" | "labs", label: string) => (
    <button
      type="button"
      onClick={() => setTab(key)}
      className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
        tab === key ? "bg-primary text-white" : "text-text-secondary hover:bg-field"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="mb-3 flex gap-1">
        {tabButton("notas", dict.expediente.tabs.notas)}
        {tabButton("labs", dict.expediente.tabs.labs)}
      </div>

      {tab === "notas" && (
        <CategorySection
          visibility={data.categoryVisibility.notas}
          dict={dict}
          empty={dict.expediente.noNotes}
        >
          {data.notes.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-[0_1px_2px_rgba(16,24,40,.08)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10.5px] font-bold uppercase tracking-wider text-text-disabled">
                    <th className="px-5 pb-2 pt-4">Fecha</th>
                    <th className="px-5 pb-2 pt-4">Autor</th>
                    <th className="px-5 pb-2 pt-4">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {data.notes.map((n) => (
                    <tr key={n.id} className="border-t border-hairline">
                      <td className="whitespace-nowrap px-5 py-3 font-bold text-text">
                        {n.signedAt ? new Date(n.signedAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-text-secondary">{n.staffName}</td>
                      <td className="px-5 py-3 text-text-secondary">{n.body}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CategorySection>
      )}

      {tab === "labs" && (
        <CategorySection
          visibility={data.categoryVisibility.labs}
          dict={dict}
          empty={dict.expediente.noLabs}
        >
          {data.labs.map((l) => (
            <Card key={l.id} className="mb-2">
              <div className="mb-2 text-xs font-bold text-text-tertiary">
                {l.confirmed ? "Confirmado" : "Leído de una foto · pendiente de confirmar"}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(l.resultValues).map(([key, v]) => (
                  <div key={key}>
                    <div className="text-xs text-text-tertiary">{key}</div>
                    <div className="font-bold text-text">
                      {v.value} {v.unit} <span className="text-text-tertiary">({v.range})</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </CategorySection>
      )}
    </div>
  );
}

function CategorySection({
  visibility,
  dict,
  empty,
  children,
}: {
  visibility?: CategoryVisibility;
  dict: Dictionary;
  empty: string;
  children: React.ReactNode;
}) {
  if (visibility === "locked") {
    return (
      <Card className="border-dashed text-center">
        <div className="mb-1 text-xs font-bold text-text-disabled">
          {dict.expediente.lockedCategory.notRequested}
        </div>
        <p className="mb-3 text-sm text-text-secondary">{dict.expediente.lockedCategory.body}</p>
        <button className="text-xs font-bold text-primary-deep" type="button" disabled>
          {dict.expediente.lockedCategory.request}
        </button>
      </Card>
    );
  }
  // 'sealed' never reaches here with content, since the data layer omits it
  // entirely — categoryVisibility can still say 'sealed', but there is
  // nothing granted to render, so it falls through to the empty state,
  // indistinguishable from a category that's simply empty.
  const hasChildren = Array.isArray(children) ? children.some(Boolean) : Boolean(children);
  if (!hasChildren) return <p className="text-sm text-text-tertiary">{empty}</p>;
  return <>{children}</>;
}
