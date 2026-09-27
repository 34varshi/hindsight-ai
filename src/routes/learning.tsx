import { createFileRoute } from "@tanstack/react-router";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Brain, CircleSlash } from "lucide-react";
import { DEMO_INCIDENTS } from "@/lib/demo-data";
import { Panel, PageHeader } from "@/components/im/ui";

export const Route = createFileRoute("/learning")({
  head: () => ({
    meta: [
      { title: "How the Agent Learns – IncidentMind" },
      { name: "description", content: "See how Hindsight memory makes incident recommendations more contextual over time." },
      { property: "og:title", content: "How the Agent Learns – IncidentMind" },
      { property: "og:description", content: "See how Hindsight memory makes incident recommendations more contextual over time." },
    ],
  }),
  component: Learning,
});

const timeline = [
  { n: 1, t: "Generic response", d: "No memory yet. The agent suggests standard triage: check logs, health, network." },
  { n: 5, t: "Recognises recurring database issue", d: "Recall surfaces INC-004 — pool exhaustion appears as a pattern." },
  { n: 10, t: "Uses previous resolutions", d: "Recommends pool sizing values that worked before, citing incident IDs." },
  { n: 20, t: "Provides more contextual recommendations", d: "Combines root causes, outcomes and service history into targeted checks." },
];

function Learning() {
  const byMonth = new Map<string, number>();
  let total = 0;
  [...DEMO_INCIDENTS].filter((i) => i.status === "Resolved").sort((a, b) => a.timestamp.localeCompare(b.timestamp)).forEach((i) => {
    total++; byMonth.set(new Date(i.timestamp).toLocaleString("en", { month: "short" }), total);
  });
  const data = [...byMonth].map(([month, memories]) => ({ month, memories }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="How the Agent Learns" sub="Each retained resolution becomes evidence for the next incident." />
      <Panel title="Learning timeline">
        <ol className="relative space-y-6 border-l pl-6">
          {timeline.map((s, i) => (
            <li key={s.n} className="relative">
              <span className={`absolute -left-[31px] grid h-4 w-4 place-items-center rounded-full border-2 ${i === 0 ? "border-muted-foreground bg-background" : "border-memory bg-memory/30"}`} />
              <div className="font-mono text-xs text-muted-foreground">Interaction {s.n}</div>
              <div className={`font-semibold ${i ? "text-memory" : ""}`}>{s.t}</div>
              <p className="text-sm text-muted-foreground">{s.d}</p>
            </li>
          ))}
        </ol>
      </Panel>
      <Panel title="Memory Growth" icon={<Brain className="h-4 w-4 text-memory" />} tone="memory">
        <div className="h-64">
          <ResponsiveContainer>
            <AreaChart data={data}>
              <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--memory)" stopOpacity={0.5} /><stop offset="100%" stopColor="var(--memory)" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6 }} />
              <Area type="monotone" dataKey="memories" stroke="var(--memory)" fill="url(#g)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Cumulative resolved incidents retained into Hindsight (seed history).</p>
      </Panel>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Before Hindsight" icon={<CircleSlash className="h-4 w-4" />}>
          <p className="text-sm text-muted-foreground">No historical context. Every incident is treated as new, so recommendations are generic checklists.</p>
        </Panel>
        <Panel title="After Hindsight" icon={<Brain className="h-4 w-4 text-memory" />} tone="memory">
          <p className="text-sm">Historical incidents + root causes + resolutions + outcomes. Recommendations cite prior incidents as evidence.</p>
        </Panel>
      </div>
    </div>
  );
}
