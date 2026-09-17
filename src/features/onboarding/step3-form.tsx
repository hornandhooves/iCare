import { finishWhatsapp } from "./actions";
import { Button } from "@/components/ui/button";
import { OnboardingProgress } from "./progress";
import { stepOfLabel, type Dictionary, type Locale } from "@/lib/i18n/dictionaries";

export function Step3Form({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  return (
    <div className="w-full max-w-[460px] rounded-2xl border border-hairline bg-surface p-8 shadow-[0_1px_3px_rgba(16,24,40,.10)]">
      <OnboardingProgress step={3} label={stepOfLabel(locale, 3, 3)} />
      <h1 className="mb-1.5 text-2xl font-bold text-text">{dict.onboarding.step3.heading}</h1>
      <p className="mb-6 text-sm text-text-secondary">{dict.onboarding.step3.subtext}</p>
      <form action={finishWhatsapp} className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-text-secondary" htmlFor="phone">
            {dict.onboarding.step3.phoneLabel}
          </label>
          <input
            id="phone"
            name="phone"
            placeholder="+52 55 0000 0000"
            className="h-11 w-full rounded-xl border border-border bg-field px-3.5 text-sm text-text outline-none focus:border-primary"
          />
        </div>
        <div className="rounded-xl bg-field p-3.5">
          <p className="mb-1.5 text-xs font-bold text-text">{dict.onboarding.step3.migrationTitle}</p>
          <p className="text-xs leading-relaxed text-text-secondary">{dict.onboarding.step3.migrationBody}</p>
        </div>
        <ul className="flex flex-col gap-1.5 text-xs text-text-secondary">
          <li>• {dict.onboarding.step3.bullet1}</li>
          <li>• {dict.onboarding.step3.bullet2}</li>
          <li>• {dict.onboarding.step3.bullet3}</li>
        </ul>
        <Button type="submit" className="w-full">
          {dict.onboarding.step3.submit}
        </Button>
        <Button type="submit" variant="ghost" className="w-full">
          {dict.onboarding.step3.skip}
        </Button>
      </form>
    </div>
  );
}
