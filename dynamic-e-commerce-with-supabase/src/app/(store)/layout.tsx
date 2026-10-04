import type { ReactNode } from "react";
import { Suspense } from "react";
import { Footer } from "@/components/store/Footer";
import { Header } from "@/components/store/Header";
import { StoreNavigation } from "@/components/store/StoreNavigation";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <StoreNavigation />
      </Suspense>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
