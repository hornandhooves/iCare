import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStaffContext } from "@/lib/permissions";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { Step1Form } from "@/features/onboarding/step1-form";
import { Step2Form } from "@/features/onboarding/step2-form";
import { Step3Form } from "@/features/onboarding/step3-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const locale = await getLocale();
  const dict = getDictionary(locale);

  const ctx = await getStaffContext(supabase);
  if (!ctx) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <Step1Form dict={dict} locale={locale} />
      </div>
    );
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("name, verticals, onboarding_completed_at")
    .eq("id", ctx.orgId)
    .single();

  if (!org || org.verticals.length === 0) {
    return <Step2Form dict={dict} orgName={org?.name ?? ""} />;
  }

  if (!org.onboarding_completed_at) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <Step3Form dict={dict} locale={locale} />
      </div>
    );
  }

  redirect("/agenda");
}
