"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AnimalForm } from "@/components/animal-form";

export default function NuevoAnimalPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-surface-2"
          aria-label="Volver"
        >
          <ChevronLeft size={22} />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo animal</h1>
      </div>
      <AnimalForm />
    </div>
  );
}
