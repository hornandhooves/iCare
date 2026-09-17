import { createOrganization } from "./actions";
import { Button } from "@/components/ui/button";
import { OnboardingProgress } from "./progress";
import { SlugField } from "./slug-field";
import { stepOfLabel, type Dictionary, type Locale } from "@/lib/i18n/dictionaries";

export function Step1Form({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  return (
    <div className="w-full max-w-[460px] rounded-2xl border border-hairline bg-surface p-8 shadow-[0_1px_3px_rgba(16,24,40,.10)]">
      <OnboardingProgress step={1} label={stepOfLabel(locale, 1, 3)} />
      <h1 className="mb-1.5 text-2xl font-bold text-text">{dict.onboarding.step1.heading}</h1>
      <p className="mb-6 text-sm text-text-secondary">{dict.onboarding.step1.subtext}</p>
      <form action={createOrganization} className="flex flex-col gap-4">
        <SlugField dict={dict} />
        <div>
          <label className="mb-1.5 block text-xs font-bold text-text-secondary" htmlFor="location">
            {dict.onboarding.step1.locationLabel}
          </label>
          <input
            id="location"
            name="location"
            required
            placeholder={dict.onboarding.step1.locationPlaceholder}
            className="h-11 w-full rounded-xl border border-border bg-field px-3.5 text-sm text-text outline-none focus:border-primary"
          />
        </div>
        <Button type="submit" className="w-full">
          {dict.common.continue}
        </Button>
      </form>
    </div>
  );
}
