import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/authConstants";

/**
 * Optimistic auth gate for /admin (Next 16 renamed middleware → proxy). This
 * only checks that a session cookie is present — the real signature check runs
 * in the admin layout (server component), per the Next.js guidance that proxy
 * should not do full authorization.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow the login page and the auth endpoints through.
  if (pathname === "/admin/login" || pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const hasCookie = request.cookies.has(ADMIN_COOKIE);
    if (!hasCookie) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
