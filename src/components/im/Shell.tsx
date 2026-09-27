import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { LayoutDashboard, PlusCircle, Activity, Brain, GraduationCap, History, Menu, Sun, Moon, X } from "lucide-react";
import { api } from "@/lib/client";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/new", label: "New Incident", icon: PlusCircle },
  { to: "/analysis", label: "Incident Analysis", icon: Activity },
  { to: "/memory", label: "Memory", icon: Brain },
  { to: "/learning", label: "Learning", icon: GraduationCap },
  { to: "/history", label: "Incident History", icon: History },
] as const;

function Status() {
  const { data, isLoading } = useQuery({ queryKey: ["health"], queryFn: () => api<{ hindsight: string }>("/api/health"), refetchInterval: 30000 });
  const s = isLoading ? "checking" : data?.hindsight ?? "unavailable";
  const label = s === "connected" ? "Hindsight Memory Connected" : s === "not_configured" ? "Hindsight Not Configured" : s === "checking" ? "Checking Hindsight…" : "Hindsight Unavailable";
  const dot = s === "connected" ? "bg-success" : s === "checking" ? "bg-muted-foreground" : "bg-destructive";
  return (
    <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs">
      <span className="relative flex h-2 w-2"><span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", dot)} /><span className={cn("relative inline-flex h-2 w-2 rounded-full", dot)} /></span>
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(true);
  useEffect(() => { setDark(localStorage.getItem("im-theme") !== "light"); }, []);
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); localStorage.setItem("im-theme", dark ? "dark" : "light"); }, [dark]);
  useEffect(() => setOpen(false), [path]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur">
        <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-memory/15 text-memory"><Brain className="h-4.5 w-4.5" /></div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">IncidentMind</div>
            <div className="text-[11px] text-muted-foreground">AI Incident Response Agent</div>
          </div>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Status />
          <button onClick={() => setDark(!dark)} className="rounded-md border p-1.5" aria-label="Toggle theme">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
        </div>
      </header>
      <div className="flex">
        <aside className={cn("fixed inset-y-14 left-0 z-20 w-60 shrink-0 border-r bg-sidebar p-3 transition-transform lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
          <nav className="space-y-1">
            {nav.map(({ to, label, icon: Icon }) => {
              const active = to === "/" ? path === "/" : path.startsWith(to);
              return (
                <Link key={to} to={to} className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors", active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground")}>
                  <Icon className={cn("h-4 w-4", active && to === "/memory" && "text-memory")} />{label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-6 rounded-md border border-memory/30 bg-memory/5 p-3 text-xs text-muted-foreground">
            <div className="mb-1 font-mono text-memory">recall → analyze → retain</div>
            Every resolved incident is retained in Hindsight and recalled for future incidents.
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
