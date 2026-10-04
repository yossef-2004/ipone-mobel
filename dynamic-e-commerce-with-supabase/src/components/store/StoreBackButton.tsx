"use client";

import { useRouter } from "next/navigation";

const historyEntryKey = "__storeNavigation";

export function StoreBackButton({ fallbackHref }: { fallbackHref: string }) {
  const router = useRouter();

  function goBack() {
    const state: unknown = window.history.state;
    const entry =
      state && typeof state === "object"
        ? (state as Record<string, unknown>)[historyEntryKey]
        : undefined;
    const previousUrl =
      entry && typeof entry === "object"
        ? (entry as Record<string, unknown>).previousUrl
        : undefined;

    if (
      typeof previousUrl === "string" &&
      previousUrl.startsWith("/") &&
      !previousUrl.startsWith("//")
    ) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/80 transition hover:border-aqua/40 hover:bg-white/10 hover:text-white"
    >
      <span aria-hidden="true">→</span>
      رجوع
    </button>
  );
}
