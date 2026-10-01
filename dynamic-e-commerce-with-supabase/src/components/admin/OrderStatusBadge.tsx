import type { OrderStatus } from "@/types";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "جديد",
  confirmed: "تم تأكيد الطلب",
  preparing: "قيد التجهيز",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

export const STATUS_STYLES: Record<OrderStatus, string> = {
  new: "border-sky-400/30 bg-sky-500/15 text-sky-300",
  confirmed: "border-violet-400/30 bg-violet-500/15 text-violet-300",
  preparing: "border-amber-400/30 bg-amber-500/15 text-amber-300",
  delivered: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
  cancelled: "border-rose-400/30 bg-rose-500/15 text-rose-300",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
