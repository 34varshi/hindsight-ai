import { Brain, CircleSlash } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";

export function Comparison({ a }: { a?: AnalysisResult | null }) {
  const n = a?.similar_incidents.length ?? 3;
  const top = a?.similar_incidents[0];
  return (
    <section className="overflow-hidden rounded-lg border">
      <div className="border-b bg-card px-4 py-3"><h2 className="text-lg font-semibold">Memory Makes the Difference</h2></div>
      <div className="grid md:grid-cols-2">
        <div className="space-y-3 bg-muted/30 p-5">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground"><CircleSlash className="h-4 w-4" />Without Hindsight</div>
          <div className="text-sm"><span className="text-muted-foreground">Incident: </span>"{a ? `${a.current_incident.errorCode} – ${a.current_incident.description}` : "API returning 503 errors."}"</div>
          <blockquote className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            {a?.generic_response || "Check your server logs, database connection, network configuration and service health."}
          </blockquote>
          <div className="font-mono text-xs text-muted-foreground">→ GENERIC</div>
        </div>
        <div className="space-y-3 border-t bg-memory/5 p-5 md:border-l md:border-t-0">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-memory"><Brain className="h-4 w-4" />With Hindsight</div>
          <div className="text-sm font-semibold text-memory">{a ? (n ? `${n} similar incidents found` : "No closely related historical incidents were found.") : "3 similar incidents found"}</div>
          <blockquote className="space-y-2 rounded-md border border-memory/30 bg-card p-3 text-sm">
            <p>{a ? (a.likely_root_causes[0] ? `Previous incidents indicate: ${a.likely_root_causes[0]}.` : a.explanation) : "Previous incidents indicate database connection pool exhaustion."}</p>
            {(top || !a) && <p className="text-muted-foreground">{top ? `${top.incident_id} was resolved by: ${top.resolution}` : "INC-004 was resolved by increasing the pool size."}</p>}
          </blockquote>
          <div className="font-mono text-xs text-memory">→ CONTEXTUAL</div>
        </div>
      </div>
    </section>
  );
}
