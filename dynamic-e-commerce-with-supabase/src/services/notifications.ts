import { formatIqd } from "@/lib/currency";
import type { OrderDTO, OrderItemDTO } from "@/types";

export function buildOrderWhatsAppMessage(order: OrderDTO | (OrderDTO & { items?: OrderItemDTO[] })) {
  const first = order.items?.[0];
  const productName = first?.productName ?? "-";
  const cap = order.capacity || "-";
  const color = order.color || "-";
  const qty = first?.quantity ?? 1;

  return [
    "طلب حجز جديد",
    "",
    `الجهاز: ${productName}`,
    `السعة: ${cap}`,
    `اللون: ${color}`,
    `السعر: ${formatIqd(order.total)}`,
    `الكمية: ${qty}`,
    "",
    `اسم الزبون: ${order.customerName}`,
    `رقم الهاتف: ${order.phone}`,
    `المحافظة: ${order.province || "-"}`,
    `المنطقة: ${order.region || "-"}`,
    `العنوان: ${order.address}`,
    `الملاحظات: ${order.notes || "-"}`,
  ].join("\n");
}

/**
 * Notification hook for new orders / status changes.
 *
 * Automatic WhatsApp API is intentionally disabled until credentials are configured.
 * Use the builder above to generate a message and pass it to your WhatsApp provider.
 */
export interface NotificationProvider {
  readonly name: string;
  onOrderCreated(order: OrderDTO): Promise<void>;
  onOrderStatusChanged(order: OrderDTO): Promise<void>;
}

const noopProvider: NotificationProvider = {
  name: "none",
  async onOrderCreated() {},
  async onOrderStatusChanged() {},
};

function getProvider(): NotificationProvider {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    return noopProvider;
  }

  return {
    name: "whatsapp-cloud",
    async onOrderCreated(order) {
      if (!process.env.WHATSAPP_API_TOKEN || !process.env.WHATSAPP_PHONE_ID) return;
      console.info("[notifications] WhatsApp provider ready:", buildOrderWhatsAppMessage(order));
    },
    async onOrderStatusChanged(order) {
      if (!process.env.WHATSAPP_API_TOKEN || !process.env.WHATSAPP_PHONE_ID) return;
      console.info("[notifications] status update message:", buildOrderWhatsAppMessage(order));
    },
  };
}

/** Never throws: a notification failure must not fail the order. */
export async function notifyOrderCreated(order: OrderDTO) {
  try {
    await getProvider().onOrderCreated(order);
  } catch (e) {
    console.error("[notifications] order created failed", e);
  }
}

export async function notifyOrderStatusChanged(order: OrderDTO) {
  try {
    await getProvider().onOrderStatusChanged(order);
  } catch (e) {
    console.error("[notifications] status change failed", e);
  }
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  // Iraqi local format 07xxxxxxxxx → 9647xxxxxxxxx
  const intl = digits.startsWith("964") ? digits : digits.startsWith("0") ? `964${digits.slice(1)}` : digits;
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}
