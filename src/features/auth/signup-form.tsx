"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface SignupCopy {
  email: string;
  password: string;
  submit: string;
  error: string;
  rateLimited: string;
  checkEmail: string;
}

// Shared by the owner and patient signup tabs on /signup — same Supabase
// Auth call either way, they only differ in copy and where a fresh session
// lands (a new business's onboarding vs. the patient portal).
export function SignupForm({
  copy,
  redirectTo,
  intendedRole,
}: {
  copy: SignupCopy;
  redirectTo: string;
  intendedRole: "owner" | "patient";
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setInfo(null);

    const supabase = createClient();
    // Recorded so a later sign-in (before onboarding finishes, or before the
    // confirmation email is even clicked) can still tell "no staff row yet
    // because this is a brand-new owner" apart from "because this is a
    // patient" — see root page.tsx.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { intended_role: intendedRole } },
    });
    setSubmitting(false);

    if (error) {
      setError(error.code === "over_email_send_rate_limit" ? copy.rateLimited : copy.error);
      return;
    }
    if (!data.session) {
      // Project has email confirmation on — no session until the link is
      // clicked, so there's nothing to redirect into yet.
      setInfo(copy.checkEmail);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-5">
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-text-secondary" htmlFor="signup-email">
          {copy.email}
        </label>
        <input
          id="signup-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-14 w-full rounded-xl border border-border bg-surface px-4 text-base text-text outline-none focus:border-primary"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-text-secondary" htmlFor="signup-password">
          {copy.password}
        </label>
        <input
          id="signup-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-14 w-full rounded-xl border border-border bg-surface px-4 text-base text-text outline-none focus:border-primary"
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      {info && <p className="text-sm text-primary-deep">{info}</p>}
      <Button type="submit" disabled={submitting} className="h-14 text-base">
        {copy.submit}
      </Button>
    </form>
  );
}
