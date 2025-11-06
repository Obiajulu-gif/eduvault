import { NextResponse } from "next/server";

export function middleware(req) {
  const token = req.cookies.get("auth_token")?.value;
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/dashboard") && !token) {
    const url = new URL("/", req.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};