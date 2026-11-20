import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const roleCookie = request.cookies.get("dh_role")?.value;
  const userIdCookie = request.cookies.get("dh_user_id")?.value;

  // 1. Protect Admin Routes (except /admin/login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (roleCookie !== "admin") {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Protect Customer Dashboard
  if (pathname.startsWith("/customer")) {
    if (!roleCookie && !userIdCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "login_required");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/customer/:path*",
  ],
};
