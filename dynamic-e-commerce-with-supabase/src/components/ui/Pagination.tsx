import Link from "next/link";

/** URL-driven pagination; keeps all other query params. */
export function Pagination({
  page,
  totalPages,
  basePath,
  params,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1, page - 2, page + 2]);
  const list = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const base = "grid h-10 min-w-10 place-items-center rounded-xl border px-3 text-sm transition";
  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="التنقل بين الصفحات">
      {page > 1 && (
        <Link href={href(page - 1)} className={`${base} border-white/10 text-white/70 hover:bg-white/8`}>السابق</Link>
      )}
      {list.map((p, i) => (
        <span key={p} className="contents">
          {i > 0 && p - list[i - 1] > 1 && <span className="text-white/30">…</span>}
          <Link
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            className={`${base} ${p === page ? "grad-bg border-transparent font-bold text-white" : "border-white/10 text-white/70 hover:bg-white/8"}`}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < totalPages && (
        <Link href={href(page + 1)} className={`${base} border-white/10 text-white/70 hover:bg-white/8`}>التالي</Link>
      )}
    </nav>
  );
}
