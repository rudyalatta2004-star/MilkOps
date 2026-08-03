import { addDias } from "./format";

/** Ciclo estral promedio de la vaca (días). Rango normal 18–24. */
export const CICLO_ESTRAL = 21;
/** Media ventana de celo alrededor del pico (±3 días → 18 a 24). */
export const VENTANA = 3;

/**
 * Fechas de celo probables (picos) desde el último celo hasta la fecha
 * `hasta` (YYYY-MM-DD): último celo + 21, +42, +63…
 */
export function proyeccionesCelo(ultimoCelo: string, hasta: string): string[] {
  const res: string[] = [];
  for (let n = 1; n <= 80; n++) {
    const d = addDias(ultimoCelo, CICLO_ESTRAL * n);
    if (d > hasta) break;
    res.push(d);
  }
  return res;
}
