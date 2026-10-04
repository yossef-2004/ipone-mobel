import Link from "next/link";
import { DbErrorNotice, EmptyState } from "@/components/ui/States";
import { HeroPhone, type HeroPhoneItem } from "@/components/store/HeroPhone";
import { ProductCard } from "@/components/store/ProductCard";
import { Section } from "@/components/store/Section";
import { StoreBackButton } from "@/components/store/StoreBackButton";
import { formatIqd } from "@/lib/currency";
import { thumbUrl } from "@/lib/image-url";
import { safe } from "@/lib/safe";
import { listCategories } from "@/services/categories";
import { listBrands, listProducts } from "@/services/products";

export const dynamic = "force-dynamic";

const steps = [
  { n: "01", title: "اختر جهازك", text: "تصفّح الأجهزة، قارن المواصفات وشاهد الأسعار بوضوح بالدينار العراقي." },
  { n: "02", title: "أرسل طلب الحجز", text: "املأ الاسم ورقم الهاتف والعنوان، ويصلك رقم الطلب فوراً." },
  { n: "03", title: "نؤكد معك", text: "نتواصل معك لتأكيد الطلب وتجهيزه وترتيب التسليم." },
];

const perks = [
  { icon: "◈", title: "أسعار شفافة", text: "كل الأسعار بالدينار العراقي وبدون رسوم مخفية." },
  { icon: "⚡", title: "حجز سريع", text: "نموذج بسيط من خطوة واحدة، بدون تسجيل حساب." },
  { icon: "◎", title: "حالة توفر لحظية", text: "ترى فوراً إن كان الجهاز متوفراً أم لا." },
  { icon: "✦", title: "تحديث مستمر", text: "نضيف أجهزة جديدة باستمرار من لوحة التحكم." },
];

export default async function HomePage() {
  const result = await safe(async () => {
    const [featured, latest, categories, brands] = await Promise.all([
      listProducts({ featuredOnly: true, pageSize: 8 }),
      listProducts({ pageSize: 8, sort: "newest" }),
      listCategories({ withCounts: true, visibleOnly: true }),
      listBrands(),
    ]);
    return { featured, latest, categories, brands };
  });

  const data = result.data;
  const heroSource = data ? (data.featured.items.length ? data.featured.items : data.latest.items) : [];
  const heroItems: HeroPhoneItem[] = heroSource.slice(0, 4).map((p) => ({
    name: p.name,
    price: formatIqd(p.price),
    image: p.images[0] ? thumbUrl(p.images[0].url) : null,
  }));

  return (
    <>
      {/* HERO */}
      <section className="relative mx-auto grid max-w-7xl items-center gap-6 px-4 pb-6 pt-8 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:pt-14">
        <div className="reveal text-center lg:text-start">
          <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold text-aqua">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-aqua" />
            وصل حديثاً: أحدث الهواتف الذكية
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.15] text-white sm:text-5xl lg:text-6xl">
            جهازك القادم
            <br />
            <span className="grad-text">يبدأ من هنا</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-white/60 lg:mx-0 lg:text-lg">
            اكتشف أفضل أجهزة الموبايل بأسعار واضحة بالدينار العراقي، واحجز جهازك بخطوات بسيطة ونحن نتواصل معك لتأكيد الطلب.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Link
              href="/products"
              className="grad-bg rounded-full px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-neon/30 transition hover:scale-[1.03] hover:shadow-neon/50 active:scale-95"
            >
              تصفّح الأجهزة
            </Link>
            <Link
              href="/products?available=1"
              className="glass rounded-full px-7 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
            >
              المتوفر الآن
            </Link>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 text-center lg:text-start">
            {[
              [data ? String(data.latest.total) : "—", "جهاز"],
              [data ? String(data.brands.length) : "—", "شركة"],
              [data ? String(data.categories.length) : "—", "قسم"],
            ].map(([v, l]) => (
              <div key={l} className="mx-auto lg:mx-0">
                <dt className="text-2xl font-extrabold text-white">{v}</dt>
                <dd className="text-xs text-white/45">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
        <HeroPhone items={heroItems} />
      </section>

      {result.failed || !data ? (
        <div className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
          <StoreBackButton fallbackHref="/" />
          <DbErrorNotice />
        </div>
      ) : (
        <>
          {/* BRANDS */}
          {data.brands.length > 0 && (
            <div className="mt-10 overflow-hidden border-y border-white/8 py-4 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
              <div className="flex w-max animate-marquee gap-3">
                {[...data.brands, ...data.brands, ...data.brands, ...data.brands].map((b, i) => (
                  <Link
                    key={`${b}-${i}`}
                    href={`/products?brand=${encodeURIComponent(b)}`}
                    className="whitespace-nowrap rounded-full border border-white/10 bg-white/[0.03] px-6 py-2 text-sm font-bold text-white/60 transition hover:border-neon/60 hover:text-white"
                  >
                    {b}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CATEGORIES */}
          <Section id="categories" eyebrow="الأقسام" title="تسوّق حسب الفئة">
            <StoreBackButton fallbackHref="/" />
            {data.categories.length ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                {data.categories.map((c, i) => (
                  <Link
                    key={c.id}
                    href={`/products?category=${c.slug}`}
                    className="reveal glass group relative overflow-hidden rounded-3xl p-5 transition duration-300 hover:-translate-y-1 hover:border-aqua/40"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="absolute -end-8 -top-8 h-28 w-28 rounded-full bg-neon/20 blur-2xl transition group-hover:bg-aqua/30" />
                    <p className="relative text-xs text-white/40">{c.productCount ?? 0} جهاز</p>
                    <h3 className="relative mt-6 text-lg font-extrabold text-white">{c.name}</h3>
                    {c.description && <p className="relative mt-1.5 line-clamp-2 text-xs leading-6 text-white/50">{c.description}</p>}
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState title="لا توجد أقسام بعد" description="ستظهر الأقسام هنا بعد إضافتها من لوحة التحكم." icon="🗂️" />
            )}
          </Section>

          {/* FEATURED */}
          {data.featured.items.length > 0 && (
            <Section eyebrow="مختارات" title="أجهزة مميزة" href="/products">
              <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                {data.featured.items.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            </Section>
          )}

          {/* LATEST */}
          <Section eyebrow="جديدنا" title="أحدث الأجهزة" href="/products">
            {data.latest.items.length ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                {data.latest.items.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            ) : (
              <EmptyState title="لا توجد أجهزة حالياً" description="سنضيف أجهزة جديدة قريباً، عد لاحقاً." />
            )}
          </Section>
        </>
      )}

      {/* PERKS */}
      <Section eyebrow="لماذا نحن" title="تجربة شراء مختلفة">
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {perks.map((p) => (
            <div key={p.title} className="glass rounded-3xl p-6 transition hover:border-white/20">
              <div className="grad-bg grid h-11 w-11 place-items-center rounded-2xl text-lg">{p.icon}</div>
              <h3 className="mt-5 font-extrabold text-white">{p.title}</h3>
              <p className="mt-2 text-sm leading-7 text-white/50">{p.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* HOW */}
      <Section id="how" eyebrow="الخطوات" title="كيف تحجز جهازك؟">
        <div className="grid gap-3 md:grid-cols-3 md:gap-5">
          {steps.map((s) => (
            <div key={s.n} className="glass relative overflow-hidden rounded-3xl p-7">
              <span className="grad-text text-5xl font-extrabold opacity-80">{s.n}</span>
              <h3 className="mt-4 text-lg font-extrabold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-7 text-white/55">{s.text}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
