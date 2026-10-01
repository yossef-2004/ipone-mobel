import type { ReactNode } from "react";
import { Footer } from "@/components/store/Footer";
import { Header } from "@/components/store/Header";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
