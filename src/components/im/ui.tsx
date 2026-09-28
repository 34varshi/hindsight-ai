import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Brain, AlertTriangle } from "lucide-react";

export function Panel({ title, icon, right, children, className, tone }: { title?: ReactNode; icon?: ReactNode; right?: ReactNode; children: ReactNode; className?: string; tone?: "memory" | "ai" }) {
  return (
    <section className={cn("rounded-lg border bg-card text-card-foreground animate-in fade-in slide-in-from-bottom-1 duration-300",
      tone === "memory" && "border-memory/40 shadow-[0_0_0_1px_var(--memory-glow)]",
      tone === "ai" && "border-primary/30", className)}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {icon}{title}
          </h2>
          {right}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

const sevMap: Record<string, string> = {
  Critical: "bg-destructive/15 text-destructive border-destructive/30",
  High: "bg-warning/15 text-warning border-warning/30",
  Medium: "bg-primary/10 text-primary border-primary/30",
  Low: "bg-muted text-muted-foreground border-border",
};
const statusMap: Record<string, string> = {
  Resolved: "bg-success/15 text-success border-success/30",
  Investigating: "bg-warning/15 text-warning border-warning/30",
  Open: "bg-destructive/15 text-destructive border-destructive/30",
};
export function Badge({ children, kind }: { children: ReactNode; kind?: string }) {
  return <span className={cn("inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[11px] font-medium", kind ? (sevMap[kind] ?? statusMap[kind]) : "border-border bg-muted text-muted-foreground")}>{children}</span>;
}

export function MemoryTag({ children = "Stored in Hindsight" }: { children?: ReactNode }) {
  return <span className="inline-flex items-center gap-1 rounded border border-memory/40 bg-memory/10 px-1.5 py-0.5 font-mono text-[11px] text-memory"><Brain className="h-3 w-3" />{children}</span>;
}

export function PageHeader({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><div>{children}</div></div>;
}

export function Btn({ className, variant = "primary", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "memory" }) {
  return <button {...p} className={cn("inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-50",
    variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary/90",
    variant === "memory" && "bg-memory text-memory-foreground hover:bg-memory/90",
    variant === "ghost" && "border bg-transparent hover:bg-accent", className)} />;
}

export const inputCls = "w-full rounded-md border bg-input/30 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export function SourceTag({ source }: { source?: string | undefined }) {
  return source === "seeded"
    ? <span className="inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">Seeded Baseline</span>
    : <span className="inline-flex items-center gap-1 rounded border border-memory/40 bg-memory/10 px-1.5 py-0.5 font-mono text-[11px] text-memory"><Brain className="h-3 w-3" />Live Retained</span>;
}
