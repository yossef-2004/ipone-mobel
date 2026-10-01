"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/store/Header";
import { callApi } from "@/lib/api";

const items = [
  { href: "/admin", label: "نظرة عامة", icon: "◧", exact: true },
  { href: "/admin/products", label: "المنتجات", icon: "▣" },
  { href: "/admin/categories", label: "الأقسام", icon: "◫" },
  { href: "/admin/orders", label: "الطلبات", icon: "◪" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await callApi("/api/admin/logout");
    router.replace("/admin/login");
    router.refresh();
  }

  const nav = (
    <nav className="flex flex-col gap-1">
      {items.map((i) => {
        const active = i.exact ? pathname === i.href : pathname.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition ${active ? "grad-bg font-bold text-white shadow-lg shadow-neon/20" : "text-white/60 hover:bg-white/8 hover:text-white"}`}
          >
            <span className="text-base">{i.icon}</span>
            {i.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/8 bg-ink/85 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Logo />
        <button onClick={() => setOpen((o) => !o)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm" aria-expanded={open}>
          {open ? "إغلاق" : "القائمة"}
        </button>
      </div>
      {open && (
        <div className="reveal border-b border-white/8 bg-ink-2 p-4 lg:hidden">
          {nav}
          <div className="mt-3 flex gap-2">
            <Link href="/" className="flex-1 rounded-xl border border-white/10 py-2 text-center text-xs text-white/70">عرض المتجر</Link>
            <button onClick={logout} className="flex-1 rounded-xl border border-rose-400/30 py-2 text-xs text-rose-300">خروج</button>
          </div>
        </div>
      )}

      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-e border-white/8 bg-ink-2/70 p-5 lg:flex">
        <Logo />
        <p className="mb-3 mt-8 text-[11px] font-bold tracking-widest text-white/30">الإدارة</p>
        {nav}
        <div className="mt-auto space-y-2">
          <Link href="/" target="_blank" className="block rounded-xl border border-white/10 py-2.5 text-center text-sm text-white/70 transition hover:bg-white/8">
            عرض المتجر ↗
          </Link>
          <button onClick={logout} className="w-full rounded-xl border border-rose-400/25 py-2.5 text-sm text-rose-300 transition hover:bg-rose-500/10">
            تسجيل الخروج
          </button>
        </div>
      </aside>
    </>
  );
}
