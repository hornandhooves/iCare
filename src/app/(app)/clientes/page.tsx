import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffContext } from "@/lib/permissions";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { Card } from "@/components/ui/card";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const ctx = await getCurrentStaffContext();
  if (!ctx) return null;

  const locale = await getLocale();
  const dict = getDictionary(locale);
  const supabase = await createClient();

  let query = supabase.from("patients").select("id, name, age, folio").eq("org_id", ctx.orgId).order("name");
  if (q) query = query.ilike("name", `%${q}%`);
  const { data: patients } = await query;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-bold text-text">{dict.clientes.title}</h1>
      <form className="mb-5">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder={dict.clientes.searchPlaceholder}
          className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-text outline-none focus:border-primary"
        />
      </form>
      <div className="flex flex-col gap-2">
        {(!patients || patients.length === 0) && (
          <Card className="text-center text-sm text-text-tertiary">{dict.clientes.empty}</Card>
        )}
        {patients?.map((p) => (
          <Link key={p.id} href={`/clientes/${p.id}`}>
            <Card className="flex items-center justify-between py-3.5 hover:border-primary">
              <div>
                <div className="text-sm font-bold text-text">{p.name}</div>
                <div className="text-xs text-text-tertiary">
                  {p.age ? `${p.age} · ` : ""}
                  {p.folio}
                </div>
              </div>
              <span className="text-xs font-bold text-primary-deep">{dict.clientes.openRecord} →</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
