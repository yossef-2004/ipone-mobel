import Link from "next/link";
import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
  icon = "📭",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: string;
}) {
  return (
    <div className="glass reveal mx-auto flex max-w-lg flex-col items-center gap-3 rounded-3xl px-6 py-14 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/5 text-3xl">{icon}</div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      {description && <p className="max-w-sm text-sm leading-7 text-white/55">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  title = "حدث خطأ غير متوقع",
  description = "تعذّر تحميل هذه الصفحة. حاول مرة أخرى بعد قليل.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-3xl border border-rose-400/25 bg-rose-500/[0.07] px-6 py-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-rose-500/15 text-2xl">⚠️</div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="max-w-sm text-sm leading-7 text-white/60">{description}</p>
      {action}
    </div>
  );
}

/** Shown when a database query fails, instead of a blank page. */
export function DbErrorNotice() {
  return (
    <ErrorState
      title="تعذّر الاتصال بقاعدة البيانات"
      description="لا يمكن تحميل البيانات حالياً. تأكد من اتصال قاعدة البيانات (DATABASE_URL) ثم أعد تحميل الصفحة."
      action={
        <Link
          href=""
          className="mt-2 rounded-xl border border-white/15 px-4 py-2 text-sm text-white transition hover:bg-white/10"
        >
          إعادة المحاولة
        </Link>
      }
    />
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass rounded-3xl p-3">
          <Skeleton className="aspect-[4/5] w-full" />
          <Skeleton className="mt-4 h-3 w-1/3" />
          <Skeleton className="mt-3 h-4 w-4/5" />
          <Skeleton className="mt-4 h-5 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-white/30 border-t-white ${className}`}
      aria-hidden
    />
  );
}
