import { Suspense } from "react";
import { requireStaff } from "@/server/auth";
import { AdminShell, type AdminNavGroup } from "@/components/admin/AdminShell";
import { interpolate } from "@/lib/admin-copy";
import { getAdminCopy, getDeskLocale } from "@/server/desk-copy";
import { canManageSettings, canManageUsers } from "@/server/auth";
import { getDeskBadges } from "@/server/dal/articles";
import { AdminLocaleSwitcher } from "@/components/admin/AdminLocaleSwitcher";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  const [copy, locale] = await Promise.all([getAdminCopy(), getDeskLocale()]);
  const badges = await getDeskBadges().catch(() => ({
    review: 0,
    breaking: 0,
    inbox: 0,
    subscribers: 0,
  }));
  const groups: AdminNavGroup[] = [
    {
      label: copy.editorial,
      items: [
        { href: "/admin", label: copy.dashboard },
        { href: "/admin/articles", label: copy.articles },
        {
          href: "/admin/articles?view=review",
          label: copy.reviewQueue,
          badge: badges.review ? String(badges.review) : undefined,
        },
        {
          href: "/admin/articles?view=breaking",
          label: copy.breakingDesk,
          badge: badges.breaking ? interpolate(copy.liveCountBadge, { n: badges.breaking }) : undefined,
          tone: badges.breaking ? "error" : undefined,
        },
        { href: "/admin/articles?view=coverage", label: copy.coverage },
      ],
    },
    {
      label: copy.taxonomy,
      items: [
        { href: "/admin/categories", label: copy.categories },
        { href: "/admin/tags", label: copy.tags },
        { href: "/admin/authors", label: copy.authors },
        { href: "/admin/media", label: copy.media },
      ],
    },
    {
      label: copy.audience,
      items: [
        {
          href: "/admin/inbox",
          label: copy.inbox,
          badge: badges.inbox ? String(badges.inbox) : undefined,
        },
        { href: "/admin/subscribers", label: copy.subscribers },
        { href: "/admin/redirects", label: copy.redirects },
        { href: "/admin/audit", label: copy.audit },
      ],
    },
  ];
  if (canManageUsers(staff.role)) {
    groups[2].items.push({ href: "/admin/users", label: copy.users });
  }
  if (canManageSettings(staff.role)) {
    groups[2].items.push({ href: "/admin/settings", label: copy.settings });
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface">
          <p className="p-6 text-sm text-on-surface-variant">{copy.cms}</p>
        </div>
      }
    >
      <AdminShell
        email={staff.email}
        role={staff.role}
        groups={groups}
        breakingCount={badges.breaking}
        copy={copy}
        localeSwitcher={<AdminLocaleSwitcher locale={locale} label={copy.language} />}
        deskLocaleNav={<AdminLocaleSwitcher locale={locale} label={copy.language} variant="stack" />}
      >
        {children}
      </AdminShell>
    </Suspense>
  );
}
