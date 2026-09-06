import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await ctx.params;
  if (parts.length === 0 || parts.some((p) => p.includes("..") || p.includes("/") || p.includes("\\"))) {
    return new NextResponse(null, { status: 400 });
  }
  const root = path.resolve(process.cwd(), "storage", "uploads");
  const file = path.resolve(root, ...parts);
  if (!file.startsWith(root + path.sep) && file !== root) {
    return new NextResponse(null, { status: 400 });
  }
  try {
    const buf = await readFile(file);
    const ext = path.extname(file).toLowerCase();
    return new NextResponse(buf, {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
