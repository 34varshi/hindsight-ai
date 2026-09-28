import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Brain, Loader2, Search, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { api, fmtDate } from "@/lib/client";
import type { Incident, RecalledMemory } from "@/lib/types";
import { Panel, PageHeader, Btn, ErrorNote, MemoryTag, SourceTag, inputCls } from "@/components/im/ui";

export const Route = createFileRoute("/memory")({
  head: () => ({
    meta: [
      { title: "Hindsight Memory – IncidentMind" },
      { name: "description", content: "Explore incident memories stored in Hindsight." },
      { property: "og:title", content: "Hindsight Memory – IncidentMind" },
      { property: "og:description", content: "Explore incident memories stored in Hindsight." },
    ],
  }),
  component: MemoryPage,
});

function MemoryPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const mem = useQuery({ queryKey: ["memory", query], queryFn: () => api<{ memories: RecalledMemory[] }>(`/api/memory${query ? `?q=${encodeURIComponent(query)}` : ""}`), retry: false });
  const inc = useQuery({ queryKey: ["incidents"], queryFn: () => api<{ incidents: Incident[] }>("/api/incidents") });
  const seed = useMutation({
    mutationFn: () => api<{ retained: number }>("/api/memory/seed", { method: "POST" }),
    onSuccess: (r) => { toast.success(`Retained ${r.retained} historical incidents in Hindsight`); qc.invalidateQueries(); },
    onError: (e) => toast.error((e as Error).message),
  });
  const byId = new Map((inc.data?.incidents ?? []).map((i) => [i.id, i]));
  // One row per incident: keep the best-scoring chunk, count the rest as related facts.
  const rows = useMemo(() => {
    const groups = new Map<string, { m: RecalledMemory; count: number }>();
    for (const m of mem.data?.memories ?? []) {
      const key = m.incidentId ?? `raw:${m.id}`;
      const g = groups.get(key);
      if (!g) groups.set(key, { m, count: 1 });
      else { g.count++; if ((m.score ?? -1) > (g.m.score ?? -1)) g.m = m; }
    }
    return [...groups.values()];
  }, [mem.data]);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader title="Hindsight Memory" sub="Everything the agent has retained. Search runs a live Hindsight recall."
        right={<Btn variant="ghost" onClick={() => seed.mutate()} disabled={seed.isPending}>{seed.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Seed historical incidents</Btn>} />
      <form onSubmit={(e) => { e.preventDefault(); setQuery(q); }} className="flex gap-2">
        <input className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Recall: e.g. payment 503 database timeout" />
        <Btn><Search className="h-4 w-4" />Recall</Btn>
      </form>
      {mem.isError && <ErrorNote>{(mem.error as Error).message}</ErrorNote>}
      <Panel title={query ? `Recall results for “${query}”` : "Stored memories"} icon={<Brain className="h-4 w-4 text-memory" />} tone="memory">
        {mem.isLoading ? <div className="h-40 animate-pulse rounded bg-muted" /> : mem.data?.memories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No memories yet. Use “Seed historical incidents” or resolve an incident to retain one.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="p-2">Incident ID</th><th className="p-2">Source</th><th className="p-2">Service</th><th className="p-2">Problem</th><th className="p-2">Root Cause</th><th className="p-2">Resolution</th><th className="p-2">Date</th><th className="p-2">Similarity</th><th className="p-2">Facts</th></tr>
              </thead>
              <tbody className="divide-y">
                {rows.map(({ m, count }) => {
                  const i = m.incidentId ? byId.get(m.incidentId) : undefined;
                  return (
                    <tr key={m.id} onClick={() => m.incidentId && setSel(m.incidentId)} className="cursor-pointer hover:bg-accent/50">
                      <td className="p-2 font-mono text-xs">{m.incidentId ?? "—"}</td>
                      <td className="p-2"><SourceTag source={i?.source ?? "live"} /></td>
                      <td className="p-2">{i?.service ?? "—"}</td>
                      <td className="max-w-xs p-2 text-muted-foreground">{i?.errorCode ?? m.text.slice(0, 80)}</td>
                      <td className="max-w-xs p-2">{i?.rootCause ?? <span className="text-xs text-muted-foreground">{m.text.slice(0, 120)}</span>}</td>
                      <td className="max-w-xs p-2 text-muted-foreground">{i?.resolution ?? "—"}</td>
                      <td className="whitespace-nowrap p-2 text-xs text-muted-foreground">{i ? fmtDate(i.timestamp) : "—"}</td>
                      <td className="p-2 font-mono text-xs text-memory">{m.score != null ? m.score.toFixed(2) : query ? "match" : "—"}</td>
                      <td className="p-2 font-mono text-xs text-muted-foreground">{count}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      {sel && <MemoryDetail id={sel} onClose={() => setSel(null)} onPick={setSel} />}
    </div>
  );
}

function MemoryDetail({ id, onClose, onPick }: { id: string; onClose: () => void; onPick: (id: string) => void }) {
  const d = useQuery({ queryKey: ["memory-detail", id], queryFn: () => api<{ incident: Incident | null; stored: RecalledMemory[]; related: string[] }>(`/api/memory/${id}`) });
  const i = d.data?.incident;
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-background/60 backdrop-blur-sm" onClick={onClose}>
      <aside className="h-full w-full max-w-lg overflow-auto border-l bg-card p-6 animate-in slide-in-from-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between"><h2 className="font-mono text-lg font-semibold">{id}</h2><button onClick={onClose}><X className="h-5 w-5" /></button></div>
        <div className="mt-2 flex gap-1"><MemoryTag />{d.data && <SourceTag source={i?.source ?? "live"} />}</div>
        {d.isLoading ? <Loader2 className="mt-8 h-6 w-6 animate-spin" /> : d.isError ? <div className="mt-4"><ErrorNote>{(d.error as Error).message}</ErrorNote></div> : (
          <div className="mt-5 space-y-4 text-sm">
            {[["Original Incident", i?.description], ["Root Cause", i?.rootCause], ["Resolution", i?.resolution], ["Outcome", i?.outcome]].map(([k, v]) => (
              <div key={k}><div className="text-xs uppercase tracking-wider text-muted-foreground">{k}</div><p className="mt-1">{v ?? "—"}</p></div>
            ))}
            <div><div className="text-xs uppercase tracking-wider text-muted-foreground">Related Incidents</div>
              <div className="mt-1 flex flex-wrap gap-1">{d.data?.related.length ? d.data.related.map((r) => <button key={r} onClick={() => onPick(r)} className="rounded border px-2 py-0.5 font-mono text-xs hover:border-memory">{r}</button>) : "—"}</div></div>
            <div><div className="text-xs uppercase tracking-wider text-muted-foreground">Stored Memory</div>
              <div className="mt-1 space-y-2">{d.data?.stored.length ? d.data.stored.map((m) => <div key={m.id} className="rounded border border-memory/30 bg-memory/5 p-2 font-mono text-xs">{m.text}</div>) : <p className="text-muted-foreground">No facts returned for this incident.</p>}</div></div>
          </div>
        )}
      </aside>
    </div>
  );
}
