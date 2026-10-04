import type { Metadata } from "next";
import Link from "next/link";
import { AvailabilityBadge } from "@/components/store/AvailabilityBadge";
import { OrderForm } from "@/components/store/OrderForm";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductGallery } from "@/components/store/ProductGallery";
import { StoreBackButton } from "@/components/store/StoreBackButton";
import { DbErrorNotice, EmptyState } from "@/components/ui/States";
import { formatIqd } from "@/lib/currency";
import { safe } from "@/lib/safe";
import { getProductBySlug, getRelatedProducts } from "@/services/products";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

const decode = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

export async function generateMetadata({ params }: Ctx): Promise<Metadata> {
  const { slug } = await params;
  const r = await safe(() => getProductBySlug(decode(slug)));
  if (!r.data) return { title: "جهاز", robots: { index: false, follow: false } };
  return { title: r.data.name, description: `${r.data.name} بسعر ${formatIqd(r.data.price)}` };
}

export default async function ProductPage({ params }: Ctx) {
  const { slug } = await params;
  const result = await safe(async () => {
    const product = await getProductBySlug(decode(slug));
    if (!product) return null;
    return { product, related: await getRelatedProducts(product) };
  });

  if (result.failed) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <StoreBackButton fallbackHref="/products" />
        <DbErrorNotice />
      </div>
    );
  }
  if (!result.data) {
    return (
      <div className="mx-auto grid min-h-[70vh] max-w-7xl place-items-center px-4 py-10">
        <div className="w-full">
          <StoreBackButton fallbackHref="/products" />
          <EmptyState
            icon="🧭"
            title="الصفحة غير موجودة"
            description="الرابط الذي تبحث عنه غير صحيح أو أن الجهاز لم يعد معروضاً."
            action={
              <Link href="/products" className="grad-bg mt-2 rounded-full px-6 py-2.5 text-sm font-bold text-white">
                تصفّح الأجهزة
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const { product, related } = result.data;
  const discount =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round((1 - product.price / product.oldPrice) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6">
      <StoreBackButton fallbackHref="/products" />
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs text-white/45" aria-label="مسار التنقل">
        <Link href="/" className="hover:text-white">الرئيسية</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-white">الأجهزة</Link>
        {product.categorySlug && (
          <>
            <span>/</span>
            <Link href={`/products?category=${product.categorySlug}`} className="hover:text-white">{product.categoryName}</Link>
          </>
        )}
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        <ProductGallery images={product.images} name={product.name} available={product.isAvailable} />

        <div className="space-y-6">
          <div className="reveal">
            <div className="flex flex-wrap items-center gap-2">
              {product.brand && (
                <Link href={`/products?brand=${encodeURIComponent(product.brand)}`} className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-aqua transition hover:bg-white/8">
                  {product.brand}
                </Link>
              )}
              <AvailabilityBadge available={product.isAvailable} />
            </div>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight text-white sm:text-4xl" dir="auto">{product.name}</h1>
            <div className="mt-5 flex flex-wrap items-end gap-x-4 gap-y-1">
              <span className="text-3xl font-extrabold text-white sm:text-4xl" data-testid="product-price">{formatIqd(product.price)}</span>
              {product.oldPrice && product.oldPrice > product.price && (
                <>
                  <span className="pb-1 text-base text-white/40 line-through">{formatIqd(product.oldPrice)}</span>
                  <span className="mb-1 rounded-full bg-rose/90 px-2.5 py-0.5 text-xs font-bold text-white">وفّر {discount}%</span>
                </>
              )}
            </div>
          </div>

          {product.description && (
            <p className="whitespace-pre-line text-sm leading-8 text-white/65">{product.description}</p>
          )}

          {product.specs.length > 0 && (
            <div className="glass overflow-hidden rounded-3xl">
              <h2 className="border-b border-white/8 px-5 py-3.5 text-sm font-bold text-white">المواصفات</h2>
              <dl className="divide-y divide-white/5">
                {product.specs.map((s, i) => (
                  <div key={i} className="grid grid-cols-[120px_1fr] gap-3 px-5 py-3 text-sm">
                    <dt className="text-white/45">{s.label}</dt>
                    <dd className="text-white/90" dir="auto">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <OrderForm
            productId={product.id}
            productName={product.name}
            price={product.price}
            available={product.isAvailable}
          />
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 text-2xl font-extrabold text-white">قد يعجبك أيضاً</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
