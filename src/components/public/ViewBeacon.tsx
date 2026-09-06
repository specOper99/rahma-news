"use client";

import { useEffect } from "react";
import { recordView } from "@/server/actions/public";
import type { Locale } from "@/lib/locales";

export function ViewBeacon({ articleId, locale }: { articleId: string; locale: Locale }) {
  useEffect(() => {
    const key = `view:${articleId}:${locale}`;
    if (sessionStorage.getItem(key)) return;
    const t = setTimeout(() => {
      if (navigator.webdriver) return;
      sessionStorage.setItem(key, "1");
      void recordView(articleId, locale);
    }, 3000);
    return () => clearTimeout(t);
  }, [articleId, locale]);
  return null;
}
