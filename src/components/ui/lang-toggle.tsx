"use client";

import { useRouter } from "next/navigation";
import { LOCALE_COOKIE } from "@/lib/i18n/locale-cookie";
import { setBrowserCookie } from "@/lib/cookie";
import type { Locale } from "@/lib/i18n/dictionaries";

const ONE_YEAR_SECONDS = 31536000;

export function LangToggle({ locale }: { locale: Locale }) {
  const router = useRouter();

  function setLocale(next: Locale) {
    setBrowserCookie(LOCALE_COOKIE, next, ONE_YEAR_SECONDS);
    router.refresh();
  }

  return (
    <div className="flex gap-0.5 rounded-full bg-black/4 p-0.5">
      {(["es", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase transition-colors ${
            locale === l
              ? "bg-primary text-white"
              : "text-text-tertiary hover:text-text"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
