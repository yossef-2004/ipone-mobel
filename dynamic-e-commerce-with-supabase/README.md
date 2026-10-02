# أوربت موبايل — متجر أجهزة موبايل (Next.js + PostgreSQL/Drizzle)

## التشغيل
- المتجر: `/` — لوحة الأدمن: `/admin`.
- سجّل الدخول بإعداد `SUPABASE_ADMIN_EMAIL` و`NEXT_PUBLIC_SUPABASE_URL` و`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` في `.env.local`. أدخل كلمة مرور حساب Supabase Auth المرتبط بهذا البريد، ويجب أن تحتوي بيانات `app_metadata` للحساب على `role: "admin"`.
- بذر بيانات أولية (مرة واحدة فقط وفي قاعدة البيانات، ليست في الكود): `node scripts/seed.mjs`.

## البنية
- `src/db` المخطط (categories, products, product_images, media, orders, order_items).
- `src/services` منطق قاعدة البيانات (products, categories, orders, media, notifications).
- `src/app/api` واجهات REST (عامة: `/api/orders`، أدمن: `/api/admin/*` محمية بجلسة Supabase Auth).
- `src/components/{store,admin,ui}` الواجهات. `src/lib` أدوات (عملة، تحقق، مصادقة). `src/types` الأنواع.

## ملاحظات صريحة
- **قاعدة البيانات**: Supabase Postgres: ضع `DATABASE_URL` الخاص بـ Supabase ثم `npx drizzle-kit push`.
- **RLS**: السياسات جاهزة في `supabase/rls.sql`؛ شغّلها في Supabase بعد إنشاء الجداول. مسارات الأدمن تتحقق من جلسة Supabase Auth ودور `admin`.
- **الصور**: تُضغط (WebP) وتُخزَّن في جدول `media`؛ لاستخدام Supabase Storage عدّل `src/services/media.ts` فقط.
- **السعر**: `bigint` بالدينار العراقي بلا حد أقصى (فقط عدد صحيح موجب).
- **واتساب**: لا يوجد إرسال تلقائي (يتطلب WhatsApp Business API). المتوفر روابط `wa.me` يدوية. نقطة الربط المستقبلية: `src/services/notifications.ts` (`NotificationProvider`).
