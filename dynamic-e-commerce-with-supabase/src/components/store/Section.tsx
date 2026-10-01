import Link from "next/link";
import type { ReactNode } from "react";

export function Section({
  id,
  eyebrow,
  title,
  href,
  hrefLabel = "عرض الكل",
  children,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  href?: string;
  hrefLabel?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mx-auto mt-20 max-w-7xl scroll-mt-24 px-4 sm:px-6">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          {eyebrow && <p className="mb-2 text-xs font-bold tracking-widest text-aqua">{eyebrow}</p>}
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">{title}</h2>
        </div>
        {href && (
          <Link href={href} className="shrink-0 rounded-full border border-white/12 px-4 py-1.5 text-sm text-white/70 transition hover:bg-white/8 hover:text-white">
            {hrefLabel} ←
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
