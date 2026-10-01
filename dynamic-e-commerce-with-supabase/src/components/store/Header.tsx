"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { siteConfig } from "@/config/site";

const links = [
  { href: "/", label: "الرئيسية" },
  { href: "/products", label: "كل الأجهزة" },
  { href: "/#categories", label: "الأقسام" },
  { href: "/#how", label: "كيف تحجز؟" },
];

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grad-bg grid h-9 w-9 place-items-center rounded-xl text-lg shadow-lg shadow-neon/30">◐</span>
      <span className="flex flex-col leading-none">
        <span className="text-base font-extrabold text-white">{siteConfig.name}</span>
        <span className="mt-1 text-[10px] tracking-wide text-white/45">{siteConfig.tagline}</span>
      </span>
    </span>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [q, setQ] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/products?q=${encodeURIComponent(term)}` : "/products");
    setOpen(false);
  }

  return (
    <header
      className={`sticky top-0 z-50 transition duration-300 ${scrolled || open ? "border-b border-white/8 bg-ink/80 backdrop-blur-xl" : "border-b border-transparent"}`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="الصفحة الرئيسية">
          <Logo />
        </Link>

        <nav className="ms-6 hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-3.5 py-1.5 text-sm transition hover:bg-white/8 hover:text-white ${pathname === l.href ? "bg-white/8 text-white" : "text-white/60"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={onSearch} className="ms-auto hidden w-full max-w-xs md:block">
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث عن جهاز أو شركة…"
              className="input-base !rounded-full !py-2 !ps-10 text-sm"
              aria-label="بحث"
            />
            <span className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-white/40">⌕</span>
          </div>
        </form>

        <button
          onClick={() => setOpen((o) => !o)}
          className="ms-auto grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 md:hidden"
          aria-label="القائمة"
          aria-expanded={open}
        >
          <span className="relative block h-3.5 w-5">
            <span className={`absolute inset-x-0 h-0.5 rounded bg-white transition ${open ? "top-1.5 rotate-45" : "top-0"}`} />
            <span className={`absolute inset-x-0 top-1.5 h-0.5 rounded bg-white transition ${open ? "opacity-0" : ""}`} />
            <span className={`absolute inset-x-0 h-0.5 rounded bg-white transition ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
          </span>
        </button>
      </div>

      {open && (
        <div className="reveal border-t border-white/8 px-4 pb-5 pt-3 md:hidden">
          <form onSubmit={onSearch} className="mb-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث عن جهاز أو شركة…"
              className="input-base"
              aria-label="بحث"
            />
          </form>
          <nav className="flex flex-col">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-xl px-3 py-3 text-white/80 hover:bg-white/8">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
