import { ok, readJson, route } from "@/lib/api";
import { HttpError } from "@/lib/auth";
import { phone, quantity, str } from "@/lib/validation";
import { notifyOrderCreated } from "@/services/notifications";
import { createOrder } from "@/services/orders";

export const dynamic = "force-dynamic";

/** Public: customers submit reservation requests. */
export const POST = route(async (req: Request) => {
  const body = await readJson(req);
  const productId = typeof body.productId === "string" ? body.productId : "";
  if (!/^[0-9a-f-]{36}$/i.test(productId)) throw new HttpError(400, "الجهاز غير محدد");

  const order = await createOrder({
    productId,
    quantity: quantity(body.quantity),
    customerName: str(body.customerName, "الاسم", { min: 2, max: 120 }),
    phone: phone(body.phone),
    province: str(body.province, "المحافظة", { min: 2, max: 80 }),
    region: str(body.region, "المنطقة", { min: 2, max: 80 }),
    address: str(body.address, "العنوان", { min: 5, max: 500 }),
    color: str(body.color, "اللون", { min: 2, max: 80 }),
    capacity: str(body.capacity, "السعة", { min: 2, max: 80 }),
    notes: str(body.notes, "الملاحظات", { required: false, max: 1000 }),
    paymentMethod: "cash",
  });
  await notifyOrderCreated(order);
  return ok(order, 201);
});
