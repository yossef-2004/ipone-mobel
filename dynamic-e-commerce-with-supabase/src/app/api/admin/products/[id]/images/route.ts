import { revalidatePath } from "next/cache";
import { ok, route } from "@/lib/api";
import { HttpError, requireAdminApi } from "@/lib/auth";
import { addImageFromFile, addImageFromUrl } from "@/services/products";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** multipart/form-data with `file` (one or many) OR JSON `{ url }`. */
export const POST = route(async (req: Request, ctx: Ctx) => {
  await requireAdminApi();
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(400, "معرّف غير صالح");

  const type = req.headers.get("content-type") ?? "";
  const created = [];
  if (type.includes("multipart/form-data")) {
    const form = await req.formData();
    const files = form.getAll("file").filter((f): f is File => f instanceof File && f.size > 0);
    if (!files.length) throw new HttpError(400, "لم يتم اختيار أي صورة");
    for (const f of files) created.push(await addImageFromFile(id, f));
  } else {
    const body = (await req.json().catch(() => ({}))) as { url?: string };
    if (!body.url?.trim()) throw new HttpError(400, "رابط الصورة مطلوب");
    created.push(await addImageFromUrl(id, body.url.trim()));
  }
  revalidatePath("/", "layout");
  return ok(created, 201);
});
