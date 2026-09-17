import { cookies } from "next/headers";
import { defaultLocale, locales, type Locale } from "./dictionaries";
import { LOCALE_COOKIE } from "./locale-cookie";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return (locales as readonly string[]).includes(value ?? "")
    ? (value as Locale)
    : defaultLocale;
}

export { LOCALE_COOKIE };
