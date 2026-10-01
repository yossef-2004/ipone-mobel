"use client";

import { useState } from "react";
import { thumbUrl } from "@/lib/image-url";
import type { ProductImageDTO } from "@/types";
import { PhoneFallback } from "./PhoneFallback";

export function ProductGallery({ images, name, available }: { images: ProductImageDTO[]; name: string; available: boolean }) {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const current = images[index];

  return (
    <div className="space-y-3">
      <div className="glass relative aspect-square overflow-hidden rounded-3xl">
        {current ? (
          <>
            {!loaded[current.id] && <div className="skeleton absolute inset-0 rounded-none" />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={current.id}
              src={current.url}
              alt={`${name} - صورة ${index + 1}`}
              onLoad={() => setLoaded((l) => ({ ...l, [current.id]: true }))}
              decoding="async"
              className={`reveal h-full w-full object-cover ${available ? "" : "opacity-60 grayscale"}`}
            />
          </>
        ) : (
          <PhoneFallback />
        )}
        {!available && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 text-center text-sm font-bold text-rose-300">
            غير متوفر حالياً
          </div>
        )}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setIndex((i) => (i + 1) % images.length)}
              className="absolute start-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
              aria-label="الصورة التالية"
            >
              ‹
            </button>
            <button
              onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
              className="absolute end-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
              aria-label="الصورة السابقة"
            >
              ›
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setIndex(i)}
              className={`aspect-square overflow-hidden rounded-xl border-2 transition ${i === index ? "border-neon" : "border-transparent opacity-60 hover:opacity-100"}`}
              aria-label={`عرض الصورة ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbUrl(img.url)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
