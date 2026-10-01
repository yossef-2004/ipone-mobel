import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-white sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-white/50">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}
