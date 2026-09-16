"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { Loader2, LogIn } from "lucide-react";
import { supabase, cloudEnabled } from "@/lib/supabase/client";
import { iniciarSesion } from "@/lib/sync/engine";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

type Estado = "cargando" | "dentro" | "fuera";

/**
 * Exige iniciar sesión para usar la app. La sesión queda guardada en el
 * dispositivo (Supabase la renueva sola), así el correo y la contraseña se
 * escriben una sola vez. Todos los dispositivos que entren con la misma
 * cuenta comparten exactamente los mismos datos.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>("cargando");

  useEffect(() => {
    // Sin nube configurada la app funciona local, sin login.
    if (!cloudEnabled || !supabase) {
      setEstado("dentro");
      return;
    }
    // getSession lee la sesión guardada: funciona incluso sin internet.
    supabase.auth.getSession().then(({ data }) => {
      setEstado(data.session ? "dentro" : "fuera");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEstado(session ? "dentro" : "fuera");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (estado === "cargando") {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (estado === "fuera") return <PantallaLogin />;

  return <>{children}</>;
}

function PantallaLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEntrando(true);
    try {
      await iniciarSesion(email, password);
      // onAuthStateChange deja pasar a la app automáticamente.
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (/invalid login credentials/i.test(msg)) {
        setError("Correo o contraseña incorrectos.");
      } else if (/email not confirmed/i.test(msg)) {
        setError(
          "Falta confirmar el correo de esta cuenta desde el enlace que envió Supabase.",
        );
      } else if (/failed to fetch|network|load failed/i.test(msg)) {
        setError(
          "No se pudo contactar al servidor. Revisa tu internet o que el proyecto de Supabase esté activo (los planes gratuitos se pausan por inactividad).",
        );
      } else {
        setError(msg || "No se pudo iniciar sesión.");
      }
      setEntrando(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center p-4">
      {/* Fondo fotográfico del establo */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(10,14,16,0.50), rgba(10,14,16,0.82)), url('/fondo.jpg')",
        }}
      />

      <Card className="w-full max-w-sm space-y-5 p-6 shadow-lg">
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/logo-app.png"
            unoptimized
            alt="MilkOps"
            width={320}
            height={320}
            priority
            className="w-20 rounded-2xl object-cover"
          />
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight">MilkOps</h1>
            <p className="text-sm text-muted-foreground">
              Ingresa con la cuenta del establo
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <Field label="Correo">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              autoComplete="username"
              required
            />
          </Field>
          <Field label="Contraseña">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </Field>

          {error && (
            <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={entrando}>
            {entrando ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <LogIn size={20} />
            )}
            Entrar
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Solo se escribe una vez: la sesión queda guardada en este dispositivo.
        </p>
      </Card>
    </div>
  );
}
