import Link from "next/link";
import { EmptyState } from "@/components/ui/States";

export default function NotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-4">
      <EmptyState
        icon="🧭"
        title="الصفحة غير موجودة"
        description="الرابط الذي تبحث عنه غير صحيح أو أن الجهاز لم يعد معروضاً."
        action={
          <Link href="/products" className="grad-bg mt-2 rounded-full px-6 py-2.5 text-sm font-bold text-white">
            تصفّح الأجهزة
          </Link>
        }
      />
    </div>
  );
}
