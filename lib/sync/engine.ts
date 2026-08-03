import { supabase, cloudEnabled, BUCKET_FOTOS } from "@/lib/supabase/client";
import { db, nowIso } from "@/lib/db/db";
import type {
  Animal,
  RegistroLeche,
  RegistroSanitario,
  EventoReproductivo,
  Gasto,
  Ingreso,
  ProduccionDiaria,
} from "@/types/models";

const LAST_SYNC_KEY = "appvaca-last-sync";

export interface ResultadoSync {
  subidos: number;
  bajados: number;
  fecha: string;
}

/** Indica si hay sesión iniciada en la nube. */
export async function usuarioActual() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

/* ------------------------------------------------------------------ */
/* Mapeo local (camelCase) <-> remoto (snake_case)                     */
/* ------------------------------------------------------------------ */

function animalToRow(a: Animal, userId: string) {
  return {
    id: a.id,
    user_id: userId,
    nombre: a.nombre,
    arete: a.arete ?? null,
    raza: a.raza ?? null,
    sexo: a.sexo ?? null,
    fecha_nacimiento: a.fechaNacimiento || null,
    estado_productivo: a.estadoProductivo,
    estado_reproductivo: a.estadoReproductivo,
    fecha_inseminacion: a.fechaInseminacion || null,
    precio: a.precio ?? null,
    foto_url: a.fotoUrl ?? null,
    observaciones: a.observaciones ?? null,
    activo: a.activo,
    created_at: a.createdAt,
    updated_at: a.updatedAt,
  };
}

function rowToAnimal(r: Record<string, unknown>): Partial<Animal> {
  return {
    id: r.id as string,
    remoteId: r.id as string,
    nombre: r.nombre as string,
    arete: (r.arete as string) ?? undefined,
    raza: (r.raza as string) ?? "",
    sexo: (r.sexo as Animal["sexo"]) ?? "hembra",
    fechaNacimiento: (r.fecha_nacimiento as string) ?? undefined,
    estadoProductivo: r.estado_productivo as Animal["estadoProductivo"],
    estadoReproductivo: r.estado_reproductivo as Animal["estadoReproductivo"],
    fechaInseminacion: (r.fecha_inseminacion as string) ?? undefined,
    precio: r.precio != null ? Number(r.precio) : undefined,
    fotoUrl: (r.foto_url as string) ?? undefined,
    observaciones: (r.observaciones as string) ?? undefined,
    activo: (r.activo as boolean) ?? true,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
    syncStatus: "synced",
  };
}

function lecheToRow(r: RegistroLeche, userId: string) {
  return {
    id: r.id,
    user_id: userId,
    animal_id: r.animalId,
    fecha: r.fecha,
    litros: r.litros,
    observaciones: r.observaciones ?? null,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  };
}

function sanidadToRow(r: RegistroSanitario, userId: string) {
  return {
    id: r.id,
    user_id: userId,
    animal_id: r.animalId,
    tipo: r.tipo,
    producto: r.producto,
    fecha: r.fecha,
    dosis: r.dosis ?? null,
    observaciones: r.observaciones ?? null,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  };
}

function reproToRow(r: EventoReproductivo, userId: string) {
  return {
    id: r.id,
    user_id: userId,
    animal_id: r.animalId,
    tipo: r.tipo,
    fecha: r.fecha,
    reproductor: r.reproductor ?? null,
    fpp: r.fpp ?? null,
    observaciones: r.observaciones ?? null,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  };
}

function gastoToRow(r: Gasto, userId: string) {
  return {
    id: r.id,
    user_id: userId,
    fecha: r.fecha,
    concepto: r.concepto,
    monto: r.monto,
    categoria: r.categoria,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  };
}

function ingresoToRow(r: Ingreso, userId: string) {
  return {
    id: r.id,
    user_id: userId,
    fecha: r.fecha,
    concepto: r.concepto,
    monto: r.monto,
    tipo: r.tipo,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  };
}

function prodDiariaToRow(r: ProduccionDiaria, userId: string) {
  return {
    id: r.id,
    user_id: userId,
    fecha: r.fecha,
    litros: r.litros,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  };
}

/* ------------------------------------------------------------------ */
/* Subida (push)                                                       */
/* ------------------------------------------------------------------ */

async function subirFoto(userId: string, a: Animal): Promise<string | undefined> {
  if (!supabase || !a.fotoBlob) return a.fotoUrl;
  const ruta = `${userId}/${a.id}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET_FOTOS)
    .upload(ruta, a.fotoBlob, { upsert: true, contentType: "image/jpeg" });
  if (error) return a.fotoUrl;
  const { data } = supabase.storage.from(BUCKET_FOTOS).getPublicUrl(ruta);
  return data.publicUrl;
}

async function push(userId: string): Promise<number> {
  if (!supabase) return 0;
  let subidos = 0;

  // Animales (incluye subida de fotos)
  const animalesPend = await db.animales
    .where("syncStatus")
    .equals("pending")
    .toArray();
  for (const a of animalesPend) {
    const fotoUrl = await subirFoto(userId, a);
    if (fotoUrl && fotoUrl !== a.fotoUrl) {
      a.fotoUrl = fotoUrl;
      await db.animales.update(a.id, { fotoUrl });
    }
    const { error } = await supabase.from("animales").upsert(animalToRow(a, userId));
    if (!error) {
      await db.animales.update(a.id, { syncStatus: "synced", remoteId: a.id });
      subidos++;
    }
  }

  // Leche
  const lechePend = await db.leche.where("syncStatus").equals("pending").toArray();
  for (const r of lechePend) {
    const { error } = await supabase.from("leche").upsert(lecheToRow(r, userId));
    if (!error) {
      await db.leche.update(r.id, { syncStatus: "synced", remoteId: r.id });
      subidos++;
    }
  }

  // Sanidad
  const sanidadPend = await db.sanidad.where("syncStatus").equals("pending").toArray();
  for (const r of sanidadPend) {
    const { error } = await supabase.from("sanidad").upsert(sanidadToRow(r, userId));
    if (!error) {
      await db.sanidad.update(r.id, { syncStatus: "synced", remoteId: r.id });
      subidos++;
    }
  }

  // Reproducción
  const reproPend = await db.reproduccion.where("syncStatus").equals("pending").toArray();
  for (const r of reproPend) {
    const { error } = await supabase.from("reproduccion").upsert(reproToRow(r, userId));
    if (!error) {
      await db.reproduccion.update(r.id, { syncStatus: "synced", remoteId: r.id });
      subidos++;
    }
  }

  // Gastos
  const gastosPend = await db.gastos.where("syncStatus").equals("pending").toArray();
  for (const r of gastosPend) {
    const { error } = await supabase.from("gastos").upsert(gastoToRow(r, userId));
    if (!error) {
      await db.gastos.update(r.id, { syncStatus: "synced", remoteId: r.id });
      subidos++;
    }
  }

  // Ingresos
  const ingresosPend = await db.ingresos.where("syncStatus").equals("pending").toArray();
  for (const r of ingresosPend) {
    const { error } = await supabase.from("ingresos").upsert(ingresoToRow(r, userId));
    if (!error) {
      await db.ingresos.update(r.id, { syncStatus: "synced", remoteId: r.id });
      subidos++;
    }
  }

  // Producción diaria
  const prodPend = await db.produccionDiaria.where("syncStatus").equals("pending").toArray();
  for (const r of prodPend) {
    const { error } = await supabase
      .from("produccion_diaria")
      .upsert(prodDiariaToRow(r, userId));
    if (!error) {
      await db.produccionDiaria.update(r.id, { syncStatus: "synced", remoteId: r.id });
      subidos++;
    }
  }

  return subidos;
}

/* ------------------------------------------------------------------ */
/* Bajada (pull)                                                       */
/* ------------------------------------------------------------------ */

async function pull(desde: string): Promise<number> {
  if (!supabase) return 0;
  let bajados = 0;

  // Animales
  const { data: aRows } = await supabase
    .from("animales")
    .select("*")
    .gt("updated_at", desde);
  for (const row of aRows ?? []) {
    const remoto = rowToAnimal(row);
    const local = await db.animales.get(remoto.id!);
    if (!local) {
      await db.animales.add(remoto as Animal);
      bajados++;
    } else if ((remoto.updatedAt ?? "") > local.updatedAt) {
      // conserva la foto local (blob) si existe
      await db.animales.update(remoto.id!, {
        ...remoto,
        fotoBlob: local.fotoBlob,
      });
      bajados++;
    }
  }

  // Tablas simples
  const mapper: Record<string, (r: Record<string, unknown>) => Record<string, unknown>> = {
    leche: (r) => ({
      id: r.id, remoteId: r.id, animalId: r.animal_id, fecha: r.fecha,
      litros: Number(r.litros), observaciones: r.observaciones ?? undefined,
      createdAt: r.created_at, updatedAt: r.updated_at, syncStatus: "synced",
    }),
    sanidad: (r) => ({
      id: r.id, remoteId: r.id, animalId: r.animal_id, tipo: r.tipo,
      producto: r.producto, fecha: r.fecha, dosis: r.dosis ?? undefined,
      observaciones: r.observaciones ?? undefined,
      createdAt: r.created_at, updatedAt: r.updated_at, syncStatus: "synced",
    }),
    reproduccion: (r) => ({
      id: r.id, remoteId: r.id, animalId: r.animal_id, tipo: r.tipo,
      fecha: r.fecha, reproductor: r.reproductor ?? undefined,
      fpp: r.fpp ?? undefined, observaciones: r.observaciones ?? undefined,
      createdAt: r.created_at, updatedAt: r.updated_at, syncStatus: "synced",
    }),
    gastos: (r) => ({
      id: r.id, remoteId: r.id, fecha: r.fecha, concepto: r.concepto,
      monto: Number(r.monto), categoria: r.categoria,
      createdAt: r.created_at, updatedAt: r.updated_at, syncStatus: "synced",
    }),
    ingresos: (r) => ({
      id: r.id, remoteId: r.id, fecha: r.fecha, concepto: r.concepto,
      monto: Number(r.monto), tipo: r.tipo,
      createdAt: r.created_at, updatedAt: r.updated_at, syncStatus: "synced",
    }),
  };

  for (const tabla of [
    "leche",
    "sanidad",
    "reproduccion",
    "gastos",
    "ingresos",
  ] as const) {
    const { data: rows } = await supabase
      .from(tabla)
      .select("*")
      .gt("updated_at", desde);
    const table = (db as unknown as Record<string, typeof db.leche>)[tabla];
    for (const row of rows ?? []) {
      const remoto = mapper[tabla](row) as unknown as { id: string; updatedAt: string };
      const local = await table.get(remoto.id);
      if (!local) {
        await table.add(remoto as unknown as RegistroLeche);
        bajados++;
      } else if (remoto.updatedAt > local.updatedAt) {
        await table.update(remoto.id, remoto as Partial<RegistroLeche>);
        bajados++;
      }
    }
  }

  // Producción diaria (nombre remoto distinto al local)
  const { data: pRows } = await supabase
    .from("produccion_diaria")
    .select("*")
    .gt("updated_at", desde);
  for (const row of pRows ?? []) {
    const remoto = {
      id: row.id as string,
      remoteId: row.id as string,
      fecha: row.fecha as string,
      litros: Number(row.litros),
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      syncStatus: "synced" as const,
    };
    const local = await db.produccionDiaria.get(remoto.id);
    if (!local) {
      await db.produccionDiaria.add(remoto);
      bajados++;
    } else if (remoto.updatedAt > local.updatedAt) {
      await db.produccionDiaria.update(remoto.id, remoto);
      bajados++;
    }
  }

  return bajados;
}

/* ------------------------------------------------------------------ */
/* Orquestación                                                        */
/* ------------------------------------------------------------------ */

let sincronizando = false;

/** Ejecuta una sincronización completa (push + pull). */
export async function sincronizar(): Promise<ResultadoSync> {
  if (!cloudEnabled || !supabase) throw new Error("Nube no configurada");
  if (sincronizando) throw new Error("Ya hay una sincronización en curso");

  const user = await usuarioActual();
  if (!user) throw new Error("Inicia sesión para sincronizar");

  sincronizando = true;
  try {
    const subidos = await push(user.id);
    const desde =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(LAST_SYNC_KEY) ?? "1970-01-01T00:00:00.000Z"
        : "1970-01-01T00:00:00.000Z";
    const bajados = await pull(desde);
    const fecha = nowIso();
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(LAST_SYNC_KEY, fecha);
    }
    return { subidos, bajados, fecha };
  } finally {
    sincronizando = false;
  }
}

/** Número de registros locales pendientes de subir. */
export async function pendientesLocales(): Promise<number> {
  const [a, l, s, r, g, i, p] = await Promise.all([
    db.animales.where("syncStatus").equals("pending").count(),
    db.leche.where("syncStatus").equals("pending").count(),
    db.sanidad.where("syncStatus").equals("pending").count(),
    db.reproduccion.where("syncStatus").equals("pending").count(),
    db.gastos.where("syncStatus").equals("pending").count(),
    db.ingresos.where("syncStatus").equals("pending").count(),
    db.produccionDiaria.where("syncStatus").equals("pending").count(),
  ]);
  return a + l + s + r + g + i + p;
}
