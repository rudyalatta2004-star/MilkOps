import { db, newId, nowIso } from "./db";
import type { RegistroSanitario, TipoSanitario } from "@/types/models";

/** Alta de un registro sanitario (RF-03.1). */
export async function registrarSanitario(input: {
  animalId: string;
  tipo: TipoSanitario;
  producto: string;
  fecha: string;
  dosis?: string;
  observaciones?: string;
}): Promise<string> {
  const id = newId();
  const ts = nowIso();
  const registro: RegistroSanitario = {
    id,
    ...input,
    createdAt: ts,
    updatedAt: ts,
    syncStatus: "pending",
  };
  await db.sanidad.add(registro);
  return id;
}

/** Elimina un registro sanitario. */
export async function eliminarSanitario(id: string): Promise<void> {
  await db.sanidad.delete(id);
}

/** Historial sanitario de un animal (más reciente primero). */
export async function sanidadDeAnimal(
  animalId: string,
): Promise<RegistroSanitario[]> {
  const regs = await db.sanidad.where("animalId").equals(animalId).toArray();
  return regs.sort((a, b) => b.fecha.localeCompare(a.fecha));
}

/** Etiqueta legible de un tipo sanitario. */
export function etiquetaTipoSanitario(tipo: TipoSanitario): string {
  switch (tipo) {
    case "vacuna":
      return "Vacuna";
    case "desparasitacion":
      return "Desparasitación";
    case "tratamiento":
      return "Tratamiento";
  }
}
