"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { DESK_LOCALE_COOKIE } from "@/lib/admin-copy";
import { isLocale } from "@/lib/locales";

export async function setDeskLocaleAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "");
  if (!isLocale(locale)) return;
  const jar = await cookies();
  jar.set(DESK_LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/admin", "layout");
}
