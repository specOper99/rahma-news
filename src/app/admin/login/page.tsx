import { getSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { getAdminCopy, getDeskLocale } from "@/server/desk-copy";
import { AdminLocaleSwitcher } from "@/components/admin/AdminLocaleSwitcher";

export default async function LoginPage() {
  const s = await getSession();
  if (s) redirect("/admin");
  const [copy, locale] = await Promise.all([getAdminCopy(), getDeskLocale()]);
  return (
    <LoginForm
      copy={copy}
      localeSwitcher={<AdminLocaleSwitcher locale={locale} label={copy.language} />}
    />
  );
}
