import { DIAS_GESTACION } from "@/types/models";
import { diffDias, todayIso } from "./format";

/**
 * Cálculos reproductivos (RF-04.3 y RF-04.4).
 */

/** Calcula la Fecha Probable de Parto = fecha inseminación + 283 días. */
export function calcularFPP(fechaInseminacion: string): string {
  const d = new Date(
    fechaInseminacion.length === 10
      ? fechaInseminacion + "T00:00:00"
      : fechaInseminacion,
  );
  d.setDate(d.getDate() + DIAS_GESTACION);
  return d.toISOString().slice(0, 10);
}

/**
 * Meses de gestación transcurridos desde la inseminación hasta hoy.
 * Devuelve un número con una decimal (p. ej. 3.2 meses).
 */
export function mesesGestacion(
  fechaInseminacion: string,
  hastaIso: string = todayIso(),
): number {
  const dias = diffDias(fechaInseminacion, hastaIso);
  if (dias < 0) return 0;
  return Math.round((dias / 30.44) * 10) / 10;
}

/** Días restantes hasta la FPP (negativo si ya pasó). */
export function diasParaParto(
  fechaInseminacion: string,
  desdeIso: string = todayIso(),
): number {
  return diffDias(desdeIso, calcularFPP(fechaInseminacion));
}
