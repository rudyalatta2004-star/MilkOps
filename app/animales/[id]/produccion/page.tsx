"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronLeft, Plus, Droplets, Trash2, Loader2 } from "lucide-react";
import { db } from "@/lib/db/db";
import {
  registrarLeche,
  eliminarLeche,
  resumenMensual,
} from "@/lib/db/leche";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { StatCard } from "@/components/ui/stat-card";
import { formatFecha, formatLitros, todayIso } from "@/lib/utils/format";

export default function ProduccionAnimalPage() {
  const { id } = useParams<{ id: string }>();
  const animal = useLiveQuery(() => db.animales.get(id), [id], undefined);
  const registros = useLiveQuery(
    async () => {
      const regs = await db.leche.where("animalId").equals(id).toArray();
      return regs.sort((a, b) => b.fecha.localeCompare(a.fecha));
    },
    [id],
    undefined,
  );

  const [fecha, setFecha] = useState(todayIso());
  const [litros, setLitros] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [vista, setVista] = useState<"registros" | "mensual">("registros");

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(litros.replace(",", "."));
    if (!isFinite(val) || val <= 0) return;
    setGuardando(true);
    try {
      await registrarLeche({ animalId: id, fecha, litros: val });
      setLitros("");
      setFecha(todayIso());
    } finally {
      setGuardando(false);
    }
  }

  const lista = registros ?? [];
  const totalGeneral = lista.reduce((s, r) => s + r.litros, 0);
  const promedio = lista.length ? totalGeneral / lista.length : 0;
  const mensual = resumenMensual(lista);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-2">
        <Link
          href={`/animales/${id}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-surface-2"
          aria-label="Volver"
        >
          <ChevronLeft size={22} />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight">
            Producción · {animal?.nombre ?? "…"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Control lechero mensual · una medición al mes
          </p>
        </div>
      </div>

      {/* Alta rápida */}
      <Card className="p-5">
        <form onSubmit={agregar} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Fecha de la medición">
              <Input
                type="date"
                value={fecha}
                max={todayIso()}
                onChange={(e) => setFecha(e.target.value)}
              />
            </Field>
            <Field label="Litros por día">
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                placeholder="Ej. 12.5"
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
            Registrar medición
          </Button>
        </form>
      </Card>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Droplets}
          label="Promedio por medición"
          value={formatLitros(promedio)}
          tone="info"
        />
        <StatCard
          icon={Droplets}
          label="Mediciones"
          value={lista.length}
          tone="primary"
        />
      </div>

      {/* Historial (RF-02.2) */}
      <div className="flex justify-center">
        <Segmented
          value={vista}
          onChange={setVista}
          options={[
            { value: "registros", label: "Mediciones" },
            { value: "mensual", label: "Resumen mensual" },
          ]}
        />
      </div>

      {registros === undefined ? (
        <div className="skeleton h-40 rounded-xl" />
      ) : lista.length === 0 ? (
        <Card className="py-10 text-center text-sm text-muted-foreground">
          Aún no hay mediciones registradas.
        </Card>
      ) : vista === "registros" ? (
        <ul className="space-y-2">
          {lista.map((r) => (
            <li key={r.id}>
              <Card className="flex items-center gap-3 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-info-soft text-info">
                  <Droplets size={18} />
                </span>
                <div className="flex-1">
                  <p className="font-medium">{formatLitros(r.litros)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFecha(r.fecha)}
                  </p>
                </div>
                <button
                  onClick={() => eliminarLeche(r.id)}
                  aria-label="Eliminar"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-danger-soft hover:text-danger"
                >
                  <Trash2 size={16} />
                </button>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-2">
          {mensual.map((p) => (
            <li key={p.clave}>
              <Card className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{p.etiqueta}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.registros}{" "}
                    {p.registros === 1 ? "medición" : "mediciones"} · promedio{" "}
                    {formatLitros(p.promedio)}
                  </p>
                </div>
                <p className="text-lg font-semibold tabular-nums">
                  {formatLitros(p.total)}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
