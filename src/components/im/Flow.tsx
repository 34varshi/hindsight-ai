import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Flow({ steps, active = -1 }: { steps: string[]; active?: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-1.5">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-1.5">
          <span className={cn("rounded-md border px-3 py-1.5 font-mono text-xs transition-all",
            i < active && "border-success/40 bg-success/10 text-success",
            i === active && "border-memory bg-memory/15 text-memory shadow-[0_0_12px_var(--memory-glow)]",
            (active < 0 || i > active) && "text-muted-foreground")}>
            {String(i + 1).padStart(2, "0")} {s}
          </span>
          {i < steps.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
        </li>
      ))}
    </ol>
  );
}
