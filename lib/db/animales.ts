import { db, newId, nowIso } from "./db";
import type {
  Animal,
  EstadoProductivo,
  EstadoReproductivo,
  Sexo,
} from "@/types/models";

/** Datos editables de un animal (sin metadatos de sistema). */
export interface AnimalInput {
  nombre: string;
  arete?: string;
  raza: string;
  sexo: Sexo;
  fechaNacimiento?: string;
  estadoProductivo: EstadoProductivo;
  estadoReproductivo: EstadoReproductivo;
  fechaInseminacion?: string;
  precio?: number;
  observaciones?: string;
  fotoBlob?: Blob;
}

/** Crea un animal nuevo en la base local. Devuelve su id. */
export async function crearAnimal(input: AnimalInput): Promise<string> {
  const id = newId();
  const ts = nowIso();
  const animal: Animal = {
    id,
    ...input,
    activo: true,
    createdAt: ts,
    updatedAt: ts,
    syncStatus: "pending",
  };
  await db.animales.add(animal);
  return id;
}

/** Actualiza los campos de un animal existente. */
export async function actualizarAnimal(
  id: string,
  cambios: Partial<AnimalInput> & {
    estadoReproductivo?: EstadoReproductivo;
    activo?: boolean;
  },
): Promise<void> {
  await db.animales.update(id, {
    ...cambios,
    updatedAt: nowIso(),
    syncStatus: "pending",
  });
}

/** Obtiene un animal por id. */
export function obtenerAnimal(id: string) {
  return db.animales.get(id);
}

/**
 * Búsqueda por nombre (RF-01.1). Coincidencia parcial, sin distinguir
 * mayúsculas/acentos, ordenada por nombre. Si el término está vacío,
 * devuelve todos los animales activos.
 */
export async function buscarAnimales(termino: string): Promise<Animal[]> {
  const q = normaliza(termino.trim());
  const todos = await db.animales.toArray();
  const activos = todos.filter((a) => a.activo !== false);

  const filtrados = q
    ? activos.filter(
        (a) =>
          normaliza(a.nombre).includes(q) ||
          normaliza(a.arete ?? "").includes(q),
      )
    : activos;

  return filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

/** Normaliza texto: minúsculas y sin acentos, para comparar. */
export function normaliza(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}
