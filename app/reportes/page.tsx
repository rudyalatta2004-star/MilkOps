"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  FileSpreadsheet,
  Download,
  Loader2,
  Check,
  Table2,
  ClipboardList,
  Wallet,
} from "lucide-react";
import { db } from "@/lib/db/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generarReporteExcel } from "@/lib/reportes/excel";

export default function ReportesPage() {
  const total = useLiveQuery(
    async () => {
      const animales = await db.animales.toArray();
      return animales.filter((a) => a.activo !== false).length;
    },
    [],
    undefined,
  );

  const [estado, setEstado] = useState<"idle" | "generando" | "listo">("idle");
  const [error, setError] = useState<string | null>(null);

  async function descargar() {
    setError(null);
    setEstado("generando");
    try {
      await generarReporteExcel();
      setEstado("listo");
      setTimeout(() => setEstado("idle"), 3000);
    } catch {
      setError("No se pudo generar el reporte.");
      setEstado("idle");
    }
  }

  const sinDatos = total === 0;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
        Reportes
      </h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <FileSpreadsheet size={22} />
            </span>
            <div>
              <CardTitle>Reporte del hato en Excel</CardTitle>
              <p className="text-sm text-muted-foreground">
                Archivo .xlsx con diseño, títulos y colores.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Table2 size={18} className="mt-0.5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium">Hojas de Animales y Producción diaria</p>
                <p className="text-xs text-muted-foreground">
                  Detalle de cada animal (raza, precio, estados, gestación,
                  FPP, última vacuna) y el registro de litros totales por día.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ClipboardList size={18} className="mt-0.5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium">Hoja &ldquo;Resumen&rdquo;</p>
                <p className="text-xs text-muted-foreground">
                  Totales consolidados: total de litros, promedio por vaca,
                  valor del hato y conteo de preñadas, inseminadas y vacías.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Wallet size={18} className="mt-0.5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium">
                  Hoja &ldquo;Balance Financiero&rdquo;
                </p>
                <p className="text-xs text-muted-foreground">
                  Ingresos, gastos por rubro y liquidez de cada mes, más el
                  detalle de todos los movimientos.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}

          <Button
            size="lg"
            className="w-full"
            onClick={descargar}
            disabled={estado === "generando" || sinDatos}
          >
            {estado === "generando" ? (
              <Loader2 className="animate-spin" size={20} />
            ) : estado === "listo" ? (
              <Check size={20} />
            ) : (
              <Download size={20} />
            )}
            {estado === "listo"
              ? "Descargado"
              : sinDatos
                ? "No hay animales para exportar"
                : "Descargar Excel"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
