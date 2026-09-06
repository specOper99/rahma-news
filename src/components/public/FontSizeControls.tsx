"use client";

import { useTranslations } from "next-intl";

export function FontSizeControls() {
  const t = useTranslations("Article");
  function bump(delta: number) {
    const root = document.getElementById("article-narrative");
    if (!root) return;
    const current = Number(root.dataset.size || "0");
    const next = Math.max(-1, Math.min(2, current + delta));
    root.dataset.size = String(next);
    root.style.fontSize = `${1.125 + next * 0.125}rem`;
  }
  return (
    <div className="flex items-center rounded bg-surface-container-low p-0.5 font-ui text-sm text-on-surface">
      <button
        type="button"
        className="grid min-h-11 min-w-11 place-items-center rounded hover:bg-surface-container-lowest"
        onClick={() => bump(-1)}
        title={t("decreaseType")}
        aria-label={t("decreaseType")}
      >
        A-
      </button>
      <button
        type="button"
        className="grid min-h-11 min-w-11 place-items-center rounded hover:bg-surface-container-lowest"
        onClick={() => bump(1)}
        title={t("increaseType")}
        aria-label={t("increaseType")}
      >
        A+
      </button>
    </div>
  );
}
