import { PageHeader } from "@/components/admin/PageHeader";
import { ProductForm } from "@/components/admin/ProductForm";
import { DbErrorNotice } from "@/components/ui/States";
import { safe } from "@/lib/safe";
import { listCategories } from "@/services/categories";
import { listBrands } from "@/services/products";

export default async function NewProductPage() {
  const r = await safe(async () => ({ categories: await listCategories(), brands: await listBrands(false) }));
  return (
    <>
      <PageHeader title="إضافة جهاز" subtitle="سيظهر في المتجر مباشرة بعد الحفظ" />
      {r.data ? <ProductForm categories={r.data.categories} brands={r.data.brands} /> : <DbErrorNotice />}
    </>
  );
}
