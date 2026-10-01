"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Spinner } from "@/components/ui/States";
import { callApi } from "@/lib/api";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    const res = await callApi("/api/admin/login", { body: { password } });
    if (!res.ok) {
      setError(res.error);
      setLoading(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <input
        name="password"
        type="password"
        required
        autoFocus
        autoComplete="current-password"
        placeholder="كلمة المرور"
        className="input-base"
      />
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
      <button
        disabled={loading}
        className="grad-bg flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? <Spinner /> : "تسجيل الدخول"}
      </button>
    </form>
  );
}
