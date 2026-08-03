"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ChevronLeft,
  Plus,
  Trash2,
  Loader2,
  Heart,
  CalendarClock,
  Baby,
} from "lucide-react";
import { db } from "@/lib/db/db";
import {
  registrarEvento,
  eliminarEvento,
  ultimaInseminacion,
  etiquetaTipoEvento,
} from "@/lib/db/reproduccion";
import type { TipoEventoReproductivo } from "@/types/models";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Badge, badgeReproductivo } from "@/components/ui/badge";
import { formatFecha, todayIso } from "@/lib/utils/format";
import {
  mesesGestacion,
  diasParaParto,
  calcularFPP,
} from "@/lib/utils/reproduccion";

const REQUIERE_REPRODUCTOR: TipoEventoReproductivo[] = ["inseminacion", "monta"];

export default function ReproduccionAnimalPage() {
  const { id } = useParams<{ id: string }>();
  const animal = useLiveQuery(() => db.animales.get(id), [id], undefined);
  const eventos = useLiveQuery(
    async () => {
      const regs = await db.reproduccion.where("animalId").equals(id).toArray();
      return regs.sort((a, b) => b.fecha.localeCompare(a.fecha));
    },
    [id],
    undefined,
  );

  const [tipo, setTipo] = useState<TipoEventoReproductivo>("celo");
  const [fecha, setFecha] = useState(todayIso());
  const [reproductor, setReproductor] = useState("");
  const [obs, setObs] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    try {
      await registrarEvento({
        animalId: id,
        tipo,
        fecha,
        reproductor: reproductor.trim() || undefined,
        observaciones: obs.trim() || undefined,
      });
      setReproductor("");
      setObs("");
      setFecha(todayIso());
      setTipo("celo");
    } finally {
      setGuardando(false);
    }
  }

  const lista = eventos ?? [];
  const insem = ultimaInseminacion(lista);
  const estado = animal?.estadoReproductivo;
  // La fecha del animal manda; si no, se usa el último evento de inseminación.
  const fechaBase = animal?.fechaInseminacion || insem?.fecha;
  const mostrarGestacion =
    (estado === "preñada" || estado === "inseminada") && !!fechaBase;

  const meses = fechaBase ? mesesGestacion(fechaBase) : 0;
  const fpp = fechaBase ? calcularFPP(fechaBase) : "";
  const diasParto = fechaBase ? diasParaParto(fechaBase) : 0;
  const rep = estado ? badgeReproductivo(estado) : null;

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
            Reproducción · {animal?.nombre ?? "…"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Celo, inseminación y gestación
          </p>
        </div>
      </div>

      {/* Estado actual y gestación (RF-04.2, RF-04.3, RF-04.4) */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Estado actual</p>
            {rep && (
              <div className="mt-1">
                <Badge tone={rep.tone}>{rep.label}</Badge>
              </div>
            )}
          </div>
          <Heart size={28} className="text-primary" />
        </div>

        {mostrarGestacion && (
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
            <div>
              <p className="text-xs text-muted-foreground">Gestación</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">
                {meses} <span className="text-sm font-normal">meses</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">FPP</p>
              <p className="mt-0.5 text-sm font-semibold">
                {formatFecha(fpp)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Faltan</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">
                {diasParto >= 0 ? diasParto : 0}{" "}
                <span className="text-sm font-normal">días</span>
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Registrar evento (RF-04.1) */}
      <Card className="p-5">
        <form onSubmit={agregar} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo de evento">
              <Select
                value={tipo}
                onChange={(e) =>
                  setTipo(e.target.value as TipoEventoReproductivo)
                }
              >
                <option value="celo">Celo</option>
                <option value="inseminacion">Inseminación</option>
                <option value="monta">Monta</option>
                <option value="diagnostico">Diagnóstico de preñez</option>
                <option value="parto">Parto</option>
              </Select>
            </Field>
            <Field label="Fecha">
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </Field>
          </div>
          {REQUIERE_REPRODUCTOR.includes(tipo) && (
            <Field label="Reproductor / pajilla">
              <Input
                value={reproductor}
                onChange={(e) => setReproductor(e.target.value)}
                placeholder="Ej. Toro Holstein 021"
              />
            </Field>
          )}
          <Field label="Observaciones">
            <Textarea
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Opcional"
            />
          </Field>
          {(tipo === "inseminacion" || tipo === "monta") && (
            <p className="rounded-xl bg-primary-soft px-4 py-2.5 text-xs text-primary">
              Se marcará como <strong>Inseminada</strong> y se calculará la
              fecha probable de parto (+283 días).
            </p>
          )}
          {tipo === "diagnostico" && (
            <p className="rounded-xl bg-success-soft px-4 py-2.5 text-xs text-success">
              Se marcará como <strong>Preñada</strong>.
            </p>
          )}
          {tipo === "parto" && (
            <p className="rounded-xl bg-surface-2 px-4 py-2.5 text-xs text-muted-foreground">
              Se marcará como <strong>Vacía</strong>.
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={guardando}>
            {guardando ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Plus size={20} />
            )}
            Registrar evento
          </Button>
        </form>
      </Card>

      {/* Historial */}
      {eventos === undefined ? (
        <div className="skeleton h-40 rounded-xl" />
      ) : lista.length === 0 ? (
        <Card className="py-10 text-center text-sm text-muted-foreground">
          Aún no hay eventos reproductivos.
        </Card>
      ) : (
        <ul className="space-y-2">
          {lista.map((ev) => (
            <li key={ev.id}>
              <Card className="flex items-start gap-3 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  {ev.tipo === "parto" ? (
                    <Baby size={18} />
                  ) : ev.tipo === "celo" ? (
                    <Heart size={18} />
                  ) : (
                    <CalendarClock size={18} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{etiquetaTipoEvento(ev.tipo)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFecha(ev.fecha)}
                    {ev.reproductor ? ` · ${ev.reproductor}` : ""}
                    {ev.fpp ? ` · FPP ${formatFecha(ev.fpp)}` : ""}
                  </p>
                  {ev.observaciones && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {ev.observaciones}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => eliminarEvento(ev.id)}
                  aria-label="Eliminar"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-danger-soft hover:text-danger"
                >
                  <Trash2 size={16} />
                </button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
