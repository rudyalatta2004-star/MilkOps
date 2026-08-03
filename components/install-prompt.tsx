"use client";

import { useEffect, useState } from "react";
import { Download, X, Share, Plus } from "lucide-react";

/** Evento no estándar de instalación de PWA (Chrome/Android/Edge). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "milkops-install-dismissed";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    // Ya instalada (abierta como app): no mostrar nada.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    // Android / Chrome / Edge → botón nativo de instalación.
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const onInstalled = () => {
      setVisible(false);
      setIosHint(false);
    };
    window.addEventListener("appinstalled", onInstalled);

    // iOS Safari no emite beforeinstallprompt → mostramos instrucciones.
    const ua = navigator.userAgent;
    const esIOS = /iphone|ipad|ipod/i.test(ua);
    const esSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
    if (esIOS && esSafari) {
      setIosHint(true);
      setVisible(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function instalar() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  }

  function cerrar() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-3 z-50 md:inset-x-auto md:right-4 md:max-w-sm"
      style={{ bottom: "calc(4.75rem + env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-lg">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Download size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Instala MilkOps</p>
          {iosHint ? (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              Toca <Share size={13} className="inline" /> y luego{" "}
              <span className="whitespace-nowrap">
                <Plus size={13} className="inline" /> Agregar a inicio
              </span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Acceso directo y uso sin internet.
            </p>
          )}
        </div>
        {!iosHint && (
          <button
            onClick={instalar}
            className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground active:scale-95"
          >
            Instalar
          </button>
        )}
        <button
          onClick={cerrar}
          aria-label="Cerrar"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-2"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
