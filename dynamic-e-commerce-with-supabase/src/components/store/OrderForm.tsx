"use client";

import { useState, type FormEvent } from "react";
import { siteConfig } from "@/config/site";
import { callApi } from "@/lib/api";
import { formatIqd } from "@/lib/currency";
import { formatDateTime } from "@/lib/date";
import { Spinner } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import type { OrderDTO } from "@/types";

type Props = { productId: string; productName: string; price: number; available: boolean };

export function OrderForm({ productId, productName, price, available }: Props) {
  const toast = useToast();
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDTO | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!available || loading) return;
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    setError(null);
    const res = await callApi<OrderDTO>("/api/orders", {
      body: {
        productId,
        quantity: qty,
        customerName: fd.get("customerName"),
        phone: fd.get("phone"),
        province: fd.get("province"),
        region: fd.get("region"),
        address: fd.get("address"),
        color: fd.get("color"),
        capacity: fd.get("capacity"),
        notes: fd.get("notes"),
        paymentMethod: "cash",
      },
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      toast.error(res.error);
      return;
    }
    setOrder(res.data);
    toast.success(`تم إرسال طلب الحجز بنجاح — رقم الطلب #${res.data.orderNumber}`);
  }

  if (order) {
    const waMessage = `مرحباً، أرسلت طلب حجز رقم #${order.orderNumber} للجهاز: ${productName} (الكمية ${order.items[0]?.quantity ?? 1}) بمبلغ ${formatIqd(order.total)}.`;
    return (
      <div className="reveal glass rounded-3xl border-emerald-400/30 p-6 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/20 text-3xl text-emerald-300">✓</div>
        <h3 className="mt-4 text-xl font-extrabold text-white">تم استلام طلب الحجز</h3>
        <p className="mt-1 text-sm text-white/55">سنتواصل معك على رقم هاتفك لتأكيد الطلب.</p>
        <dl className="mt-5 space-y-2.5 rounded-2xl bg-white/[0.04] p-4 text-sm">
          <Row k="رقم الطلب" v={`#${order.orderNumber}`} />
          <Row k="الجهاز" v={productName} />
          <Row k="الكمية" v={String(order.items[0]?.quantity ?? 1)} />
          <Row k="سعر الوحدة" v={formatIqd(order.items[0]?.unitPrice ?? price)} />
          <Row k="الإجمالي" v={formatIqd(order.total)} strong />
          <Row k="التاريخ" v={formatDateTime(order.createdAt)} />
        </dl>
        {siteConfig.whatsappNumber && (
          <a
            href={`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(waMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 py-3 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/20"
          >
            تأكيد سريع عبر واتساب (اختياري)
          </a>
        )}
        <button
          onClick={() => setOrder(null)}
          className="mt-3 w-full rounded-xl border border-white/10 py-3 text-sm text-white/70 transition hover:bg-white/8"
        >
          حجز آخر
        </button>
      </div>
    );
  }

  if (!available) {
    return (
      <div className="glass rounded-3xl p-6 text-center">
        <p className="text-sm text-white/60">هذا الجهاز غير متوفر حالياً، لا يمكن حجزه الآن.</p>
        <button disabled className="mt-4 w-full cursor-not-allowed rounded-xl bg-white/8 py-3.5 text-sm font-bold text-white/40">
          غير متوفر
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="glass space-y-4 rounded-3xl p-5 sm:p-6" id="order-form">
      <h3 className="text-lg font-extrabold text-white">احجز هذا الجهاز</h3>

      <Field label="الاسم الكامل">
        <input name="customerName" required minLength={2} maxLength={120} autoComplete="name" className="input-base" placeholder="مثال: أحمد علي" />
      </Field>
      <Field label="رقم الهاتف">
        <input name="phone" required inputMode="tel" autoComplete="tel" className="input-base" placeholder="07701234567" dir="ltr" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="المحافظة">
          <input name="province" required minLength={2} maxLength={80} className="input-base" placeholder="بغداد" />
        </Field>
        <Field label="المنطقة">
          <input name="region" required minLength={2} maxLength={80} className="input-base" placeholder="المنصور" />
        </Field>
      </div>
      <Field label="العنوان">
        <input name="address" required minLength={5} maxLength={500} autoComplete="street-address" className="input-base" placeholder="الشارع، رقم المنزل، أقرب علامة مميزة" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="اللون">
          <input name="color" required minLength={2} maxLength={80} className="input-base" placeholder="أسود" />
        </Field>
        <Field label="السعة">
          <input name="capacity" required minLength={2} maxLength={80} className="input-base" placeholder="256GB" />
        </Field>
      </div>
      <Field label="ملاحظات (اختياري)">
        <textarea name="notes" rows={2} maxLength={1000} className="input-base resize-none" placeholder="ملاحظات إضافية، وقت التواصل، أو تفاصيل أخرى" />
      </Field>

      <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] p-3">
        <span className="text-sm text-white/60">الكمية</span>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-9 w-9 place-items-center rounded-xl bg-white/8 text-lg transition hover:bg-white/15 active:scale-90" aria-label="إنقاص">−</button>
          <span className="w-8 text-center font-bold text-white">{qty}</span>
          <button type="button" onClick={() => setQty((q) => Math.min(1000, q + 1))} className="grid h-9 w-9 place-items-center rounded-xl bg-white/8 text-lg transition hover:bg-white/15 active:scale-90" aria-label="زيادة">+</button>
        </div>
      </div>

      <div className="flex items-end justify-between border-t border-white/8 pt-4">
        <span className="text-sm text-white/55">الإجمالي</span>
        <span className="text-2xl font-extrabold text-white">{formatIqd(price * qty)}</span>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-200">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="grad-bg flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-lg shadow-neon/25 transition hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? (<><Spinner /> جارٍ الإرسال…</>) : "إرسال طلب الحجز"}
      </button>
      <p className="text-center text-xs text-white/40">لا يتطلب دفعاً الآن — نتواصل معك لتأكيد الطلب.</p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs text-white/55">{label}</span>
      {children}
    </label>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-white/50">{k}</dt>
      <dd className={`text-end ${strong ? "text-base font-extrabold text-white" : "text-white/90"}`} dir="auto">{v}</dd>
    </div>
  );
}
