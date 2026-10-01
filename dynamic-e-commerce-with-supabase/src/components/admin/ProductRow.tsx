"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Spinner } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { callApi } from "@/lib/api";
import { formatIqd, parsePriceInput } from "@/lib/currency";
import { thumbUrl } from "@/lib/image-url";
import type { CategoryDTO, ProductDTO } from "@/types";

export function ProductRow({ product, categories }: { product: ProductDTO; categories: CategoryDTO[] }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceDraft, setPriceDraft] = useState(String(product.price));

  async function patch(body: Record<string, unknown>, success: string) {
    setBusy(true);
    const res = await callApi(`/api/admin/products/${product.id}`, { method: "PATCH", body });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return false;
    }
    toast.success(success);
    router.refresh();
    return true;
  }

  async function savePrice() {
    const n = parsePriceInput(priceDraft);
    if (n === null) {
      toast.error("السعر يجب أن يكون رقماً صحيحاً");
      return;
    }
    if (await patch({ price: n }, `تم تغيير السعر إلى ${formatIqd(n)}`)) setEditingPrice(false);
  }

  async function remove() {
    if (!confirm(`حذف «${product.name}» نهائياً مع صوره؟ لا يمكن التراجع.`)) return;
    setBusy(true);
    const res = await callApi(`/api/admin/products/${product.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) return toast.error(res.error);
    toast.success("تم حذف الجهاز");
    router.refresh();
  }

  const image = product.images[0];

  return (
    <div className={`glass flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl p-3 transition sm:p-4 ${busy ? "opacity-60" : ""} ${product.isVisible ? "" : "border-dashed"}`}>
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/5">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbUrl(image.url)} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-2xl">📱</div>
        )}
      </div>

      <div className="min-w-0 flex-1 basis-48">
        <p className="truncate font-bold text-white" dir="auto">{product.name}</p>
        <p className="mt-0.5 text-xs text-white/45">{product.brand || "—"} · {product.images.length} صور</p>
        {!product.isVisible && <span className="mt-1 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/60">مخفي عن الزبائن</span>}
      </div>

      <div className="basis-44">
        {editingPrice ? (
          <div className="flex items-center gap-1.5">
            <input
              value={priceDraft}
              onChange={(e) => setPriceDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && savePrice()}
              inputMode="numeric"
              dir="ltr"
              autoFocus
              className="input-base !w-32 !py-1.5 text-sm"
            />
            <button onClick={savePrice} className="rounded-lg bg-emerald-500/20 px-2 py-1.5 text-xs text-emerald-300">حفظ</button>
            <button onClick={() => { setEditingPrice(false); setPriceDraft(String(product.price)); }} className="rounded-lg bg-white/8 px-2 py-1.5 text-xs">✕</button>
          </div>
        ) : (
          <button onClick={() => setEditingPrice(true)} className="group text-start" title="تغيير السعر">
            <span className="block font-extrabold text-white">{formatIqd(product.price)}</span>
            <span className="text-[11px] text-white/40 group-hover:text-aqua">تغيير السعر ✎</span>
          </button>
        )}
      </div>

      <select
        value={product.categoryId ?? ""}
        onChange={(e) => patch({ categoryId: e.target.value || null }, "تم تغيير القسم")}
        className="input-base !w-40 !py-2 text-xs"
        aria-label="القسم"
      >
        <option value="">بدون قسم</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <div className="flex flex-wrap items-center gap-2">
        <Toggle
          on={product.isAvailable}
          onLabel="متوفر"
          offLabel="غير متوفر"
          onClick={() => patch({ isAvailable: !product.isAvailable }, product.isAvailable ? "تم تحويله إلى غير متوفر" : "تم تحويله إلى متوفر")}
        />
        <Toggle
          on={product.isVisible}
          onLabel="ظاهر"
          offLabel="مخفي"
          onClick={() => patch({ isVisible: !product.isVisible }, product.isVisible ? "تم إخفاء الجهاز" : "تم إظهار الجهاز")}
        />
      </div>

      <div className="ms-auto flex items-center gap-2">
        {busy && <Spinner />}
        <Link href={`/admin/products/${product.id}`} className="rounded-xl border border-white/12 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/10">تعديل</Link>
        <button onClick={remove} className="rounded-xl border border-rose-400/25 px-3.5 py-2 text-xs font-bold text-rose-300 transition hover:bg-rose-500/10">حذف</button>
      </div>
    </div>
  );
}

function Toggle({ on, onLabel, offLabel, onClick }: { on: boolean; onLabel: string; offLabel: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${on ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25" : "border-rose-400/30 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"}`}
    >
      {on ? onLabel : offLabel}
    </button>
  );
}
