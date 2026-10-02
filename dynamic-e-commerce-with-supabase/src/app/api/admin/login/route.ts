import { cookies } from "next/headers";
import { ok, readJson, route } from "@/lib/api";
import { ADMIN_ACCESS_COOKIE, ADMIN_REFRESH_COOKIE, HttpError, verifyPassword } from "@/lib/auth";
import { hasSupabaseConfig, supabase } from "@/db";

export const dynamic = "force-dynamic";

export const POST = route(async (req: Request) => {
  const body = await readJson(req);
  const password = typeof body.password === "string" ? body.password : "";
  if (!hasSupabaseConfig || !process.env.SUPABASE_ADMIN_EMAIL || !verifyPassword(password)) {
    await new Promise((r) => setTimeout(r, 600)); // slow down brute force
    throw new HttpError(401, "كلمة المرور غير صحيحة");
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email: process.env.SUPABASE_ADMIN_EMAIL,
    password,
  });
  if (error || !data.session || data.user.app_metadata?.role !== "admin") {
    throw new HttpError(401, "تعذّر تسجيل الدخول كأدمن. تحقق من حساب Supabase وصلاحية admin.");
  }

  const store = await cookies();
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  } as const;
  store.set(ADMIN_ACCESS_COOKIE, data.session.access_token, { ...cookieOptions, maxAge: data.session.expires_in });
  store.set(ADMIN_REFRESH_COOKIE, data.session.refresh_token, { ...cookieOptions, maxAge: 60 * 60 * 24 * 30 });
  return ok({ loggedIn: true });
});
