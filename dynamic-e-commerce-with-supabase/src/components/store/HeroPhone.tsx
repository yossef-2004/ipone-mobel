"use client";

import { useEffect, useRef, useState } from "react";

export type HeroPhoneItem = { name: string; price: string; image: string | null };

/**
 * Interactive 3D phone: tilts toward the pointer / finger (smoothed with rAF, no re-renders),
 * floats when idle and cycles through featured products from the database on its screen.
 */
export function HeroPhone({ items }: { items: HeroPhoneItem[] }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const stage = stageRef.current;
    const phone = phoneRef.current;
    if (!stage || !phone) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let tx = -12;
    let ty = 18;
    let cx = tx;
    let cy = ty;
    let raf = 0;
    let running = true;
    const t0 = performance.now();

    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width - 0.5) * 2; // -1..1
      const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
      const clamp = (v: number) => Math.max(-1.4, Math.min(1.4, v));
      ty = clamp(nx) * 24;
      tx = -clamp(ny) * 16;
    };
    const onLeave = () => {
      tx = -12;
      ty = 18;
    };

    const tick = (now: number) => {
      if (!running) return;
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      const sway = Math.sin((now - t0) / 1800) * 2;
      phone.style.transform = `rotateX(${cx}deg) rotateY(${cy + sway}deg)`;
      phone.style.setProperty("--gx", `${50 + cy * 1.6}%`);
      phone.style.setProperty("--gy", `${50 - cx * 2}%`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("pointermove", onMove, { passive: true });
    stage.addEventListener("pointerleave", onLeave);
    const io = new IntersectionObserver(([entry]) => {
      const visible = entry.isIntersecting;
      if (visible && !running) {
        running = true;
        raf = requestAnimationFrame(tick);
      } else if (!visible) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(stage);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      io.disconnect();
    };
  }, []);

  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => setActive((a) => (a + 1) % items.length), 3800);
    return () => clearInterval(id);
  }, [items.length]);

  const current = items[active];

  return (
    <div
      ref={stageRef}
      className="relative mx-auto flex h-[560px] w-full max-w-[420px] items-center justify-center [perspective:1400px] sm:h-[620px]"
    >
      {/* glow */}
      <div className="absolute h-72 w-72 rounded-full bg-neon/35 blur-[90px]" />
      <div className="absolute -bottom-2 h-40 w-64 rounded-full bg-aqua/20 blur-[80px]" />
      <div className="absolute h-[22rem] w-[22rem] animate-pulse-ring rounded-full border border-white/5" />

      <div className="animate-float [transform-style:preserve-3d]">
        <div
          ref={phoneRef}
          className="relative h-[500px] w-[244px] [transform-style:preserve-3d] [transform:rotateX(-12deg)_rotateY(18deg)] sm:h-[540px] sm:w-[264px]"
          style={{ ["--gx" as string]: "50%", ["--gy" as string]: "50%" }}
        >
          {/* body */}
          <div className="absolute inset-0 rounded-[2.9rem] bg-gradient-to-br from-[#3a3f5c] via-[#14172a] to-[#05060b] p-[3px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.12)_inset]">
            <div className="relative h-full w-full overflow-hidden rounded-[2.75rem] bg-black p-[9px]">
              {/* screen */}
              <div className="relative h-full w-full overflow-hidden rounded-[2.2rem] bg-gradient-to-b from-[#1b1450] via-[#0e1030] to-[#06121f]">
                {/* wallpaper blobs */}
                <div className="absolute -top-10 start-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-neon/60 blur-3xl" />
                <div className="absolute bottom-10 end-0 h-40 w-40 rounded-full bg-aqua/40 blur-3xl" />

                {/* dynamic island */}
                <div className="absolute start-1/2 top-2.5 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />

                <div className="relative z-10 flex h-full flex-col px-4 pb-5 pt-10 text-white" dir="rtl">
                  <div className="flex items-center justify-between text-[10px] text-white/70" dir="ltr">
                    <span>9:41</span>
                    <span>5G ▮▮▮</span>
                  </div>

                  <div className="mt-3 text-center" dir="ltr">
                    <div className="text-5xl font-extralight tracking-tight">9:41</div>
                    <div className="mt-1 text-[11px] text-white/60">متجر الأجهزة الذكية</div>
                  </div>

                  <div className="mt-auto">
                    {current ? (
                      <div key={active} className="reveal rounded-3xl border border-white/15 bg-white/10 p-3 backdrop-blur-xl">
                        <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-2xl bg-black/30">
                          {current.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={current.image} alt={current.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="grid h-full place-items-center text-4xl">📱</div>
                          )}
                        </div>
                        <p className="line-clamp-1 text-xs font-bold" dir="auto">{current.name}</p>
                        <p className="mt-1 text-sm font-extrabold text-aqua">{current.price}</p>
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-white/15 bg-white/10 p-4 text-center text-xs text-white/70 backdrop-blur-xl">
                        أحدث الأجهزة تصلك هنا
                      </div>
                    )}
                    {items.length > 1 && (
                      <div className="mt-3 flex justify-center gap-1.5">
                        {items.map((_, i) => (
                          <span
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-500 ${i === active ? "w-5 bg-white" : "w-1.5 bg-white/30"}`}
                          />
                        ))}
                      </div>
                    )}
                    <div className="mx-auto mt-3 h-1 w-24 rounded-full bg-white/50" />
                  </div>
                </div>

                {/* glare that follows tilt */}
                <div
                  className="pointer-events-none absolute inset-0 z-30 opacity-70 mix-blend-overlay"
                  style={{
                    background:
                      "radial-gradient(circle at var(--gx) var(--gy), rgba(255,255,255,0.45), transparent 55%)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* side buttons */}
          <span className="absolute -end-[3px] top-28 h-14 w-[3px] rounded bg-white/25" />
          <span className="absolute -start-[3px] top-24 h-8 w-[3px] rounded bg-white/25" />
          <span className="absolute -start-[3px] top-36 h-12 w-[3px] rounded bg-white/25" />

          {/* floating chips (depth) */}
          <div className="glass absolute -start-10 top-24 flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold text-white [transform:translateZ(70px)] sm:-start-14">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />
            متوفر الآن
          </div>
          <div className="glass absolute -end-8 bottom-32 rounded-2xl px-3 py-2 text-xs font-bold text-aqua [transform:translateZ(90px)] sm:-end-12">
            ⚡ حجز بدقيقة
          </div>
          <div className="glass absolute -start-6 bottom-12 rounded-2xl px-3 py-2 text-xs font-bold text-white [transform:translateZ(50px)]">
            د.ع <span className="text-white/50">· أسعار واضحة</span>
          </div>
        </div>
      </div>
    </div>
  );
}
