"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { detectDir } from "@/lib/locales";

export function AutoDir({
  fallback,
  lang,
  className,
  children,
}: {
  fallback: "ltr" | "rtl";
  lang?: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [dir, setDir] = useState(fallback);

  useEffect(() => {
    setDir(fallback);
  }, [fallback]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const scan = () => {
      const chunks: string[] = [];
      root.querySelectorAll("input, textarea, [contenteditable='true']").forEach((el) => {
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          chunks.push(el.value);
        } else {
          chunks.push(el.textContent ?? "");
        }
      });
      setDir(detectDir(chunks.join("\n"), fallback));
    };
    scan();
    root.addEventListener("input", scan);
    return () => root.removeEventListener("input", scan);
  }, [fallback]);

  return (
    <div ref={ref} dir={dir} lang={lang} className={className}>
      {children}
    </div>
  );
}
