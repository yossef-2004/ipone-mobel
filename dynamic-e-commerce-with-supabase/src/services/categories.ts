import { getSupabaseClient, hasSupabaseConfig } from "@/db";
import { HttpError } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import type { CategoryDTO } from "@/types";

export async function listCategories(opts: { withCounts?: boolean; visibleOnly?: boolean } = {}): Promise<CategoryDTO[]> {
  if (!hasSupabaseConfig) return [];
  const client = await getSupabaseClient();
  let query = client
    .from("categories")
    .select(opts.withCounts ? "id,name,slug,description,sort_order,products(count)" : "id,name,slug,description,sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  const { data, error } = await query;
  if (error) throw new HttpError(503, "تعذّر تحميل الأقسام من Supabase");

  let categories = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    sortOrder: row.sort_order,
    ...(opts.withCounts ? { productCount: row.products?.[0]?.count ?? 0 } : {}),
  })) as CategoryDTO[];

  if (opts.visibleOnly && categories.length) {
    const { data: products, error: productError } = await client
      .from("products")
      .select("category_id")
      .eq("is_visible", true)
      .not("category_id", "is", null);
    if (productError) throw new HttpError(503, "تعذّر تحميل أقسام المنتجات");
    const visibleCategoryIds = new Set((products ?? []).map((product) => product.category_id));
    categories = categories.filter((category) => visibleCategoryIds.has(category.id));
  }
  return categories;
}

async function uniqueSlug(name: string, excludeId?: string): Promise<string> {
  const client = await getSupabaseClient();
  const base = slugify(name) || "category";
  for (let suffix = 1; suffix < 1000; suffix++) {
    const slug = suffix === 1 ? base : `${base}-${suffix}`;
    let query = client.from("categories").select("id").eq("slug", slug);
    if (excludeId) query = query.neq("id", excludeId);
    const { data, error } = await query.maybeSingle();
    if (error) throw new HttpError(503, "تعذّر التحقق من اسم القسم");
    if (!data) return slug;
  }
  throw new HttpError(409, "تعذّر إنشاء رابط فريد للقسم");
}

export async function createCategory(input: { name: string; description?: string; sortOrder?: number }) {
  if (!hasSupabaseConfig) {
    throw new HttpError(503, "Supabase غير مهيأ بعد التعديل.");
  }
  const client = await getSupabaseClient();
  const { data, error } = await client.from("categories").insert({
    name: input.name,
    slug: await uniqueSlug(input.name),
    description: input.description || null,
    sort_order: input.sortOrder ?? 0,
  }).select("id,name,slug,description,sort_order").single();
  if (error) throw new HttpError(error.code === "23505" ? 409 : 503, "تعذّرت إضافة القسم إلى Supabase");
  return { id: data.id, name: data.name, slug: data.slug, description: data.description, sortOrder: data.sort_order };
}

export async function updateCategory(
  id: string,
  input: { name: string; description?: string; sortOrder?: number },
) {
  if (!hasSupabaseConfig) {
    throw new HttpError(503, "Supabase غير مهيأ بعد التعديل.");
  }
  const client = await getSupabaseClient();
  const { data, error } = await client.from("categories").update({
    name: input.name,
    slug: await uniqueSlug(input.name, id),
    description: input.description || null,
    sort_order: input.sortOrder ?? 0,
  }).eq("id", id).select("id,name,slug,description,sort_order").maybeSingle();
  if (error) throw new HttpError(error.code === "23505" ? 409 : 503, "تعذّر تعديل القسم في Supabase");
  if (!data) throw new HttpError(404, "القسم غير موجود");
  return { id: data.id, name: data.name, slug: data.slug, description: data.description, sortOrder: data.sort_order };
}

export async function deleteCategory(id: string) {
  if (!hasSupabaseConfig) {
    throw new HttpError(503, "Supabase غير مهيأ بعد التعديل.");
  }
  const client = await getSupabaseClient();
  const { data, error } = await client.from("categories").delete().eq("id", id).select("id").maybeSingle();
  if (error) throw new HttpError(503, "تعذّر حذف القسم من Supabase");
  if (!data) throw new HttpError(404, "القسم غير موجود");
}
