import { getSupabaseClient, hasSupabaseConfig } from "@/db";
import { HttpError } from "@/lib/auth";
import type { OrderDTO, OrderStatus, Paginated } from "@/types";

export type CreateOrderInput = {
  productId: string;
  quantity: number;
  customerName: string;
  phone: string;
  province: string;
  region: string;
  address: string;
  color: string;
  capacity: string;
  notes: string;
  paymentMethod?: "cash";
};

const ORDER_SELECT = "*,items:order_items(id,product_id,product_name,unit_price,quantity)";

function toOrderDTO(row: any): OrderDTO {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    phone: row.phone,
    province: row.province,
    region: row.region,
    address: row.address,
    color: row.color,
    capacity: row.capacity,
    notes: row.notes,
    paymentMethod: row.payment_method,
    status: row.status,
    total: Number(row.total),
    createdAt: row.created_at,
    items: (row.items ?? []).map((item: any) => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      unitPrice: Number(item.unit_price),
      quantity: item.quantity,
    })),
  };
}

export async function createOrder(input: CreateOrderInput): Promise<OrderDTO> {
  if (!hasSupabaseConfig) {
    throw new HttpError(503, "يجب تهيئة متغيرات Supabase أولاً.");
  }
  const client = await getSupabaseClient();
  const { data, error } = await client.rpc("create_public_order", {
    p_product_id: input.productId,
    p_quantity: input.quantity,
    p_customer_name: input.customerName,
    p_phone: input.phone,
    p_province: input.province,
    p_region: input.region,
    p_address: input.address,
    p_color: input.color,
    p_capacity: input.capacity,
    p_notes: input.notes,
    p_payment_method: input.paymentMethod ?? "cash",
  });
  if (error || !data) {
    console.error("[orders] create RPC failed", error?.message);
    throw new HttpError(503, "تعذّر إنشاء الطلب. تأكد من تنفيذ إعدادات Supabase المطلوبة.");
  }
  const result = data as Record<string, any>;
  return {
    id: result.id,
    orderNumber: result.order_number,
    customerName: result.customer_name,
    phone: result.phone,
    province: result.province,
    region: result.region,
    address: result.address,
    color: result.color,
    capacity: result.capacity,
    notes: result.notes,
    paymentMethod: result.payment_method,
    status: result.status,
    total: Number(result.total),
    createdAt: result.created_at,
    items: (result.items ?? []).map((item: any) => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      unitPrice: Number(item.unit_price),
      quantity: item.quantity,
    })),
  };
}

export async function getOrderById(id: string): Promise<OrderDTO | null> {
  if (!hasSupabaseConfig) return null;
  const client = await getSupabaseClient();
  const { data, error } = await client.from("orders").select(ORDER_SELECT).eq("id", id).maybeSingle();
  if (error) throw new HttpError(503, "تعذّر تحميل الطلب من Supabase");
  return data ? toOrderDTO(data) : null;
}

export async function listOrders(
  opts: { status?: OrderStatus; page?: number; pageSize?: number; q?: string } = {},
): Promise<Paginated<OrderDTO>> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 25));
  if (!hasSupabaseConfig) {
    return { items: [], total: 0, page, pageSize, totalPages: 1 };
  }
  const client = await getSupabaseClient();
  let query = client.from("orders").select(ORDER_SELECT, { count: "exact" }).order("created_at", { ascending: false });
  if (opts.status) query = query.eq("status", opts.status);
  const search = opts.q?.trim().slice(0, 100).replace(/[%,()]/g, " ");
  if (search) {
    const fields = [`customer_name.ilike.%${search}%`, `phone.ilike.%${search}%`, `address.ilike.%${search}%`, `province.ilike.%${search}%`, `region.ilike.%${search}%`];
    if (/^\d+$/.test(search)) fields.push(`order_number.eq.${search}`);
    query = query.or(fields.join(","));
  }
  const from = (page - 1) * pageSize;
  const { data, count, error } = await query.range(from, from + pageSize - 1);
  if (error) throw new HttpError(503, "تعذّر تحميل الطلبات من Supabase");
  const total = count ?? 0;
  return {
    items: (data ?? []).map(toOrderDTO),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<OrderDTO> {
  if (!hasSupabaseConfig) {
    throw new HttpError(503, "Supabase غير مهيأ بعد التعديل.");
  }
  const client = await getSupabaseClient();
  const { error } = await client.from("orders").update({ status }).eq("id", id);
  if (error) throw new HttpError(503, "تعذّر تحديث حالة الطلب");
  const order = await getOrderById(id);
  if (!order) throw new HttpError(404, "الطلب غير موجود");
  return order;
}

export async function deleteOrder(id: string) {
  if (!hasSupabaseConfig) return;
  const client = await getSupabaseClient();
  const { data, error } = await client.from("orders").delete().eq("id", id).select("id").maybeSingle();
  if (error) throw new HttpError(503, "تعذّر حذف الطلب من Supabase");
  if (!data) throw new HttpError(404, "الطلب غير موجود");
}

export async function getOrderStats() {
  if (!hasSupabaseConfig) {
    return { total: 0, newCount: 0, preparing: 0, delivered: 0, revenue: 0 };
  }
  const client = await getSupabaseClient();
  const [all, fresh, preparing, delivered] = await Promise.all([
    client.from("orders").select("id", { count: "exact", head: true }),
    client.from("orders").select("id", { count: "exact", head: true }).eq("status", "new"),
    client.from("orders").select("id", { count: "exact", head: true }).eq("status", "preparing"),
    client.from("orders").select("total").eq("status", "delivered"),
  ]);
  if (all.error || fresh.error || preparing.error || delivered.error) throw new HttpError(503, "تعذّر تحميل إحصاءات الطلبات");
  const revenue = (delivered.data ?? []).reduce((sum, row) => sum + Number(row.total), 0);
  return { total: all.count ?? 0, newCount: fresh.count ?? 0, preparing: preparing.count ?? 0, delivered: (delivered.data ?? []).length, revenue };
}
