"use client";

import { useEffect, useState } from "react";
import {
  CloudOff,
  Cloud,
  RefreshCw,
  Loader2,
  Check,
  UploadCloud,
} from "lucide-react";
import { cloudEnabled } from "@/lib/supabase/client";
import {
  sincronizar,
  pendientesLocales,
  asegurarSesion,
  type ResultadoSync,
} from "@/lib/sync/engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Estado = "conectando" | "conectado" | "sin-conexion" | "no-config";

export default function SincronizacionPage() {
  const [estado, setEstado] = useState<Estado>("conectando");
  const [pendientes, setPendientes] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoSync | null>(null);

  useEffect(() => {
    if (!cloudEnabled) {
      setEstado("no-config");
      return;
    }
    asegurarSesion().then((user) => {
      setEstado(user ? "conectado" : "sin-conexion");
    });
    pendientesLocales().then(setPendientes);
  }, []);

  async function hacerSync() {
    setSincronizando(true);
    try {
      const user = await asegurarSesion();
      if (!user) {
        setEstado("sin-conexion");
        return;
      }
      setEstado("conectado");
      const r = await sincronizar();
      setResultado(r);
      pendientesLocales().then(setPendientes);
    } catch {
      setEstado("sin-conexion");
    } finally {
      setSincronizando(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
        Sincronización
      </h1>

      {estado === "no-config" ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-2 text-muted-foreground">
              <CloudOff size={30} />
            </span>
            <div>
              <p className="text-lg font-semibold">Sin nube</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                La app funciona 100% en tu dispositivo. La copia en la nube no
                está configurada.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span
                  className={
                    "flex h-11 w-11 items-center justify-center rounded-xl " +
                    (estado === "conectado"
                      ? "bg-primary-soft text-primary"
                      : "bg-warning-soft text-warning")
                  }
                >
                  {estado === "conectando" ? (
                    <Loader2 size={22} className="animate-spin" />
                  ) : (
                    <Cloud size={22} />
                  )}
                </span>
                <div>
                  <CardTitle>
                    {estado === "conectado"
                      ? "Datos del establo sincronizados"
                      : estado === "conectando"
                        ? "Conectando…"
                        : "Sin conexión ahora"}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Cuenta compartida · todos ven los mismos datos
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-3 text-sm">
                <UploadCloud size={18} className="text-muted-foreground" />
                {pendientes > 0
                  ? `${pendientes} registro(s) pendiente(s) de subir`
                  : "Todo sincronizado"}
              </div>

              {resultado && (
                <p className="flex items-center gap-2 rounded-xl bg-success-soft px-4 py-3 text-sm text-success">
                  <Check size={16} />
                  Subidos {resultado.subidos} · Bajados {resultado.bajados}
                </p>
              )}

              <Button
                size="lg"
                className="w-full"
                onClick={hacerSync}
                disabled={sincronizando}
              >
                {sincronizando ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <RefreshCw size={20} />
                )}
                Sincronizar ahora
              </Button>
            </CardContent>
          </Card>

          <p className="px-1 text-xs text-muted-foreground">
            La app sincroniza sola cada vez que hay internet. También puedes
            usarla sin conexión: los cambios se subirán al reconectar.
          </p>
        </>
      )}
    </div>
  );
}
