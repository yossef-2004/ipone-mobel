import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { ProductRow } from "@/components/admin/ProductRow";
import { Pagination } from "@/components/ui/Pagination";
import { DbErrorNotice, EmptyState } from "@/components/ui/States";
import { safe } from "@/lib/safe";
import { listCategories } from "@/services/categories";
import { listProducts } from "@/services/products";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = one(sp.q)?.slice(0, 100);
  const category = one(sp.category);
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const r = await safe(async () => {
    const [list, categories] = await Promise.all([
      listProducts({ q, category, page, pageSize: 20, includeHidden: true }),
      listCategories(),
    ]);
    return { list, categories };
  });

  return (
    <>
      <PageHeader
        title="المنتجات"
        subtitle={r.data ? `${r.data.list.total} جهاز` : undefined}
        actions={<Link href="/admin/products/new" className="grad-bg rounded-xl px-5 py-2.5 text-sm font-bold text-white">+ إضافة جهاز</Link>}
      />
      <form className="mb-5 flex gap-2" action="/admin/products">
        <input name="q" defaultValue={q} placeholder="ابحث في المنتجات…" className="input-base max-w-sm" />
        <select name="category" defaultValue={category ?? ""} className="input-base max-w-xs">
          <option value="">كل الأقسام</option>
          {r.data?.categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
        </select>
        <button className="rounded-xl border border-white/12 px-5 text-sm text-white transition hover:bg-white/10">بحث</button>
      </form>

      {!r.data ? (
        <DbErrorNotice />
      ) : r.data.list.items.length ? (
        <>
          <div className="space-y-3">
            {r.data.list.items.map((p) => (
              <ProductRow key={p.id} product={p} categories={r.data.categories} />
            ))}
          </div>
          <Pagination page={r.data.list.page} totalPages={r.data.list.totalPages} basePath="/admin/products" params={{ q, category }} />
        </>
      ) : (
        <EmptyState
          title={q || category ? "لا توجد نتائج" : "لا توجد منتجات بعد"}
          description="أضف أول جهاز ليظهر في المتجر مباشرة."
          action={<Link href="/admin/products/new" className="grad-bg mt-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white">+ إضافة جهاز</Link>}
        />
      )}
    </>
  );
}
