import type { Metadata, Viewport } from "next";
import { Tajawal } from "next/font/google";
import type { ReactNode } from "react";
import { siteConfig } from "@/config/site";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: `${siteConfig.name} | ${siteConfig.tagline}`, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
};

export const viewport: Viewport = {
  themeColor: "#07080d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.variable}>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
