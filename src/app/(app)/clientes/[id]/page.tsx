import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffContext } from "@/lib/permissions";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getExpedienteData } from "@/features/expediente/data";
import { ExpedienteTabs } from "@/features/expediente/tabs";
import { Card } from "@/components/ui/card";

export default async function ExpedientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getCurrentStaffContext();
  if (!ctx) return null;

  const locale = await getLocale();
  const dict = getDictionary(locale);
  const supabase = await createClient();

  const { data: branch } = await supabase
    .from("branches")
    .select("id")
    .eq("org_id", ctx.orgId)
    .limit(1)
    .single();
  if (!branch) return null;

  const data = await getExpedienteData(supabase, ctx, id, branch.id);
  if (!data) return <div className="p-8 text-text-secondary">{dict.clientes.empty}</div>;

  const medsVisibility = data.categoryVisibility.medicamentos;

  const initials = data.patient.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const lastVisit = data.visits[0];

  return (
    <div className="mx-auto flex max-w-5xl gap-6 p-6">
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-12 w-12 flex-none place-items-center rounded-full bg-primary text-sm font-bold text-white">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text">{data.patient.name}</h1>
            <p className="text-xs text-text-tertiary">
              {data.patient.age ? `${data.patient.age} años · ` : ""}
              {data.patient.folio}
              {lastVisit ? ` · ${new Date(lastVisit.startAt).toLocaleDateString()}` : ""}
            </p>
          </div>
        </div>

        {!data.hasClinicalAccess && (
          <Card className="mb-4 bg-field text-sm text-text-secondary">{dict.expediente.noClinicalAccess}</Card>
        )}

        {data.criticalFields.length > 0 && (
          <Card className="mb-4 bg-warning-wash">
            <div className="mb-1 text-[10.5px] font-bold uppercase tracking-wider text-warning">
              {dict.expediente.alwaysShared}
            </div>
            {data.criticalFields.map((f) => (
              <div key={f.label} className="text-sm text-text">
                <span className="font-bold">{f.label}:</span> {String(f.value)}
              </div>
            ))}
          </Card>
        )}

        {data.contactFields.length > 0 && (
          <Card className="mb-4">
            {data.contactFields.map((f) => (
              <div key={f.label} className="text-sm text-text">
                <span className="font-bold">{f.label}:</span> {String(f.value)}
              </div>
            ))}
          </Card>
        )}

        {data.hasClinicalAccess && <ExpedienteTabs data={data} dict={dict} />}
      </div>

      <div className="w-[260px] flex-none">
        {data.hasClinicalAccess && (
          <Card className="mb-4">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-text-tertiary">
              {dict.expediente.currentMedication}
            </div>
            {medsVisibility === "locked" ? (
              <LockedNote dict={dict} />
            ) : data.medications.length === 0 ? (
              <p className="text-sm text-text-tertiary">{dict.expediente.noMeds}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {data.medications.map((m) => (
                  <div key={m.id} className="text-sm text-text">
                    <span className="font-bold">{m.drugName}</span>
                    {m.dose ? ` · ${m.dose}` : ""}
                    {m.frequency ? ` · ${m.frequency}` : ""}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        <Card className="mb-4">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-text-tertiary">
            {dict.expediente.visits}
          </div>
          {data.visits.length === 0 ? (
            <p className="text-sm text-text-tertiary">{dict.expediente.noAppointments}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {data.visits.map((v) => (
                <div key={v.id} className="text-xs text-text-secondary">
                  {new Date(v.startAt).toLocaleDateString()} · {v.serviceName}
                </div>
              ))}
            </div>
          )}
        </Card>

        {data.hasClinicalAccess && (
          <p className="text-[10.5px] leading-relaxed text-text-disabled">{dict.expediente.auditNotice}</p>
        )}
      </div>
    </div>
  );
}

function LockedNote({ dict }: { dict: ReturnType<typeof getDictionary> }) {
  return (
    <div className="rounded-xl border border-dashed border-border-canvas p-3 text-center">
      <div className="mb-1 text-[10.5px] font-bold text-text-disabled">
        {dict.expediente.lockedCategory.notRequested}
      </div>
      <p className="text-xs text-text-secondary">{dict.expediente.lockedCategory.body}</p>
    </div>
  );
}
