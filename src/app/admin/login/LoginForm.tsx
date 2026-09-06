"use client";

import { useEffect, useState, type ReactNode } from "react";
import { authClient } from "@/auth/client";
import { assertLoginRate } from "@/server/actions/public";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import type { AdminCopy } from "@/lib/admin-copy";

export function LoginForm({ copy, localeSwitcher }: { copy: AdminCopy; localeSwitcher: ReactNode }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    const allowed = await assertLoginRate(email);
    if (!allowed) {
      setPending(false);
      setMessage(copy.invalid);
      return;
    }
    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      setPending(false);
      setMessage(copy.invalid);
      return;
    }
    window.location.assign("/admin");
  }

  return (
    <main className="relative mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <div className="absolute end-2 top-2 flex items-center gap-2">
        {localeSwitcher}
        <ThemeToggle label={copy.theme} />
      </div>
      <div className="mb-6 flex items-center gap-2">
        <span className="grid size-10 place-items-center rounded bg-primary font-display text-2xl font-bold text-on-primary">
          H
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">{copy.cms}</h1>
          <p className="text-sm text-on-surface-variant">{copy.desk}</p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="admin-card flex flex-col gap-3 p-5">
        <label className="text-sm">
          {copy.email}
          <input name="email" type="email" autoComplete="username" required className="mt-1" />
        </label>
        <label className="text-sm">
          {copy.password}
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={10}
            className="mt-1"
          />
        </label>
        <button type="submit" disabled={!ready || pending} className="admin-btn-primary h-10 px-4 disabled:opacity-60">
          {copy.login}
        </button>
        {message ? <p className="text-sm text-error">{message}</p> : null}
      </form>
    </main>
  );
}
