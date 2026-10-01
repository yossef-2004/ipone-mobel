"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Spinner } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { callApi } from "@/lib/api";
import { formatIqd, parsePriceInput } from "@/lib/currency";
import type { CategoryDTO, ProductDTO, ProductSpec } from "@/types";

type Props = { categories: CategoryDTO[]; brands: string[]; product?: ProductDTO };

const SPEC_SUGGESTIONS: ProductSpec[] = [
  { label: "السعة", value: "" },
  { label: "الرام", value: "" },
  { label: "الشاشة", value: "" },
  { label: "البطارية", value: "" },
  { label: "اللون", value: "" },
];

export function ProductForm({ categories, brands, product }: Props) {
  const router = useRouter();
  const toast = useToast();
  const editing = Boolean(product);

  const [name, setName] = useState(product?.name ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [priceText, setPriceText] = useState(product ? String(product.price) : "");
  const [oldPriceText, setOldPriceText] = useState(product?.oldPrice ? String(product.oldPrice) : "");
  const [isAvailable, setAvailable] = useState(product?.isAvailable ?? true);
  const [isVisible, setVisible] = useState(product?.isVisible ?? true);
  const [isFeatured, setFeatured] = useState(product?.isFeatured ?? false);
  const [specs, setSpecs] = useState<ProductSpec[]>(product?.specs.length ? product.specs : []);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const price = parsePriceInput(priceText);
  const oldPrice = oldPriceText.trim() ? parsePriceInput(oldPriceText) : null;
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (price === null) return setError("أدخل سعراً صحيحاً بالدينار العراقي (أرقام فقط)");
    if (oldPriceText.trim() && oldPrice === null) return setError("السعر قبل الخصم غير صحيح");

    const body = {
      name,
      brand,
      categoryId: categoryId || null,
      description,
      price,
      oldPrice,
      isAvailable,
      isVisible,
      isFeatured,
      specs: specs.filter((s) => s.label.trim() && s.value.trim()),
    };

    setLoading(true);
    const res = editing
      ? await callApi<{ id: string }>(`/api/admin/products/${product!.id}`, { method: "PATCH", body })
      : await callApi<{ id: string }>("/api/admin/products", { body });

    if (!res.ok) {
      setLoading(false);
      setError(res.error);
      return toast.error(res.error);
    }

    if (!editing && files.length) {
      const fd = new FormData();
      files.forEach((f) => fd.append("file", f));
      const up = await callApi(`/api/admin/products/${res.data.id}/images`, { formData: fd });
      if (!up.ok) toast.error(`تم حفظ الجهاز لكن فشل رفع الصور: ${up.error}`);
    }

    setLoading(false);
    toast.success(editing ? "تم حفظ التعديلات" : "تمت إضافة الجهاز وهو ظاهر الآن في المتجر");
    if (editing) router.refresh();
    else router.push(`/admin/products/${res.data.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="glass grid gap-4 rounded-3xl p-5 sm:grid-cols-2">
        <Field label="اسم الجهاز *" className="sm:col-span-2">
          <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} className="input-base" placeholder="مثال: iPhone 16 Pro Max 256GB" />
        </Field>
        <Field label="الشركة">
          <input value={brand} onChange={(e) => setBrand(e.target.value)} list="brand-list" className="input-base" placeholder="Apple, Samsung…" />
          <datalist id="brand-list">{brands.map((b) => <option key={b} value={b} />)}</datalist>
        </Field>
        <Field label="القسم">
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-base">
            <option value="">بدون قسم</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="السعر (د.ع) *" hint={price !== null ? formatIqd(price) : priceText ? "رقم غير صحيح" : "بدون حد أقصى"}>
          <input value={priceText} onChange={(e) => setPriceText(e.target.value)} required inputMode="numeric" dir="ltr" className="input-base" placeholder="1250000" />
        </Field>
        <Field label="السعر قبل الخصم (اختياري)" hint={oldPrice !== null ? formatIqd(oldPrice) : undefined}>
          <input value={oldPriceText} onChange={(e) => setOldPriceText(e.target.value)} inputMode="numeric" dir="ltr" className="input-base" placeholder="1400000" />
        </Field>
        <Field label="الوصف" className="sm:col-span-2">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="input-base" placeholder="وصف مختصر للجهاز ومميزاته…" />
        </Field>
      </div>

      <div className="glass rounded-3xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-extrabold text-white">المواصفات</h2>
          <div className="flex gap-2">
            {specs.length === 0 && (
              <button type="button" onClick={() => setSpecs(SPEC_SUGGESTIONS)} className="rounded-lg border border-white/12 px-3 py-1.5 text-xs transition hover:bg-white/10">مواصفات جاهزة</button>
            )}
            <button type="button" onClick={() => setSpecs([...specs, { label: "", value: "" }])} className="rounded-lg border border-white/12 px-3 py-1.5 text-xs transition hover:bg-white/10">+ سطر</button>
          </div>
        </div>
        {specs.length === 0 ? (
          <p className="text-sm text-white/40">لا توجد مواصفات.</p>
        ) : (
          <div className="space-y-2">
            {specs.map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_1.4fr_auto] gap-2">
                <input value={s.label} onChange={(e) => setSpecs(specs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder="العنوان" className="input-base" />
                <input value={s.value} onChange={(e) => setSpecs(specs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} placeholder="القيمة" className="input-base" />
                <button type="button" onClick={() => setSpecs(specs.filter((_, j) => j !== i))} className="rounded-xl border border-rose-400/25 px-3 text-rose-300 transition hover:bg-rose-500/10" aria-label="حذف السطر">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass grid gap-3 rounded-3xl p-5 sm:grid-cols-3">
        <Switch label="متوفر للحجز" description={isAvailable ? "الزبون يستطيع الحجز" : "يظهر «غير متوفر» ويتوقف الحجز"} checked={isAvailable} onChange={setAvailable} />
        <Switch label="ظاهر في المتجر" description={isVisible ? "يراه الزبائن" : "مخفي عن الزبائن"} checked={isVisible} onChange={setVisible} />
        <Switch label="جهاز مميز" description="يظهر في الصفحة الرئيسية" checked={isFeatured} onChange={setFeatured} />
      </div>

      {!editing && (
        <div className="glass rounded-3xl p-5">
          <h2 className="mb-3 font-extrabold text-white">الصور</h2>
          <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/20 py-4 text-sm text-white/70 transition hover:border-neon hover:bg-white/5">
            ⬆ اختر صوراً (عدة صور)
            <input type="file" accept="image/*" multiple hidden onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])])} />
          </label>
          {previews.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6">
              {previews.map((src, i) => (
                <div key={src} className="relative aspect-square overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="absolute end-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-xs">✕</button>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-white/35">أول صورة ستكون الصورة الرئيسية. تُرفع الصور بعد حفظ الجهاز.</p>
        </div>
      )}

      {error && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button disabled={loading} className="grad-bg flex min-w-40 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-60">
          {loading ? <><Spinner /> جارٍ الحفظ…</> : editing ? "حفظ التعديلات" : "إضافة الجهاز"}
        </button>
        <button type="button" onClick={() => router.push("/admin/products")} className="rounded-xl border border-white/12 px-6 py-3 text-sm text-white/80 transition hover:bg-white/8">رجوع للقائمة</button>
      </div>
    </form>
  );
}

function Field({ label, hint, className = "", children }: { label: string; hint?: string; className?: string; children: ReactNode }) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="flex items-center justify-between text-xs text-white/55">
        <span>{label}</span>
        {hint && <span className="font-bold text-aqua">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function Switch({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-start transition ${checked ? "border-neon/50 bg-neon/10" : "border-white/10 bg-white/[0.03]"}`}
    >
      <span>
        <span className="block text-sm font-bold text-white">{label}</span>
        <span className="mt-0.5 block text-xs text-white/45">{description}</span>
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-neon" : "bg-white/20"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? "start-[22px]" : "start-0.5"}`} />
      </span>
    </button>
  );
}
