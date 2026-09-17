import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffContext, hasPrivilege } from "@/lib/permissions";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getAgendaRows, getAgendaStats, getStaffForBranch, colorForStaff } from "@/features/agenda/data";
import { NewAppointmentDialog } from "@/features/agenda/new-appointment-dialog";
import { StatusMenu } from "@/features/agenda/status-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function shiftDate(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; staff?: string; filter?: string }>;
}) {
  const params = await searchParams;
  const dateStr = params.date ?? todayStr();

  const supabase = await createClient();
  const ctx = await getCurrentStaffContext();
  if (!ctx) return null;

  const locale = await getLocale();
  const dict = getDictionary(locale);

  const { data: branch } = await supabase
    .from("branches")
    .select("id, name")
    .eq("org_id", ctx.orgId)
    .limit(1)
    .single();
  if (!branch) return <div className="p-8 text-text-secondary">No branch configured yet.</div>;

  const canViewAll = hasPrivilege(ctx, "view_all_agenda");
  const staffFilter = canViewAll ? params.staff : ctx.staffId;

  const allRows = await getAgendaRows(supabase, { branchId: branch.id, dateStr, staffId: staffFilter });
  const rows = allRows.filter((r) => {
    if (params.filter === "unconfirmed") return ["agendada", "primera_vez"].includes(r.status);
    if (params.filter === "first_visit") return r.status === "primera_vez";
    return true;
  });
  const stats = getAgendaStats(allRows);

  const staffList = canViewAll ? await getStaffForBranch(supabase, branch.id) : [];
  const staffIds = staffList.map((s) => s.id);
  const staffCounts = new Map<string, number>();
  for (const r of allRows) staffCounts.set(r.staffId, (staffCounts.get(r.staffId) ?? 0) + 1);

  const { data: servicesData } = await supabase
    .from("services")
    .select("id, name, bookable")
    .eq("org_id", ctx.orgId);
  const { data: patientsData } = await supabase
    .from("patients")
    .select("id, name")
    .eq("org_id", ctx.orgId)
    .order("name");

  const riskAlerts = rows.filter((r) => r.displayStatus === "riesgo_no_show");

  const dateLabel = new Date(`${dateStr}T00:00:00`).toLocaleDateString(locale === "es" ? "es-MX" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  function dateHref(target: string) {
    const sp = new URLSearchParams(params as Record<string, string>);
    sp.set("date", target);
    return `/agenda?${sp.toString()}`;
  }

  return (
    <div className="flex h-full">
      {canViewAll && (
        <aside className="flex w-[250px] flex-none flex-col gap-5 overflow-y-auto bg-surface p-5 shadow-[1px_0_0_var(--color-hairline)]">
          <div>
            <div className="mb-1 text-[9.5px] font-bold uppercase tracking-wider text-text-disabled">
              {branch.name}
            </div>
          </div>

          <div>
            <div className="mb-2 text-[9.5px] font-bold uppercase tracking-wider text-text-disabled">
              {dict.agenda.staff}
            </div>
            <div className="flex flex-col gap-1">
              <Link
                href="/agenda"
                className={`rounded-lg px-2 py-1.5 text-xs font-semibold ${
                  !params.staff ? "bg-tint-wash text-primary-deep" : "text-text-secondary hover:bg-field"
                }`}
              >
                {dict.agenda.title} · {allRows.length}
              </Link>
              {staffList.map((s) => (
                <Link
                  key={s.id}
                  href={`/agenda?staff=${s.id}`}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold ${
                    params.staff === s.id ? "bg-tint-wash text-primary-deep" : "text-text-secondary hover:bg-field"
                  }`}
                >
                  <span
                    className="h-2 w-2 flex-none rounded-full"
                    style={{ background: colorForStaff(s.id, staffIds) }}
                  />
                  <span className="min-w-0 flex-1 truncate">{s.name}</span>
                  <span className="text-text-tertiary">{staffCounts.get(s.id) ?? 0}</span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-[9.5px] font-bold uppercase tracking-wider text-text-disabled">
              {dict.agenda.filters}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: "unconfirmed", label: dict.agenda.filterUnconfirmed },
                { key: "first_visit", label: dict.agenda.filterFirstVisit },
              ].map((f) => (
                <Link
                  key={f.key}
                  href={params.filter === f.key ? "/agenda" : `/agenda?filter=${f.key}`}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    params.filter === f.key ? "bg-primary text-white" : "bg-field text-text-secondary"
                  }`}
                >
                  {f.label}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      )}

      <div className="flex min-w-0 flex-1 gap-0">
        <div className="min-w-0 flex-1 overflow-y-auto p-6">
          <div className="mb-5 flex items-center gap-3">
            <h1 className="text-2xl font-bold capitalize text-text">{dateLabel}</h1>
            <div className="flex items-center gap-1">
              <Link href={dateHref(shiftDate(dateStr, -1))} className="grid h-8 w-8 place-items-center rounded-full hover:bg-field">
                <ChevronLeft size={16} strokeWidth={2.75} />
              </Link>
              <Link href={dateHref(todayStr())} className="rounded-full bg-field px-3 py-1.5 text-xs font-bold text-text">
                {dict.common.today}
              </Link>
              <Link href={dateHref(shiftDate(dateStr, 1))} className="grid h-8 w-8 place-items-center rounded-full hover:bg-field">
                <ChevronRight size={16} strokeWidth={2.75} />
              </Link>
            </div>
            <div className="ml-auto">
              <NewAppointmentDialog
                dict={dict}
                branchId={branch.id}
                dateStr={dateStr}
                services={servicesData ?? []}
                patients={patientsData ?? []}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {rows.length === 0 && (
              <Card className="text-center text-sm text-text-tertiary">{dict.clientes.empty}</Card>
            )}
            {rows.map((r) => (
              <Card key={r.id} className="flex items-center gap-4 py-3.5">
                <div className="w-16 flex-none text-sm font-bold text-text">
                  {r.startAt.slice(11, 16)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-text">{r.patientName}</span>
                    <StatusBadge status={r.displayStatus} label={dict.agenda.status[r.displayStatus]} />
                  </div>
                  <div className="truncate text-xs text-text-tertiary">
                    {r.serviceName}
                    {canViewAll ? ` · ${r.staffName}` : ""}
                  </div>
                </div>
                <StatusMenu appointmentId={r.id} status={r.status} dict={dict} />
              </Card>
            ))}
          </div>
        </div>

        <div className="w-[272px] flex-none overflow-y-auto p-6 pl-0">
          <Card className="mb-4">
            <div className="mb-3 text-xs font-bold uppercase tracking-wider text-text-tertiary">
              {dict.agenda.statToday}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xl font-bold text-text">{stats.appointments}</div>
                <div className="text-[10.5px] text-text-tertiary">{dict.agenda.statAppointments}</div>
              </div>
              <div>
                <div className="text-xl font-bold text-text">{stats.unconfirmed}</div>
                <div className="text-[10.5px] text-text-tertiary">{dict.agenda.statUnconfirmed}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xl font-bold text-text">
                  ${stats.revenue.toLocaleString(locale === "es" ? "es-MX" : "en-US")} MXN
                </div>
                <div className="text-[10.5px] text-text-tertiary">{dict.agenda.statRevenue}</div>
              </div>
            </div>
          </Card>

          {riskAlerts.length > 0 && (
            <Card>
              <div className="mb-3 text-xs font-bold uppercase tracking-wider text-text-tertiary">
                {dict.agenda.needsAttention}
              </div>
              <div className="flex flex-col gap-3">
                {riskAlerts.map((r) => (
                  <div key={r.id}>
                    <div className="text-sm font-bold text-text">{r.patientName}</div>
                    <div className="text-xs text-text-tertiary">{dict.agenda.status.riesgo_no_show}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
