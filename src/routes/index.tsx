import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertOctagon, CheckCircle2, Brain, GitCompare, PlayCircle, ArrowRight } from "lucide-react";
import { api, fmtDate, setAppState } from "@/lib/client";
import type { Incident } from "@/lib/types";
import { Panel, Badge, PageHeader, Btn } from "@/components/im/ui";
import { Flow } from "@/components/im/Flow";
import { Comparison } from "@/components/im/Comparison";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard – IncidentMind" },
      { name: "description", content: "Memory-powered incident intelligence dashboard for DevOps teams." },
      { property: "og:title", content: "Dashboard – IncidentMind" },
      { property: "og:description", content: "Memory-powered incident intelligence dashboard for DevOps teams." },
    ],
  }),
  component: Dashboard,
});

function Stat({ label, value, icon, memory }: { label: string; value: string | number; icon: React.ReactNode; memory?: boolean }) {
  return (
    <div className={`rounded-lg border bg-card p-4 ${memory ? "border-memory/40" : ""}`}>
      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">{label}{icon}</div>
      <div className={`mt-2 font-mono text-3xl font-semibold ${memory ? "text-memory" : ""}`}>{value}</div>
    </div>
  );
}

function Dashboard() {
  const nav = useNavigate();
  const stats = useQuery({ queryKey: ["stats"], queryFn: () => api<{ total: number; resolved: number; memory_records: number | null; similar_found: number }>("/api/stats") });
  const inc = useQuery({ queryKey: ["incidents"], queryFn: () => api<{ incidents: Incident[] }>("/api/incidents") });
  const s = stats.data;
  const recent = [...(inc.data?.incidents ?? [])].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Dashboard" sub="Memory-Powered Incident Intelligence"
        right={<Btn variant="memory" onClick={() => { setAppState({ demoStep: 1, analysis: null }); nav({ to: "/new", search: { demo: true } }); }}><PlayCircle className="h-4 w-4" />Demo Mode</Btn>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total Incidents" value={s?.total ?? "—"} icon={<AlertOctagon className="h-4 w-4" />} />
        <Stat label="Resolved" value={s?.resolved ?? "—"} icon={<CheckCircle2 className="h-4 w-4" />} />
        <Stat label="Memory Records" value={s ? (s.memory_records ?? "offline") : "—"} icon={<Brain className="h-4 w-4" />} memory />
        <Stat label="Similar Incidents Found" value={s?.similar_found ?? "—"} icon={<GitCompare className="h-4 w-4" />} />
      </div>

      <Panel title="Memory-Powered Incident Intelligence" icon={<Brain className="h-4 w-4 text-memory" />} tone="memory">
        <Flow steps={["Incident", "Recall", "Learn", "Recommend", "Retain"]} />
        <p className="mt-3 text-sm text-muted-foreground">Each new incident triggers a Hindsight <b className="text-memory">recall</b>. Once resolved, the fix is <b className="text-memory">retained</b> so the next similar incident starts with evidence, not guesswork.</p>
      </Panel>

      <Comparison />

      <Panel title="Recent Incidents" right={<Link to="/history" className="flex items-center gap-1 text-xs text-primary">View all <ArrowRight className="h-3 w-3" /></Link>}>
        {inc.isLoading ? <div className="h-40 animate-pulse rounded bg-muted" /> : (
          <div className="divide-y">
            {recent.map((i) => (
              <div key={i.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm">
                <span className="w-20 font-mono text-xs text-muted-foreground">{i.id}</span>
                <span className="min-w-48 flex-1 font-medium">{i.title}<span className="ml-2 text-xs text-muted-foreground">{i.service}</span></span>
                <span className="hidden flex-1 truncate text-xs text-muted-foreground md:block">{i.rootCause ?? "Root cause pending"}</span>
                <Badge kind={i.severity}>{i.severity}</Badge>
                <Badge kind={i.status}>{i.status}</Badge>
                <span className="w-36 text-right text-xs text-muted-foreground">{fmtDate(i.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
