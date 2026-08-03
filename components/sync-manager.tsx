"use client";

import { useEffect } from "react";
import { cloudEnabled } from "@/lib/supabase/client";
import { sincronizar, asegurarSesion } from "@/lib/sync/engine";

/**
 * Sincronización automática (RNF-02): intenta sincronizar al cargar la
 * app y cada vez que el dispositivo recupera conexión a internet.
 * No hace nada si la nube no está configurada o no hay sesión.
 */
export function SyncManager() {
  useEffect(() => {
    if (!cloudEnabled) return;

    let activo = true;
    const intentar = async () => {
      if (!activo || !navigator.onLine) return;
      // Inicia sesión sola con la cuenta compartida si hace falta.
      const user = await asegurarSesion();
      if (!user) return;
      try {
        await sincronizar();
      } catch {
        // silencioso: se reintentará en la próxima reconexión
      }
    };

    intentar();
    window.addEventListener("online", intentar);
    return () => {
      activo = false;
      window.removeEventListener("online", intentar);
    };
  }, []);

  return null;
}
