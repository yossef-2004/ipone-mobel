import { and, asc, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { categories, productImages, products, type ProductSpec } from "@/db/schema";
import { HttpError } from "@/lib/auth";
import { randomSuffix, slugify } from "@/lib/slug";
import { removeMedia, storeImage } from "@/services/media";
import type { Paginated, ProductDTO, ProductFilters, ProductImageDTO } from "@/types";

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  description: string;
  price: number;
  oldPrice: number | null;
  isAvailable: boolean;
  isVisible: boolean;
  isFeatured: boolean;
  specs: ProductSpec[];
  createdAt: Date;
};

const productColumns = {
  id: products.id,
  slug: products.slug,
  name: products.name,
  brand: products.brand,
  categoryId: products.categoryId,
  categoryName: categories.name,
  categorySlug: categories.slug,
  description: products.description,
  price: products.price,
  oldPrice: products.oldPrice,
  isAvailable: products.isAvailable,
  isVisible: products.isVisible,
  isFeatured: products.isFeatured,
  specs: products.specs,
  createdAt: products.createdAt,
};

async function attachImages(rows: ProductRow[]): Promise<ProductDTO[]> {
  if (!rows.length) return [];
  const imgs = await db
    .select({ id: productImages.id, productId: productImages.productId, url: productImages.url, sortOrder: productImages.sortOrder })
    .from(productImages)
    .where(inArray(productImages.productId, rows.map((r) => r.id)))
    .orderBy(asc(productImages.sortOrder), asc(productImages.createdAt));
  const byProduct = new Map<string, ProductImageDTO[]>();
  for (const i of imgs) {
    const list = byProduct.get(i.productId) ?? [];
    list.push({ id: i.id, url: i.url, sortOrder: i.sortOrder });
    byProduct.set(i.productId, list);
  }
  return rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    images: byProduct.get(r.id) ?? [],
  }));
}

function escapeLike(s: string) {
  return s.replace(/[\\%_]/g, (m) => `\\${m}`);
}

export async function listProducts(filters: ProductFilters = {}): Promise<Paginated<ProductDTO>> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, filters.pageSize ?? 12));

  const conds: SQL[] = [];
  if (!filters.includeHidden) conds.push(eq(products.isVisible, true));
  if (filters.featuredOnly) conds.push(eq(products.isFeatured, true));
  if (filters.availableOnly) conds.push(eq(products.isAvailable, true));
  if (filters.category) conds.push(eq(categories.slug, filters.category));
  if (filters.brand) conds.push(eq(products.brand, filters.brand));
  if (filters.minPrice !== undefined) conds.push(sql`${products.price} >= ${filters.minPrice}`);
  if (filters.maxPrice !== undefined) conds.push(sql`${products.price} <= ${filters.maxPrice}`);
  if (filters.q?.trim()) {
    const like = `%${escapeLike(filters.q.trim())}%`;
    const c = or(ilike(products.name, like), ilike(products.brand, like), ilike(products.description, like));
    if (c) conds.push(c);
  }
  const where = conds.length ? and(...conds) : undefined;

  const order =
    filters.sort === "price_asc"
      ? [asc(products.price), desc(products.createdAt)]
      : filters.sort === "price_desc"
        ? [desc(products.price), desc(products.createdAt)]
        : [desc(products.createdAt)];

  const [countRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(where);
  const total = countRow?.n ?? 0;

  const rows = await db
    .select(productColumns)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(where)
    .orderBy(...order)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    items: await attachImages(rows),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

async function getOne(where: SQL, includeHidden: boolean): Promise<ProductDTO | null> {
  const rows = await db
    .select(productColumns)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(includeHidden ? where : and(where, eq(products.isVisible, true)))
    .limit(1);
  const [dto] = await attachImages(rows);
  return dto ?? null;
}

export function getProductBySlug(slug: string, includeHidden = false) {
  return getOne(eq(products.slug, slug), includeHidden);
}

export function getProductById(id: string, includeHidden = true) {
  return getOne(eq(products.id, id), includeHidden);
}

export async function listBrands(visibleOnly = true): Promise<string[]> {
  const rows = await db
    .selectDistinct({ brand: products.brand })
    .from(products)
    .where(visibleOnly ? and(eq(products.isVisible, true), sql`${products.brand} <> ''`) : sql`${products.brand} <> ''`)
    .orderBy(asc(products.brand));
  return rows.map((r) => r.brand);
}

export async function getRelatedProducts(product: ProductDTO, limit = 4): Promise<ProductDTO[]> {
  const conds: SQL[] = [eq(products.isVisible, true), sql`${products.id} <> ${product.id}`];
  const sameGroup = product.categoryId
    ? or(eq(products.categoryId, product.categoryId), eq(products.brand, product.brand))
    : eq(products.brand, product.brand);
  if (sameGroup) conds.push(sameGroup);
  const rows = await db
    .select(productColumns)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...conds))
    .orderBy(desc(products.createdAt))
    .limit(limit);
  return attachImages(rows);
}

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

async function uniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name);
  const existing = await db.select({ id: products.id }).from(products).where(eq(products.slug, base)).limit(1);
  if (!existing.length || existing[0].id === excludeId) return base;
  return `${base}-${randomSuffix()}`;
}

export async function createProduct(input: ProductInput) {
  const slug = await uniqueSlug(input.name);
  const [row] = await db.insert(products).values({ ...input, slug }).returning();
  return row;
}

export async function updateProduct(id: string, input: Partial<ProductInput>) {
  const patch: Partial<typeof products.$inferInsert> = { ...input, updatedAt: new Date() };
  const [row] = await db.update(products).set(patch).where(eq(products.id, id)).returning();
  if (!row) throw new HttpError(404, "المنتج غير موجود");
  return row;
}

export async function deleteProduct(id: string) {
  const imgs = await db.select({ mediaId: productImages.mediaId }).from(productImages).where(eq(productImages.productId, id));
  const [row] = await db.delete(products).where(eq(products.id, id)).returning({ id: products.id });
  if (!row) throw new HttpError(404, "المنتج غير موجود");
  await Promise.all(imgs.map((i) => removeMedia(i.mediaId)));
}

async function nextSortOrder(productId: string): Promise<number> {
  const [r] = await db
    .select({ n: sql<number>`coalesce(max(${productImages.sortOrder}), -1) + 1` })
    .from(productImages)
    .where(eq(productImages.productId, productId));
  return Number(r?.n ?? 0);
}

async function assertProduct(productId: string) {
  const [p] = await db.select({ id: products.id }).from(products).where(eq(products.id, productId)).limit(1);
  if (!p) throw new HttpError(404, "المنتج غير موجود");
}

export async function addImageFromFile(productId: string, file: File) {
  await assertProduct(productId);
  const { mediaId, url } = await storeImage(file);
  const [row] = await db
    .insert(productImages)
    .values({ productId, url, mediaId, sortOrder: await nextSortOrder(productId) })
    .returning();
  return row;
}

export async function addImageFromUrl(productId: string, url: string) {
  await assertProduct(productId);
  if (!/^https?:\/\//i.test(url)) throw new HttpError(400, "رابط الصورة يجب أن يبدأ بـ http أو https");
  const [row] = await db
    .insert(productImages)
    .values({ productId, url, sortOrder: await nextSortOrder(productId) })
    .returning();
  return row;
}

export async function deleteImage(productId: string, imageId: string) {
  const [row] = await db
    .delete(productImages)
    .where(and(eq(productImages.id, imageId), eq(productImages.productId, productId)))
    .returning();
  if (!row) throw new HttpError(404, "الصورة غير موجودة");
  await removeMedia(row.mediaId);
}

/** Makes the given image the first (primary) one. */
export async function makeImagePrimary(productId: string, imageId: string) {
  const imgs = await db
    .select({ id: productImages.id })
    .from(productImages)
    .where(eq(productImages.productId, productId))
    .orderBy(asc(productImages.sortOrder), asc(productImages.createdAt));
  const ordered = [imageId, ...imgs.map((i) => i.id).filter((i) => i !== imageId)];
  await Promise.all(
    ordered.map((id, idx) => db.update(productImages).set({ sortOrder: idx }).where(eq(productImages.id, id))),
  );
}

export async function getProductStats() {
  const [r] = await db
    .select({
      total: sql<number>`count(*)::int`,
      hidden: sql<number>`count(*) filter (where not ${products.isVisible})::int`,
      unavailable: sql<number>`count(*) filter (where not ${products.isAvailable})::int`,
    })
    .from(products);
  return r ?? { total: 0, hidden: 0, unavailable: 0 };
}
