import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_ACCESS_COOKIE, ADMIN_REFRESH_COOKIE, supabaseKey, supabaseUrl } from "@/db";

function tokenExpiry(token: string): number {
  try {
    const payload = token.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/");
    if (!payload) return 0;
    return Number(JSON.parse(atob(payload)).exp) || 0;
  } catch {
    return 0;
  }
}

export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(ADMIN_ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(ADMIN_REFRESH_COOKIE)?.value;
  if (!accessToken || !refreshToken || tokenExpiry(accessToken) > Math.floor(Date.now() / 1000) + 60) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  try {
    const refreshed = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: supabaseKey, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });
    if (!refreshed.ok) {
      response.cookies.delete(ADMIN_ACCESS_COOKIE);
      response.cookies.delete(ADMIN_REFRESH_COOKIE);
      return response;
    }

    const session = (await refreshed.json()) as { access_token: string; refresh_token: string; expires_in: number };
    const options = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/" };
    response.cookies.set(ADMIN_ACCESS_COOKIE, session.access_token, { ...options, maxAge: session.expires_in });
    response.cookies.set(ADMIN_REFRESH_COOKIE, session.refresh_token, { ...options, maxAge: 60 * 60 * 24 * 30 });
  } catch {
    return NextResponse.next();
  }
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};