"use client";

import { useEffect, useState } from "react";
import {
  CloudOff,
  Cloud,
  RefreshCw,
  Loader2,
  Check,
  UploadCloud,
  LogOut,
} from "lucide-react";
import { cloudEnabled } from "@/lib/supabase/client";
import {
  sincronizar,
  pendientesLocales,
  usuarioActual,
  cerrarSesion,
  type ResultadoSync,
} from "@/lib/sync/engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CuentaPage() {
  const [correo, setCorreo] = useState<string | null>(null);
  const [pendientes, setPendientes] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoSync | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cloudEnabled) return;
    usuarioActual().then((u) => setCorreo(u?.email ?? null));
    pendientesLocales().then(setPendientes);
  }, []);

  async function hacerSync() {
    setError(null);
    setSincronizando(true);
    try {
      const r = await sincronizar();
      setResultado(r);
      pendientesLocales().then(setPendientes);
    } catch {
      setError("No se pudo sincronizar. Revisa tu conexión.");
    } finally {
      setSincronizando(false);
    }
  }

  if (!cloudEnabled) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Cuenta y sincronización
        </h1>
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
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
        Cuenta y sincronización
      </h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Cloud size={22} />
            </span>
            <div className="min-w-0">
              <CardTitle>Cuenta del establo</CardTitle>
              <p className="truncate text-sm text-muted-foreground">
                {correo ?? "…"}
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

          {error && (
            <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}
          {resultado && !error && (
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
        Todos los celulares que entren con este mismo correo y contraseña ven y
        editan la misma información. La app sincroniza sola cuando hay internet.
      </p>

      <button
        onClick={cerrarSesion}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
      >
        <LogOut size={18} /> Cerrar sesión
      </button>
    </div>
  );
}
