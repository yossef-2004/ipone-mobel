# أوربت موبايل — متجر أجهزة موبايل (Next.js + PostgreSQL/Drizzle)

## التشغيل
- المتجر: `/` — لوحة الأدمن: `/admin` (كلمة المرور من `ADMIN_PASSWORD` في `.env`، غيّرها قبل النشر مع `ADMIN_SESSION_SECRET`).
- بذر بيانات أولية (مرة واحدة فقط وفي قاعدة البيانات، ليست في الكود): `node scripts/seed.mjs`.

## البنية
- `src/db` المخطط (categories, products, product_images, media, orders, order_items).
- `src/services` منطق قاعدة البيانات (products, categories, orders, media, notifications).
- `src/app/api` واجهات REST (عامة: `/api/orders`، أدمن: `/api/admin/*` محمية بجلسة موقّعة).
- `src/components/{store,admin,ui}` الواجهات. `src/lib` أدوات (عملة، تحقق، مصادقة). `src/types` الأنواع.

## ملاحظات صريحة
- **قاعدة البيانات**: PostgreSQL محلي عبر Drizzle. المخطط متوافق مع Supabase Postgres: ضع `DATABASE_URL` الخاص بـ Supabase ثم `npx drizzle-kit push`.
- **RLS**: السياسات جاهزة في `supabase/rls.sql` وغير مفعّلة هنا؛ الصلاحيات تُفرض حالياً من الخادم (كل مسارات الأدمن تتحقق من الجلسة).
- **الصور**: تُضغط (WebP) وتُخزَّن في جدول `media`؛ لاستخدام Supabase Storage عدّل `src/services/media.ts` فقط.
- **السعر**: `bigint` بالدينار العراقي بلا حد أقصى (فقط عدد صحيح موجب).
- **واتساب**: لا يوجد إرسال تلقائي (يتطلب WhatsApp Business API). المتوفر روابط `wa.me` يدوية. نقطة الربط المستقبلية: `src/services/notifications.ts` (`NotificationProvider`).
