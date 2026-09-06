import { eq } from "drizzle-orm";
import { db } from "@/db";
import { redirects } from "@/db/schema";

export async function findRedirect(fromPath: string) {
  const [row] = await db
    .select()
    .from(redirects)
    .where(eq(redirects.fromPath, fromPath))
    .limit(1);
  return row ?? null;
}
