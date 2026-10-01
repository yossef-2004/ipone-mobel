import { revalidatePath } from "next/cache";
import { ok, readJson, route } from "@/lib/api";
import { requireAdminApi } from "@/lib/auth";
import { str } from "@/lib/validation";
import { createCategory } from "@/services/categories";

export const dynamic = "force-dynamic";

export const POST = route(async (req: Request) => {
  await requireAdminApi();
  const b = await readJson(req);
  const row = await createCategory({
    name: str(b.name, "اسم القسم", { min: 2, max: 80 }),
    description: str(b.description, "الوصف", { required: false, max: 500 }),
    sortOrder: Number.isInteger(Number(b.sortOrder)) ? Number(b.sortOrder) : 0,
  });
  revalidatePath("/", "layout");
  return ok(row, 201);
});
