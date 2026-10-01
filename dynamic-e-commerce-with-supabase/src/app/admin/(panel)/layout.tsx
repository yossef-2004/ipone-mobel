import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdminPage } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  await requireAdminPage();
  return (
    <div className="min-h-screen lg:flex">
      <AdminNav />
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:py-10">{children}</div>
    </div>
  );
}
