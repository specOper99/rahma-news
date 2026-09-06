"use client";

import { logoutAction } from "@/server/actions/public";

export function AdminLogout({ label }: { label: string }) {
  return (
    <form action={logoutAction}>
      <button type="submit" className="text-xs font-semibold text-secondary underline-offset-2 hover:underline">
        {label}
      </button>
    </form>
  );
}
