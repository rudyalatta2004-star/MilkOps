import { db, newId, nowIso } from "./db";
import { eliminarRegistro } from "./eliminaciones";
import type { ProduccionDiaria } from "@/types/models";

/**
 * Agrega una entrada de litros para una fecha. Se pueden registrar
 * VARIAS entradas en un mismo día (p. ej. ordeño de mañana y tarde);
 * el total del día es la suma de todas.
 */
export async function agregarProduccionDia(
  fecha: string,
  litros: number,
): Promise<void> {
  const ts = nowIso();
  const registro: ProduccionDiaria = {
    id: newId(),
    fecha,
    litros,
    createdAt: ts,
    updatedAt: ts,
    syncStatus: "pending",
  };
  await db.produccionDiaria.add(registro);
}

/** Elimina una entrada de producción. */
export function eliminarProduccionDia(id: string): Promise<void> {
  return eliminarRegistro("produccion_diaria", id);
}

/** Suma de litros registrados para una fecha. */
export async function totalDelDia(fecha: string): Promise<number> {
  const regs = await db.produccionDiaria.where("fecha").equals(fecha).toArray();
  return regs.reduce((s, r) => s + r.litros, 0);
}
