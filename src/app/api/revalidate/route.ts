import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { promoteDueScheduled } from "@/server/dal/articles";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const header = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const secret = header || url.searchParams.get("secret") || "";
  const expected = process.env.REVALIDATE_SECRET ?? "";
  if (!expected || secret !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  await promoteDueScheduled();
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  return POST(req);
}
