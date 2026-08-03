"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Registra el Service Worker (solo en producción, para no interferir
 * con el hot-reload de desarrollo) y muestra un aviso cuando el
 * dispositivo pierde conexión (RNF-01).
 */
export function Pwa() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);

    if (
      process.env.NODE_ENV === "production" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => reg.update())
        .catch(() => {});
      // Cuando una versión nueva toma el control, recarga una vez para
      // que el usuario siempre vea la última versión (evita caché vieja).
      let recargando = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (recargando) return;
        recargando = true;
        window.location.reload();
      });
    }

    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-warning px-4 py-1.5 text-center text-xs font-medium text-white">
      <WifiOff size={14} />
      Sin conexión · trabajando en modo local
    </div>
  );
}
