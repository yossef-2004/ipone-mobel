import { cookies } from "next/headers";
import { ok, readJson, route } from "@/lib/api";
import { ADMIN_COOKIE, HttpError, createSessionToken, verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const POST = route(async (req: Request) => {
  const body = await readJson(req);
  const password = typeof body.password === "string" ? body.password : "";
  if (!verifyPassword(password)) {
    await new Promise((r) => setTimeout(r, 600)); // slow down brute force
    throw new HttpError(401, "كلمة المرور غير صحيحة");
  }
  const { token, maxAge } = createSessionToken();
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge,
  });
  return ok({ loggedIn: true });
});
