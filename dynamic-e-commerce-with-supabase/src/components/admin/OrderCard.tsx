"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ORDER_STATUSES } from "@/config/site";
import { Spinner } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { callApi } from "@/lib/api";
import { formatIqd } from "@/lib/currency";
import { formatDateTime } from "@/lib/date";
import { buildWhatsAppLink } from "@/services/notifications";
import type { OrderDTO, OrderStatus } from "@/types";
import { STATUS_LABELS, STATUS_STYLES } from "./OrderStatusBadge";

export function OrderCard({ order }: { order: OrderDTO }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function setStatus(status: OrderStatus) {
    setBusy(true);
    const res = await callApi(`/api/admin/orders/${order.id}`, { method: "PATCH", body: { status } });
    setBusy(false);
    if (!res.ok) return toast.error(res.error);
    toast.success(`الطلب #${order.orderNumber}: ${STATUS_LABELS[status]}`);
    router.refresh();
  }

  async function remove() {
    if (!confirm(`حذف الطلب #${order.orderNumber} نهائياً؟`)) return;
    setBusy(true);
    const res = await callApi(`/api/admin/orders/${order.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) return toast.error(res.error);
    toast.success("تم حذف الطلب");
    router.refresh();
  }

  const first = order.items[0];
  const wa = buildWhatsAppLink(
    order.phone,
    `مرحباً ${order.customerName}، بخصوص طلبك رقم #${order.orderNumber}${first ? ` (${first.productName})` : ""}. حالة الطلب: ${STATUS_LABELS[order.status]}.`,
  );

  return (
    <article className={`glass rounded-2xl p-4 transition sm:p-5 ${busy ? "opacity-60" : ""}`}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grad-bg rounded-xl px-3 py-1 text-sm font-extrabold">#{order.orderNumber}</span>
          <span className="text-xs text-white/45">{formatDateTime(order.createdAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          {busy && <Spinner />}
          <select
            value={order.status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            disabled={busy}
            aria-label="حالة الطلب"
            className={`rounded-full border px-3 py-1.5 text-xs font-bold outline-none ${STATUS_STYLES[order.status]}`}
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s} className="bg-panel text-white">{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <dl className="space-y-1.5 text-sm">
          <Item k="الزبون" v={order.customerName} />
          <Item k="الهاتف" v={<a href={`tel:${order.phone}`} dir="ltr" className="text-aqua hover:underline">{order.phone}</a>} />
          <Item k="المحافظة" v={order.province || "—"} />
          <Item k="المنطقة" v={order.region || "—"} />
          <Item k="العنوان" v={order.address} />
          <Item k="اللون" v={order.color || "—"} />
          <Item k="السعة" v={order.capacity || "—"} />
          <Item k="الدفع" v={order.paymentMethod === "cash" ? "Cash عند الاستلام" : order.paymentMethod || "—"} />
          <Item k="الملاحظات" v={order.notes || "—"} />
        </dl>

        <div className="space-y-2">
          {order.items.map((i) => (
            <div key={i.id} className="rounded-xl bg-white/[0.04] p-3 text-sm">
              <p className="font-bold text-white" dir="auto">{i.productName}</p>
              <div className="mt-1.5 flex flex-wrap justify-between gap-2 text-xs text-white/55">
                <span>السعر: <b className="text-white/90">{formatIqd(i.unitPrice)}</b></span>
                <span>الكمية: <b className="text-white/90">{i.quantity}</b></span>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between px-1 text-sm">
            <span className="text-white/50">الإجمالي</span>
            <span className="text-lg font-extrabold text-white">{formatIqd(order.total)}</span>
          </div>
        </div>
      </div>

      <footer className="mt-4 flex flex-wrap gap-2 border-t border-white/8 pt-3">
        <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/20">
          مراسلة واتساب (يدوي)
        </a>
        <a href={`tel:${order.phone}`} className="rounded-xl border border-white/12 px-3.5 py-2 text-xs font-bold text-white/80 transition hover:bg-white/10">اتصال</a>
        <button onClick={remove} className="ms-auto rounded-xl border border-rose-400/25 px-3.5 py-2 text-xs font-bold text-rose-300 transition hover:bg-rose-500/10">حذف</button>
      </footer>
    </article>
  );
}

function Item({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-20 shrink-0 text-white/40">{k}</dt>
      <dd className="min-w-0 break-words text-white/90" dir="auto">{v}</dd>
    </div>
  );
}
