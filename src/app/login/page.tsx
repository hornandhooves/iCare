import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { LoginForm } from "@/features/auth/login-form";
import { LangToggle } from "@/components/ui/lang-toggle";

export default async function LoginPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-[420px] rounded-2xl border border-hairline bg-surface p-8 shadow-[0_1px_3px_rgba(16,24,40,.10)]">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm font-bold text-text">{dict.common.appName}</span>
          <LangToggle locale={locale} />
        </div>
        <h1 className="mb-1.5 text-2xl font-bold text-text">{dict.login.title}</h1>
        <p className="mb-6 text-sm text-text-secondary">{dict.login.subtitle}</p>
        <LoginForm dict={dict} />
      </div>
    </div>
  );
}
