"use client";

import { useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Users,
  HeartHandshake,
  CircleDashed,
  Search,
  X,
  Plus,
  HeartPulse,
  FileSpreadsheet,
  Cloud,
  ChevronRight,
} from "lucide-react";
import { db } from "@/lib/db/db";
import { normaliza } from "@/lib/db/animales";
import type { Animal } from "@/types/models";
import { DollarSun } from "@/components/icons/dollar-sun";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnimalFoto } from "@/components/animal-foto";
import {
  Badge,
  badgeReproductivo,
  badgeProductivo,
} from "@/components/ui/badge";

type IconType = ComponentType<{ size?: number; className?: string }>;

interface Seccion {
  label: string;
  desc: string;
  href: string;
  icon: IconType;
  kw: string;
}

/** Secciones y acciones que también encuentra el buscador global. */
const SECCIONES: Seccion[] = [
  {
    label: "Registrar animal",
    desc: "Dar de alta una vaca",
    href: "/animales/nuevo",
    icon: Plus,
    kw: "registrar animal nuevo alta agregar vaca ficha arete",
  },
  {
    label: "Salud",
    desc: "Sanidad, reproducción y celo",
    href: "/salud",
    icon: HeartPulse,
    kw: "salud sanidad vacuna vacunas desparasitacion tratamiento reproduccion celo inseminacion monta preñada gestacion parto fpp",
  },
  {
    label: "Finanzas",
    desc: "Ingresos, gastos y liquidez",
    href: "/finanzas",
    icon: DollarSun,
    kw: "finanzas dinero gasto gastos ingreso ingresos liquidez quincena balance concentrado medicamentos personal mantenimiento",
  },
  {
    label: "Reportes",
    desc: "Exportar a Excel",
    href: "/reportes",
    icon: FileSpreadsheet,
    kw: "reportes reporte excel exportar xlsx descargar balance financiero liquidez",
  },
  {
    label: "Cuenta y nube",
    desc: "Sincronizar y respaldo",
    href: "/cuenta",
    icon: Cloud,
    kw: "cuenta nube sincronizar sincronizacion supabase respaldo copia login sesion iniciar",
  },
];

export default function DashboardPage() {
  const [q, setQ] = useState("");
  const animales = useLiveQuery(() => db.animales.toArray(), [], undefined);

  const cargando = animales === undefined;
  const activos = useMemo(
    () => (animales ?? []).filter((a) => a.activo !== false),
    [animales],
  );

  const preñadas = activos.filter((a) => a.estadoReproductivo === "preñada").length;
  const vacias = activos.filter((a) => a.estadoReproductivo === "vacia").length;

  const term = normaliza(q.trim());
  const buscando = term !== "";

  const animalesFiltrados = useMemo(() => {
    const base = term
      ? activos.filter(
          (a) =>
            normaliza(a.nombre).includes(term) ||
            normaliza(a.arete ?? "").includes(term),
        )
      : activos;
    return [...base].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [activos, term]);

  const seccionesFiltradas = useMemo(
    () =>
      term
        ? SECCIONES.filter((s) => normaliza(`${s.label} ${s.kw}`).includes(term))
        : [],
    [term],
  );

  return (
    <div className="space-y-5">
      {/* Panel principal: logo + buscador + registrar */}
      <Card className="space-y-4 p-5 shadow-lg sm:p-6">
        <div className="flex justify-center">
          <Image
            src="/logo-app.png"
            unoptimized
            alt="MilkOps"
            width={320}
            height={320}
            priority
            className="w-28 rounded-3xl object-cover sm:w-32"
          />
        </div>

        {/* Buscador global */}
        <div className="relative">
          <Search
            size={22}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar en la app: animales, finanzas, salud…"
            className="h-14 w-full rounded-2xl border border-border-strong bg-surface pl-12 pr-12 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            autoComplete="off"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              aria-label="Limpiar"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-muted-foreground hover:bg-surface-2"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <Link href="/animales/nuevo" className="block">
          <Button size="lg" className="w-full">
            <Plus size={20} /> Registrar animal
          </Button>
        </Link>
      </Card>

      {buscando ? (
        /* ---------- Resultados de búsqueda global ---------- */
        <div className="space-y-4">
          {seccionesFiltradas.length > 0 && (
            <div className="space-y-2">
              <p className="px-1 text-xs font-semibold uppercase tracking-wide text-foreground">
                Secciones
              </p>
              {seccionesFiltradas.map((s) => {
                const Icon = s.icon;
                return (
                  <Link key={s.href} href={s.href}>
                    <Card className="flex items-center gap-3 p-3 shadow-md transition-colors hover:bg-surface-2">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                        <Icon size={20} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{s.label}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {s.desc}
                        </p>
                      </div>
                      <ChevronRight size={18} className="text-muted-foreground" />
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          {animalesFiltrados.length > 0 && (
            <div className="space-y-2">
              <p className="px-1 text-xs font-semibold uppercase tracking-wide text-foreground">
                Animales
              </p>
              <ul className="space-y-2">
                {animalesFiltrados.map((a) => (
                  <AnimalRow key={a.id} a={a} />
                ))}
              </ul>
            </div>
          )}

          {seccionesFiltradas.length === 0 && animalesFiltrados.length === 0 && (
            <Card className="py-8 text-center text-sm text-muted-foreground shadow-md">
              Sin resultados para “{q}”.
            </Card>
          )}
        </div>
      ) : (
        /* ---------- Vista normal ---------- */
        <>
          {cargando ? (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-24 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <StatCard icon={Users} label="Animales" value={activos.length} tone="primary" />
              <StatCard icon={HeartHandshake} label="Preñadas" value={preñadas} tone="success" />
              <StatCard icon={CircleDashed} label="Vacías" value={vacias} tone="warning" />
            </div>
          )}

          {cargando ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-20 rounded-xl" />
              ))}
            </div>
          ) : activos.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 py-10 text-center shadow-md">
              <p className="text-sm text-muted-foreground">
                Aún no tienes animales registrados.
              </p>
            </Card>
          ) : (
            <ul className="space-y-2">
              {animalesFiltrados.map((a) => (
                <AnimalRow key={a.id} a={a} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

/** Fila de animal reutilizable (lista y resultados de búsqueda). */
function AnimalRow({ a }: { a: Animal }) {
  const rep = badgeReproductivo(a.estadoReproductivo);
  const prod = badgeProductivo(a.estadoProductivo);
  return (
    <li>
      <Link href={`/animales/${a.id}`}>
        <Card className="flex items-center gap-3 p-3 shadow-md transition-colors hover:bg-surface-2">
          <AnimalFoto
            blob={a.fotoBlob}
            url={a.fotoUrl}
            alt={a.nombre}
            className="h-14 w-14 shrink-0 rounded-xl"
            iconSize={24}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{a.nombre}</p>
            <p className="truncate text-xs text-muted-foreground">
              {[a.arete, a.raza].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Badge tone={rep.tone}>{rep.label}</Badge>
            <Badge tone={prod.tone}>{prod.label}</Badge>
          </div>
        </Card>
      </Link>
    </li>
  );
}
