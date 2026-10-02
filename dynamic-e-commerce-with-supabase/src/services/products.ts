import { getSupabaseClient, hasSupabaseConfig } from "@/db";
import { HttpError } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { removeMedia, storeImage } from "@/services/media";
import type { Paginated, ProductDTO, ProductFilters, ProductSpec } from "@/types";

export type ProductInput = {
  name: string;
  brand: string;
  categoryId: string | null;
  description: string;
  price: number;
  oldPrice: number | null;
  isAvailable: boolean;
  isVisible: boolean;
  isFeatured: boolean;
  specs: ProductSpec[];
};

const PRODUCT_SELECT = "*,category:categories(id,name,slug),images:product_images(id,url,sort_order)";

function toProductDTO(row: any): ProductDTO {
  const category = Array.isArray(row.category) ? row.category[0] : row.category;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    categoryId: row.category_id,
    categoryName: category?.name ?? null,
    categorySlug: category?.slug ?? null,
    description: row.description,
    price: Number(row.price),
    oldPrice: row.old_price === null ? null : Number(row.old_price),
    isAvailable: row.is_available,
    isVisible: row.is_visible,
    isFeatured: row.is_featured,
    specs: Array.isArray(row.specs) ? row.specs : [],
    images: (row.images ?? [])
      .map((image: any) => ({ id: image.id, url: image.url, sortOrder: image.sort_order }))
      .sort((a: { sortOrder: number }, b: { sortOrder: number }) => a.sortOrder - b.sortOrder),
    createdAt: row.created_at,
  };
}

export async function listProducts(filters: ProductFilters = {}): Promise<Paginated<ProductDTO>> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, filters.pageSize ?? 12));
  if (!hasSupabaseConfig) return { items: [], total: 0, page, pageSize, totalPages: 1 };
  const client = await getSupabaseClient();
  let query = client.from("products").select(PRODUCT_SELECT, { count: "exact" });
  if (!filters.includeHidden) query = query.eq("is_visible", true);
  if (filters.availableOnly) query = query.eq("is_available", true);
  if (filters.featuredOnly) query = query.eq("is_featured", true);
  if (filters.brand) query = query.eq("brand", filters.brand);
  if (filters.minPrice !== undefined) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice !== undefined) query = query.lte("price", filters.maxPrice);
  if (filters.category) {
    const { data: category, error: categoryError } = await client
      .from("categories")
      .select("id")
      .eq("slug", filters.category)
      .maybeSingle();
    if (categoryError) throw new HttpError(503, "تعذّر تحميل القسم");
    if (!category) return { items: [], total: 0, page, pageSize, totalPages: 1 };
    query = query.eq("category_id", category.id);
  }
  const search = filters.q?.trim().slice(0, 100).replace(/[%,()]/g, " ");
  if (search) query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%,slug.ilike.%${search}%`);

  const sort = filters.sort ?? "newest";
  if (sort === "price_asc") query = query.order("price", { ascending: true });
  else if (sort === "price_desc") query = query.order("price", { ascending: false });
  else query = query.order("created_at", { ascending: false });
  const from = (page - 1) * pageSize;
  const { data, count, error } = await query.range(from, from + pageSize - 1);
  if (error) throw new HttpError(503, "تعذّر تحميل المنتجات من Supabase");
  const total = count ?? 0;
  return {
    items: (data ?? []).map(toProductDTO),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getProductBySlug(slug: string, includeHidden = false): Promise<ProductDTO | null> {
  if (!hasSupabaseConfig) return null;
  const client = await getSupabaseClient();
  let query = client.from("products").select(PRODUCT_SELECT).eq("slug", slug);
  if (!includeHidden) query = query.eq("is_visible", true);
  const { data, error } = await query.maybeSingle();
  if (error) throw new HttpError(503, "تعذّر تحميل المنتج من Supabase");
  return data ? toProductDTO(data) : null;
}

export async function getProductById(id: string, includeHidden = true): Promise<ProductDTO | null> {
  if (!hasSupabaseConfig) return null;
  const client = await getSupabaseClient();
  let query = client.from("products").select(PRODUCT_SELECT).eq("id", id);
  if (!includeHidden) query = query.eq("is_visible", true);
  const { data, error } = await query.maybeSingle();
  if (error) throw new HttpError(503, "تعذّر تحميل المنتج من Supabase");
  return data ? toProductDTO(data) : null;
}

export async function listBrands(visibleOnly = true): Promise<string[]> {
  if (!hasSupabaseConfig) return [];
  const client = await getSupabaseClient();
  let query = client.from("products").select("brand").neq("brand", "");
  if (visibleOnly) query = query.eq("is_visible", true);
  const { data, error } = await query.order("brand", { ascending: true });
  if (error) throw new HttpError(503, "تعذّر تحميل الشركات");
  return [...new Set((data ?? []).map((row) => row.brand as string))];
}

export async function getRelatedProducts(product: ProductDTO, limit = 4): Promise<ProductDTO[]> {
  if (!hasSupabaseConfig) return [];
  const client = await getSupabaseClient();
  let query = client.from("products").select(PRODUCT_SELECT).eq("is_visible", true).neq("id", product.id);
  if (product.categoryId) query = query.eq("category_id", product.categoryId);
  const { data, error } = await query.order("created_at", { ascending: false }).limit(Math.max(1, Math.min(limit, 12)));
  if (error) throw new HttpError(503, "تعذّر تحميل المنتجات المشابهة");
  return (data ?? []).map(toProductDTO);
}

async function uniqueSlug(name: string, excludeId?: string): Promise<string> {
  const client = await getSupabaseClient();
  const base = slugify(name) || "product";
  for (let suffix = 1; suffix < 1000; suffix++) {
    const slug = suffix === 1 ? base : `${base}-${suffix}`;
    let query = client.from("products").select("id").eq("slug", slug);
    if (excludeId) query = query.neq("id", excludeId);
    const { data, error } = await query.maybeSingle();
    if (error) throw new HttpError(503, "تعذّر التحقق من اسم المنتج");
    if (!data) return slug;
  }
  throw new HttpError(409, "تعذّر إنشاء رابط فريد للمنتج");
}

async function removeMediaIfUnused(mediaId: string | null) {
  if (!mediaId) return;
  const client = await getSupabaseClient();
  const { data, error } = await client.from("product_images").select("id").eq("media_id", mediaId).limit(1);
  if (error) throw new HttpError(503, "تعذّر التحقق من استخدام الصورة");
  if (!data?.length) await removeMedia(mediaId);
}

export async function createProduct(input: ProductInput) {
  if (!hasSupabaseConfig) {
    throw new HttpError(503, "Supabase غير مهيأ بعد التعديل.");
  }
  const client = await getSupabaseClient();
  const { data, error } = await client.from("products").insert({
    slug: await uniqueSlug(input.name),
    name: input.name,
    brand: input.brand,
    category_id: input.categoryId,
    description: input.description,
    price: input.price,
    old_price: input.oldPrice,
    is_available: input.isAvailable,
    is_visible: input.isVisible,
    is_featured: input.isFeatured,
    specs: input.specs,
  }).select("id,slug").single();
  if (error) throw new HttpError(error.code === "23505" ? 409 : 503, "تعذّرت إضافة المنتج إلى Supabase");
  return { id: data.id, slug: data.slug, ...input };
}

export async function updateProduct(id: string, input: Partial<ProductInput>) {
  if (!hasSupabaseConfig) {
    throw new HttpError(503, "Supabase غير مهيأ بعد التعديل.");
  }
  const client = await getSupabaseClient();
  const values: Record<string, unknown> = {};
  if (input.name !== undefined) {
    values.name = input.name;
    values.slug = await uniqueSlug(input.name, id);
  }
  if (input.brand !== undefined) values.brand = input.brand;
  if (input.categoryId !== undefined) values.category_id = input.categoryId;
  if (input.description !== undefined) values.description = input.description;
  if (input.price !== undefined) values.price = input.price;
  if (input.oldPrice !== undefined) values.old_price = input.oldPrice;
  if (input.isAvailable !== undefined) values.is_available = input.isAvailable;
  if (input.isVisible !== undefined) values.is_visible = input.isVisible;
  if (input.isFeatured !== undefined) values.is_featured = input.isFeatured;
  if (input.specs !== undefined) values.specs = input.specs;
  const { data, error } = await client.from("products").update(values).eq("id", id).select("id,slug").maybeSingle();
  if (error) throw new HttpError(error.code === "23505" ? 409 : 503, "تعذّر تعديل المنتج في Supabase");
  if (!data) throw new HttpError(404, "المنتج غير موجود");
  return { id: data.id, slug: data.slug, ...input };
}

export async function deleteProduct(id: string) {
  if (!hasSupabaseConfig) {
    throw new HttpError(503, "Supabase غير مهيأ بعد التعديل.");
  }
  const client = await getSupabaseClient();
  const { data: images, error: imagesError } = await client.from("product_images").select("media_id").eq("product_id", id);
  if (imagesError) throw new HttpError(503, "تعذّر تحميل صور المنتج قبل حذفه");
  const { data, error } = await client.from("products").delete().eq("id", id).select("id").maybeSingle();
  if (error) throw new HttpError(503, "تعذّر حذف المنتج من Supabase");
  if (!data) throw new HttpError(404, "المنتج غير موجود");
  for (const image of images ?? []) await removeMediaIfUnused(image.media_id);
}

export async function addImageFromFile(productId: string, file: File) {
  const image = await storeImage(file);
  const client = await getSupabaseClient();
  const { data: existing, error: listError } = await client.from("product_images").select("sort_order").eq("product_id", productId);
  if (listError) {
    await removeMedia(image.mediaId);
    throw new HttpError(503, "تعذّر تحميل صور المنتج");
  }
  const sortOrder = Math.max(-1, ...(existing ?? []).map((row) => row.sort_order)) + 1;
  const { data, error } = await client.from("product_images").insert({
    product_id: productId,
    url: image.url,
    media_id: image.mediaId,
    sort_order: sortOrder,
  }).select("id,product_id,url,sort_order").single();
  if (error) {
    await removeMedia(image.mediaId);
    throw new HttpError(503, "تعذّر ربط الصورة بالمنتج");
  }
  return { id: data.id, productId: data.product_id, url: data.url, sortOrder: data.sort_order };
}

export async function addImageFromUrl(productId: string, url: string) {
  if (!/^https?:\/\//i.test(url) && !url.startsWith("/")) throw new HttpError(400, "رابط الصورة غير صالح");
  const client = await getSupabaseClient();
  const { data: existing, error: listError } = await client.from("product_images").select("sort_order").eq("product_id", productId);
  if (listError) throw new HttpError(503, "تعذّر تحميل صور المنتج");
  const sortOrder = Math.max(-1, ...(existing ?? []).map((row) => row.sort_order)) + 1;
  const { data, error } = await client.from("product_images").insert({ product_id: productId, url, sort_order: sortOrder })
    .select("id,product_id,url,sort_order").single();
  if (error) throw new HttpError(503, "تعذّرت إضافة رابط الصورة");
  return { id: data.id, productId: data.product_id, url: data.url, sortOrder: data.sort_order };
}

export async function deleteImage(productId: string, imageId: string) {
  const client = await getSupabaseClient();
  const { data: image, error: getError } = await client.from("product_images").select("id,media_id")
    .eq("id", imageId).eq("product_id", productId).maybeSingle();
  if (getError) throw new HttpError(503, "تعذّر تحميل الصورة");
  if (!image) throw new HttpError(404, "الصورة غير موجودة");
  const { error } = await client.from("product_images").delete().eq("id", imageId).eq("product_id", productId);
  if (error) throw new HttpError(503, "تعذّر حذف الصورة");
  await removeMediaIfUnused(image.media_id);
}

export async function makeImagePrimary(productId: string, imageId: string) {
  const client = await getSupabaseClient();
  const { data, error } = await client.from("product_images").select("id,sort_order")
    .eq("product_id", productId).order("sort_order", { ascending: true });
  if (error) throw new HttpError(503, "تعذّر تحميل صور المنتج");
  const images = data ?? [];
  const selected = images.find((image) => image.id === imageId);
  if (!selected) throw new HttpError(404, "الصورة غير موجودة");
  const ordered = [selected, ...images.filter((image) => image.id !== imageId)];
  for (const [sortOrder, image] of ordered.entries()) {
    if (image.sort_order === sortOrder) continue;
    const { error: updateError } = await client.from("product_images").update({ sort_order: sortOrder }).eq("id", image.id);
    if (updateError) throw new HttpError(503, "تعذّر ترتيب الصور");
  }
}

export async function getProductStats() {
  if (!hasSupabaseConfig) return { total: 0, hidden: 0, unavailable: 0 };
  const client = await getSupabaseClient();
  const [total, hidden, unavailable] = await Promise.all([
    client.from("products").select("id", { count: "exact", head: true }),
    client.from("products").select("id", { count: "exact", head: true }).eq("is_visible", false),
    client.from("products").select("id", { count: "exact", head: true }).eq("is_available", false),
  ]);
  if (total.error || hidden.error || unavailable.error) throw new HttpError(503, "تعذّر تحميل إحصاءات المنتجات");
  return { total: total.count ?? 0, hidden: hidden.count ?? 0, unavailable: unavailable.count ?? 0 };
}
