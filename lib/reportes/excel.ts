import ExcelJS from "exceljs";
import { db } from "@/lib/db/db";
import { formatFecha, todayIso } from "@/lib/utils/format";
import { mesesGestacion, calcularFPP } from "@/lib/utils/reproduccion";
import { ultimaInseminacion } from "@/lib/db/reproduccion";
import {
  calcularBalance,
  mesesConMovimientos,
  etiquetaMes,
} from "@/lib/db/finanzas";
import type { EstadoReproductivo } from "@/types/models";

const ETIQUETA_REP: Record<EstadoReproductivo, string> = {
  preñada: "Preñada",
  inseminada: "Inseminada",
  vacia: "Vacía",
};

/* Paleta (ARGB) coherente con la app */
const C = {
  green: "FF2F9D5F",
  greenDark: "FF1F7A45",
  white: "FFFFFFFF",
  cream: "FFF6F2E7",
  zebra: "FFF3EFE3",
  red: "FFC0392B",
  redSoft: "FFFBE4E0",
  greenSoft: "FFE4F4E8",
  gray: "FF6D7361",
  line: "FFE0DAC9",
  dark: "FF23271E",
};

/** Color propio de cada sección del reporte. */
interface Seccion {
  main: string;
  dark: string;
  soft: string;
}
const SECCION = {
  resumen: { main: "FF2F9D5F", dark: "FF1F7A45", soft: "FFE4F4E8" },
  animales: { main: "FF2563EB", dark: "FF1E40AF", soft: "FFE6EEFF" },
  finanzas: { main: "FFB8860B", dark: "FF8A6300", soft: "FFF8EFD6" },
} satisfies Record<string, Seccion>;

function borde(argb = C.line) {
  const s = { style: "thin" as const, color: { argb } };
  return { top: s, left: s, bottom: s, right: s };
}

function titulo(
  ws: ExcelJS.Worksheet,
  texto: string,
  ncols: number,
  sec: Seccion,
) {
  // Banda de color de la sección
  ws.mergeCells(1, 1, 1, ncols);
  const c = ws.getCell(1, 1);
  c.value = `  ${texto}`;
  c.font = { bold: true, size: 16, color: { argb: C.white } };
  c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: sec.main } };
  c.alignment = { vertical: "middle", horizontal: "left" };
  ws.getRow(1).height = 32;
  ws.mergeCells(2, 1, 2, ncols);
  const s = ws.getCell(2, 1);
  s.value = `  MilkOps · Generado el ${formatFecha(todayIso())}`;
  s.font = { italic: true, size: 10, color: { argb: sec.dark } };
  s.fill = { type: "pattern", pattern: "solid", fgColor: { argb: sec.soft } };
}

function cabecera(
  ws: ExcelJS.Worksheet,
  fila: number,
  headers: string[],
  sec: Seccion,
) {
  const row = ws.getRow(fila);
  headers.forEach((h, i) => {
    const c = row.getCell(i + 1);
    c.value = h;
    c.font = { bold: true, color: { argb: C.white }, size: 11 };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: sec.main } };
    c.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    c.border = borde(sec.main);
  });
  row.height = 24;
}

function filaDatos(
  ws: ExcelJS.Worksheet,
  fila: number,
  valores: (string | number)[],
  zebra: boolean,
) {
  const row = ws.getRow(fila);
  valores.forEach((v, i) => {
    const c = row.getCell(i + 1);
    c.value = v;
    c.border = borde();
    c.font = { size: 10, color: { argb: C.dark } };
    if (zebra) {
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.zebra } };
    }
    c.alignment = {
      vertical: "middle",
      horizontal: typeof v === "number" ? "right" : "left",
    };
  });
}

function pintar(cell: ExcelJS.Cell, fondo: string, texto: string) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fondo } };
  cell.font = { size: 10, bold: true, color: { argb: texto } };
}

const S = (n: number) => `S/ ${Math.round(n * 100) / 100}`;
const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Genera y descarga el reporte Excel con diseño (título, cabeceras de
 * color, bordes y celdas destacadas). Incluye hojas: Resumen, Animales
 * y Balance Financiero.
 */
export async function generarReporteExcel(): Promise<{ filas: number }> {
  const [animales, leche, sanidad, reproduccion, gastos, ingresos] =
    await Promise.all([
      db.animales.toArray(),
      db.leche.toArray(),
      db.sanidad.toArray(),
      db.reproduccion.toArray(),
      db.gastos.toArray(),
      db.ingresos.toArray(),
    ]);

  const activos = animales
    .filter((a) => a.activo !== false)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  const wb = new ExcelJS.Workbook();
  wb.creator = "MilkOps";

  /* ---------------- Hoja: Resumen ---------------- */
  const valorTotal = activos.reduce((s, a) => s + (a.precio ?? 0), 0);
  const enOrdeño = activos.filter((a) => a.estadoProductivo === "ordeño").length;
  const preñadas = activos.filter((a) => a.estadoReproductivo === "preñada").length;
  const inseminadas = activos.filter((a) => a.estadoReproductivo === "inseminada").length;
  const vacias = activos.filter((a) => a.estadoReproductivo === "vacia").length;
  const totalIngresos = ingresos.reduce((s, x) => s + x.monto, 0);
  const totalGastos = gastos.reduce((s, x) => s + x.monto, 0);
  const liquidez = totalIngresos - totalGastos;

  const wsR = wb.addWorksheet("Resumen", {
    properties: { defaultColWidth: 22 },
  });
  wsR.columns = [{ width: 34 }, { width: 24 }];
  titulo(wsR, "Resumen del hato", 2, SECCION.resumen);
  cabecera(wsR, 4, ["Indicador", "Valor"], SECCION.resumen);
  const resumenFilas: [string, string | number][] = [
    ["Total de animales", activos.length],
    ["En ordeño", enOrdeño],
    ["Preñadas", preñadas],
    ["Inseminadas", inseminadas],
    ["Vacías", vacias],
    ["Valor total del hato", S(valorTotal)],
    ["Total de ingresos", S(totalIngresos)],
    ["Total de gastos", S(totalGastos)],
    ["Liquidez", S(liquidez)],
  ];
  resumenFilas.forEach(([k, v], i) => {
    const fila = 5 + i;
    filaDatos(wsR, fila, [k, v], i % 2 === 1);
    wsR.getCell(fila, 1).font = { size: 10, bold: true, color: { argb: C.dark } };
    if (k === "Liquidez") {
      const cel = wsR.getCell(fila, 2);
      pintar(cel, liquidez >= 0 ? C.greenSoft : C.redSoft, liquidez >= 0 ? C.greenDark : C.red);
      cel.border = borde();
      cel.alignment = { horizontal: "right", vertical: "middle" };
    }
  });
  wsR.views = [{ state: "frozen", ySplit: 4 }];

  /* ---------------- Hoja: Animales ---------------- */
  const wsA = wb.addWorksheet("Animales");
  const headA = [
    "Arete", "Nombre", "Raza", "Precio (S/)", "Estado prod.",
    "Litros últ. med.", "Estado reprod.", "Gestación (meses)",
    "Últ. inseminación", "FPP", "Última vacuna", "Observaciones",
  ];
  wsA.columns = [
    { width: 12 }, { width: 16 }, { width: 13 }, { width: 12 }, { width: 13 },
    { width: 14 }, { width: 14 }, { width: 15 }, { width: 16 }, { width: 13 },
    { width: 24 }, { width: 26 },
  ];
  titulo(wsA, "Detalle de animales", headA.length, SECCION.animales);
  cabecera(wsA, 4, headA, SECCION.animales);
  activos.forEach((a, i) => {
    const lecheA = leche
      .filter((r) => r.animalId === a.id)
      .sort((x, y) => y.fecha.localeCompare(x.fecha));
    const vac = sanidad
      .filter((r) => r.animalId === a.id && r.tipo === "vacuna")
      .sort((x, y) => y.fecha.localeCompare(x.fecha))[0];
    const insem = ultimaInseminacion(reproduccion.filter((r) => r.animalId === a.id));
    // La fecha del animal manda; si no, el último evento de inseminación.
    const fechaInsem = a.fechaInseminacion || insem?.fecha || "";
    const gest =
      a.estadoReproductivo === "preñada" && fechaInsem
        ? mesesGestacion(fechaInsem)
        : "";
    filaDatos(
      wsA,
      5 + i,
      [
        a.arete ?? "",
        a.nombre,
        a.raza ?? "",
        a.precio != null ? a.precio : "",
        a.estadoProductivo === "ordeño" ? "En ordeño" : "Seca",
        lecheA[0] ? lecheA[0].litros : "",
        ETIQUETA_REP[a.estadoReproductivo],
        gest,
        fechaInsem ? formatFecha(fechaInsem) : "",
        fechaInsem ? formatFecha(calcularFPP(fechaInsem)) : "",
        vac ? `${vac.producto} (${formatFecha(vac.fecha)})` : "",
        a.observaciones ?? "",
      ],
      i % 2 === 1,
    );
  });
  wsA.views = [{ state: "frozen", ySplit: 4 }];

  /* ---------------- Hoja: Balance Financiero ---------------- */
  const wsF = wb.addWorksheet("Balance Financiero");
  const headF = [
    "Mes", "Ingresos (S/)", "Concentrado", "Medicamentos", "Personal",
    "Mantenimiento", "Total Gastos (S/)", "Liquidez (S/)",
  ];
  wsF.columns = [
    { width: 16 }, { width: 15 }, { width: 14 }, { width: 14 },
    { width: 13 }, { width: 15 }, { width: 16 }, { width: 15 },
  ];
  titulo(wsF, "Balance financiero mensual", headF.length, SECCION.finanzas);
  cabecera(wsF, 4, headF, SECCION.finanzas);
  const meses = mesesConMovimientos(gastos, ingresos);
  let accIng = 0;
  let accGas = 0;
  meses.forEach((mes, i) => {
    const b = calcularBalance(gastos, ingresos, mes);
    accIng += b.totalIngresos;
    accGas += b.totalGastos;
    const fila = 5 + i;
    filaDatos(
      wsF,
      fila,
      [
        etiquetaMes(mes),
        r2(b.totalIngresos),
        r2(b.gastosPorCategoria.concentrado),
        r2(b.gastosPorCategoria.medicamentos),
        r2(b.gastosPorCategoria.personal),
        r2(b.gastosPorCategoria.mantenimiento),
        r2(b.totalGastos),
        r2(b.liquidez),
      ],
      i % 2 === 1,
    );
    const cel = wsF.getCell(fila, 8);
    pintar(cel, b.liquidez >= 0 ? C.greenSoft : C.redSoft, b.liquidez >= 0 ? C.greenDark : C.red);
    cel.border = borde();
    cel.alignment = { horizontal: "right", vertical: "middle" };
  });
  const fTot = 5 + meses.length;
  filaDatos(
    wsF,
    fTot,
    ["TOTAL", r2(accIng), "", "", "", "", r2(accGas), r2(accIng - accGas)],
    false,
  );
  for (let c = 1; c <= headF.length; c++) {
    pintar(wsF.getCell(fTot, c), SECCION.finanzas.main, C.white);
    wsF.getCell(fTot, c).border = borde(SECCION.finanzas.main);
  }
  wsF.views = [{ state: "frozen", ySplit: 4 }];

  /* ---------------- Descargar ---------------- */
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reporte-milkops-${todayIso()}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);

  return { filas: activos.length };
}
