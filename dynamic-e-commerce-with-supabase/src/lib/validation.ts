import { HttpError } from "@/lib/auth";
import type { ProductSpec } from "@/types";

export function str(v: unknown, label: string, opts: { min?: number; max?: number; required?: boolean } = {}): string {
  const { min = 0, max = 5000, required = true } = opts;
  const s = typeof v === "string" ? v.trim() : "";
  if (!s && !required) return "";
  if (s.length < Math.max(min, required ? 1 : 0)) {
    throw new HttpError(400, `الحقل «${label}» مطلوب${min > 1 ? ` (${min} أحرف على الأقل)` : ""}`);
  }
  if (s.length > max) throw new HttpError(400, `الحقل «${label}» طويل جداً`);
  return s;
}

/** Whole-number price. Intentionally NO maximum — only requires a positive safe integer. */
export function price(v: unknown, label: string, opts: { required?: boolean } = {}): number | null {
  const { required = true } = opts;
  if (v === null || v === undefined || v === "") {
    if (required) throw new HttpError(400, `الحقل «${label}» مطلوب`);
    return null;
  }
  const n = typeof v === "number" ? v : Number(String(v).replace(/[,\s]/g, ""));
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
    throw new HttpError(400, `«${label}» يجب أن يكون رقماً صحيحاً بالدينار العراقي`);
  }
  if (!Number.isSafeInteger(n)) throw new HttpError(400, `«${label}» غير صالح`);
  return n;
}

export function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

export function specs(v: unknown): ProductSpec[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((s) => ({
      label: typeof s?.label === "string" ? s.label.trim() : "",
      value: typeof s?.value === "string" ? s.value.trim() : "",
    }))
    .filter((s) => s.label && s.value)
    .slice(0, 100);
}

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function normalizePhone(raw: string): string {
  return raw
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)))
    .replace(/[^\d+]/g, "");
}

export function phone(v: unknown): string {
  const p = normalizePhone(typeof v === "string" ? v : "");
  const digits = p.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) {
    throw new HttpError(400, "رقم الهاتف غير صحيح (مثال: 07701234567)");
  }
  return p;
}

export function quantity(v: unknown): number {
  const n = Number(v ?? 1);
  if (!Number.isInteger(n) || n < 1 || n > 1000) throw new HttpError(400, "الكمية غير صحيحة");
  return n;
}
