"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { db } from "@/lib/db/db";
import { Card } from "@/components/ui/card";
import { cn, addDias, formatFecha, todayIso } from "@/lib/utils/format";
import { proyeccionesCelo, VENTANA } from "@/lib/utils/celo";

interface VentanaEntry {
  nombre: string;
  dia: number; // día del ciclo (18–24; el pico es 21)
  pico: boolean;
}

const DIAS_SEMANA = ["L", "M", "M", "J", "V", "S", "D"];

export function CeloCalendar() {
  // Mes visible (0 = mes actual)
  const [offset, setOffset] = useState(0);
  const [seleccion, setSeleccion] = useState<string | null>(todayIso());

  const animales = useLiveQuery(() => db.animales.toArray(), [], undefined);
  const celos = useLiveQuery(
    () => db.reproduccion.where("tipo").equals("celo").toArray(),
    [],
    undefined,
  );

  // Fecha base del mes visible
  const hoy = new Date();
  const base = new Date(hoy.getFullYear(), hoy.getMonth() + offset, 1);
  const year = base.getFullYear();
  const month = base.getMonth();
  const mm = String(month + 1).padStart(2, "0");
  const diasEnMes = new Date(year, month + 1, 0).getDate();
  const primerDiaSemana = (new Date(year, month, 1).getDay() + 6) % 7; // lunes=0
  const monthStart = `${year}-${mm}-01`;
  const monthEnd = `${year}-${mm}-${String(diasEnMes).padStart(2, "0")}`;
  const nombreMes = base.toLocaleDateString("es-PE", {
    month: "long",
    year: "numeric",
  });

  const { ventanaPorDia, registradoPorDia } = useMemo(() => {
    const vent = new Map<string, VentanaEntry[]>();
    const reg = new Map<string, string[]>();
    if (!animales || !celos) return { ventanaPorDia: vent, registradoPorDia: reg };

    const activos = animales.filter((a) => a.activo !== false);
    const enMes = (d: string) => d >= monthStart && d <= monthEnd;
    const nombre = (id: string) =>
      activos.find((a) => a.id === id)?.nombre ?? "";

    // Último celo por animal + celos registrados en el mes
    const ultimoPorAnimal = new Map<string, string>();
    for (const ev of celos) {
      if (!activos.some((a) => a.id === ev.animalId)) continue;
      const prev = ultimoPorAnimal.get(ev.animalId);
      if (!prev || ev.fecha > prev) ultimoPorAnimal.set(ev.animalId, ev.fecha);
      if (enMes(ev.fecha)) {
        const arr = reg.get(ev.fecha) ?? [];
        arr.push(nombre(ev.animalId));
        reg.set(ev.fecha, arr);
      }
    }

    // Proyección de celos (picos + ventana) dentro del mes
    for (const [animalId, ultimo] of ultimoPorAnimal) {
      const picos = proyeccionesCelo(ultimo, addDias(monthEnd, VENTANA));
      for (const pico of picos) {
        for (let off = -VENTANA; off <= VENTANA; off++) {
          const d = addDias(pico, off);
          if (!enMes(d)) continue;
          const arr = vent.get(d) ?? [];
          arr.push({
            nombre: nombre(animalId),
            dia: 21 + off,
            pico: off === 0,
          });
          vent.set(d, arr);
        }
      }
    }
    return { ventanaPorDia: vent, registradoPorDia: reg };
  }, [animales, celos, monthStart, monthEnd]);

  const celdas: (number | null)[] = [
    ...Array(primerDiaSemana).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ];
  while (celdas.length % 7 !== 0) celdas.push(null);

  const selVent = seleccion ? ventanaPorDia.get(seleccion) ?? [] : [];
  const selReg = seleccion ? registradoPorDia.get(seleccion) ?? [] : [];

  return (
    <Card className="overflow-hidden">
      {/* Encabezado del mes */}
      <div className="flex items-center justify-between bg-rose-soft px-4 py-3">
        <button
          onClick={() => setOffset((o) => o - 1)}
          aria-label="Mes anterior"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-rose-strong hover:bg-white/50"
        >
          <ChevronLeft size={20} />
        </button>
        <p className="font-semibold capitalize text-rose-strong">{nombreMes}</p>
        <button
          onClick={() => setOffset((o) => o + 1)}
          aria-label="Mes siguiente"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-rose-strong hover:bg-white/50"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="p-4">
        {/* Días de la semana */}
        <div className="mb-1 grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
          {DIAS_SEMANA.map((d, i) => (
            <div key={i} className="py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Cuadrícula */}
        <div className="grid grid-cols-7 gap-1">
          {celdas.map((dia, i) => {
            if (dia === null) return <div key={i} />;
            const ds = `${year}-${mm}-${String(dia).padStart(2, "0")}`;
            const vent = ventanaPorDia.get(ds);
            const reg = registradoPorDia.get(ds);
            const pico = vent?.some((v) => v.pico);
            const esHoy = ds === todayIso();
            const sel = ds === seleccion;
            return (
              <button
                key={i}
                onClick={() => setSeleccion(ds)}
                className={cn(
                  "relative mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm transition-colors",
                  pico
                    ? "bg-rose text-white font-semibold"
                    : vent
                      ? "bg-rose-soft text-rose-strong"
                      : "text-foreground hover:bg-surface-2",
                  esHoy && !pico && "ring-1 ring-primary/50",
                  sel && "ring-2 ring-rose-strong",
                )}
              >
                {dia}
                {reg && (
                  <span
                    className={cn(
                      "absolute bottom-1 h-1.5 w-1.5 rounded-full",
                      pico ? "bg-white" : "bg-rose-strong",
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[0.7rem] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose" /> Celo probable
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-soft" /> Ventana (18–24)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-strong" /> Celo
            registrado
          </span>
        </div>
      </div>

      {/* Detalle del día seleccionado */}
      <div className="border-t border-border bg-surface-2/50 px-5 py-4">
        <p className="text-sm font-semibold">
          {seleccion ? formatFecha(seleccion) : "Selecciona un día"}
        </p>
        {selReg.length > 0 && (
          <p className="mt-2 flex items-start gap-2 text-sm">
            <Heart size={16} className="mt-0.5 shrink-0 text-rose-strong" />
            <span>
              Celo registrado: <strong>{selReg.join(", ")}</strong>
            </span>
          </p>
        )}
        {selVent.length > 0 ? (
          <div className="mt-2">
            <p className="text-xs font-medium text-muted-foreground">
              Vacas en ventana de celo
            </p>
            <ul className="mt-1 space-y-1">
              {[...selVent]
                .sort((a, b) => Number(b.pico) - Number(a.pico))
                .map((v, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        v.pico ? "bg-rose" : "bg-rose-soft",
                      )}
                    />
                    <span className="font-medium">{v.nombre}</span>
                    <span className="text-muted-foreground">
                      (Día {v.dia}
                      {v.pico ? " · celo" : ""})
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        ) : (
          selReg.length === 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Sin celo previsto este día.
            </p>
          )
        )}
      </div>
    </Card>
  );
}
