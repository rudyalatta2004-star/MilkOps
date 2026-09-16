/**
 * Modelo de datos de APPVACA.
 * Diseñado local-first: cada entidad lleva metadatos de sincronización
 * (`updatedAt`, `syncStatus`, `remoteId`) para que la Fase 6 (nube) se
 * integre sin rediseñar el esquema.
 */

/** Estado de sincronización de un registro con la nube. */
export type SyncStatus = "pending" | "synced" | "deleted";

/** Campos comunes a toda entidad sincronizable. */
export interface SyncMeta {
  /** ID local (uuid generado en el dispositivo). */
  id: string;
  /** ID del registro en Supabase, una vez sincronizado. */
  remoteId?: string;
  /** ISO timestamp de última modificación local. */
  updatedAt: string;
  /** ISO timestamp de creación. */
  createdAt: string;
  /** Estado frente a la nube. */
  syncStatus: SyncStatus;
}

/* ------------------------------------------------------------------ */
/* Animal                                                              */
/* ------------------------------------------------------------------ */

export type EstadoProductivo = "ordeño" | "seca";
export type EstadoReproductivo = "vacia" | "inseminada" | "preñada";
export type Sexo = "hembra" | "macho";

export interface Animal extends SyncMeta {
  nombre: string;
  /** Número de arete / identificación (opcional). */
  arete?: string;
  raza: string;
  sexo: Sexo;
  /** Fecha de nacimiento (ISO, opcional). */
  fechaNacimiento?: string;
  estadoProductivo: EstadoProductivo;
  estadoReproductivo: EstadoReproductivo;
  /**
   * Fecha de inseminación (YYYY-MM-DD) desde la que cuenta la preñez.
   * Se usa para calcular meses de gestación y la FPP. Solo aplica cuando
   * el estado es "inseminada" o "preñada".
   */
  fechaInseminacion?: string;
  /** Precio / valor del animal en soles (S/). Opcional. */
  precio?: number;
  /** Foto guardada localmente como Blob (offline). */
  fotoBlob?: Blob;
  /** URL de la foto en Supabase Storage (tras sincronizar). */
  fotoUrl?: string;
  observaciones?: string;
  /** Marca de baja lógica (animal vendido/muerto) sin borrar historial. */
  activo: boolean;
}

/* ------------------------------------------------------------------ */
/* Producción lechera (RF-02)                                          */
/* ------------------------------------------------------------------ */

/**
 * Registro de producción. La medida se toma UNA VEZ AL MES por vaca:
 * ese valor representa la producción diaria del animal durante el mes.
 */
export interface RegistroLeche extends SyncMeta {
  animalId: string;
  /** Fecha de la medición en formato YYYY-MM-DD. */
  fecha: string;
  /** Litros medidos en la medición. */
  litros: number;
  observaciones?: string;
}

/* ------------------------------------------------------------------ */
/* Sanidad (RF-03)                                                     */
/* ------------------------------------------------------------------ */

export type TipoSanitario = "vacuna" | "desparasitacion" | "tratamiento";

export interface RegistroSanitario extends SyncMeta {
  animalId: string;
  tipo: TipoSanitario;
  /** Nombre del producto aplicado. */
  producto: string;
  /** Fecha de aplicación YYYY-MM-DD. */
  fecha: string;
  /** Dosis administrada (texto libre, p.ej. "5 ml"). */
  dosis?: string;
  observaciones?: string;
}

/* ------------------------------------------------------------------ */
/* Reproducción (RF-04)                                                */
/* ------------------------------------------------------------------ */

export type TipoEventoReproductivo =
  | "celo"
  | "inseminacion"
  | "monta"
  | "parto"
  | "diagnostico";

export interface EventoReproductivo extends SyncMeta {
  animalId: string;
  tipo: TipoEventoReproductivo;
  /** Fecha del evento YYYY-MM-DD. */
  fecha: string;
  /** Toro / pajilla / semental usado (para inseminación o monta). */
  reproductor?: string;
  /** FPP calculada (fecha + 283 días) para inseminación/monta confirmada. */
  fpp?: string;
  observaciones?: string;
}

/** Días de gestación bovina usados para calcular la Fecha Probable de Parto. */
export const DIAS_GESTACION = 283;

/* ------------------------------------------------------------------ */
/* Control financiero (Gastos, Ingresos y Liquidez)                    */
/* ------------------------------------------------------------------ */

export type CategoriaGasto =
  | "concentrado"
  | "medicamentos"
  | "personal"
  | "mantenimiento";

export interface Gasto extends SyncMeta {
  /** Fecha del egreso YYYY-MM-DD. */
  fecha: string;
  concepto: string;
  /** Monto en soles (S/). */
  monto: number;
  categoria: CategoriaGasto;
}

/**
 * Producción diaria total del hato (litros de todas las vacas en un día).
 * Es un registro simple e independiente por fecha.
 */
export interface ProduccionDiaria extends SyncMeta {
  /** Fecha YYYY-MM-DD (una fila por día). */
  fecha: string;
  /** Litros totales producidos ese día. */
  litros: number;
}

export type TipoIngreso = "quincena_leche" | "venta_animal" | "otro";

export interface Ingreso extends SyncMeta {
  /** Fecha del cobro YYYY-MM-DD. */
  fecha: string;
  concepto: string;
  /** Monto en soles (S/). */
  monto: number;
  tipo: TipoIngreso;
}

/* ------------------------------------------------------------------ */
/* Eliminaciones (tombstones) para sincronizar borrados                */
/* ------------------------------------------------------------------ */

/** Tablas cuyos borrados se sincronizan (nombre remoto en Supabase). */
export type TablaRemota =
  | "leche"
  | "sanidad"
  | "reproduccion"
  | "gastos"
  | "ingresos"
  | "produccion_diaria";

/**
 * Marca de borrado. Al eliminar un registro se guarda una de estas para
 * que el borrado viaje a la nube y se aplique en los demás dispositivos.
 */
export interface Eliminacion extends SyncMeta {
  tabla: TablaRemota;
  /** id del registro eliminado. */
  registroId: string;
}
