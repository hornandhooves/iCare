"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function SignupForm({ dict }: { dict: Dictionary }) {
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
    const { data, error } = await supabase.auth.signUp({ email, password });
    setSubmitting(false);

    if (error) {
      setError(error.code === "over_email_send_rate_limit" ? dict.signup.owner.rateLimited : dict.signup.owner.error);
      return;
    }
    if (!data.session) {
      // Project has email confirmation on — no session until the link is
      // clicked, so there's nothing to redirect into yet.
      setInfo(dict.signup.owner.checkEmail);
      return;
    }
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-5">
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-text-secondary" htmlFor="signup-email">
          {dict.signup.owner.email}
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
          {dict.signup.owner.password}
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
        {dict.signup.owner.submit}
      </Button>
    </form>
  );
}
