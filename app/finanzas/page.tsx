"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Loader2,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";
import { db } from "@/lib/db/db";
import {
  registrarGasto,
  registrarIngreso,
  eliminarGasto,
  eliminarIngreso,
  calcularBalance,
  etiquetaCategoria,
  etiquetaTipoIngreso,
  CATEGORIAS_GASTO,
  TIPOS_INGRESO,
} from "@/lib/db/finanzas";
import type {
  CategoriaGasto,
  TipoIngreso,
  Gasto,
  Ingreso,
} from "@/types/models";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { cn, formatSoles, formatFecha, todayIso } from "@/lib/utils/format";

export default function FinanzasPage() {
  const [mes, setMes] = useState(todayIso().slice(0, 7));

  const gastos = useLiveQuery(() => db.gastos.toArray(), [], undefined);
  const ingresos = useLiveQuery(() => db.ingresos.toArray(), [], undefined);

  const balance = useMemo(
    () => calcularBalance(gastos ?? [], ingresos ?? [], mes),
    [gastos, ingresos, mes],
  );

  const gastosMes = useMemo(
    () =>
      (gastos ?? [])
        .filter((g) => g.fecha.slice(0, 7) === mes)
        .sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [gastos, mes],
  );
  const ingresosMes = useMemo(
    () =>
      (ingresos ?? [])
        .filter((i) => i.fecha.slice(0, 7) === mes)
        .sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [ingresos, mes],
  );

  const positivo = balance.liquidez >= 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Finanzas
        </h1>
        <input
          type="month"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="h-11 rounded-xl border border-border bg-surface px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </div>

      {/* Liquidez del mes con semáforo (RF-05.3 / RF-05.4) */}
      <Card
        className={cn(
          "overflow-hidden border-2",
          positivo ? "border-success" : "border-danger",
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between px-5 py-4",
            positivo ? "bg-success-soft" : "bg-danger-soft",
          )}
        >
          <div>
            <p
              className={cn(
                "text-sm font-medium",
                positivo ? "text-success" : "text-danger",
              )}
            >
              Liquidez del mes
            </p>
            <p
              className={cn(
                "mt-1 text-3xl font-bold tabular-nums",
                positivo ? "text-success" : "text-danger",
              )}
            >
              {formatSoles(balance.liquidez)}
            </p>
            <p
              className={cn(
                "mt-0.5 text-xs font-medium",
                positivo ? "text-success" : "text-danger",
              )}
            >
              {positivo ? "Ganancia" : "Déficit"}
            </p>
          </div>
          <span
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-2xl text-white",
              positivo ? "bg-success" : "bg-danger",
            )}
          >
            {positivo ? <TrendingUp size={28} /> : <TrendingDown size={28} />}
          </span>
        </div>
      </Card>

      {/* Dos cuadros: Ingresos y Gastos */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PanelIngresos
          mes={mes}
          total={balance.totalIngresos}
          items={ingresosMes}
        />
        <PanelGastos mes={mes} total={balance.totalGastos} items={gastosMes} />
      </div>

      {/* Desglose de gastos por rubro */}
      {balance.totalGastos > 0 && (
        <Card className="p-5">
          <p className="mb-3 text-sm font-semibold text-muted-foreground">
            Gastos por rubro
          </p>
          <ul className="space-y-2">
            {CATEGORIAS_GASTO.map((c) => {
              const monto = balance.gastosPorCategoria[c.value];
              if (monto === 0) return null;
              const pct = (monto / balance.totalGastos) * 100;
              return (
                <li key={c.value}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{c.label}</span>
                    <span className="font-medium tabular-nums">
                      {formatSoles(monto)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}

/* ==================================================================== */
/* Cuadro de INGRESOS                                                   */
/* ==================================================================== */

function PanelIngresos({
  mes,
  total,
  items,
}: {
  mes: string;
  total: number;
  items: Ingreso[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [fecha, setFecha] = useState(`${mes}-15`);
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [tipo, setTipo] = useState<TipoIngreso>("quincena_leche");
  const [guardando, setGuardando] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(monto.replace(",", "."));
    if (!concepto.trim() || !isFinite(val) || val <= 0) return;
    setGuardando(true);
    try {
      await registrarIngreso({ fecha, concepto: concepto.trim(), monto: val, tipo });
      setConcepto("");
      setMonto("");
      setAbierto(false);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex items-center justify-between bg-success-soft px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-success text-white">
            <ArrowUpCircle size={20} />
          </span>
          <h2 className="font-semibold text-success">Ingresos</h2>
        </div>
        <p className="text-lg font-bold tabular-nums text-success">
          {formatSoles(total)}
        </p>
      </div>

      {!abierto ? (
        <div className="p-4">
          <Button size="lg" className="w-full" onClick={() => setAbierto(true)}>
            <Plus size={20} /> Ingreso
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3 border-b border-border p-5">
          <Field label="Concepto">
            <Input
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              placeholder="Ej. Quincena leche"
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Monto (S/)">
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="1200"
              />
            </Field>
            <Field label="Fecha">
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </Field>
          </div>
          <Field label="Tipo">
            <Select value={tipo} onChange={(e) => setTipo(e.target.value as TipoIngreso)}>
              {TIPOS_INGRESO.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setAbierto(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" size="lg" className="flex-1" disabled={guardando}>
              {guardando ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
              Guardar
            </Button>
          </div>
        </form>
      )}

      <ListaMovimientos
        tone="success"
        vacio="Sin ingresos este mes."
        items={items.map((i) => ({
          id: i.id,
          titulo: i.concepto,
          sub: `${etiquetaTipoIngreso(i.tipo)} · ${formatFecha(i.fecha)}`,
          monto: i.monto,
          onDelete: () => eliminarIngreso(i.id),
        }))}
      />
    </Card>
  );
}

/* ==================================================================== */
/* Cuadro de GASTOS                                                     */
/* ==================================================================== */

function PanelGastos({
  mes,
  total,
  items,
}: {
  mes: string;
  total: number;
  items: Gasto[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [fecha, setFecha] = useState(`${mes}-15`);
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState<CategoriaGasto>("concentrado");
  const [guardando, setGuardando] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(monto.replace(",", "."));
    if (!concepto.trim() || !isFinite(val) || val <= 0) return;
    setGuardando(true);
    try {
      await registrarGasto({ fecha, concepto: concepto.trim(), monto: val, categoria });
      setConcepto("");
      setMonto("");
      setAbierto(false);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex items-center justify-between bg-danger-soft px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger text-white">
            <ArrowDownCircle size={20} />
          </span>
          <h2 className="font-semibold text-danger">Gastos</h2>
        </div>
        <p className="text-lg font-bold tabular-nums text-danger">
          {formatSoles(total)}
        </p>
      </div>

      {!abierto ? (
        <div className="p-4">
          <Button
            variant="danger"
            size="lg"
            className="w-full"
            onClick={() => setAbierto(true)}
          >
            <Plus size={20} /> Gasto
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3 border-b border-border p-5">
          <Field label="Concepto">
            <Input
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              placeholder="Ej. Alimento balanceado"
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Monto (S/)">
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="800"
              />
            </Field>
            <Field label="Fecha">
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </Field>
          </div>
          <Field label="Categoría">
            <Select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as CategoriaGasto)}
            >
              {CATEGORIAS_GASTO.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setAbierto(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="lg"
              className="flex-1"
              disabled={guardando}
            >
              {guardando ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
              Guardar
            </Button>
          </div>
        </form>
      )}

      <ListaMovimientos
        tone="danger"
        vacio="Sin gastos este mes."
        items={items.map((g) => ({
          id: g.id,
          titulo: g.concepto,
          sub: `${etiquetaCategoria(g.categoria)} · ${formatFecha(g.fecha)}`,
          monto: g.monto,
          onDelete: () => eliminarGasto(g.id),
        }))}
      />
    </Card>
  );
}

/* ==================================================================== */
/* Lista dentro de cada cuadro                                          */
/* ==================================================================== */

interface Movimiento {
  id: string;
  titulo: string;
  sub: string;
  monto: number;
  onDelete: () => void;
}

function ListaMovimientos({
  items,
  vacio,
  tone,
}: {
  items: Movimiento[];
  vacio: string;
  tone: "success" | "danger";
}) {
  return (
    <div className="mt-auto border-t border-border">
      {items.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-muted-foreground">
          {vacio}
        </p>
      ) : (
        <ul className="max-h-72 divide-y divide-border overflow-y-auto">
          {items.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.titulo}</p>
                <p className="truncate text-xs text-muted-foreground">{m.sub}</p>
              </div>
              <p
                className={cn(
                  "shrink-0 text-sm font-semibold tabular-nums",
                  tone === "success" ? "text-success" : "text-danger",
                )}
              >
                {tone === "success" ? "+" : "−"}
                {formatSoles(m.monto)}
              </p>
              <button
                onClick={m.onDelete}
                aria-label="Eliminar"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-danger-soft hover:text-danger"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
