import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductFilters } from "@/components/store/ProductFilters";
import { ProductCard } from "@/components/store/ProductCard";
import { Pagination } from "@/components/ui/Pagination";
import { DbErrorNotice, EmptyState } from "@/components/ui/States";
import { siteConfig } from "@/config/site";
import { safe } from "@/lib/safe";
import { listCategories } from "@/services/categories";
import { listBrands, listProducts } from "@/services/products";
import type { ProductSort } from "@/types";
import { SortSelect } from "./SortSelect";

export const metadata: Metadata = { title: "كل الأجهزة" };
export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const num = (v: string | undefined) => {
  if (!v || !/^\d+$/.test(v)) return undefined;
  const n = Number(v);
  return Number.isSafeInteger(n) ? n : undefined;
};

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = one(sp.q)?.slice(0, 100);
  const category = one(sp.category);
  const brand = one(sp.brand);
  const available = one(sp.available) === "1";
  const min = one(sp.min);
  const max = one(sp.max);
  const sortRaw = one(sp.sort);
  const sort: ProductSort = sortRaw === "price_asc" || sortRaw === "price_desc" ? sortRaw : "newest";
  const page = Math.max(1, num(one(sp.page)) ?? 1);

  const result = await safe(async () => {
    const [list, categories, brands] = await Promise.all([
      listProducts({
        q,
        category,
        brand,
        availableOnly: available,
        minPrice: num(min),
        maxPrice: num(max),
        sort,
        page,
        pageSize: siteConfig.pageSize,
      }),
      listCategories({ visibleOnly: true }),
      listBrands(),
    ]);
    return { list, categories, brands };
  });

  const data = result.data;
  const hasFilters = Boolean(q || category || brand || available || min || max);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6">
      <div className="mb-8">
        <p className="mb-2 text-xs font-bold tracking-widest text-aqua">المتجر</p>
        <h1 className="text-3xl font-extrabold text-white sm:text-4xl">كل الأجهزة</h1>
      </div>

      {!data ? (
        <DbErrorNotice />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Suspense fallback={<div className="skeleton h-40" />}>
              <ProductFilters categories={data.categories} brands={data.brands} />
            </Suspense>
          </aside>

          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-white/55">
                {data.list.total} {data.list.total === 1 ? "جهاز" : "جهاز"}
                {q && <> لنتائج «{q}»</>}
              </p>
              <Suspense fallback={null}>
                <SortSelect value={sort} />
              </Suspense>
            </div>

            {data.list.items.length ? (
              <>
                <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                  {data.list.items.map((p, i) => (
                    <ProductCard key={p.id} product={p} index={i} />
                  ))}
                </div>
                <Pagination
                  page={data.list.page}
                  totalPages={data.list.totalPages}
                  basePath="/products"
                  params={{ q, category, brand, available: available ? "1" : undefined, min, max, sort: sort === "newest" ? undefined : sort }}
                />
              </>
            ) : (
              <EmptyState
                icon="🔍"
                title={hasFilters ? "لا توجد نتائج مطابقة" : "لا توجد أجهزة حالياً"}
                description={
                  hasFilters ? "جرّب تغيير كلمات البحث أو إزالة بعض الفلاتر." : "سيتم عرض الأجهزة هنا فور إضافتها."
                }
                action={
                  hasFilters ? (
                    <Link href="/products" className="mt-2 rounded-xl border border-white/15 px-4 py-2 text-sm text-white transition hover:bg-white/10">
                      مسح الفلاتر
                    </Link>
                  ) : undefined
                }
              />
            )}
          </section>
        </div>
      )}
    </div>
  );
}
