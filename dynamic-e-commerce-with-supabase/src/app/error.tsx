"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/States";

export default function GlobalRouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[70vh] place-items-center px-4">
      <ErrorState
        action={
          <button onClick={reset} className="grad-bg mt-2 rounded-full px-6 py-2.5 text-sm font-bold text-white">
            إعادة المحاولة
          </button>
        }
      />
    </div>
  );
}
