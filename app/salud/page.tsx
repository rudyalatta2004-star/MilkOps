"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { Search, Syringe, Heart, ChevronRight } from "lucide-react";
import { db } from "@/lib/db/db";
import { normaliza } from "@/lib/db/animales";
import { AnimalFoto } from "@/components/animal-foto";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge, badgeReproductivo } from "@/components/ui/badge";
import { formatFecha } from "@/lib/utils/format";
import { CeloCalendar } from "@/components/celo-calendar";

export default function SaludPage() {
  const [q, setQ] = useState("");
  const animales = useLiveQuery(() => db.animales.toArray(), [], undefined);
  const sanidad = useLiveQuery(() => db.sanidad.toArray(), [], undefined);

  const cargando = animales === undefined || sanidad === undefined;

  const ultimaVacunaPorAnimal = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const r of sanidad ?? []) {
      if (r.tipo !== "vacuna") continue;
      const prev = mapa.get(r.animalId);
      if (!prev || r.fecha > prev) mapa.set(r.animalId, r.fecha);
    }
    return mapa;
  }, [sanidad]);

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

  const preñadas = lista.filter((a) => a.estadoReproductivo === "preñada").length;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
        Salud
      </h1>

      {/* Calendario de celo (estilo Flo) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Heart size={18} className="text-rose-strong" />
          <h2 className="font-semibold tracking-tight">Calendario de celo</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Proyección automática cada 21 días desde el último celo. Regístralo en
          la ficha de la vaca (Reproducción → Celo).
        </p>
        <CeloCalendar />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Heart}
          label="Preñadas"
          value={cargando ? "…" : preñadas}
          tone="success"
        />
        <StatCard
          icon={Syringe}
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
            const rep = badgeReproductivo(a.estadoReproductivo);
            const ultVac = ultimaVacunaPorAnimal.get(a.id);
            return (
              <li key={a.id}>
                <Link href={`/animales/${a.id}`}>
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
                        Última vacuna:{" "}
                        {ultVac ? formatFecha(ultVac) : "sin registro"}
                      </p>
                    </div>
                    <Badge tone={rep.tone}>{rep.label}</Badge>
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
