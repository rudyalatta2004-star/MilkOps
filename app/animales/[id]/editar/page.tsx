"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronLeft } from "lucide-react";
import { db } from "@/lib/db/db";
import { AnimalForm } from "@/components/animal-form";
import { Card } from "@/components/ui/card";

export default function EditarAnimalPage() {
  const { id } = useParams<{ id: string }>();
  const animal = useLiveQuery(() => db.animales.get(id), [id], undefined);

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
        <h1 className="text-2xl font-semibold tracking-tight">Editar animal</h1>
      </div>

      {animal === undefined ? (
        <div className="skeleton h-96 rounded-xl" />
      ) : !animal ? (
        <Card className="py-12 text-center text-sm text-muted-foreground">
          Animal no encontrado.
        </Card>
      ) : (
        <AnimalForm animal={animal} />
      )}
    </div>
  );
}
