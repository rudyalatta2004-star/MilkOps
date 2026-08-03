import { Card } from "./card";
import { cn } from "@/lib/utils/format";
import type { LucideIcon } from "lucide-react";

type Tone = "primary" | "info" | "success" | "warning" | "danger";

const iconTone: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary",
  info: "bg-info-soft text-info",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = "primary",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  tone?: Tone;
}) {
  return (
    <Card className="p-4">
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl",
          iconTone[tone],
        )}
      >
        <Icon size={20} />
      </span>
      <p className="mt-3 text-2xl font-semibold leading-none tracking-tight tabular-nums">
        {value}
      </p>
      <p className="mt-1.5 truncate text-sm text-muted-foreground">{label}</p>
      {sub && <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>}
    </Card>
  );
}
