"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmptyState, Spinner } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { callApi } from "@/lib/api";
import type { CategoryDTO } from "@/types";

export function CategoryManager({ categories }: { categories: CategoryDTO[] }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", description: "", sortOrder: "0" });
  const [form, setForm] = useState({ name: "", description: "", sortOrder: "0" });

  const body = (d: typeof form) => ({ name: d.name, description: d.description, sortOrder: Number(d.sortOrder) || 0 });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy("new");
    const res = await callApi("/api/admin/categories", { body: body(form) });
    setBusy(null);
    if (!res.ok) return toast.error(res.error);
    toast.success("تمت إضافة القسم");
    setForm({ name: "", description: "", sortOrder: "0" });
    router.refresh();
  }

  async function save(id: string) {
    setBusy(id);
    const res = await callApi(`/api/admin/categories/${id}`, { method: "PATCH", body: body(draft) });
    setBusy(null);
    if (!res.ok) return toast.error(res.error);
    toast.success("تم تعديل القسم");
    setEditing(null);
    router.refresh();
  }

  async function remove(c: CategoryDTO) {
    const n = c.productCount ?? 0;
    const msg = n
      ? `حذف القسم «${c.name}»؟ سيبقى ${n} جهاز في المتجر لكن بدون قسم.`
      : `حذف القسم «${c.name}»؟`;
    if (!confirm(msg)) return;
    setBusy(c.id);
    const res = await callApi(`/api/admin/categories/${c.id}`, { method: "DELETE" });
    setBusy(null);
    if (!res.ok) return toast.error(res.error);
    toast.success("تم حذف القسم");
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form onSubmit={create} className="glass space-y-3 rounded-3xl p-5 lg:sticky lg:top-24 lg:self-start">
        <h2 className="font-extrabold text-white">إضافة قسم</h2>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} placeholder="اسم القسم" className="input-base" />
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="وصف مختصر (اختياري)" className="input-base" />
        <input value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} inputMode="numeric" placeholder="الترتيب" className="input-base" dir="ltr" />
        <button disabled={busy === "new"} className="grad-bg flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-60">
          {busy === "new" ? <Spinner /> : "إضافة"}
        </button>
      </form>

      <div className="space-y-3">
        {categories.length === 0 ? (
          <EmptyState icon="🗂️" title="لا توجد أقسام" description="أضف أول قسم لتنظيم الأجهزة." />
        ) : (
          categories.map((c) => (
            <div key={c.id} className={`glass rounded-2xl p-4 ${busy === c.id ? "opacity-60" : ""}`}>
              {editing === c.id ? (
                <div className="space-y-2">
                  <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="input-base" />
                  <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={2} className="input-base" />
                  <input value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })} inputMode="numeric" className="input-base !w-28" dir="ltr" />
                  <div className="flex gap-2">
                    <button onClick={() => save(c.id)} className="grad-bg rounded-xl px-5 py-2 text-xs font-bold">حفظ</button>
                    <button onClick={() => setEditing(null)} className="rounded-xl border border-white/12 px-5 py-2 text-xs">إلغاء</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-white">{c.name}</p>
                    <p className="mt-0.5 text-xs text-white/45">
                      {c.productCount ?? 0} جهاز · ترتيب {c.sortOrder} · <span dir="ltr">/{c.slug}</span>
                    </p>
                    {c.description && <p className="mt-1 text-sm text-white/55">{c.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditing(c.id); setDraft({ name: c.name, description: c.description ?? "", sortOrder: String(c.sortOrder) }); }}
                      className="rounded-xl border border-white/12 px-4 py-2 text-xs font-bold transition hover:bg-white/10"
                    >
                      تعديل
                    </button>
                    <button onClick={() => remove(c)} className="rounded-xl border border-rose-400/25 px-4 py-2 text-xs font-bold text-rose-300 transition hover:bg-rose-500/10">حذف</button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
