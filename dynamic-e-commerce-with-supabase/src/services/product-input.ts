import { HttpError } from "@/lib/auth";
import { bool, price, specs, str } from "@/lib/validation";
import type { ProductInput } from "@/services/products";

const has = (b: Record<string, unknown>, k: string) => Object.prototype.hasOwnProperty.call(b, k);

function categoryId(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v !== "string" || !/^[0-9a-f-]{36}$/i.test(v)) throw new HttpError(400, "القسم غير صالح");
  return v;
}

export function parseCreateProduct(b: Record<string, unknown>): ProductInput {
  return {
    name: str(b.name, "اسم الجهاز", { min: 2, max: 200 }),
    brand: str(b.brand, "الشركة", { required: false, max: 80 }),
    categoryId: categoryId(b.categoryId),
    description: str(b.description, "الوصف", { required: false, max: 10000 }),
    price: price(b.price, "السعر") as number,
    oldPrice: price(b.oldPrice, "السعر قبل الخصم", { required: false }),
    isAvailable: bool(b.isAvailable, true),
    isVisible: bool(b.isVisible, true),
    isFeatured: bool(b.isFeatured, false),
    specs: specs(b.specs),
  };
}

/** Partial update: only fields present in the body are changed (used by quick toggles too). */
export function parsePatchProduct(b: Record<string, unknown>): Partial<ProductInput> {
  const out: Partial<ProductInput> = {};
  if (has(b, "name")) out.name = str(b.name, "اسم الجهاز", { min: 2, max: 200 });
  if (has(b, "brand")) out.brand = str(b.brand, "الشركة", { required: false, max: 80 });
  if (has(b, "categoryId")) out.categoryId = categoryId(b.categoryId);
  if (has(b, "description")) out.description = str(b.description, "الوصف", { required: false, max: 10000 });
  if (has(b, "price")) out.price = price(b.price, "السعر") as number;
  if (has(b, "oldPrice")) out.oldPrice = price(b.oldPrice, "السعر قبل الخصم", { required: false });
  if (has(b, "isAvailable")) out.isAvailable = bool(b.isAvailable, true);
  if (has(b, "isVisible")) out.isVisible = bool(b.isVisible, true);
  if (has(b, "isFeatured")) out.isFeatured = bool(b.isFeatured, false);
  if (has(b, "specs")) out.specs = specs(b.specs);
  if (!Object.keys(out).length) throw new HttpError(400, "لا توجد حقول للتحديث");
  return out;
}
