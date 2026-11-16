import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const space =
    pathname === "/espace-admin" || pathname.startsWith("/espace-admin/")
      ? "admin"
      : pathname === "/espace-redacteur" || pathname.startsWith("/espace-redacteur/")
        ? "editor"
        : null;

  if (space) {
    const prefix = space === "admin" ? "/espace-admin" : "/espace-redacteur";
    const loginPath = `${prefix}/login`;
    const cookieName =
      space === "admin" ? "datasys_admin_session" : "datasys_editor_session";
    if (pathname !== loginPath && !request.cookies.has(cookieName)) {
      return NextResponse.redirect(new URL(loginPath, request.url));
    }
    const suffix = pathname.slice(prefix.length);
    const destination = request.nextUrl.clone();
    destination.pathname = `/admin${suffix}`;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-datasys-admin-space", space);
    return NextResponse.rewrite(destination, {
      request: { headers: requestHeaders },
    });
  }

  if (
    pathname === "/admin" ||
    (pathname.startsWith("/admin/") && pathname !== "/admin/login")
  ) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
}

export const config = {
  matcher: ["/espace-admin/:path*", "/espace-redacteur/:path*", "/admin", "/admin/:path*"],
};
