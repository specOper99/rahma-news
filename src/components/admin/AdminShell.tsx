"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { AdminLogout } from "@/components/admin/AdminLogout";
import { createArticleAndRedirect } from "@/server/actions/create-story";
import type { AdminCopy } from "@/lib/admin-copy";
import { interpolate } from "@/lib/interpolate";
import { Icon } from "@/components/ui/Icon";
import { formatClock } from "@/lib/format";

export type AdminNavLink = { href: string; label: string; badge?: string; tone?: "error" | "muted" };
export type AdminNavGroup = { label: string; items: AdminNavLink[] };

export function AdminShell({
  email,
  role,
  groups,
  children,
  breakingCount,
  copy,
  localeSwitcher,
  deskLocaleNav,
}: {
  email: string;
  role: string;
  groups: AdminNavGroup[];
  children: ReactNode;
  breakingCount?: number;
  copy: AdminCopy;
  localeSwitcher: ReactNode;
  deskLocaleNav: ReactNode;
}) {
  const pathname = usePathname();
  const search = useSearchParams();
  const query = search.toString();
  const [open, setOpen] = useState(false);
  const now = new Date();

  useEffect(() => {
    setOpen(false);
  }, [pathname, query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-outline-variant/30 bg-surface-container-lowest px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="grid size-11 place-items-center lg:hidden"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{copy.openNav}</span>
            <Icon name="menu" size={20} />
          </button>
          <Link href="/admin" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded bg-primary font-display text-lg font-bold text-on-primary">
              H
            </span>
            <span className="font-display text-xl font-semibold tracking-tight">{copy.cms}</span>
          </Link>
          <span className="hidden rounded bg-primary-container px-2 py-0.5 font-mono-num text-[10px] font-semibold uppercase tracking-wider text-on-primary sm:inline">
            {copy.production}
          </span>
          {breakingCount ? (
            <span className="hidden items-center gap-1.5 rounded-full bg-error-container/60 px-2 py-1 font-mono-num text-[11px] font-semibold text-on-error-container md:inline-flex">
              <span className="size-2 animate-pulse rounded-full bg-error" />
              {interpolate(copy.breakingLive, { n: breakingCount })}
            </span>
          ) : null}
        </div>
        <form action="/admin/articles" className="mx-6 hidden max-w-md flex-1 md:block">
          <label className="sr-only" htmlFor="desk-search">
            {copy.searchStories}
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-outline">
              <Icon name="search" size={18} />
            </span>
            <input
              id="desk-search"
              name="q"
              defaultValue={search.get("q") ?? ""}
              placeholder={copy.searchStories}
              className="admin-search h-9 w-full rounded border border-outline-variant bg-surface-container-low pe-3 text-sm"
            />
          </div>
        </form>
        <div className="flex shrink-0 items-center gap-3">
          <form action={createArticleAndRedirect} className="hidden sm:block">
            <button type="submit" className="admin-btn-primary h-9 px-3">
              <Icon name="plus" size={16} />
              {copy.newArticle}
            </button>
          </form>
          <div className="hidden flex-col text-end font-mono-num text-[11px] text-on-surface-variant xl:flex">
            <span suppressHydrationWarning>
              {copy.baghdad} {formatClock(now, "Asia/Baghdad")} UTC+3
            </span>
            <span className="text-outline" suppressHydrationWarning>
              {copy.london} {formatClock(now, "Europe/London")} UTC+0
            </span>
          </div>
          {localeSwitcher}
          <ThemeToggle label={copy.theme} />
          <div className="hidden border-s border-outline-variant/30 ps-3 lg:block">
            <p className="text-[13px] font-semibold leading-none">{email}</p>
            <p className="mt-1 text-[11px] capitalize text-outline">{role}</p>
          </div>
        </div>
      </header>

      <aside className="fixed bottom-0 start-0 top-16 z-40 hidden w-64 flex-col overflow-y-auto border-e border-outline-variant/30 bg-surface-container-lowest lg:flex">
        <AdminNav groups={groups} pathname={pathname} query={query} label={copy.navAria} />
        <div className="border-t border-outline-variant/30 bg-surface-container-low p-4 text-[11px] text-on-surface-variant">
          <div className="mb-3">{deskLocaleNav}</div>
          <p className="flex items-center gap-1.5 font-mono-num">
            <span className="size-1.5 rounded-full bg-secondary" />
            {copy.liveSync}
          </p>
          <p className="mt-2 border-t border-outline-variant/20 pt-2 font-mono-num">
            {email} · {role}
          </p>
          <div className="mt-2">
            <AdminLogout label={copy.signOut} />
          </div>
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-[40] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-primary/40"
            aria-label={copy.closeNav}
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 start-0 flex w-[min(16.5rem,88vw)] flex-col border-e border-outline-variant/30 bg-surface-container-lowest">
            <div className="flex items-center justify-between px-3 py-4">
              <p className="text-[13px] font-semibold">{copy.cms}</p>
              <button type="button" className="grid size-11 place-items-center" onClick={() => setOpen(false)}>
                <span className="sr-only">{copy.closeNav}</span>
                <Icon name="close" size={20} />
              </button>
            </div>
            <AdminNav groups={groups} pathname={pathname} query={query} label={copy.navAria} />
            <div className="mt-auto space-y-3 border-t border-outline-variant/30 p-4 text-xs text-on-surface-variant">
              {deskLocaleNav}
              <p className="truncate">{email}</p>
              <AdminLogout label={copy.signOut} />
            </div>
          </aside>
        </div>
      ) : null}

      <div className="pt-16 lg:ps-64">
        <a
          href="#desk-main"
          className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-20 focus:z-50 focus:bg-surface focus:px-3 focus:py-2"
        >
          {copy.skipDesk}
        </a>
        <main id="desk-main" className="px-4 py-6 lg:px-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function AdminNav({
  groups,
  pathname,
  query,
  label,
}: {
  groups: AdminNavGroup[];
  pathname: string;
  query: string;
  label: string;
}) {
  return (
    <nav aria-label={label} className="flex flex-1 flex-col gap-1 px-2 py-4">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-outline">
            {group.label}
          </p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isActive(item.href, pathname, query);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center justify-between rounded px-2 py-2 text-[13px] leading-none transition-colors duration-150 ${
                      active
                        ? "bg-primary-container font-semibold text-on-primary"
                        : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.badge ? (
                      <span
                        className={`rounded px-1.5 py-0.5 font-mono-num text-[10px] font-medium ${
                          item.tone === "error"
                            ? "bg-error text-on-error"
                            : "bg-surface-container-highest text-on-surface-variant"
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function isActive(href: string, pathname: string, query: string) {
  if (href === "/admin") return pathname === "/admin";
  if (href.includes("view=coverage")) {
    return pathname === "/admin/articles" && query.includes("view=coverage");
  }
  if (href.includes("view=review")) {
    return pathname === "/admin/articles" && query.includes("view=review");
  }
  if (href.includes("view=breaking")) {
    return pathname === "/admin/articles" && query.includes("view=breaking");
  }
  if (href === "/admin/articles") {
    return (
      (pathname === "/admin/articles" || pathname.startsWith("/admin/articles/")) &&
      !query.includes("view=")
    );
  }
  const path = href.split("?")[0];
  return pathname === path || pathname.startsWith(`${path}/`);
}
