import sharp from "sharp";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { media } from "@/db/schema";
import { HttpError } from "@/lib/auth";

/**
 * Image storage service. Currently stores compressed WebP in PostgreSQL (`media` table).
 * To use Supabase Storage later, replace `storeImage` / `removeMedia` and keep
 * returning a public URL — nothing else in the app needs to change.
 */

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

export async function storeImage(
  file: File,
): Promise<{ mediaId: string; url: string }> {
  if (!ALLOWED.includes(file.type)) throw new HttpError(400, "نوع الصورة غير مدعوم (JPG, PNG, WebP)");
  if (file.size > MAX_UPLOAD_BYTES) throw new HttpError(400, "حجم الصورة كبير جداً (الحد 15 ميغابايت)");

  const input = Buffer.from(await file.arrayBuffer());
  let data: Buffer;
  let thumb: Buffer;
  try {
    const base = sharp(input, { failOn: "none" }).rotate();
    data = await base
      .clone()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    thumb = await base
      .clone()
      .resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 76 })
      .toBuffer();
  } catch {
    throw new HttpError(400, "تعذّرت معالجة الصورة، تأكد أن الملف صورة صالحة");
  }

  const [row] = await db
    .insert(media)
    .values({ contentType: "image/webp", data, thumb })
    .returning({ id: media.id });
  return { mediaId: row.id, url: `/api/media/${row.id}` };
}

export async function removeMedia(mediaId: string | null): Promise<void> {
  if (!mediaId) return;
  await db.delete(media).where(eq(media.id, mediaId));
}

export async function readMedia(id: string, size: "full" | "thumb") {
  const [row] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  if (!row) return null;
  return { contentType: row.contentType, data: size === "thumb" && row.thumb ? row.thumb : row.data };
}
