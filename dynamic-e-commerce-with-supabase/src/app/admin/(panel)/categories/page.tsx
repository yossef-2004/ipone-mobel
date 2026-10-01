import { CategoryManager } from "@/components/admin/CategoryManager";
import { PageHeader } from "@/components/admin/PageHeader";
import { DbErrorNotice } from "@/components/ui/States";
import { safe } from "@/lib/safe";
import { listCategories } from "@/services/categories";

export default async function AdminCategoriesPage() {
  const r = await safe(() => listCategories({ withCounts: true }));
  return (
    <>
      <PageHeader title="الأقسام" subtitle="نظّم الأجهزة في أقسام تظهر في المتجر" />
      {r.data ? <CategoryManager categories={r.data} /> : <DbErrorNotice />}
    </>
  );
}
