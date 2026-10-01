import type { OrderDTO } from "@/types";

/**
 * Notification hook for new orders / status changes.
 *
 * IMPORTANT: automatic WhatsApp sending is NOT active. It requires the WhatsApp
 * Business Cloud API (or a provider such as Twilio) and approved credentials.
 * Today the store only offers MANUAL wa.me links (customer → store, admin → customer).
 *
 * To integrate later, implement `NotificationProvider` (e.g. WhatsAppCloudProvider reading
 * WHATSAPP_TOKEN / WHATSAPP_PHONE_ID from process.env) and return it from `getProvider()`.
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
  return noopProvider;
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
