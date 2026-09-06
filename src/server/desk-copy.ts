import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { adminCopyFor, DESK_LOCALE_COOKIE, resolveDeskLocale, type AdminCopy } from "@/lib/admin-copy";
import type { Locale } from "@/lib/locales";

export const getDeskLocale = cache(async (): Promise<Locale> => {
  const jar = await cookies();
  return resolveDeskLocale(jar.get(DESK_LOCALE_COOKIE)?.value, jar.get("NEXT_LOCALE")?.value);
});

export const getAdminCopy = cache(async (): Promise<AdminCopy> => adminCopyFor(await getDeskLocale()));
