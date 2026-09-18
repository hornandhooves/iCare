import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLinkedBusinesses } from "@/features/portal/data";
import { linkPatientByPhone } from "@/features/portal/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function PortalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const locale = await getLocale();
  const dict = getDictionary(locale);

  const businesses = await getLinkedBusinesses(supabase, user.id);

  return (
    <div className="mx-auto max-w-xl p-6">
      <Card className="mb-6">
        <h2 className="mb-1.5 text-lg font-bold text-text">{dict.portal.linkPhone.heading}</h2>
        <p className="mb-4 text-sm text-text-secondary">{dict.portal.linkPhone.body}</p>
        <form action={linkPatientByPhone} className="flex gap-2">
          <input
            name="phone"
            required
            placeholder={dict.portal.linkPhone.placeholder}
            className="h-11 flex-1 rounded-xl border border-border bg-field px-3.5 text-sm text-text outline-none focus:border-primary"
          />
          <Button type="submit">{dict.portal.linkPhone.submit}</Button>
        </form>
      </Card>

      <h1 className="mb-3 text-lg font-bold text-text">{dict.portal.businessList.heading}</h1>
      {businesses.length === 0 ? (
        <p className="text-sm text-text-tertiary">{dict.portal.businessList.empty}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {businesses.map((b) => (
            <Link key={b.patientId} href={`/portal/${b.patientId}`}>
              <Card className="flex items-center justify-between py-3.5 hover:border-primary">
                <span className="text-sm font-bold text-text">{b.orgName}</span>
                <span className="text-xs font-bold text-primary-deep">{dict.portal.businessList.open}</span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
