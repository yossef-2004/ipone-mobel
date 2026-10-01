"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={value}
      aria-label="ترتيب"
      disabled={pending}
      onChange={(e) => {
        const next = new URLSearchParams(params.toString());
        if (e.target.value === "newest") next.delete("sort");
        else next.set("sort", e.target.value);
        next.delete("page");
        startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
      }}
      className="input-base !w-auto !rounded-full !py-2 text-sm"
    >
      <option value="newest">الأحدث</option>
      <option value="price_asc">السعر: من الأقل</option>
      <option value="price_desc">السعر: من الأعلى</option>
    </select>
  );
}
