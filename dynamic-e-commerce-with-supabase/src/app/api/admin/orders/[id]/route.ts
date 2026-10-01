import { ok, readJson, route } from "@/lib/api";
import { HttpError, requireAdminApi } from "@/lib/auth";
import { ORDER_STATUSES } from "@/config/site";
import { notifyOrderStatusChanged } from "@/services/notifications";
import { deleteOrder, updateOrderStatus } from "@/services/orders";
import type { OrderStatus } from "@/types";

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
  const status = b.status as OrderStatus;
  if (!ORDER_STATUSES.includes(status)) throw new HttpError(400, "حالة الطلب غير صالحة");
  const order = await updateOrderStatus(id, status);
  await notifyOrderStatusChanged(order);
  return ok(order);
});

export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  await requireAdminApi();
  const { id } = await ctx.params;
  checkId(id);
  await deleteOrder(id);
  return ok({ deleted: true });
});
