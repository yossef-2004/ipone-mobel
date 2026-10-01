import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageManager } from "@/components/admin/ImageManager";
import { PageHeader } from "@/components/admin/PageHeader";
import { ProductForm } from "@/components/admin/ProductForm";
import { DbErrorNotice } from "@/components/ui/States";
import { safe } from "@/lib/safe";
import { listCategories } from "@/services/categories";
import { getProductById, listBrands } from "@/services/products";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const r = await safe(async () => ({
    product: await getProductById(id),
    categories: await listCategories(),
    brands: await listBrands(false),
  }));

  if (!r.data) return <DbErrorNotice />;
  if (!r.data.product) notFound();
  const { product, categories, brands } = r.data;

  return (
    <>
      <PageHeader
        title="تعديل جهاز"
        subtitle={product.name}
        actions={
          <Link href={`/products/${product.slug}`} target="_blank" className="rounded-xl border border-white/12 px-4 py-2 text-sm text-white/80 transition hover:bg-white/8">
            عرض في المتجر ↗
          </Link>
        }
      />
      <div className="space-y-5">
        <ImageManager productId={product.id} images={product.images} />
        <ProductForm categories={categories} brands={brands} product={product} />
      </div>
    </>
  );
}
