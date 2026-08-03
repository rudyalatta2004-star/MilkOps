import { db, newId, nowIso } from "./db";
import type {
  Gasto,
  Ingreso,
  RegistroLeche,
  CategoriaGasto,
  TipoIngreso,
} from "@/types/models";

/* ------------------------------------------------------------------ */
/* Altas / bajas                                                       */
/* ------------------------------------------------------------------ */

export async function registrarGasto(input: {
  fecha: string;
  concepto: string;
  monto: number;
  categoria: CategoriaGasto;
}): Promise<string> {
  const id = newId();
  const ts = nowIso();
  const gasto: Gasto = {
    id,
    ...input,
    createdAt: ts,
    updatedAt: ts,
    syncStatus: "pending",
  };
  await db.gastos.add(gasto);
  return id;
}

export async function registrarIngreso(input: {
  fecha: string;
  concepto: string;
  monto: number;
  tipo: TipoIngreso;
}): Promise<string> {
  const id = newId();
  const ts = nowIso();
  const ingreso: Ingreso = {
    id,
    ...input,
    createdAt: ts,
    updatedAt: ts,
    syncStatus: "pending",
  };
  await db.ingresos.add(ingreso);
  return id;
}

export function eliminarGasto(id: string) {
  return db.gastos.delete(id);
}

export function eliminarIngreso(id: string) {
  return db.ingresos.delete(id);
}

/* ------------------------------------------------------------------ */
/* Etiquetas                                                           */
/* ------------------------------------------------------------------ */

export const CATEGORIAS_GASTO: { value: CategoriaGasto; label: string }[] = [
  { value: "concentrado", label: "Concentrado / Alimento" },
  { value: "medicamentos", label: "Medicamentos / Sanidad" },
  { value: "personal", label: "Personal / Mano de obra" },
  { value: "mantenimiento", label: "Mantenimiento / Extras" },
];

export const TIPOS_INGRESO: { value: TipoIngreso; label: string }[] = [
  { value: "quincena_leche", label: "Quincena (venta de leche)" },
  { value: "venta_animal", label: "Venta de animal" },
  { value: "otro", label: "Otro" },
];

export function etiquetaCategoria(c: CategoriaGasto): string {
  return CATEGORIAS_GASTO.find((x) => x.value === c)?.label ?? c;
}

export function etiquetaTipoIngreso(t: TipoIngreso): string {
  return TIPOS_INGRESO.find((x) => x.value === t)?.label ?? t;
}

/* ------------------------------------------------------------------ */
/* Cálculo de liquidez mensual (RF-05.3)                               */
/* ------------------------------------------------------------------ */

/** Filtra por mes en formato YYYY-MM. */
function delMes<T extends { fecha: string }>(items: T[], mes: string): T[] {
  return items.filter((i) => i.fecha.slice(0, 7) === mes);
}

export interface BalanceMes {
  mes: string;
  totalIngresos: number;
  totalGastos: number;
  liquidez: number;
  gastosPorCategoria: Record<CategoriaGasto, number>;
}

export function calcularBalance(
  gastos: Gasto[],
  ingresos: Ingreso[],
  mes: string,
): BalanceMes {
  const g = delMes(gastos, mes);
  const i = delMes(ingresos, mes);

  const totalGastos = g.reduce((s, x) => s + x.monto, 0);
  const totalIngresos = i.reduce((s, x) => s + x.monto, 0);

  const gastosPorCategoria: Record<CategoriaGasto, number> = {
    concentrado: 0,
    medicamentos: 0,
    personal: 0,
    mantenimiento: 0,
  };
  for (const x of g) gastosPorCategoria[x.categoria] += x.monto;

  return {
    mes,
    totalIngresos,
    totalGastos,
    liquidez: totalIngresos - totalGastos,
    gastosPorCategoria,
  };
}

/** Lista de meses (YYYY-MM) presentes en los datos, más reciente primero. */
export function mesesConMovimientos(
  gastos: Gasto[],
  ingresos: Ingreso[],
): string[] {
  const set = new Set<string>();
  for (const x of gastos) set.add(x.fecha.slice(0, 7));
  for (const x of ingresos) set.add(x.fecha.slice(0, 7));
  return [...set].sort((a, b) => b.localeCompare(a));
}

/* ------------------------------------------------------------------ */
/* Costo y margen por litro                                            */
/* ------------------------------------------------------------------ */

/**
 * Litros totales del mes: suma de la producción registrada de todas las
 * vacas ese mes. La medida se toma una vez al mes y representa la
 * producción de cada animal en ordeño.
 */
export function litrosDelMes(leche: RegistroLeche[], mes: string): number {
  return leche
    .filter((r) => r.fecha.slice(0, 7) === mes)
    .reduce((s, r) => s + r.litros, 0);
}

export interface IndicadorLitro {
  litros: number;
  /** Costo de producción por litro = gastos del mes ÷ litros del mes. */
  costoPorLitro: number | null;
  /** Margen de ganancia por litro = (ingresos − gastos) ÷ litros del mes. */
  margenPorLitro: number | null;
}

export function indicadorPorLitro(
  totalGastos: number,
  totalIngresos: number,
  litros: number,
): IndicadorLitro {
  if (litros <= 0) {
    return { litros, costoPorLitro: null, margenPorLitro: null };
  }
  return {
    litros,
    costoPorLitro: totalGastos / litros,
    margenPorLitro: (totalIngresos - totalGastos) / litros,
  };
}

/** Etiqueta legible de un mes YYYY-MM: "Julio 2026". */
export function etiquetaMes(mes: string): string {
  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  const [anio, m] = mes.split("-");
  return `${meses[Number(m) - 1]} ${anio}`;
}
