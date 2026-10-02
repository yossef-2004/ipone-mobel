import { HttpError } from "@/lib/auth";
import { getSupabaseClient } from "@/db";
import sharp from "sharp";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

export async function storeImage(file: File): Promise<{ mediaId: string; url: string }> {
  if (!ALLOWED.includes(file.type)) throw new HttpError(400, "نوع الصورة غير مدعوم (JPG, PNG, WebP)");
  if (file.size > MAX_UPLOAD_BYTES) throw new HttpError(400, "حجم الصورة كبير جداً (الحد 15 ميغابايت)");

  let full: Buffer;
  let thumb: Buffer;
  try {
    const source = Buffer.from(await file.arrayBuffer());
    [full, thumb] = await Promise.all([
      sharp(source).rotate().resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true }).webp({ quality: 84 }).toBuffer(),
      sharp(source).rotate().resize({ width: 480, height: 480, fit: "inside", withoutEnlargement: true }).webp({ quality: 72 }).toBuffer(),
    ]);
  } catch {
    throw new HttpError(400, "تعذّر قراءة الصورة أو أن الملف تالف");
  }

  const client = await getSupabaseClient();
  const { data, error } = await client.from("media").insert({
    content_type: "image/webp",
    data: `\\x${full.toString("hex")}`,
    thumb: `\\x${thumb.toString("hex")}`,
  }).select("id").single();
  if (error) throw new HttpError(503, "تعذّر حفظ الصورة في Supabase");
  return { mediaId: data.id, url: `/api/media/${data.id}` };
}

export async function removeMedia(mediaId: string | null): Promise<void> {
  if (!mediaId) return;
  const client = await getSupabaseClient();
  const { error } = await client.from("media").delete().eq("id", mediaId);
  if (error) throw new HttpError(503, "تعذّر حذف ملف الصورة من Supabase");
}

export async function readMedia(
  id: string,
  size: "full" | "thumb",
): Promise<{ contentType: string; data: Uint8Array } | null> {
  const client = await getSupabaseClient();
  const { data, error } = await client.from("media").select("content_type,data,thumb").eq("id", id).maybeSingle();
  if (error) throw new HttpError(503, "تعذّر تحميل الصورة من Supabase");
  if (!data) return null;
  const encoded = size === "thumb" && data.thumb ? data.thumb : data.data;
  if (typeof encoded !== "string") return null;
  const hex = encoded.startsWith("\\x") ? encoded.slice(2) : encoded;
  if (!/^(?:[0-9a-f]{2})*$/i.test(hex)) return null;
  return { contentType: data.content_type, data: new Uint8Array(Buffer.from(hex, "hex")) };
}
