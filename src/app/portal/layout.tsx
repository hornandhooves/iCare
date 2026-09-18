import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { Logo } from "@/components/ui/logo";
import { LangToggle } from "@/components/ui/lang-toggle";
import { SignOutButton } from "@/components/ui/sign-out-button";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <div className="min-h-screen bg-canvas">
      <header className="flex items-center justify-between border-b border-hairline bg-surface px-6 py-3">
        <div className="flex items-center gap-2.5">
          <Logo size={28} />
          <span className="text-sm font-bold text-text">{dict.portal.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <LangToggle locale={locale} />
          <SignOutButton />
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
