export function AvailabilityBadge({ available, compact = false }: { available: boolean; compact?: boolean }) {
  const size = compact ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs";
  return available ? (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 font-bold text-emerald-300 ${size}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      متوفر
    </span>
  ) : (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-500/15 font-bold text-rose-300 ${size}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
      غير متوفر
    </span>
  );
}
