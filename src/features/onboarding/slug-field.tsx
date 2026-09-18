"use client";

import { useState } from "react";
import { slugify } from "@/lib/slug";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function SlugField({ dict }: { dict: Dictionary }) {
  const [name, setName] = useState("");
  const slug = slugify(name) || "tu-clinica";

  return (
    <div>
      <label className="sr-only" htmlFor="name">
        {dict.onboarding.step1.nameLabel}
      </label>
      <input
        id="name"
        name="name"
        required
        placeholder={dict.onboarding.step1.namePlaceholder}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-11 w-full rounded-xl border border-border bg-field px-3.5 text-sm text-text outline-none focus:border-primary"
      />
      <p className="mt-1.5 font-mono text-xs text-text-tertiary">{slug}.icare.mx</p>
    </div>
  );
}
