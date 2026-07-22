import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { I18nProvider } from "@/lib/i18n";
import { RouterProvider } from "@/lib/router";
import { AppShell } from "@/components/dashboard/AppShell";

export const metadata: Metadata = {
  title: "Railflow — Deploy. Scale. Control.",
  description: "Professional control plane for deploying projects via Docker with automatic GitHub integration. Rust-powered backend, real-time server monitoring, military-grade security.",
  keywords: ["Railflow", "Docker", "Deployment", "Rust", "GitHub", "PaaS", "Railway alternative", "Cloud deployment"],
  authors: [{ name: "Railflow" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className="dark">
      <body className="antialiased bg-background text-foreground min-h-screen">
        <I18nProvider>
          <RouterProvider>
            <AppShell />
          </RouterProvider>
        </I18nProvider>
        <Toaster />
      </body>
    </html>
  );
}
