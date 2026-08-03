"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  CloudOff,
  Cloud,
  RefreshCw,
  LogOut,
  Loader2,
  Check,
  UploadCloud,
} from "lucide-react";
import { supabase, cloudEnabled } from "@/lib/supabase/client";
import {
  sincronizar,
  pendientesLocales,
  usuarioActual,
  type ResultadoSync,
} from "@/lib/sync/engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export default function CuentaPage() {
  const [user, setUser] = useState<User | null>(null);
  const [cargandoUser, setCargandoUser] = useState(true);
  const [pendientes, setPendientes] = useState(0);

  useEffect(() => {
    if (!cloudEnabled || !supabase) {
      setCargandoUser(false);
      return;
    }
    usuarioActual().then((u) => {
      setUser(u);
      setCargandoUser(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    pendientesLocales().then(setPendientes);
    return () => sub.subscription.unsubscribe();
  }, []);

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
              <p className="text-lg font-semibold">Nube no configurada</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                La app funciona 100% en tu dispositivo. Para respaldar y
                sincronizar tus datos en la nube, configura Supabase siguiendo
                las instrucciones de <code>supabase/README.md</code> y reinicia
                la aplicación.
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
      {cargandoUser ? (
        <div className="skeleton h-48 rounded-xl" />
      ) : user ? (
        <PanelSincronizacion
          user={user}
          pendientes={pendientes}
          onRefreshPendientes={() => pendientesLocales().then(setPendientes)}
        />
      ) : (
        <FormularioLogin />
      )}
    </div>
  );
}

function FormularioLogin() {
  const [modo, setModo] = useState<"entrar" | "registrar">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setError(null);
    setMensaje(null);
    setCargando(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) setError("Correo o contraseña incorrectos.");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) setError(error.message);
        else
          setMensaje(
            "Cuenta creada. Revisa tu correo si se requiere confirmación, luego inicia sesión.",
          );
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Cloud size={22} />
          </span>
          <CardTitle>
            {modo === "entrar" ? "Iniciar sesión" : "Crear cuenta"}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Correo">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
            />
          </Field>
          <Field label="Contraseña">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </Field>
          {error && (
            <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}
          {mensaje && (
            <p className="rounded-xl bg-success-soft px-4 py-3 text-sm text-success">
              {mensaje}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={cargando}>
            {cargando ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Cloud size={20} />
            )}
            {modo === "entrar" ? "Entrar" : "Registrarme"}
          </Button>
        </form>
        <button
          onClick={() => {
            setModo((m) => (m === "entrar" ? "registrar" : "entrar"));
            setError(null);
            setMensaje(null);
          }}
          className="mt-4 w-full text-center text-sm text-primary"
        >
          {modo === "entrar"
            ? "¿No tienes cuenta? Crear una"
            : "Ya tengo cuenta, iniciar sesión"}
        </button>
      </CardContent>
    </Card>
  );
}

function PanelSincronizacion({
  user,
  pendientes,
  onRefreshPendientes,
}: {
  user: User;
  pendientes: number;
  onRefreshPendientes: () => void;
}) {
  const [sincronizando, setSincronizando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoSync | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function hacerSync() {
    setError(null);
    setSincronizando(true);
    try {
      const r = await sincronizar();
      setResultado(r);
      onRefreshPendientes();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al sincronizar");
    } finally {
      setSincronizando(false);
    }
  }

  async function salir() {
    await supabase?.auth.signOut();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Cloud size={22} />
            </span>
            <div className="min-w-0">
              <CardTitle>Conectado</CardTitle>
              <p className="truncate text-sm text-muted-foreground">
                {user.email}
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

      <button
        onClick={salir}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
      >
        <LogOut size={18} /> Cerrar sesión
      </button>
    </div>
  );
}
