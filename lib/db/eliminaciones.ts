import { db, newId, nowIso } from "./db";
import type { Eliminacion, TablaRemota } from "@/types/models";

/** Nombre remoto (Supabase) -> nombre de la tabla local en Dexie. */
export const TABLA_LOCAL: Record<TablaRemota, string> = {
  leche: "leche",
  sanidad: "sanidad",
  reproduccion: "reproduccion",
  gastos: "gastos",
  ingresos: "ingresos",
  produccion_diaria: "produccionDiaria",
};

/**
 * Borra un registro en el dispositivo y deja una marca de eliminación,
 * para que el borrado también se aplique en la nube y en los demás
 * dispositivos que usen la misma cuenta.
 */
export async function eliminarRegistro(
  tabla: TablaRemota,
  registroId: string,
): Promise<void> {
  const local = TABLA_LOCAL[tabla];
  await db.table(local).delete(registroId);

  const ts = nowIso();
  const marca: Eliminacion = {
    id: newId(),
    tabla,
    registroId,
    createdAt: ts,
    updatedAt: ts,
    syncStatus: "pending",
  };
  await db.eliminaciones.add(marca);
}

/** Aplica una eliminación recibida de la nube (borra el registro local). */
export async function aplicarEliminacionRemota(
  tabla: TablaRemota,
  registroId: string,
): Promise<void> {
  const local = TABLA_LOCAL[tabla];
  if (!local) return;
  await db.table(local).delete(registroId);
}
