import { revalidatePath } from "next/cache";
import { ok, readJson, route } from "@/lib/api";
import { HttpError, requireAdminApi } from "@/lib/auth";
import { parsePatchProduct } from "@/services/product-input";
import { deleteProduct, updateProduct } from "@/services/products";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function checkId(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(400, "معرّف غير صالح");
}

export const PATCH = route(async (req: Request, ctx: Ctx) => {
  await requireAdminApi();
  const { id } = await ctx.params;
  checkId(id);
  const product = await updateProduct(id, parsePatchProduct(await readJson(req)));
  revalidatePath("/", "layout");
  return ok(product);
});

export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  await requireAdminApi();
  const { id } = await ctx.params;
  checkId(id);
  await deleteProduct(id);
  revalidatePath("/", "layout");
  return ok({ deleted: true });
});
