import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getBranchGrants, getOwnRecordData, TOGGLEABLE_CATEGORIES } from "@/features/portal/data";
import { SEALED_CATEGORIES } from "@/lib/permissions";
import { GrantToggle } from "@/features/portal/grant-toggle";
import { ExpedienteTabs } from "@/features/expediente/tabs";
import { Card } from "@/components/ui/card";

export default async function PortalBusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: patientRow } = (await supabase
    .from("patients")
    .select("id, org_id, user_id, organizations(name)")
    .eq("id", id)
    .single()) as unknown as {
    data: { id: string; org_id: string; user_id: string | null; organizations: { name: string } | null } | null;
  };
  if (!patientRow || patientRow.user_id !== user.id) redirect("/portal");

  const orgName = patientRow.organizations?.name ?? "";

  const locale = await getLocale();
  const dict = getDictionary(locale);

  const branchGrants = await getBranchGrants(supabase, id, patientRow.org_id);
  const record = await getOwnRecordData(supabase, id);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <Link href="/portal" className="mb-4 inline-block text-xs font-bold text-primary-deep">
        {dict.portal.backToList}
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-text">{orgName}</h1>

      <Card className="mb-6">
        <h2 className="mb-1 text-sm font-bold text-text">{dict.portal.access.heading}</h2>
        <p className="mb-4 text-xs text-text-secondary">{dict.portal.access.body}</p>
        <div className="flex flex-col gap-4">
          {branchGrants.map((b) => (
            <div key={b.branchId}>
              <div className="mb-1 text-xs font-bold uppercase tracking-wider text-text-disabled">
                {b.branchName}
              </div>
              <div className="flex flex-col divide-y divide-hairline">
                {TOGGLEABLE_CATEGORIES.map((cat) => (
                  <GrantToggle
                    key={cat}
                    patientId={id}
                    orgId={patientRow.org_id}
                    branchId={b.branchId}
                    category={cat}
                    granted={Boolean(b.grants[cat])}
                    sealed={SEALED_CATEGORIES.includes(cat)}
                    label={dict.expediente.categories[cat]}
                    onLabel={dict.portal.access.on}
                    offLabel={dict.portal.access.off}
                    sealedConfirmText={dict.portal.access.sealedConfirm}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <h2 className="mb-3 text-lg font-bold text-text">{dict.portal.record.heading}</h2>

      {record.criticalFields.length > 0 && (
        <Card className="mb-4 bg-warning-wash">
          {record.criticalFields.map((f) => (
            <div key={f.label} className="text-sm text-text">
              <span className="font-bold">{f.label}:</span> {String(f.value)}
            </div>
          ))}
        </Card>
      )}

      <ExpedienteTabs data={record} dict={dict} />
    </div>
  );
}
