import Link from "next/link";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { SignupForm } from "@/features/auth/signup-form";
import { LangToggle } from "@/components/ui/lang-toggle";

const ROLES = ["owner", "recepcion", "practicante", "paciente"] as const;
type Role = (typeof ROLES)[number];

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role: roleParam } = await searchParams;
  const role: Role = ROLES.includes(roleParam as Role) ? (roleParam as Role) : "owner";

  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <div className="relative min-h-screen bg-canvas px-10 py-8">
      <div className="absolute right-6 top-6">
        <LangToggle locale={locale} />
      </div>

      <div className="mb-16 inline-flex gap-0.5 rounded-full bg-surface p-1 shadow-[0_1px_2px_rgba(16,24,40,.08)]">
        {ROLES.map((r) => (
          <Link
            key={r}
            href={r === "owner" ? "/signup" : `/signup?role=${r}`}
            className={`rounded-full px-5 py-2.5 text-sm font-bold transition-colors ${
              role === r ? "bg-primary text-white" : "text-text-secondary hover:text-text"
            }`}
          >
            {dict.signup.tabs[r]}
          </Link>
        ))}
      </div>

      <div className="max-w-xl">
        <div className="mb-2 text-sm font-bold uppercase tracking-wider text-primary-deep">
          {dict.signup.eyebrow}
        </div>

        {role === "owner" && (
          <>
            <h1 className="mb-3 text-5xl font-bold text-text">{dict.signup.owner.heading}</h1>
            <p className="mb-10 text-lg text-text-secondary">{dict.signup.owner.subtext}</p>
            <SignupForm copy={dict.signup.owner} redirectTo="/onboarding" intendedRole="owner" />
          </>
        )}

        {(role === "recepcion" || role === "practicante") && (
          <>
            <h1 className="mb-3 text-5xl font-bold text-text">{dict.signup.staff.heading}</h1>
            <p className="text-lg text-text-secondary">{dict.signup.staff.body}</p>
          </>
        )}

        {role === "paciente" && (
          <>
            <h1 className="mb-3 text-5xl font-bold text-text">{dict.signup.patient.heading}</h1>
            <p className="mb-10 text-lg text-text-secondary">{dict.signup.patient.subtext}</p>
            <SignupForm copy={dict.signup.patient} redirectTo="/portal" intendedRole="patient" />
          </>
        )}

        <Link
          href="/login"
          className="mt-10 inline-block text-sm font-semibold text-primary-deep hover:underline"
        >
          {dict.signup.backToLogin}
        </Link>
      </div>
    </div>
  );
}
