"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function LoginForm({ dict }: { dict: Dictionary }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      setError(dict.login.error);
      return;
    }
    router.push("/agenda");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <label className="sr-only" htmlFor="email">
          {dict.login.email}
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="fernanda@clinicasauce.mx"
          className="h-11 w-full rounded-xl border border-border bg-field px-3.5 text-sm text-text outline-none focus:border-primary"
        />
      </div>
      <div>
        <label className="sr-only" htmlFor="password">
          {dict.login.password}
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={dict.login.password}
          className="h-11 w-full rounded-xl border border-border bg-field px-3.5 text-sm text-text outline-none focus:border-primary"
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={submitting} className="w-full">
        {dict.login.submit}
      </Button>
      <div className="flex items-center justify-center gap-4 text-xs">
        <a href="#" className="font-semibold text-primary-deep hover:underline">
          {dict.login.haveInvitation}
        </a>
        <a href="#" className="font-semibold text-primary-deep hover:underline">
          {dict.login.forgotPassword}
        </a>
      </div>
    </form>
  );
}
