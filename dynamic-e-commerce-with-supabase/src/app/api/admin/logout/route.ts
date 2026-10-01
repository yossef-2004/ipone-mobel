import { cookies } from "next/headers";
import { ok, route } from "@/lib/api";
import { ADMIN_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const POST = route(async () => {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  return ok({ loggedOut: true });
});
