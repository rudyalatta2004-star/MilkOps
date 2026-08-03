/** Utilidades de formato y fechas para APPVACA. */

/** Une clases condicionalmente (mini alternativa a clsx). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Fecha de hoy en formato YYYY-MM-DD (zona local). */
export function todayIso(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60_000);
  return local.toISOString().slice(0, 10);
}

/** Formatea YYYY-MM-DD a algo legible: "25 jul 2026". */
export function formatFecha(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Litros con una decimal y unidad: "12.5 L". */
export function formatLitros(n: number): string {
  return `${n.toLocaleString("es-PE", { maximumFractionDigits: 1 })} L`;
}

/** Precio en soles: "S/ 3,500". */
export function formatSoles(n?: number): string {
  if (n == null || !isFinite(n)) return "—";
  return `S/ ${n.toLocaleString("es-PE", { maximumFractionDigits: 2 })}`;
}

/** Suma n días a una fecha YYYY-MM-DD y devuelve YYYY-MM-DD. */
export function addDias(iso: string, n: number): string {
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Diferencia en días entre dos fechas ISO (b - a). */
export function diffDias(aIso: string, bIso: string): number {
  const a = new Date(aIso.length === 10 ? aIso + "T00:00:00" : aIso);
  const b = new Date(bIso.length === 10 ? bIso + "T00:00:00" : bIso);
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000);
}
