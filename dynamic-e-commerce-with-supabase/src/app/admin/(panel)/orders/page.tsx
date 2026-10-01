import Link from "next/link";
import { OrderCard } from "@/components/admin/OrderCard";
import { STATUS_LABELS } from "@/components/admin/OrderStatusBadge";
import { PageHeader } from "@/components/admin/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { DbErrorNotice, EmptyState } from "@/components/ui/States";
import { ORDER_STATUSES } from "@/config/site";
import { safe } from "@/lib/safe";
import { listOrders } from "@/services/orders";
import type { OrderStatus } from "@/types";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const statusParam = one(sp.status);
  const status = ORDER_STATUSES.find((s) => s === statusParam) as OrderStatus | undefined;
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const r = await safe(() => listOrders({ status, page, pageSize: 20 }));

  const tab = (active: boolean) =>
    `whitespace-nowrap rounded-full border px-4 py-1.5 text-xs font-bold transition ${active ? "grad-bg border-transparent text-white" : "border-white/10 text-white/65 hover:bg-white/8"}`;

  return (
    <>
      <PageHeader title="الطلبات" subtitle={r.data ? `${r.data.total} طلب` : undefined} />
      <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">
        <Link href="/admin/orders" className={tab(!status)}>الكل</Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`} className={tab(status === s)}>{STATUS_LABELS[s]}</Link>
        ))}
      </div>

      {!r.data ? (
        <DbErrorNotice />
      ) : r.data.items.length ? (
        <>
          <div className="space-y-4">
            {r.data.items.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
          <Pagination page={r.data.page} totalPages={r.data.totalPages} basePath="/admin/orders" params={{ status }} />
        </>
      ) : (
        <EmptyState icon="🧾" title="لا توجد طلبات" description="ستظهر طلبات الحجز هنا فور وصولها من الزبائن." />
      )}
    </>
  );
}
