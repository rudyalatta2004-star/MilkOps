"use client";

import { useEffect, useState } from "react";
import { Beef } from "lucide-react";
import { cn } from "@/lib/utils/format";

/**
 * Muestra la foto de un animal a partir de un Blob (offline) o una URL.
 * Gestiona el object URL para evitar fugas de memoria.
 */
export function AnimalFoto({
  blob,
  url,
  alt,
  className,
  iconSize = 28,
}: {
  blob?: Blob;
  url?: string;
  alt: string;
  className?: string;
  iconSize?: number;
}) {
  const [src, setSrc] = useState<string | undefined>(url);

  useEffect(() => {
    if (blob) {
      const objectUrl = URL.createObjectURL(blob);
      setSrc(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setSrc(url);
  }, [blob, url]);

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-surface-2 text-muted-foreground",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <Beef size={iconSize} strokeWidth={1.6} />
      )}
    </div>
  );
}
