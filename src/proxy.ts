import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  request.headers.set("x-pathname", pathname);

  if (/^\/(en|ar|ckb)\//.test(pathname)) {
    try {
      const { findRedirect } = await import("@/server/dal/redirects");
      const hit = await findRedirect(pathname);
      if (hit) {
        const url = new URL(hit.toPath, request.url);
        return NextResponse.redirect(url, hit.type === "302" ? 302 : 301);
      }
    } catch {
      /* db unavailable — skip redirects */
    }
  }

  const res = intlMiddleware(request);
  if (res instanceof NextResponse) {
    return withPreviewRobots(request, res);
  }
  return res;
}

function withPreviewRobots(request: NextRequest, response: NextResponse) {
  if (request.nextUrl.searchParams.has("preview")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export const config = {
  matcher: ["/((?!api|admin|trpc|_next|_vercel|uploads|fixtures|og|sitemaps|.*\\..*).*)"],
};
