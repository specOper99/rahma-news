import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { staffProfiles } from "@/db/schema";

export type StaffRole = "owner" | "admin" | "editor" | "author";

export type StaffSession = {
  userId: string;
  email: string;
  name: string;
  role: StaffRole;
};

export async function getSession(): Promise<StaffSession | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  const [profile] = await db
    .select()
    .from(staffProfiles)
    .where(eq(staffProfiles.userId, session.user.id))
    .limit(1);
  if (!profile || !profile.active) return null;
  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: profile.role,
  };
}

export async function requireStaff(): Promise<StaffSession> {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  return s;
}

export function hasRole(role: StaffRole, allowed: StaffRole[]): boolean {
  return allowed.includes(role);
}

export async function requireRole(...roles: StaffRole[]): Promise<StaffSession> {
  const s = await requireStaff();
  if (!hasRole(s.role, roles)) {
    redirect("/admin");
  }
  return s;
}

export function canPublish(role: StaffRole): boolean {
  return role === "owner" || role === "admin" || role === "editor";
}

export function canManageUsers(role: StaffRole): boolean {
  return role === "owner" || role === "admin";
}

export function canManageSettings(role: StaffRole): boolean {
  return role === "owner" || role === "admin";
}
