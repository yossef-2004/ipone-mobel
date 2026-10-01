/** Stylised phone placeholder used when a product has no image yet. */
export function PhoneFallback({ className = "" }: { className?: string }) {
  return (
    <div className={`relative grid h-full w-full place-items-center overflow-hidden bg-gradient-to-br from-white/[0.05] to-white/[0.01] ${className}`}>
      <div className="absolute h-2/3 w-2/3 rounded-full bg-neon/20 blur-3xl" />
      <svg viewBox="0 0 120 220" className="relative h-3/4 w-auto drop-shadow-2xl" aria-hidden>
        <defs>
          <linearGradient id="pf-body" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2b2f45" />
            <stop offset="1" stopColor="#0d0f19" />
          </linearGradient>
          <linearGradient id="pf-screen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7c5cff" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <rect x="6" y="4" width="108" height="212" rx="22" fill="url(#pf-body)" stroke="#ffffff22" />
        <rect x="13" y="12" width="94" height="196" rx="16" fill="url(#pf-screen)" opacity="0.85" />
        <rect x="46" y="17" width="28" height="7" rx="3.5" fill="#05060a" />
      </svg>
    </div>
  );
}
