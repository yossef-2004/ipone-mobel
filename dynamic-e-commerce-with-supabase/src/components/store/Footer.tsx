import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Logo } from "./Header";

export function Footer() {
  const wa = siteConfig.whatsappNumber;
  return (
    <footer className="mt-24 border-t border-white/8 bg-ink-2/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm leading-7 text-white/50">{siteConfig.description}</p>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-bold text-white">روابط سريعة</h4>
          <ul className="space-y-2.5 text-sm text-white/55">
            <li><Link className="hover:text-white" href="/products">كل الأجهزة</Link></li>
            <li><Link className="hover:text-white" href="/products?available=1">المتوفرة الآن</Link></li>
            <li><Link className="hover:text-white" href="/#how">كيف تحجز؟</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-bold text-white">تواصل معنا</h4>
          {wa ? (
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300 transition hover:bg-emerald-500/20"
            >
              واتساب
            </a>
          ) : (
            <p className="text-sm text-white/50">سيتم تأكيد حجزك عبر الاتصال بك على رقم هاتفك.</p>
          )}
          <p className="mt-4 text-xs text-white/35">جميع الأسعار بالدينار العراقي (د.ع)</p>
        </div>
      </div>
      <div className="border-t border-white/5 py-5 text-center text-xs text-white/35">
        © {new Date().getFullYear()} {siteConfig.name}. جميع الحقوق محفوظة.
      </div>
    </footer>
  );
}
