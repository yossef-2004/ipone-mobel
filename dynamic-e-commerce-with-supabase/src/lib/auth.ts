import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { HttpError } from "@/lib/errors";

export { HttpError };

/**
 * Minimal admin auth: one password (ADMIN_PASSWORD) → signed, httpOnly session cookie.
 * Every admin API route and the admin layout call the guards below.
 * Replace with Supabase Auth / user accounts later without touching callers.
 */

export const ADMIN_COOKIE = "orbit_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET || "dev-only-insecure-secret";
}

export function isUsingDefaultCredentials(): boolean {
  return !process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function verifyPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || "admin123";
  const h = (s: string) => createHmac("sha256", "pw").update(s).digest("base64url");
  return safeEqual(h(input), h(expected));
}

export function createSessionToken(): { token: string; maxAge: number } {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = String(exp);
  return { token: `${payload}.${sign(payload)}`, maxAge: SESSION_TTL_SECONDS };
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  if (!safeEqual(sign(payload), signature)) return false;
  return Number(payload) > Math.floor(Date.now() / 1000);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

/** For server components / layouts. */
export async function requireAdminPage(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function requireAdminApi(): Promise<void> {
  if (!(await isAdmin())) throw new HttpError(401, "غير مصرّح: يجب تسجيل الدخول كأدمن");
}
