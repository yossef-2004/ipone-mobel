import { revalidatePath } from "next/cache";
import { ok, readJson, route } from "@/lib/api";
import { HttpError, requireAdminApi } from "@/lib/auth";
import { str } from "@/lib/validation";
import { deleteCategory, updateCategory } from "@/services/categories";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function checkId(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(400, "معرّف غير صالح");
}

export const PATCH = route(async (req: Request, ctx: Ctx) => {
  await requireAdminApi();
  const { id } = await ctx.params;
  checkId(id);
  const b = await readJson(req);
  const row = await updateCategory(id, {
    name: str(b.name, "اسم القسم", { min: 2, max: 80 }),
    description: str(b.description, "الوصف", { required: false, max: 500 }),
    sortOrder: Number.isInteger(Number(b.sortOrder)) ? Number(b.sortOrder) : 0,
  });
  revalidatePath("/", "layout");
  return ok(row);
});

export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  await requireAdminApi();
  const { id } = await ctx.params;
  checkId(id);
  await deleteCategory(id);
  revalidatePath("/", "layout");
  return ok({ deleted: true });
});
