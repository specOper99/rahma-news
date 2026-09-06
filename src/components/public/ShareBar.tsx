"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";

export function ShareBar({ url }: { url: string }) {
  const t = useTranslations("Article");
  const [copied, setCopied] = useState(false);
  return (
    <div className="no-print flex items-center gap-1 font-ui text-sm text-on-surface-variant">
      <button
        type="button"
        className="inline-flex min-h-11 items-center gap-1 rounded px-2 hover:bg-surface-container-low"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
        }}
      >
        <Icon name="link" size={16} />
        <span className="hidden sm:inline">{copied ? t("copied") : t("copyLink")}</span>
      </button>
      {"share" in navigator ? (
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-1 rounded px-2 hover:bg-surface-container-low"
          onClick={() => navigator.share({ url })}
        >
          <Icon name="share" size={16} />
          <span className="hidden sm:inline">{t("share")}</span>
        </button>
      ) : null}
      <button
        type="button"
        className="inline-flex min-h-11 items-center gap-1 rounded px-2 hover:bg-surface-container-low"
        onClick={() => window.print()}
        title={t("print")}
      >
        <Icon name="print" size={16} />
      </button>
    </div>
  );
}
