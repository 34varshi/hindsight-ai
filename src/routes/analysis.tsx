import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Activity, Brain, Sparkles, ListChecks, FileSearch, CheckCircle2, Loader2, Save, AlertTriangle, Repeat } from "lucide-react";
import { api, setAppState, useAppState } from "@/lib/client";
import { Panel, Badge, PageHeader, Btn, ErrorNote, MemoryTag, inputCls } from "@/components/im/ui";
import { Flow } from "@/components/im/Flow";
import { Comparison } from "@/components/im/Comparison";

export const Route = createFileRoute("/analysis")({
  head: () => ({
    meta: [
      { title: "Incident Analysis – IncidentMind" },
      { name: "description", content: "AI analysis grounded in similar incidents recalled from Hindsight memory." },
      { property: "og:title", content: "Incident Analysis – IncidentMind" },
      { property: "og:description", content: "AI analysis grounded in similar incidents recalled from Hindsight memory." },
    ],
  }),
  component: Analysis,
});

const STEPS = ["Incident", "Recall", "Analyze", "Resolve", "Retain", "Learn"];

function Analysis() {
  const { analysis: a, demoStep, retainedIds } = useAppState();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({ root_cause: "", resolution: "", outcome: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!a) return (
    <div className="mx-auto max-w-xl py-20 text-center">
      <Activity className="mx-auto h-10 w-10 text-muted-foreground" />
      <h1 className="mt-4 text-xl font-semibold">No incident under analysis</h1>
      <p className="mt-2 text-sm text-muted-foreground">Submit an incident to see Hindsight recall and AI analysis here.</p>
      <Link to="/new" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">New Incident</Link>
    </div>
  );

  const c = a.current_incident;
  const newlyRecalled = a.recalled_memories.filter((m) => m.incidentId && retainedIds.includes(m.incidentId) && m.incidentId !== c.id);

  async function resolve(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setErr(null);
    try {
      const r = await api<{ memory_id: string; message: string }>("/api/incidents/resolve", { method: "POST", body: JSON.stringify({
        incident_id: c.id, incident_description: c.description, service: c.service, environment: c.environment,
        severity: c.severity, error_code: c.errorCode, timestamp: c.timestamp, ...form }) });
      setSaved(r.memory_id);
      setAppState({ retainedIds: [...retainedIds, c.id], demoStep: demoStep ? 5 : 0 });
      qc.invalidateQueries();
    } catch (e) { setErr((e as Error).message); } finally { setSaving(false); }
  }

  const active = saved ? (demoStep >= 6 ? 6 : 5) : demoStep >= 6 ? 5 : 3;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader title="Incident Analysis" sub={`${c.id} · ${c.service}`} />
      <Panel><Flow steps={STEPS} active={active} /></Panel>

      {newlyRecalled.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-memory bg-memory/10 p-4 text-sm animate-in fade-in">
          <Repeat className="h-5 w-5 text-memory" />
          <div><b className="text-memory">The agent learned.</b> This analysis recalled {newlyRecalled.map((m) => m.incidentId).join(", ")} — the incident you resolved earlier in this session.</div>
        </div>
      )}

      {/* 1. Current incident */}
      <Panel title="Current Incident" icon={<Activity className="h-4 w-4" />}>
        <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm">{c.id}</span><Badge kind={c.severity}>{c.severity}</Badge><Badge>{c.environment}</Badge><Badge>{c.errorCode}</Badge></div>
        <p className="mt-2 text-base font-medium">{c.service}</p>
        <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
        {c.symptoms && <p className="mt-1 text-sm text-muted-foreground"><span className="font-medium text-foreground">Symptoms: </span>{c.symptoms}</p>}
      </Panel>

      {/* 2. Hindsight recall */}
      <Panel title="Hindsight Memory · Recall" icon={<Brain className="h-4 w-4 text-memory" />} tone="memory"
        right={<span className="font-mono text-xs text-memory">{a.recalled_memories.length} memories recalled</span>}>
        {a.memory_status === "unavailable" && <ErrorNote>Hindsight memory is temporarily unavailable. The analysis below uses only the current incident. <span className="opacity-70">({a.memory_error})</span></ErrorNote>}
        {a.memory_status === "not_configured" && <ErrorNote>Hindsight is not configured (HINDSIGHT_BASE_URL / HINDSIGHT_API_KEY). The analysis below uses only the current incident.</ErrorNote>}
        {a.memory_status === "empty" && <p className="text-sm text-muted-foreground">No closely related historical incidents were found. The AI analysed using only the current incident.</p>}
        {a.memory_status === "ok" && (
          <>
            <p className="text-sm"><b className="text-memory">{a.similar_incidents.length} similar incidents found</b> <span className="text-muted-foreground">for query:</span></p>
            <code className="mt-1 block rounded bg-muted p-2 font-mono text-xs text-muted-foreground">{a.recall_query}</code>
          </>
        )}
      </Panel>

      {/* 3. Similar historical incidents */}
      {a.similar_incidents.length > 0 && (
        <Panel title="Similar Historical Incidents" icon={<FileSearch className="h-4 w-4 text-memory" />} tone="memory">
          <div className="grid gap-3 md:grid-cols-3">
            {a.similar_incidents.map((s, i) => (
              <div key={s.incident_id + i} className="rounded-md border bg-background p-3 text-sm">
                <div className="flex items-center justify-between"><span className="font-mono font-semibold">{i + 1}. {s.incident_id}</span><MemoryTag>recalled</MemoryTag></div>
                <p className="mt-2 font-medium">{s.summary}</p>
                <p className="mt-2 text-xs text-muted-foreground"><b>Root cause:</b> {s.root_cause}</p>
                <p className="mt-1 text-xs"><b className="text-memory">Resolution:</b> {s.resolution}</p>
                <p className="mt-2 text-xs italic text-muted-foreground">{s.relevance}</p>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* 4. AI analysis */}
      <Panel title="AI Analysis" icon={<Sparkles className="h-4 w-4 text-primary" />} tone="ai" right={<Badge kind={a.confidence === "High" ? "Resolved" : a.confidence === "Medium" ? "Medium" : "Low"}>Confidence: {a.confidence}</Badge>}>
        <p className="text-sm leading-relaxed">{a.incident_summary}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a.explanation}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Possible Root Cause</h3>
            <ul className="space-y-1 text-sm">{a.likely_root_causes.map((r) => <li key={r} className="rounded border-l-2 border-warning bg-warning/5 px-2 py-1">{r}</li>)}</ul>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">What to Check Next</h3>
            <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">{a.what_to_check_next.map((r) => <li key={r}>{r}</li>)}</ul>
          </div>
        </div>
      </Panel>

      {/* 5. Recommended actions */}
      <Panel title="Recommended Actions" icon={<ListChecks className="h-4 w-4" />}>
        <div className="mb-3 flex items-center gap-2 rounded-md bg-warning/10 px-3 py-2 text-xs text-warning"><AlertTriangle className="h-3.5 w-3.5" />Suggestions based on evidence, not guaranteed fixes. Verify before applying in production.</div>
        <ol className="space-y-2">{a.recommended_actions.map((r, i) => <li key={r} className="flex gap-3 text-sm"><span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>{r}</li>)}</ol>
      </Panel>

      {/* 6. Memory evidence */}
      <Panel title="Memory Evidence" icon={<Brain className="h-4 w-4 text-memory" />} tone="memory">
        {a.evidence.length > 0 && <ul className="mb-4 list-disc space-y-1 pl-4 text-sm">{a.evidence.map((e) => <li key={e}>{e}</li>)}</ul>}
        {a.recalled_memories.length ? (
          <details className="text-sm"><summary className="cursor-pointer font-mono text-xs text-memory">Raw Hindsight recall results ({a.recalled_memories.length})</summary>
            <div className="mt-2 max-h-72 space-y-2 overflow-auto">{a.recalled_memories.map((m) => <div key={m.id} className="rounded border bg-background p-2 font-mono text-xs text-muted-foreground">{m.type && <span className="text-memory">[{m.type}] </span>}{m.text}</div>)}</div>
          </details>
        ) : <p className="text-sm text-muted-foreground">No memory evidence was available for this analysis.</p>}
      </Panel>

      <Comparison a={a} />

      {/* Retain */}
      <Panel title="Resolve Incident · Retain to Hindsight" icon={<Save className="h-4 w-4 text-memory" />} tone="memory">
        {saved ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-success"><CheckCircle2 className="h-5 w-5" /><b>✓ Incident successfully stored in Hindsight memory.</b></div>
            <p className="text-sm text-muted-foreground">Future incidents can now use this experience. Memory ID: <span className="font-mono">{saved}</span></p>
            <Btn variant="memory" onClick={() => { setAppState({ demoStep: Math.max(demoStep, 6), analysis: null }); nav({ to: "/new", search: { followup: true } }); }}>
              <Repeat className="h-4 w-4" />Submit a similar incident to test recall
            </Btn>
          </div>
        ) : (
          <form onSubmit={resolve} className="space-y-3">
            {(["root_cause", "resolution", "outcome"] as const).map((k) => (
              <label key={k} className="block space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">{k === "root_cause" ? "Actual Root Cause" : k === "resolution" ? "Actual Resolution" : "Outcome"}</span>
                <textarea required rows={2} className={inputCls} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  placeholder={k === "root_cause" ? a.likely_root_causes[0] : k === "resolution" ? "What actually fixed it?" : "e.g. Error rate back to baseline in 8 minutes"} />
              </label>
            ))}
            {demoStep > 0 && <button type="button" className="text-xs text-primary" onClick={() => setForm({ root_cause: "Database connection pool exhausted (max 100) after checkout traffic grew 2x", resolution: "Increased pool size from 100 to 200, added PgBouncer, alert at 80% pool utilisation", outcome: "503s stopped within 7 minutes; no recurrence during next peak" })}>Fill demo resolution</button>}
            {err && <ErrorNote>{err}</ErrorNote>}
            <div className="flex justify-end"><Btn variant="memory" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}Save to Hindsight Memory</Btn></div>
          </form>
        )}
      </Panel>
    </div>
  );
}
