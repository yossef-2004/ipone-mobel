import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_ACCESS_COOKIE, hasSupabaseConfig, supabase, supabaseKey, supabaseUrl } from "@/db";
import { HttpError } from "@/lib/errors";

export { HttpError };

export { ADMIN_ACCESS_COOKIE, ADMIN_REFRESH_COOKIE } from "@/db";

export function isUsingDefaultCredentials(): boolean {
  return !process.env.SUPABASE_ADMIN_EMAIL || !hasSupabaseConfig;
}

export async function isAdmin(): Promise<boolean> {
  if (!hasSupabaseConfig) return false;
  const accessToken = (await cookies()).get(ADMIN_ACCESS_COOKIE)?.value;
  if (!accessToken) return false;
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) return false;
    const user = (await response.json()) as { app_metadata?: { role?: string } };
    return user.app_metadata?.role === "admin";
  } catch {
    return false;
  }
}

/** For server components / layouts. */
export async function requireAdminPage(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function requireAdminApi(): Promise<void> {
  if (!(await isAdmin())) throw new HttpError(401, "غير مصرّح: يجب تسجيل الدخول كأدمن");
}
