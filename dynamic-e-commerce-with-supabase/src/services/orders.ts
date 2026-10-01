import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";
import { HttpError } from "@/lib/auth";
import type { OrderDTO, OrderItemDTO, OrderStatus, Paginated } from "@/types";

export type CreateOrderInput = {
  productId: string;
  quantity: number;
  customerName: string;
  phone: string;
  address: string;
  notes: string;
};

/** The price is ALWAYS read from the database at order time (never trusted from the client). */
export async function createOrder(input: CreateOrderInput): Promise<OrderDTO> {
  const created = await db.transaction(async (tx) => {
    const [product] = await tx
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        isAvailable: products.isAvailable,
        isVisible: products.isVisible,
      })
      .from(products)
      .where(eq(products.id, input.productId))
      .limit(1);

    if (!product || !product.isVisible) throw new HttpError(404, "هذا الجهاز غير موجود");
    if (!product.isAvailable) throw new HttpError(409, "عذراً، هذا الجهاز غير متوفر حالياً");

    const total = product.price * input.quantity;
    if (!Number.isSafeInteger(total)) throw new HttpError(400, "المبلغ الإجمالي غير صالح");

    const [order] = await tx
      .insert(orders)
      .values({
        customerName: input.customerName,
        phone: input.phone,
        address: input.address,
        notes: input.notes,
        total,
      })
      .returning();

    await tx.insert(orderItems).values({
      orderId: order.id,
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      quantity: input.quantity,
    });
    return order.id;
  });

  const order = await getOrderById(created);
  if (!order) throw new HttpError(500, "تعذّر قراءة الطلب بعد حفظه");
  return order;
}

type OrderRow = typeof orders.$inferSelect;

async function withItems(rows: OrderRow[]): Promise<OrderDTO[]> {
  if (!rows.length) return [];
  const items = await db
    .select()
    .from(orderItems)
    .where(inArray(orderItems.orderId, rows.map((r) => r.id)));
  const byOrder = new Map<string, OrderItemDTO[]>();
  for (const i of items) {
    const list = byOrder.get(i.orderId) ?? [];
    list.push({ id: i.id, productId: i.productId, productName: i.productName, unitPrice: i.unitPrice, quantity: i.quantity });
    byOrder.set(i.orderId, list);
  }
  return rows.map((r) => ({
    id: r.id,
    orderNumber: r.orderNumber,
    customerName: r.customerName,
    phone: r.phone,
    address: r.address,
    notes: r.notes,
    status: r.status,
    total: r.total,
    createdAt: r.createdAt.toISOString(),
    items: byOrder.get(r.id) ?? [],
  }));
}

export async function getOrderById(id: string): Promise<OrderDTO | null> {
  const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return (await withItems(rows))[0] ?? null;
}

export async function listOrders(
  opts: { status?: OrderStatus; page?: number; pageSize?: number } = {},
): Promise<Paginated<OrderDTO>> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, opts.pageSize ?? 25));
  const where = opts.status ? eq(orders.status, opts.status) : undefined;
  const [c] = await db.select({ n: sql<number>`count(*)::int` }).from(orders).where(where);
  const rows = await db
    .select()
    .from(orders)
    .where(where)
    .orderBy(desc(orders.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  const total = c?.n ?? 0;
  return { items: await withItems(rows), total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<OrderDTO> {
  const [row] = await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning({ id: orders.id });
  if (!row) throw new HttpError(404, "الطلب غير موجود");
  const order = await getOrderById(id);
  if (!order) throw new HttpError(404, "الطلب غير موجود");
  return order;
}

export async function deleteOrder(id: string) {
  const [row] = await db.delete(orders).where(eq(orders.id, id)).returning({ id: orders.id });
  if (!row) throw new HttpError(404, "الطلب غير موجود");
}

export async function getOrderStats() {
  const [r] = await db
    .select({
      total: sql<number>`count(*)::int`,
      newCount: sql<number>`count(*) filter (where ${orders.status} = 'new')::int`,
      preparing: sql<number>`count(*) filter (where ${orders.status} in ('confirmed','preparing'))::int`,
      delivered: sql<number>`count(*) filter (where ${orders.status} = 'delivered')::int`,
      revenue: sql<string>`coalesce(sum(${orders.total}) filter (where ${orders.status} = 'delivered'), 0)::text`,
    })
    .from(orders);
  return {
    total: r?.total ?? 0,
    newCount: r?.newCount ?? 0,
    preparing: r?.preparing ?? 0,
    delivered: r?.delivered ?? 0,
    revenue: Number(r?.revenue ?? 0),
  };
}
