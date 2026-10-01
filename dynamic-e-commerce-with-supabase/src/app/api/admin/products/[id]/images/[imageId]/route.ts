import { revalidatePath } from "next/cache";
import { ok, route } from "@/lib/api";
import { requireAdminApi } from "@/lib/auth";
import { deleteImage, makeImagePrimary } from "@/services/products";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; imageId: string }> };

export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  await requireAdminApi();
  const { id, imageId } = await ctx.params;
  await deleteImage(id, imageId);
  revalidatePath("/", "layout");
  return ok({ deleted: true });
});

/** Make this image the primary (first) one. */
export const PATCH = route(async (_req: Request, ctx: Ctx) => {
  await requireAdminApi();
  const { id, imageId } = await ctx.params;
  await makeImagePrimary(id, imageId);
  revalidatePath("/", "layout");
  return ok({ updated: true });
});
