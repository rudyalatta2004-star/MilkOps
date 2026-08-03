import Dexie, { type EntityTable } from "dexie";
import type {
  Animal,
  RegistroLeche,
  RegistroSanitario,
  EventoReproductivo,
  Gasto,
  Ingreso,
  ProduccionDiaria,
} from "@/types/models";

/**
 * Base de datos local (IndexedDB vía Dexie).
 * Vive dentro del navegador y funciona 100% offline.
 * Los índices están pensados para las consultas de cada fase.
 */
class AppVacaDB extends Dexie {
  animales!: EntityTable<Animal, "id">;
  leche!: EntityTable<RegistroLeche, "id">;
  sanidad!: EntityTable<RegistroSanitario, "id">;
  reproduccion!: EntityTable<EventoReproductivo, "id">;
  gastos!: EntityTable<Gasto, "id">;
  ingresos!: EntityTable<Ingreso, "id">;
  produccionDiaria!: EntityTable<ProduccionDiaria, "id">;

  constructor() {
    super("appvaca");

    this.version(1).stores({
      animales:
        "id, nombre, arete, estadoProductivo, estadoReproductivo, activo, syncStatus, updatedAt",
      leche:
        "id, animalId, fecha, turno, syncStatus, updatedAt, [animalId+fecha]",
      sanidad:
        "id, animalId, fecha, tipo, syncStatus, updatedAt, [animalId+fecha]",
      reproduccion:
        "id, animalId, fecha, tipo, syncStatus, updatedAt, [animalId+fecha]",
    });

    // v2: control lechero semanal — se elimina el índice por turno.
    this.version(2).stores({
      leche: "id, animalId, fecha, syncStatus, updatedAt, [animalId+fecha]",
    });

    // v3: control financiero (gastos e ingresos).
    this.version(3).stores({
      gastos: "id, fecha, categoria, syncStatus, updatedAt",
      ingresos: "id, fecha, tipo, syncStatus, updatedAt",
    });

    // v4: producción diaria total del hato (una fila por día).
    this.version(4).stores({
      produccionDiaria: "id, fecha, syncStatus, updatedAt",
    });
  }
}

export const db = new AppVacaDB();

/** Genera un identificador único (uuid v4) disponible en el navegador. */
export function newId(): string {
  return crypto.randomUUID();
}

/** Timestamp ISO actual, para createdAt/updatedAt. */
export function nowIso(): string {
  return new Date().toISOString();
}
