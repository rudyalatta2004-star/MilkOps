"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, X, Loader2 } from "lucide-react";
import { AnimalFoto } from "./animal-foto";
import { comprimirImagen } from "@/lib/utils/imagen";
import { Button } from "./ui/button";

/**
 * Captura de fotografía del animal (RF-01.2).
 * Ofrece cámara (capture="environment") y galería. Comprime antes de
 * entregar el Blob al formulario padre.
 */
export function FotoInput({
  value,
  onChange,
}: {
  value?: Blob;
  onChange: (blob?: Blob) => void;
}) {
  const camaraRef = useRef<HTMLInputElement>(null);
  const galeriaRef = useRef<HTMLInputElement>(null);
  const [procesando, setProcesando] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (!file) return;
    setProcesando(true);
    try {
      const comprimida = await comprimirImagen(file);
      onChange(comprimida);
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative mx-auto w-40">
        <AnimalFoto
          blob={value}
          alt="Foto del animal"
          className="aspect-square w-40 rounded-2xl border border-border"
          iconSize={44}
        />
        {procesando && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-surface/70 backdrop-blur-sm">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        )}
        {value && !procesando && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            aria-label="Quitar foto"
            className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-danger text-white shadow-md"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex justify-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => camaraRef.current?.click()}
        >
          <Camera size={18} /> Cámara
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => galeriaRef.current?.click()}
        >
          <ImagePlus size={18} /> Galería
        </Button>
      </div>

      <input
        ref={camaraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      <input
        ref={galeriaRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
