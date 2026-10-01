import { redirect } from "next/navigation";
import { Logo } from "@/components/store/Header";
import { isAdmin, isUsingDefaultCredentials } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="glass reveal w-full max-w-sm rounded-3xl p-7">
        <Logo />
        <h1 className="mt-7 text-xl font-extrabold text-white">دخول الأدمن</h1>
        <p className="mt-1 text-sm text-white/50">هذه المنطقة مخصّصة لإدارة المتجر فقط.</p>
        <LoginForm />
        {isUsingDefaultCredentials() && (
          <p className="mt-5 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-xs leading-6 text-amber-200">
            تنبيه: لم يتم ضبط ADMIN_PASSWORD / ADMIN_SESSION_SECRET في متغيرات البيئة، يتم استخدام قيم افتراضية غير آمنة. غيّرها قبل النشر.
          </p>
        )}
      </div>
    </div>
  );
}
