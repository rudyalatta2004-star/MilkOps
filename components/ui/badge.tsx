import { cn } from "@/lib/utils/format";
import type { ReactNode } from "react";
import type {
  EstadoProductivo,
  EstadoReproductivo,
} from "@/types/models";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "primary";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted-foreground border border-border",
  success: "bg-success-soft text-success border border-transparent",
  warning: "bg-warning-soft text-warning border border-transparent",
  danger: "bg-danger-soft text-danger border border-transparent",
  info: "bg-info-soft text-info border border-transparent",
  primary: "bg-primary-soft text-primary border border-transparent",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Mapea el estado reproductivo a un tono y etiqueta legible. */
export function badgeReproductivo(estado: EstadoReproductivo): {
  tone: Tone;
  label: string;
} {
  switch (estado) {
    case "preñada":
      return { tone: "success", label: "Preñada" };
    case "inseminada":
      return { tone: "warning", label: "Inseminada" };
    case "vacia":
      return { tone: "neutral", label: "Vacía" };
  }
}

/** Mapea el estado productivo a un tono y etiqueta legible. */
export function badgeProductivo(estado: EstadoProductivo): {
  tone: Tone;
  label: string;
} {
  return estado === "ordeño"
    ? { tone: "info", label: "En ordeño" }
    : { tone: "neutral", label: "Seca" };
}
