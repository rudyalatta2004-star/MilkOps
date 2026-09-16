"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  HeartPulse,
  FileSpreadsheet,
  Cloud,
} from "lucide-react";
import { cn } from "@/lib/utils/format";
import { DollarSun } from "@/components/icons/dollar-sun";
import type { ComponentType, ReactNode } from "react";

type IconType = ComponentType<{
  size?: number;
  strokeWidth?: number;
  className?: string;
}>;

interface NavItem {
  href: string;
  label: string;
  icon: IconType;
}

const NAV: NavItem[] = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/salud", label: "Salud", icon: HeartPulse },
  { href: "/finanzas", label: "Finanzas", icon: DollarSun },
  { href: "/reportes", label: "Reportes", icon: FileSpreadsheet },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const enInicio = pathname === "/";

  return (
    <div className="min-h-dvh md:flex">
      {/* Fondo fotográfico del establo, solo en el Inicio (decorativo) */}
      {enInicio && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, rgba(255,255,255,0.10), rgba(255,255,255,0.38)), url('/fondo.jpg')",
          }}
        />
      )}

      {/* Barra lateral (escritorio/tablet) */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-border md:bg-surface">
        <div className="flex h-16 items-center gap-2 px-5">
          <Image
            src="/icono.png"
            unoptimized
            alt="MilkOps"
            width={40}
            height={40}
            className="h-9 w-9 rounded-lg object-cover"
          />
          <span className="text-lg font-semibold tracking-tight">MilkOps</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-soft text-primary"
                    : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <Link
            href="/cuenta"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              isActive(pathname, "/cuenta")
                ? "bg-primary-soft text-primary"
                : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
            )}
          >
            <Cloud size={20} />
            Cuenta y nube
          </Link>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Encabezado móvil */}
        <header className="flex h-14 items-center gap-2 border-b border-border bg-surface px-4 md:hidden">
          <Image
            src="/icono.png"
            unoptimized
            alt="MilkOps"
            width={36}
            height={36}
            className="h-8 w-8 rounded-lg object-cover"
          />
          <span className="font-semibold tracking-tight">MilkOps</span>
          <Link
            href="/cuenta"
            aria-label="Cuenta y nube"
            className={cn(
              "ml-auto flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
              isActive(pathname, "/cuenta")
                ? "bg-primary-soft text-primary"
                : "text-muted-foreground hover:bg-surface-2",
            )}
          >
            <Cloud size={20} />
          </Link>
        </header>

        <main className="flex-1 px-4 py-5 pb-24 md:px-8 md:py-8 md:pb-8">
          <div className="mx-auto w-full max-w-5xl animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Barra inferior (móvil) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur md:hidden">
        <div
          className="grid grid-cols-4"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2.5 text-[0.68rem] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
