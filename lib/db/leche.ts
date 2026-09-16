import { db, newId, nowIso } from "./db";
import { eliminarRegistro } from "./eliminaciones";
import type { RegistroLeche } from "@/types/models";

/** Alta de una medición mensual de leche. */
export async function registrarLeche(input: {
  animalId: string;
  fecha: string;
  litros: number;
  observaciones?: string;
}): Promise<string> {
  const id = newId();
  const ts = nowIso();
  const registro: RegistroLeche = {
    id,
    ...input,
    createdAt: ts,
    updatedAt: ts,
    syncStatus: "pending",
  };
  await db.leche.add(registro);
  return id;
}

/** Elimina un registro de producción. */
export async function eliminarLeche(id: string): Promise<void> {
  await eliminarRegistro("leche", id);
}

/** Registros de un animal, del más reciente al más antiguo. */
export async function lecheDeAnimal(animalId: string): Promise<RegistroLeche[]> {
  const regs = await db.leche.where("animalId").equals(animalId).toArray();
  return regs.sort((a, b) => b.fecha.localeCompare(a.fecha));
}

/* ------------------------------------------------------------------ */
/* Agregados                                                           */
/* ------------------------------------------------------------------ */

export interface ResumenPeriodo {
  clave: string;
  etiqueta: string;
  total: number;
  registros: number;
  promedio: number;
}

/** Agrupa por mes (para RF-02.2). */
export function resumenMensual(registros: RegistroLeche[]): ResumenPeriodo[] {
  const meses = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ];
  const mapa = new Map<string, RegistroLeche[]>();
  for (const r of registros) {
    const clave = r.fecha.slice(0, 7); // YYYY-MM
    (mapa.get(clave) ?? mapa.set(clave, []).get(clave)!).push(r);
  }
  return [...mapa.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([clave, regs]) => {
      const total = regs.reduce((s, r) => s + r.litros, 0);
      const [anio, mes] = clave.split("-");
      return {
        clave,
        etiqueta: `${meses[Number(mes) - 1]} ${anio}`,
        total,
        registros: regs.length,
        promedio: total / regs.length,
      };
    });
}
