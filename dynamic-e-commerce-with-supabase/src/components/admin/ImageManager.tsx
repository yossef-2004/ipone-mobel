"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Spinner } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { callApi } from "@/lib/api";
import { thumbUrl } from "@/lib/image-url";
import type { ProductImageDTO } from "@/types";

/** Immediate image management for an existing product (upload many, add by URL, delete, set primary). */
export function ImageManager({ productId, images }: { productId: string; images: ProductImageDTO[] }) {
  const router = useRouter();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [url, setUrl] = useState("");

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("file", f));
    setBusy("upload");
    const res = await callApi(`/api/admin/products/${productId}/images`, { formData: fd });
    setBusy(null);
    if (fileRef.current) fileRef.current.value = "";
    if (!res.ok) return toast.error(res.error);
    toast.success(`تم رفع ${files.length} صورة`);
    router.refresh();
  }

  async function addUrl() {
    if (!url.trim()) return;
    setBusy("url");
    const res = await callApi(`/api/admin/products/${productId}/images`, { body: { url } });
    setBusy(null);
    if (!res.ok) return toast.error(res.error);
    setUrl("");
    toast.success("تمت إضافة الصورة");
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("حذف هذه الصورة؟")) return;
    setBusy(id);
    const res = await callApi(`/api/admin/products/${productId}/images/${id}`, { method: "DELETE" });
    setBusy(null);
    if (!res.ok) return toast.error(res.error);
    toast.success("تم حذف الصورة");
    router.refresh();
  }

  async function primary(id: string) {
    setBusy(id);
    const res = await callApi(`/api/admin/products/${productId}/images/${id}`, { method: "PATCH" });
    setBusy(null);
    if (!res.ok) return toast.error(res.error);
    toast.success("تم تعيينها كصورة رئيسية");
    router.refresh();
  }

  return (
    <div className="glass rounded-3xl p-5">
      <h2 className="mb-4 font-extrabold text-white">صور الجهاز ({images.length})</h2>

      {images.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-white/45">لا توجد صور بعد.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {images.map((img, i) => (
            <div key={img.id} className={`group relative aspect-square overflow-hidden rounded-2xl bg-white/5 ${busy === img.id ? "opacity-50" : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbUrl(img.url)} alt="" loading="lazy" className="h-full w-full object-cover" />
              {i === 0 && <span className="absolute start-1.5 top-1.5 rounded-full bg-neon px-2 py-0.5 text-[10px] font-bold">رئيسية</span>}
              <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-gradient-to-t from-black/85 p-1.5 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                {i !== 0 && (
                  <button onClick={() => primary(img.id)} className="flex-1 rounded-lg bg-white/15 py-1 text-[10px]">رئيسية</button>
                )}
                <button onClick={() => remove(img.id)} className="flex-1 rounded-lg bg-rose-500/70 py-1 text-[10px]">حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 py-3 text-sm text-white/75 transition hover:border-neon hover:bg-white/5">
          {busy === "upload" ? <><Spinner /> جارٍ الرفع والضغط…</> : "⬆ رفع صور (يمكن اختيار عدة صور)"}
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} disabled={busy !== null} />
        </label>
        <div className="flex gap-2">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="أو الصق رابط صورة https://…" className="input-base" dir="ltr" />
          <button onClick={addUrl} disabled={busy !== null} className="shrink-0 rounded-xl border border-white/12 px-4 text-sm transition hover:bg-white/10 disabled:opacity-50">
            {busy === "url" ? <Spinner /> : "إضافة"}
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs text-white/35">يتم ضغط الصور المرفوعة تلقائياً (WebP) لتسريع الموقع. لا يوجد حد لعدد الصور.</p>
    </div>
  );
}
