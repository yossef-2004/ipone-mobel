import { revalidatePath } from "next/cache";
import { ok, readJson, route } from "@/lib/api";
import { requireAdminApi } from "@/lib/auth";
import { parseCreateProduct } from "@/services/product-input";
import { createProduct } from "@/services/products";

export const dynamic = "force-dynamic";

export const POST = route(async (req: Request) => {
  await requireAdminApi();
  const product = await createProduct(parseCreateProduct(await readJson(req)));
  revalidatePath("/", "layout");
  return ok(product, 201);
});
