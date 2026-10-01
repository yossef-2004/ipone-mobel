import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { DbErrorNotice } from "@/components/ui/States";
import { formatIqd } from "@/lib/currency";
import { safe } from "@/lib/safe";
import { getOrderStats, listOrders } from "@/services/orders";
import { getProductStats } from "@/services/products";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { formatDateTime } from "@/lib/date";

export default async function AdminDashboard() {
  const r = await safe(async () => {
    const [products, orders, recent] = await Promise.all([
      getProductStats(),
      getOrderStats(),
      listOrders({ pageSize: 5 }),
    ]);
    return { products, orders, recent };
  });

  if (!r.data) {
    return (
      <>
        <PageHeader title="نظرة عامة" />
        <DbErrorNotice />
      </>
    );
  }
  const { products, orders, recent } = r.data;

  const cards = [
    { label: "طلبات جديدة", value: String(orders.newCount), tone: "text-aqua", href: "/admin/orders?status=new" },
    { label: "قيد المعالجة", value: String(orders.preparing), tone: "text-amber-300", href: "/admin/orders" },
    { label: "إجمالي الطلبات", value: String(orders.total), tone: "text-white", href: "/admin/orders" },
    { label: "مبيعات مسلّمة", value: formatIqd(orders.revenue), tone: "text-emerald-300", href: "/admin/orders?status=delivered" },
    { label: "المنتجات", value: String(products.total), tone: "text-white", href: "/admin/products" },
    { label: "غير متوفر / مخفي", value: `${products.unavailable} / ${products.hidden}`, tone: "text-rose-300", href: "/admin/products" },
  ];

  return (
    <>
      <PageHeader
        title="نظرة عامة"
        subtitle="ملخص سريع لحالة المتجر"
        actions={
          <Link href="/admin/products/new" className="grad-bg rounded-xl px-5 py-2.5 text-sm font-bold text-white">+ إضافة جهاز</Link>
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="glass rounded-2xl p-4 transition hover:border-white/25 sm:p-5">
            <p className="text-xs text-white/45">{c.label}</p>
            <p className={`mt-2 text-xl font-extrabold sm:text-2xl ${c.tone}`}>{c.value}</p>
          </Link>
        ))}
      </div>

      <h2 className="mb-3 mt-10 text-lg font-extrabold text-white">آخر الطلبات</h2>
      {recent.items.length ? (
        <div className="glass divide-y divide-white/5 overflow-hidden rounded-2xl">
          {recent.items.map((o) => (
            <Link key={o.id} href="/admin/orders" className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-sm transition hover:bg-white/[0.04]">
              <div className="min-w-0">
                <p className="font-bold text-white">#{o.orderNumber} · {o.customerName}</p>
                <p className="truncate text-xs text-white/45" dir="auto">{o.items.map((i) => `${i.productName} ×${i.quantity}`).join("، ")}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/40">{formatDateTime(o.createdAt)}</span>
                <span className="font-bold text-white">{formatIqd(o.total)}</span>
                <OrderStatusBadge status={o.status} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="glass rounded-2xl p-8 text-center text-sm text-white/50">لا توجد طلبات بعد.</p>
      )}
    </>
  );
}
