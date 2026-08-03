"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ChevronLeft,
  Plus,
  Syringe,
  Bug,
  Pill,
  Trash2,
  Loader2,
} from "lucide-react";
import { db } from "@/lib/db/db";
import {
  registrarSanitario,
  eliminarSanitario,
  etiquetaTipoSanitario,
} from "@/lib/db/sanidad";
import type { TipoSanitario } from "@/types/models";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { formatFecha, todayIso } from "@/lib/utils/format";

const ICONO: Record<TipoSanitario, typeof Syringe> = {
  vacuna: Syringe,
  desparasitacion: Bug,
  tratamiento: Pill,
};

export default function SanidadAnimalPage() {
  const { id } = useParams<{ id: string }>();
  const animal = useLiveQuery(() => db.animales.get(id), [id], undefined);
  const registros = useLiveQuery(
    async () => {
      const regs = await db.sanidad.where("animalId").equals(id).toArray();
      return regs.sort((a, b) => b.fecha.localeCompare(a.fecha));
    },
    [id],
    undefined,
  );

  const [tipo, setTipo] = useState<TipoSanitario>("vacuna");
  const [producto, setProducto] = useState("");
  const [fecha, setFecha] = useState(todayIso());
  const [dosis, setDosis] = useState("");
  const [obs, setObs] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    if (!producto.trim()) return;
    setGuardando(true);
    try {
      await registrarSanitario({
        animalId: id,
        tipo,
        producto: producto.trim(),
        fecha,
        dosis: dosis.trim() || undefined,
        observaciones: obs.trim() || undefined,
      });
      setProducto("");
      setDosis("");
      setObs("");
      setFecha(todayIso());
    } finally {
      setGuardando(false);
    }
  }

  const lista = registros ?? [];

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
            Sanidad · {animal?.nombre ?? "…"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Vacunas, desparasitaciones y tratamientos
          </p>
        </div>
      </div>

      <Card className="p-5">
        <form onSubmit={agregar} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo">
              <Select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoSanitario)}
              >
                <option value="vacuna">Vacuna</option>
                <option value="desparasitacion">Desparasitación</option>
                <option value="tratamiento">Tratamiento</option>
              </Select>
            </Field>
            <Field label="Fecha de aplicación">
              <Input
                type="date"
                value={fecha}
                max={todayIso()}
                onChange={(e) => setFecha(e.target.value)}
              />
            </Field>
            <Field label="Producto *">
              <Input
                value={producto}
                onChange={(e) => setProducto(e.target.value)}
                placeholder="Ej. Aftosa, Ivermectina…"
              />
            </Field>
            <Field label="Dosis">
              <Input
                value={dosis}
                onChange={(e) => setDosis(e.target.value)}
                placeholder="Ej. 5 ml"
              />
            </Field>
          </div>
          <Field label="Observaciones">
            <Textarea
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Opcional"
            />
          </Field>
          <Button type="submit" size="lg" className="w-full" disabled={guardando}>
            {guardando ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Plus size={20} />
            )}
            Registrar
          </Button>
        </form>
      </Card>

      {registros === undefined ? (
        <div className="skeleton h-40 rounded-xl" />
      ) : lista.length === 0 ? (
        <Card className="py-10 text-center text-sm text-muted-foreground">
          Aún no hay registros sanitarios.
        </Card>
      ) : (
        <ul className="space-y-2">
          {lista.map((r) => {
            const Icono = ICONO[r.tipo];
            return (
              <li key={r.id}>
                <Card className="flex items-start gap-3 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Icono size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{r.producto}</p>
                    <p className="text-xs text-muted-foreground">
                      {etiquetaTipoSanitario(r.tipo)} · {formatFecha(r.fecha)}
                      {r.dosis ? ` · ${r.dosis}` : ""}
                    </p>
                    {r.observaciones && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {r.observaciones}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => eliminarSanitario(r.id)}
                    aria-label="Eliminar"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-danger-soft hover:text-danger"
                  >
                    <Trash2 size={16} />
                  </button>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
