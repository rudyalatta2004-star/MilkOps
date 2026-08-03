"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FotoInput } from "@/components/foto-input";
import {
  crearAnimal,
  actualizarAnimal,
  type AnimalInput,
} from "@/lib/db/animales";
import type { Animal } from "@/types/models";
import { todayIso } from "@/lib/utils/format";

const RAZAS = [
  "Holstein",
  "Jersey",
  "Brown Swiss",
  "Gyr",
  "Girolando",
  "Criolla",
  "Otra",
];

export function AnimalForm({ animal }: { animal?: Animal }) {
  const router = useRouter();
  const editando = Boolean(animal);

  const [form, setForm] = useState<AnimalInput>({
    nombre: animal?.nombre ?? "",
    raza: animal?.raza ?? "Holstein",
    sexo: animal?.sexo ?? "hembra",
    fechaNacimiento: animal?.fechaNacimiento ?? "",
    estadoProductivo: animal?.estadoProductivo ?? "ordeño",
    estadoReproductivo: animal?.estadoReproductivo ?? "vacia",
    fechaInseminacion: animal?.fechaInseminacion ?? "",
    precio: animal?.precio,
    observaciones: animal?.observaciones ?? "",
    fotoBlob: animal?.fotoBlob,
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof AnimalInput>(key: K, val: AnimalInput[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setGuardando(true);
    try {
      if (animal) {
        await actualizarAnimal(animal.id, form);
        router.push(`/animales/${animal.id}`);
      } else {
        const id = await crearAnimal(form);
        router.push(`/animales/${id}`);
      }
    } catch {
      setError("No se pudo guardar. Intenta de nuevo.");
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Card className="p-5">
        <FotoInput
          value={form.fotoBlob}
          onChange={(blob) => set("fotoBlob", blob)}
        />
      </Card>

      <Card className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre *">
            <Input
              value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              placeholder="Ej. Lucero"
              autoFocus
            />
          </Field>
          <Field label="Raza">
            <Select value={form.raza} onChange={(e) => set("raza", e.target.value)}>
              {RAZAS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Sexo">
            <Select
              value={form.sexo}
              onChange={(e) => set("sexo", e.target.value as AnimalInput["sexo"])}
            >
              <option value="hembra">Hembra</option>
              <option value="macho">Macho</option>
            </Select>
          </Field>
          <Field label="Fecha de nacimiento">
            <Input
              type="date"
              value={form.fechaNacimiento}
              onChange={(e) => set("fechaNacimiento", e.target.value)}
            />
          </Field>
          <Field label="Precio (S/)" hint="Valor del animal, opcional">
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="Ej. 3500"
              value={form.precio ?? ""}
              onChange={(e) =>
                set(
                  "precio",
                  e.target.value === ""
                    ? undefined
                    : parseFloat(e.target.value),
                )
              }
            />
          </Field>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Estado actual
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Estado productivo">
            <Select
              value={form.estadoProductivo}
              onChange={(e) =>
                set(
                  "estadoProductivo",
                  e.target.value as AnimalInput["estadoProductivo"],
                )
              }
            >
              <option value="ordeño">En ordeño</option>
              <option value="seca">Seca</option>
            </Select>
          </Field>
          <Field label="Estado reproductivo">
            <Select
              value={form.estadoReproductivo}
              onChange={(e) => {
                const val = e.target
                  .value as AnimalInput["estadoReproductivo"];
                setForm((f) => ({
                  ...f,
                  estadoReproductivo: val,
                  // al pasar a "vacía" se limpia la fecha de inseminación
                  fechaInseminacion:
                    val === "vacia" ? "" : f.fechaInseminacion,
                }));
              }}
            >
              <option value="vacia">Vacía</option>
              <option value="inseminada">Inseminada</option>
              <option value="preñada">Preñada</option>
            </Select>
          </Field>
          {(form.estadoReproductivo === "inseminada" ||
            form.estadoReproductivo === "preñada") && (
            <Field
              label={
                form.estadoReproductivo === "preñada"
                  ? "Fecha de inseminación (inicio de preñez)"
                  : "Fecha de inseminación"
              }
              hint="Con esta fecha se calculan los meses de gestación y la FPP"
            >
              <Input
                type="date"
                max={todayIso()}
                value={form.fechaInseminacion ?? ""}
                onChange={(e) => set("fechaInseminacion", e.target.value)}
              />
            </Field>
          )}
        </div>
        <Field label="Observaciones">
          <Textarea
            value={form.observaciones}
            onChange={(e) => set("observaciones", e.target.value)}
            placeholder="Notas adicionales (opcional)"
          />
        </Field>
      </Card>

      {error && (
        <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" size="lg" className="flex-1" disabled={guardando}>
          {guardando ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Save size={20} />
          )}
          {editando ? "Guardar cambios" : "Registrar animal"}
        </Button>
      </div>
    </form>
  );
}
