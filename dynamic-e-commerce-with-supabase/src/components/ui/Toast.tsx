"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; kind: ToastKind; message: string };

type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

const styles: Record<ToastKind, string> = {
  success: "border-emerald-400/40 bg-emerald-500/15 text-emerald-100",
  error: "border-rose-400/40 bg-rose-500/15 text-rose-100",
  info: "border-sky-400/40 bg-sky-500/15 text-sky-100",
};
const icons: Record<ToastKind, string> = { success: "✓", error: "!", info: "i" };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev.slice(-3), { id, kind, message }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), kind === "error" ? 6000 : 3800);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`reveal pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl ${styles[t.kind]}`}
          >
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/15 text-xs font-bold">
              {icons[t.kind]}
            </span>
            <p className="leading-6">{t.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
