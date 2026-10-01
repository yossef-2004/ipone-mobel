export const siteConfig = {
  name: "أوربت موبايل",
  tagline: "متجر الأجهزة الذكية",
  description:
    "متجر أجهزة موبايل عراقي: أحدث الهواتف الذكية بأسعار واضحة بالدينار العراقي، احجز جهازك بخطوات بسيطة.",
  /** International format without "+". Used ONLY for manual wa.me links. */
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
  pageSize: 12,
} as const;

export const ORDER_STATUSES = ["new", "confirmed", "preparing", "delivered", "cancelled"] as const;
