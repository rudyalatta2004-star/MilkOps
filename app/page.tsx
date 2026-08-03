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
  Droplets,
  Loader2,
  Trash2,
  HeartPulse,
  FileSpreadsheet,
  Cloud,
  ChevronRight,
} from "lucide-react";
import { db } from "@/lib/db/db";
import { normaliza } from "@/lib/db/animales";
import {
  agregarProduccionDia,
  eliminarProduccionDia,
} from "@/lib/db/produccion-diaria";
import type { Animal, ProduccionDiaria } from "@/types/models";
import { DollarSun } from "@/components/icons/dollar-sun";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { AnimalFoto } from "@/components/animal-foto";
import {
  Badge,
  badgeReproductivo,
  badgeProductivo,
} from "@/components/ui/badge";
import { formatLitros, todayIso } from "@/lib/utils/format";

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
    label: "Producción de leche",
    desc: "Litros y mediciones",
    href: "/produccion",
    icon: Droplets,
    kw: "produccion leche litros ordeño medicion diaria mensual",
  },
  {
    label: "Salud",
    desc: "Sanidad y reproducción",
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
    kw: "reportes reporte excel exportar xlsx descargar balance financiero",
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
  const produccion = useLiveQuery(
    () => db.produccionDiaria.toArray(),
    [],
    undefined,
  );

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
    <div className="space-y-6">
      {/* Logo */}
      <div className="flex flex-col items-center pt-1">
        <Image
          src="/logo.png"
          unoptimized
          alt="MilkOps"
          width={360}
          height={298}
          priority
          className="h-auto w-56 object-contain sm:w-64"
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
          className="h-16 w-full rounded-2xl border border-border bg-surface pl-12 pr-12 text-base shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
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

      {/* Registrar animal (debajo del buscador) */}
      <Link href="/animales/nuevo" className="block">
        <Button size="lg" className="w-full">
          <Plus size={20} /> Registrar animal
        </Button>
      </Link>

      {buscando ? (
        /* ---------- Resultados de búsqueda global ---------- */
        <div className="space-y-4">
          {seccionesFiltradas.length > 0 && (
            <div className="space-y-2">
              <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Secciones
              </p>
              {seccionesFiltradas.map((s) => {
                const Icon = s.icon;
                return (
                  <Link key={s.href} href={s.href}>
                    <Card className="flex items-center gap-3 p-3 transition-colors hover:bg-surface-2">
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
              <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
            <Card className="py-8 text-center text-sm text-muted-foreground">
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

          <CuadroProduccionDia registros={produccion} />

          {cargando ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-20 rounded-xl" />
              ))}
            </div>
          ) : activos.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 py-10 text-center">
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
        <Card className="flex items-center gap-3 p-3 transition-colors hover:bg-surface-2">
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

/** Cuadro para registrar los litros del día. Admite varias entradas por día. */
function CuadroProduccionDia({
  registros,
}: {
  registros: ProduccionDiaria[] | undefined;
}) {
  const [fecha, setFecha] = useState(todayIso());
  const [litros, setLitros] = useState("");
  const [guardando, setGuardando] = useState(false);

  const entradas = useMemo(
    () =>
      (registros ?? [])
        .filter((r) => r.fecha === fecha)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [registros, fecha],
  );
  const totalDia = entradas.reduce((s, r) => s + r.litros, 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(litros.replace(",", "."));
    if (!isFinite(val) || val <= 0) return;
    setGuardando(true);
    try {
      await agregarProduccionDia(fecha, val);
      setLitros("");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between bg-info-soft px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-info text-white">
            <Droplets size={20} />
          </span>
          <div>
            <p className="font-semibold text-info">Litros del día</p>
            <p className="text-xs text-info/80">Puedes anotar varias veces</p>
          </div>
        </div>
        <p className="text-lg font-bold tabular-nums text-info">
          {formatLitros(totalDia)}
        </p>
      </div>

      <form onSubmit={submit} className="space-y-3 p-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha">
            <Input
              type="date"
              value={fecha}
              max={todayIso()}
              onChange={(e) => setFecha(e.target.value)}
            />
          </Field>
          <Field label="Litros">
            <Input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              placeholder="Ej. 120"
              value={litros}
              onChange={(e) => setLitros(e.target.value)}
            />
          </Field>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={guardando}>
          {guardando ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Plus size={20} />
          )}
          Agregar
        </Button>
      </form>

      {entradas.length > 0 && (
        <ul className="border-t border-border">
          {entradas.map((r, i) => (
            <li
              key={r.id}
              className="flex items-center gap-3 px-5 py-2.5 text-sm"
            >
              <span className="text-muted-foreground">Toma {i + 1}</span>
              <span className="flex-1 font-medium">{formatLitros(r.litros)}</span>
              <button
                onClick={() => eliminarProduccionDia(r.id)}
                aria-label="Eliminar"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-danger-soft hover:text-danger"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
