import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { api, fmtDate } from "@/lib/client";
import type { Incident } from "@/lib/types";
import { Panel, PageHeader, Badge, SourceTag, inputCls } from "@/components/im/ui";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Incident History – IncidentMind" },
      { name: "description", content: "Searchable history of production incidents, root causes and resolutions." },
      { property: "og:title", content: "Incident History – IncidentMind" },
      { property: "og:description", content: "Searchable history of production incidents, root causes and resolutions." },
    ],
  }),
  component: History,
});

function History() {
  const q = useQuery({ queryKey: ["incidents"], queryFn: () => api<{ incidents: Incident[] }>("/api/incidents") });
  const [s, setS] = useState(""); const [sev, setSev] = useState(""); const [svc, setSvc] = useState(""); const [st, setSt] = useState(""); const [env, setEnv] = useState("");
  const [sel, setSel] = useState<Incident | null>(null);
  const all = useMemo(() => { const seen = new Set<string>(); return (q.data?.incidents ?? []).filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true))); }, [q.data]);
  const services = [...new Set(all.map((i) => i.service))].sort();
  const rows = useMemo(() => all.filter((i) =>
    (!sev || i.severity === sev) && (!svc || i.service === svc) && (!st || i.status === st) && (!env || i.environment === env) &&
    (!s || JSON.stringify(i).toLowerCase().includes(s.toLowerCase()))).sort((a, b) => b.timestamp.localeCompare(a.timestamp)), [all, s, sev, svc, st, env]);
  const sel2 = (v: string, set: (x: string) => void, opts: string[], label: string) => (
    <select className={inputCls} value={v} onChange={(e) => set(e.target.value)}><option value="">{label}</option>{opts.map((o) => <option key={o}>{o}</option>)}</select>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader title="Incident History" sub={`${rows.length} of ${all.length} incidents`} />
      <div className="grid gap-2 md:grid-cols-5">
        <input className={inputCls} placeholder="Search…" value={s} onChange={(e) => setS(e.target.value)} />
        {sel2(sev, setSev, ["Critical", "High", "Medium", "Low"], "All severities")}
        {sel2(svc, setSvc, services, "All services")}
        {sel2(st, setSt, ["Resolved", "Investigating", "Open"], "All statuses")}
        {sel2(env, setEnv, ["Production", "Staging", "Development"], "All environments")}
      </div>
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground"><tr>{["ID", "Source", "Service", "Severity", "Status", "Root Cause", "Resolution", "Date"].map((h) => <th key={h} className="p-2">{h}</th>)}</tr></thead>
            <tbody className="divide-y">
              {q.isLoading && <tr><td colSpan={8} className="p-6"><div className="h-24 animate-pulse rounded bg-muted" /></td></tr>}
              {rows.map((i) => (
                <tr key={i.id} className="cursor-pointer hover:bg-accent/50" onClick={() => setSel(i)}>
                  <td className="p-2 font-mono text-xs">{i.id}</td><td className="p-2"><SourceTag source={i.source} /></td><td className="p-2">{i.service}</td>
                  <td className="p-2"><Badge kind={i.severity}>{i.severity}</Badge></td><td className="p-2"><Badge kind={i.status}>{i.status}</Badge></td>
                  <td className="max-w-xs truncate p-2 text-muted-foreground">{i.rootCause ?? "—"}</td>
                  <td className="max-w-xs truncate p-2 text-muted-foreground">{i.resolution ?? "—"}</td>
                  <td className="whitespace-nowrap p-2 text-xs text-muted-foreground">{fmtDate(i.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {sel && (
        <div className="fixed inset-0 z-40 flex justify-end bg-background/60 backdrop-blur-sm" onClick={() => setSel(null)}>
          <aside className="h-full w-full max-w-lg overflow-auto border-l bg-card p-6 animate-in slide-in-from-right" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h2 className="font-mono text-lg font-semibold">{sel.id}</h2><button onClick={() => setSel(null)}><X className="h-5 w-5" /></button></div>
            <p className="mt-1 font-medium">{sel.title}</p>
            <div className="mt-2 flex flex-wrap gap-1"><Badge kind={sel.severity}>{sel.severity}</Badge><Badge kind={sel.status}>{sel.status}</Badge><Badge>{sel.environment}</Badge><Badge>{sel.errorCode}</Badge><SourceTag source={sel.source} /></div>
            <div className="mt-5 space-y-4 text-sm">
              {[["Service", sel.service], ["Timestamp", fmtDate(sel.timestamp)], ["Description", sel.description], ["Root Cause", sel.rootCause], ["Resolution", sel.resolution], ["Outcome", sel.outcome]].map(([k, v]) => (
                <div key={k}><div className="text-xs uppercase tracking-wider text-muted-foreground">{k}</div><p className="mt-1">{v || "—"}</p></div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
