import { db, newId, nowIso } from "./db";
import type {
  EventoReproductivo,
  TipoEventoReproductivo,
  EstadoReproductivo,
} from "@/types/models";
import { calcularFPP } from "@/lib/utils/reproduccion";

/**
 * Registra un evento reproductivo (RF-04.1) y actualiza el estado
 * reproductivo del animal (RF-04.2) según el tipo de evento:
 *  - inseminación / monta → "inseminada" + FPP calculada (RF-04.4)
 *  - diagnóstico          → "preñada" (confirmación de preñez)
 *  - parto                → "vacia"
 *  - celo                 → sin cambio de estado
 */
export async function registrarEvento(input: {
  animalId: string;
  tipo: TipoEventoReproductivo;
  fecha: string;
  reproductor?: string;
  observaciones?: string;
}): Promise<string> {
  const id = newId();
  const ts = nowIso();

  const fpp =
    input.tipo === "inseminacion" || input.tipo === "monta"
      ? calcularFPP(input.fecha)
      : undefined;

  const evento: EventoReproductivo = {
    id,
    ...input,
    fpp,
    createdAt: ts,
    updatedAt: ts,
    syncStatus: "pending",
  };
  await db.reproduccion.add(evento);

  const nuevoEstado = estadoSegunEvento(input.tipo);
  if (nuevoEstado) {
    const cambios: {
      estadoReproductivo: EstadoReproductivo;
      updatedAt: string;
      syncStatus: "pending";
      fechaInseminacion?: string;
    } = {
      estadoReproductivo: nuevoEstado,
      updatedAt: ts,
      syncStatus: "pending",
    };
    // Inseminación/monta fija la fecha; el parto la limpia.
    if (input.tipo === "inseminacion" || input.tipo === "monta") {
      cambios.fechaInseminacion = input.fecha;
    } else if (input.tipo === "parto") {
      cambios.fechaInseminacion = undefined;
    }
    await db.animales.update(input.animalId, cambios);
  }
  return id;
}

function estadoSegunEvento(
  tipo: TipoEventoReproductivo,
): EstadoReproductivo | null {
  switch (tipo) {
    case "inseminacion":
    case "monta":
      return "inseminada";
    case "diagnostico":
      return "preñada";
    case "parto":
      return "vacia";
    default:
      return null;
  }
}

/** Elimina un evento reproductivo. */
export async function eliminarEvento(id: string): Promise<void> {
  await db.reproduccion.delete(id);
}

/** Eventos reproductivos de un animal (más reciente primero). */
export async function reproduccionDeAnimal(
  animalId: string,
): Promise<EventoReproductivo[]> {
  const regs = await db.reproduccion.where("animalId").equals(animalId).toArray();
  return regs.sort((a, b) => b.fecha.localeCompare(a.fecha));
}

/** Última inseminación o monta (para calcular gestación y FPP). */
export function ultimaInseminacion(
  eventos: EventoReproductivo[],
): EventoReproductivo | undefined {
  return eventos
    .filter((e) => e.tipo === "inseminacion" || e.tipo === "monta")
    .sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
}

/** Etiqueta legible de un tipo de evento reproductivo. */
export function etiquetaTipoEvento(tipo: TipoEventoReproductivo): string {
  switch (tipo) {
    case "celo":
      return "Celo";
    case "inseminacion":
      return "Inseminación";
    case "monta":
      return "Monta";
    case "parto":
      return "Parto";
    case "diagnostico":
      return "Diagnóstico de preñez";
  }
}
