"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import type { CategoryDTO } from "@/types";
import { Spinner } from "@/components/ui/States";

export function ProductFilters({ categories, brands }: { categories: CategoryDTO[]; brands: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const get = (k: string) => params.get(k) ?? "";

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("page");
    startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    update({
      q: String(fd.get("q") ?? "").trim() || null,
      min: String(fd.get("min") ?? "").replace(/\D/g, "") || null,
      max: String(fd.get("max") ?? "").replace(/\D/g, "") || null,
    });
  }

  const activeCount = ["q", "category", "brand", "available", "min", "max"].filter((k) => get(k)).length;
  const paramsKey = params.toString();

  return (
    <div className="glass rounded-3xl p-4 sm:p-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-sm font-bold text-white lg:hidden"
      >
        <span>
          الفلاتر {activeCount > 0 && <span className="ms-1 rounded-full bg-neon px-2 py-0.5 text-xs">{activeCount}</span>}
        </span>
        <span className={`transition ${open ? "rotate-180" : ""}`}>⌄</span>
      </button>

      <form
        key={paramsKey}
        onSubmit={onSubmit}
        className={`${open ? "mt-4 block" : "hidden"} space-y-5 lg:mt-0 lg:block`}
      >
        <div className="flex items-center justify-between">
          <h2 className="hidden text-sm font-bold text-white lg:block">الفلاتر</h2>
          {pending && <Spinner className="h-4 w-4" />}
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs text-white/50">بحث</span>
          <input name="q" defaultValue={get("q")} placeholder="اسم الجهاز أو الشركة…" className="input-base" />
        </label>

        <div className="space-y-1.5">
          <span className="text-xs text-white/50">القسم</span>
          <div className="flex flex-wrap gap-2">
            <Chip active={!get("category")} onClick={() => update({ category: null })}>الكل</Chip>
            {categories.map((c) => (
              <Chip key={c.id} active={get("category") === c.slug} onClick={() => update({ category: c.slug })}>
                {c.name}
              </Chip>
            ))}
          </div>
        </div>

        {brands.length > 0 && (
          <label className="block space-y-1.5">
            <span className="text-xs text-white/50">الشركة</span>
            <select
              className="input-base"
              defaultValue={get("brand")}
              onChange={(e) => update({ brand: e.target.value || null })}
            >
              <option value="">كل الشركات</option>
              {brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </label>
        )}

        <div className="space-y-1.5">
          <span className="text-xs text-white/50">السعر (د.ع)</span>
          <div className="grid grid-cols-2 gap-2">
            <input name="min" inputMode="numeric" defaultValue={get("min")} placeholder="من" className="input-base" dir="ltr" />
            <input name="max" inputMode="numeric" defaultValue={get("max")} placeholder="إلى" className="input-base" dir="ltr" />
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white/80">
          <input
            type="checkbox"
            defaultChecked={get("available") === "1"}
            onChange={(e) => update({ available: e.target.checked ? "1" : null })}
            className="h-4 w-4 accent-[#7c5cff]"
          />
          المتوفر فقط
        </label>

        <button type="submit" className="grad-bg w-full rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.98]">
          تطبيق
        </button>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => startTransition(() => router.push(pathname, { scroll: false }))}
            className="w-full rounded-xl border border-white/10 py-2.5 text-sm text-white/70 transition hover:bg-white/8"
          >
            مسح الفلاتر
          </button>
        )}
      </form>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${active ? "grad-bg border-transparent text-white" : "border-white/10 bg-white/[0.03] text-white/65 hover:border-white/25 hover:text-white"}`}
    >
      {children}
    </button>
  );
}
