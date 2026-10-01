import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { HttpError } from "@/lib/auth";
import { randomSuffix, slugify } from "@/lib/slug";
import type { CategoryDTO } from "@/types";

export async function listCategories(opts: { withCounts?: boolean; visibleOnly?: boolean } = {}): Promise<CategoryDTO[]> {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      sortOrder: categories.sortOrder,
      productCount: sql<number>`count(${products.id}) filter (where ${opts.visibleOnly ? sql`${products.isVisible}` : sql`true`})::int`,
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
  return opts.withCounts ? rows : rows.map(({ productCount: _pc, ...rest }) => rest);
}

async function uniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name);
  const existing = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, base)).limit(1);
  if (!existing.length || existing[0].id === excludeId) return base;
  return `${base}-${randomSuffix()}`;
}

export async function createCategory(input: { name: string; description?: string; sortOrder?: number }) {
  const slug = await uniqueSlug(input.name);
  const [row] = await db
    .insert(categories)
    .values({ name: input.name, slug, description: input.description || null, sortOrder: input.sortOrder ?? 0 })
    .returning();
  return row;
}

export async function updateCategory(
  id: string,
  input: { name: string; description?: string; sortOrder?: number },
) {
  const slug = await uniqueSlug(input.name, id);
  const [row] = await db
    .update(categories)
    .set({ name: input.name, slug, description: input.description || null, sortOrder: input.sortOrder ?? 0 })
    .where(eq(categories.id, id))
    .returning();
  if (!row) throw new HttpError(404, "القسم غير موجود");
  return row;
}

/** Products of a deleted category are kept (category_id → NULL). */
export async function deleteCategory(id: string) {
  const [row] = await db.delete(categories).where(eq(categories.id, id)).returning({ id: categories.id });
  if (!row) throw new HttpError(404, "القسم غير موجود");
}
