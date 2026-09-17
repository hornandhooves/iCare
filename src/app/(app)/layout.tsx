import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStaffContext } from "@/lib/permissions";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { IconRail } from "@/components/ui/icon-rail";
import { LangToggle } from "@/components/ui/lang-toggle";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ctx = await getStaffContext(supabase);
  if (!ctx) redirect("/onboarding");

  const { data: org } = await supabase
    .from("organizations")
    .select("verticals, onboarding_completed_at")
    .eq("id", ctx.orgId)
    .single();
  if (!org || org.verticals.length === 0 || !org.onboarding_completed_at) {
    redirect("/onboarding");
  }

  const locale = await getLocale();
  const dict = getDictionary(locale);

  const initials = ctx.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-screen">
      <IconRail
        labels={{
          agenda: dict.nav.agenda,
          clientes: dict.nav.clientes,
          signOut: dict.common.signOut,
        }}
        initials={initials}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-none items-center justify-end gap-3 border-b border-hairline bg-surface px-6 py-3">
          <span className="text-xs text-text-tertiary">{ctx.name}</span>
          <LangToggle locale={locale} />
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto bg-canvas">{children}</main>
      </div>
    </div>
  );
}
