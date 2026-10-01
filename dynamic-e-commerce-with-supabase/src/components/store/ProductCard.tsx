import Link from "next/link";
import { formatIqd } from "@/lib/currency";
import { thumbUrl } from "@/lib/image-url";
import type { ProductDTO } from "@/types";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { PhoneFallback } from "./PhoneFallback";

export function ProductCard({ product, index = 0 }: { product: ProductDTO; index?: number }) {
  const image = product.images[0];
  const discount =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round((1 - product.price / product.oldPrice) * 100)
      : 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="reveal group glass relative flex flex-col overflow-hidden rounded-3xl p-2.5 transition duration-300 hover:-translate-y-1.5 hover:border-neon/50 hover:shadow-[0_20px_60px_-20px_rgba(124,92,255,0.55)] sm:p-3"
      style={{ animationDelay: `${Math.min(index, 12) * 50}ms` }}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-ink-2">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl(image.url)}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${product.isAvailable ? "" : "opacity-50 grayscale"}`}
          />
        ) : (
          <PhoneFallback />
        )}
        <div className="absolute start-2 top-2 flex flex-col items-start gap-1.5">
          <AvailabilityBadge available={product.isAvailable} compact />
          {discount > 0 && (
            <span className="rounded-full bg-rose/90 px-2 py-0.5 text-[11px] font-bold text-white">-{discount}%</span>
          )}
        </div>
        {product.isFeatured && (
          <span className="absolute end-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[11px] text-amber-300 backdrop-blur">
            ★ مميز
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 px-1.5 pb-1.5 pt-3.5">
        <span className="text-xs font-medium text-aqua/80">{product.brand || product.categoryName || "موبايل"}</span>
        <h3 className="line-clamp-2 min-h-[2.8rem] text-[15px] font-bold leading-snug text-white" dir="auto">
          {product.name}
        </h3>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-x-2">
          <div className="flex flex-col">
            <span className="text-base font-extrabold text-white sm:text-lg">{formatIqd(product.price)}</span>
            {product.oldPrice && product.oldPrice > product.price && (
              <span className="text-xs text-white/40 line-through">{formatIqd(product.oldPrice)}</span>
            )}
          </div>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/8 text-white transition group-hover:bg-neon group-hover:text-white rtl:group-hover:-translate-x-1">
            ←
          </span>
        </div>
      </div>
    </Link>
  );
}
