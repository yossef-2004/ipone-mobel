// Seeds starter data INTO THE DATABASE (one time, only if empty).
// Products are normal rows — editable/deletable from the admin dashboard.
// Usage: node scripts/seed.mjs
import "dotenv/config";
import { readFile } from "node:fs/promises";
import pg from "pg";
import sharp from "sharp";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const categories = [
  { name: "الهواتف الرائدة", slug: "flagship", description: "أقوى الأجهزة وأحدث التقنيات", sort: 1 },
  { name: "الفئة المتوسطة", slug: "mid-range", description: "توازن مثالي بين السعر والأداء", sort: 2 },
  { name: "الفئة الاقتصادية", slug: "budget", description: "أجهزة عملية بسعر مناسب", sort: 3 },
  { name: "الأجهزة اللوحية", slug: "tablets", description: "شاشات كبيرة للعمل والترفيه", sort: 4 },
];

const specs = (storage, ram, screen, battery, color) => [
  { label: "السعة", value: storage },
  { label: "الرام", value: ram },
  { label: "الشاشة", value: screen },
  { label: "البطارية", value: battery },
  { label: "اللون", value: color },
];

const products = [
  { name: "iPhone 16 Pro Max 256GB", brand: "Apple", cat: "flagship", price: 2150000, old: 2300000, featured: true, img: 0,
    desc: "أقوى آيفون حتى الآن بشاشة 6.9 إنش وكاميرا احترافية بعدسة تيليفوتو 5x ومعالج A18 Pro.", specs: specs("256 GB", "8 GB", "6.9 إنش OLED", "4685 mAh", "تيتانيوم طبيعي") },
  { name: "Samsung Galaxy S25 Ultra 512GB", brand: "Samsung", cat: "flagship", price: 1950000, featured: true, img: 1,
    desc: "رائد سامسونج مع قلم S Pen وكاميرا 200 ميغابكسل وشاشة Dynamic AMOLED 2X.", specs: specs("512 GB", "12 GB", "6.9 إنش AMOLED", "5000 mAh", "رمادي تيتانيوم") },
  { name: "Google Pixel 9 Pro 256GB", brand: "Google", cat: "flagship", price: 1450000, featured: true, img: 2,
    desc: "تصوير ذكي بالذكاء الاصطناعي وتجربة أندرويد نقية مع تحديثات لسبع سنوات.", specs: specs("256 GB", "16 GB", "6.3 إنش LTPO OLED", "4700 mAh", "أزرق") },
  { name: "Xiaomi 14T Pro 512GB", brand: "Xiaomi", cat: "mid-range", price: 890000, old: 980000, featured: true, img: 3,
    desc: "عدسات Leica وشحن سريع 120 واط وأداء قوي بسعر منافس.", specs: specs("512 GB", "12 GB", "6.67 إنش AMOLED", "5000 mAh", "أسود") },
  { name: "Samsung Galaxy A56 256GB", brand: "Samsung", cat: "mid-range", price: 540000, img: 1,
    desc: "شاشة AMOLED سلسة بمعدل 120Hz وبطارية تدوم يوماً كاملاً.", specs: specs("256 GB", "8 GB", "6.7 إنش AMOLED", "5000 mAh", "أخضر فاتح") },
  { name: "Redmi Note 14 Pro 256GB", brand: "Xiaomi", cat: "mid-range", price: 420000, img: 3,
    desc: "كاميرا 200 ميغابكسل وشاشة منحنية مقاومة للماء والغبار.", specs: specs("256 GB", "8 GB", "6.67 إنش AMOLED", "5110 mAh", "بنفسجي") },
  { name: "Honor X8c 256GB", brand: "Honor", cat: "budget", price: 310000, img: 2,
    desc: "تصميم نحيف وبطارية كبيرة مع شحن سريع، خيار اقتصادي ممتاز.", specs: specs("256 GB", "8 GB", "6.7 إنش LCD", "6000 mAh", "رمادي") },
  { name: "Samsung Galaxy Tab S10 FE", brand: "Samsung", cat: "tablets", price: 780000, img: 0,
    desc: "جهاز لوحي بشاشة 10.9 إنش مع قلم S Pen مرفق للدراسة والعمل.", specs: specs("128 GB", "6 GB", "10.9 إنش LCD", "8000 mAh", "فضي") },
];

async function main() {
  const { rows } = await pool.query("select (select count(*) from products)::int p, (select count(*) from categories)::int c");
  if (rows[0].p > 0 || rows[0].c > 0) {
    console.log("Database already has data — seed skipped.");
    return;
  }

  const mediaIds = [];
  for (let i = 1; i <= 4; i++) {
    const input = await readFile(new URL(`../seed-assets/phone-${i}.jpg`, import.meta.url));
    const data = await sharp(input).resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    const thumb = await sharp(input).resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: true }).webp({ quality: 76 }).toBuffer();
    const r = await pool.query("insert into media (content_type, data, thumb) values ('image/webp', $1, $2) returning id", [data, thumb]);
    mediaIds.push(r.rows[0].id);
  }

  const catIds = {};
  for (const c of categories) {
    const r = await pool.query(
      "insert into categories (name, slug, description, sort_order) values ($1,$2,$3,$4) returning id",
      [c.name, c.slug, c.description, c.sort],
    );
    catIds[c.slug] = r.rows[0].id;
  }

  for (const p of products) {
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const r = await pool.query(
      `insert into products (slug, name, brand, category_id, description, price, old_price, is_featured, specs)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb) returning id`,
      [slug, p.name, p.brand, catIds[p.cat], p.desc, p.price, p.old ?? null, !!p.featured, JSON.stringify(p.specs)],
    );
    // Reuse the same stored image row is not possible (FK set null on delete), so duplicate media per product.
    const src = await pool.query("select content_type, data, thumb from media where id = $1", [mediaIds[p.img]]);
    const m = await pool.query("insert into media (content_type, data, thumb) values ($1,$2,$3) returning id", [
      src.rows[0].content_type, src.rows[0].data, src.rows[0].thumb,
    ]);
    await pool.query(
      "insert into product_images (product_id, url, media_id, sort_order) values ($1,$2,$3,0)",
      [r.rows[0].id, `/api/media/${m.rows[0].id}`, m.rows[0].id],
    );
  }
  // Remove the temporary originals.
  await pool.query("delete from media where id = any($1::uuid[])", [mediaIds]);
  console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
