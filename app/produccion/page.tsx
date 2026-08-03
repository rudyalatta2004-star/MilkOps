"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { Search, Droplets, ChevronRight } from "lucide-react";
import { db } from "@/lib/db/db";
import { normaliza } from "@/lib/db/animales";
import { AnimalFoto } from "@/components/animal-foto";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { formatLitros, todayIso } from "@/lib/utils/format";

export default function ProduccionPage() {
  const [q, setQ] = useState("");
  const animales = useLiveQuery(() => db.animales.toArray(), [], undefined);
  const leche = useLiveQuery(() => db.leche.toArray(), [], undefined);

  const cargando = animales === undefined || leche === undefined;

  const { totalMes, ultimoPorAnimal } = useMemo(() => {
    const regs = leche ?? [];
    const mesActual = todayIso().slice(0, 7);
    let totalMes = 0;
    const ultimo = new Map<string, { fecha: string; litros: number }>();
    for (const r of regs) {
      if (r.fecha.slice(0, 7) === mesActual) totalMes += r.litros;
      const prev = ultimo.get(r.animalId);
      if (!prev || r.fecha > prev.fecha)
        ultimo.set(r.animalId, { fecha: r.fecha, litros: r.litros });
    }
    return { totalMes, ultimoPorAnimal: ultimo };
  }, [leche]);

  const lista = useMemo(() => {
    const activos = (animales ?? []).filter((a) => a.activo !== false);
    const term = normaliza(q.trim());
    const filtrados = term
      ? activos.filter(
          (a) =>
            normaliza(a.nombre).includes(term) ||
            normaliza(a.arete ?? "").includes(term),
        )
      : activos;
    return filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [animales, q]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
        Producción
      </h1>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Droplets}
          label="Leche este mes"
          value={cargando ? "…" : formatLitros(totalMes)}
          tone="info"
        />
        <StatCard
          icon={Droplets}
          label="Animales"
          value={cargando ? "…" : lista.length}
          tone="primary"
        />
      </div>

      <div className="relative">
        <Search
          size={20}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar animal…"
          className="h-14 w-full rounded-2xl border border-border bg-surface pl-12 pr-4 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
          autoComplete="off"
        />
      </div>

      {cargando ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <Card className="py-10 text-center text-sm text-muted-foreground">
          No hay animales para mostrar.
        </Card>
      ) : (
        <ul className="space-y-2">
          {lista.map((a) => {
            const u = ultimoPorAnimal.get(a.id);
            return (
              <li key={a.id}>
                <Link href={`/animales/${a.id}/produccion`}>
                  <Card className="flex items-center gap-3 p-3 transition-colors hover:bg-surface-2">
                    <AnimalFoto
                      blob={a.fotoBlob}
                      url={a.fotoUrl}
                      alt={a.nombre}
                      className="h-12 w-12 shrink-0 rounded-xl"
                      iconSize={22}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{a.nombre}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {u
                          ? `Último: ${formatLitros(u.litros)}`
                          : "Sin mediciones"}
                      </p>
                    </div>
                    <ChevronRight size={20} className="text-muted-foreground" />
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
