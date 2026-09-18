import Link from "next/link";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { LoginForm } from "@/features/auth/login-form";
import { LangToggle } from "@/components/ui/lang-toggle";
import { Logo } from "@/components/ui/logo";

export default async function LoginPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="absolute right-6 top-6">
        <LangToggle locale={locale} />
      </div>
      <div className="w-full max-w-105 rounded-2xl border border-hairline bg-surface p-8 shadow-[0_1px_3px_rgba(16,24,40,.10)]">
        <Logo />
        <h1 className="mb-1.5 mt-5 text-2xl font-bold text-text">{dict.login.title}</h1>
        <p className="mb-6 text-sm text-text-secondary">{dict.login.subtitle}</p>
        <LoginForm dict={dict} />
        <p className="mt-6 text-center text-xs text-text-tertiary">
          {dict.login.newBusiness}{" "}
          <Link href="/signup" className="font-semibold text-primary-deep hover:underline">
            {dict.login.createAccount}
          </Link>
        </p>
      </div>
    </div>
  );
}
