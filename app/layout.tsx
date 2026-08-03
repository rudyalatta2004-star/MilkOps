import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { Pwa } from "@/components/pwa";
import { SyncManager } from "@/components/sync-manager";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MilkOps — Gestión de ganado lechero",
  description:
    "Control offline de producción de leche, sanidad y reproducción del hato.",
  applicationName: "MilkOps",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MilkOps",
  },
  icons: {
    icon: "/icono.png",
    apple: "/icono.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2f9d5f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Pwa />
        <SyncManager />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
