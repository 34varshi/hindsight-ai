import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, Search, Wand2 } from "lucide-react";
import { z } from "zod";
import { api, setAppState, useAppState } from "@/lib/client";
import { DEMO_SCENARIO } from "@/lib/demo-data";
import type { AnalysisResult, NewIncidentInput } from "@/lib/types";
import { Panel, PageHeader, Btn, ErrorNote, inputCls } from "@/components/im/ui";
import { Flow } from "@/components/im/Flow";

export const Route = createFileRoute("/new")({
  validateSearch: z.object({ demo: z.boolean().optional(), followup: z.boolean().optional() }),
  head: () => ({
    meta: [
      { title: "New Incident – IncidentMind" },
      { name: "description", content: "Report a production incident and let the agent recall similar past incidents." },
      { property: "og:title", content: "New Incident – IncidentMind" },
      { property: "og:description", content: "Report a production incident and let the agent recall similar past incidents." },
    ],
  }),
  component: NewIncident,
});

const STEPS = ["Incident", "Recall", "Analyze", "Resolve", "Retain", "Learn"];

function NewIncident() {
  const { demo, followup } = Route.useSearch();
  const nav = useNavigate();
  const { demoStep } = useAppState();
  const incQ = useQuery({ queryKey: ["incidents"], queryFn: () => api<{ next_id: string }>("/api/incidents") });
  const [f, setF] = useState<NewIncidentInput>({ id: "", service: "", environment: "Production", severity: "High", errorCode: "", description: "", symptoms: "", timestamp: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date().toISOString().slice(0, 16);
    setF((p) => ({ ...p, timestamp: p.timestamp || now, id: p.id || incQ.data?.next_id || "" }));
  }, [incQ.data]);

  useEffect(() => {
    if (demo) setF((p) => ({ ...p, ...DEMO_SCENARIO }));
    if (followup) setF((p) => ({ ...p, service: "Payment API", environment: "Production", severity: "Critical", errorCode: "HTTP 503",
      description: "Payment API intermittently returning 503 during evening peak; DB connection wait time spiking.", symptoms: "503 rate 12%, connection pool at 100% utilisation." }));
  }, [demo, followup]);

  const set = (k: keyof NewIncidentInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      const body = { ...f, timestamp: new Date(f.timestamp).toISOString(), compare_generic: true };
      const r = await api<AnalysisResult>("/api/incidents/analyze", { method: "POST", body: JSON.stringify(body) });
      setAppState({ analysis: r, demoStep: demoStep ? (followup ? 6 : 3) : 0 });
      nav({ to: "/analysis" });
    } catch (e) { setErr((e as Error).message); } finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="New Incident" sub="Describe what's happening. The agent will recall similar incidents from Hindsight before analysing."
        right={<Btn variant="ghost" type="button" onClick={() => { setF({ ...f, ...DEMO_SCENARIO }); setAppState({ demoStep: 1 }); }}><Wand2 className="h-4 w-4" />Load demo incident</Btn>} />
      {demoStep > 0 && <Panel title="Demo progress"><Flow steps={STEPS} active={followup ? 5 : 0} /></Panel>}
      <form onSubmit={submit}>
        <Panel title="Incident details">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Incident ID"><input required className={`${inputCls} font-mono`} value={f.id} onChange={set("id")} /></Field>
            <Field label="Service"><input required className={inputCls} value={f.service} onChange={set("service")} placeholder="Payment API" /></Field>
            <Field label="Environment"><select className={inputCls} value={f.environment} onChange={set("environment")}>{["Production", "Staging", "Development"].map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Severity"><select className={inputCls} value={f.severity} onChange={set("severity")}>{["Critical", "High", "Medium", "Low"].map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Error Code"><input className={`${inputCls} font-mono`} value={f.errorCode} onChange={set("errorCode")} placeholder="HTTP 503" /></Field>
            <Field label="Timestamp"><input type="datetime-local" required className={inputCls} value={f.timestamp} onChange={set("timestamp")} /></Field>
            <Field label="Incident Description" wide><textarea required rows={4} className={inputCls} value={f.description} onChange={set("description")} /></Field>
            <Field label="Observed Symptoms" wide><textarea rows={3} className={inputCls} value={f.symptoms} onChange={set("symptoms")} placeholder="Error rates, latency, dashboards, alerts…" /></Field>
          </div>
          {err && <div className="mt-4"><ErrorNote>{err}</ErrorNote></div>}
          <div className="mt-5 flex items-center justify-end gap-3">
            {loading && <span className="font-mono text-xs text-memory">Recalling from Hindsight → analysing…</span>}
            <Btn type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Analyze Incident</Btn>
          </div>
        </Panel>
      </form>
    </div>
  );
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={`block space-y-1.5 ${wide ? "md:col-span-2" : ""}`}><span className="text-xs font-medium text-muted-foreground">{label}</span>{children}</label>;
}
