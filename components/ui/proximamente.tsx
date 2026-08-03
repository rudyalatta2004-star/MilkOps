import { Card } from "./card";
import type { LucideIcon } from "lucide-react";

export function Proximamente({
  icon: Icon,
  titulo,
  descripcion,
  fase,
}: {
  icon: LucideIcon;
  titulo: string;
  descripcion: string;
  fase: string;
}) {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
        {titulo}
      </h1>
      <Card className="flex flex-col items-center gap-4 py-16 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <Icon size={30} />
        </span>
        <div>
          <p className="text-lg font-semibold">{descripcion}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Módulo en construcción · {fase}
          </p>
        </div>
      </Card>
    </div>
  );
}
