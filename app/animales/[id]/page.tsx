"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ChevronLeft,
  Pencil,
  Trash2,
  Droplets,
  Syringe,
  Heart,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { db } from "@/lib/db/db";
import { actualizarAnimal } from "@/lib/db/animales";
import { AnimalFoto } from "@/components/animal-foto";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Badge,
  badgeProductivo,
  badgeReproductivo,
} from "@/components/ui/badge";
import { formatFecha, formatSoles } from "@/lib/utils/format";
import {
  mesesGestacion,
  calcularFPP,
  diasParaParto,
} from "@/lib/utils/reproduccion";

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}

export default function FichaAnimalPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const animal = useLiveQuery(() => db.animales.get(id), [id], undefined);

  if (animal === undefined) {
    return <div className="skeleton h-64 rounded-xl" />;
  }
  if (animal === null || !animal) {
    return (
      <Card className="py-12 text-center text-sm text-muted-foreground">
        Animal no encontrado.
      </Card>
    );
  }

  const prod = badgeProductivo(animal.estadoProductivo);
  const rep = badgeReproductivo(animal.estadoReproductivo);

  const gestando =
    (animal.estadoReproductivo === "preñada" ||
      animal.estadoReproductivo === "inseminada") &&
    !!animal.fechaInseminacion;
  const fi = animal.fechaInseminacion;
  const meses = fi ? mesesGestacion(fi) : 0;
  const fpp = fi ? calcularFPP(fi) : "";
  const diasParto = fi ? diasParaParto(fi) : 0;

  async function darDeBaja() {
    if (!confirm(`¿Dar de baja a ${animal!.nombre}? Se ocultará del listado.`))
      return;
    await actualizarAnimal(animal!.id, { activo: false });
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-surface-2"
          aria-label="Volver"
        >
          <ChevronLeft size={22} />
        </Link>
        <h1 className="flex-1 truncate text-2xl font-semibold tracking-tight">
          {animal.nombre}
        </h1>
        <Link href={`/animales/${animal.id}/editar`}>
          <Button variant="secondary" size="sm">
            <Pencil size={16} /> Editar
          </Button>
        </Link>
      </div>

      <Card className="p-5">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <AnimalFoto
            blob={animal.fotoBlob}
            url={animal.fotoUrl}
            alt={animal.nombre}
            className="h-32 w-32 shrink-0 rounded-2xl border border-border"
            iconSize={48}
          />
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              <Badge tone={rep.tone}>{rep.label}</Badge>
              <Badge tone={prod.tone}>{prod.label}</Badge>
            </div>
            <dl className="grid grid-cols-2 gap-4 text-left">
              {animal.arete && <Dato label="Arete / ID" value={animal.arete} />}
              <Dato label="Raza" value={animal.raza} />
              <Dato label="Sexo" value={animal.sexo === "hembra" ? "Hembra" : "Macho"} />
              <Dato
                label="Nacimiento"
                value={formatFecha(animal.fechaNacimiento)}
              />
              {animal.precio != null && (
                <Dato label="Precio" value={formatSoles(animal.precio)} />
              )}
            </dl>
          </div>
        </div>
        {animal.observaciones && (
          <p className="mt-4 rounded-xl bg-surface-2 px-4 py-3 text-sm text-muted-foreground">
            {animal.observaciones}
          </p>
        )}
      </Card>

      {/* Gestación / FPP (según fecha de inseminación) */}
      {gestando && (
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-soft text-success">
              <Heart size={20} />
            </span>
            <div>
              <p className="font-semibold">
                {animal.estadoReproductivo === "preñada"
                  ? "Preñez"
                  : "Inseminación"}
              </p>
              <p className="text-xs text-muted-foreground">
                Desde el {formatFecha(fi)}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 border-t border-border pt-3 text-center sm:text-left">
            <div>
              <p className="text-xs text-muted-foreground">Gestación</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">
                {meses} <span className="text-sm font-normal">meses</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">FPP</p>
              <p className="mt-0.5 text-sm font-semibold">{formatFecha(fpp)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Faltan</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">
                {diasParto >= 0 ? diasParto : 0}{" "}
                <span className="text-sm font-normal">días</span>
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Accesos a los módulos por animal */}
      <div className="grid gap-3 sm:grid-cols-3">
        <ModuloLink
          href={`/animales/${animal.id}/produccion`}
          icon={Droplets}
          tone="info"
          titulo="Producción"
          desc="Control de leche"
        />
        <ModuloLink
          href={`/animales/${animal.id}/sanidad`}
          icon={Syringe}
          tone="primary"
          titulo="Sanidad"
          desc="Vacunas y tratamientos"
        />
        <ModuloLink
          href={`/animales/${animal.id}/reproduccion`}
          icon={Heart}
          tone="danger"
          titulo="Reproducción"
          desc="Celo e inseminación"
        />
      </div>

      <button
        onClick={darDeBaja}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
      >
        <Trash2 size={18} /> Dar de baja
      </button>
    </div>
  );
}

const TONO: Record<string, string> = {
  info: "bg-info-soft text-info",
  primary: "bg-primary-soft text-primary",
  danger: "bg-danger-soft text-danger",
};

function ModuloLink({
  href,
  icon: Icon,
  tone,
  titulo,
  desc,
}: {
  href: string;
  icon: LucideIcon;
  tone: "info" | "primary" | "danger";
  titulo: string;
  desc: string;
}) {
  return (
    <Link href={href}>
      <Card className="flex items-center gap-3 p-4 transition-colors hover:bg-surface-2">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${TONO[tone]}`}
        >
          <Icon size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{titulo}</p>
          <p className="truncate text-xs text-muted-foreground">{desc}</p>
        </div>
        <ChevronRight size={18} className="text-muted-foreground" />
      </Card>
    </Link>
  );
}
