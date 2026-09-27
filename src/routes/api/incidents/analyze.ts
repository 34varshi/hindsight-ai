import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { recall, HindsightError } from "@/lib/hindsight.server";
import { complete, parseJson, SYSTEM_PROMPT } from "@/lib/llm.server";
import { upsertIncident } from "@/lib/store.server";
import type { AnalysisResult, RecalledMemory } from "@/lib/types";

const schema = z.object({
  id: z.string().min(1).max(40),
  service: z.string().min(1).max(100),
  environment: z.enum(["Production", "Staging", "Development"]),
  severity: z.enum(["Critical", "High", "Medium", "Low"]),
  errorCode: z.string().max(60).default(""),
  description: z.string().min(1).max(4000),
  symptoms: z.string().max(4000).optional(),
  timestamp: z.string(),
  compare_generic: z.boolean().optional(),
});

export const Route = createFileRoute("/api/incidents/analyze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const p = schema.safeParse(await request.json().catch(() => null));
        if (!p.success) return Response.json({ error: "Invalid incident", issues: p.error.issues }, { status: 400 });
        const { compare_generic, ...inc } = p.data;
        upsertIncident({ ...inc, title: inc.description.slice(0, 80), status: "Investigating" });

        const query = `${inc.service} ${inc.errorCode} incident: ${inc.description} ${inc.symptoms ?? ""}. What were root causes and resolutions of similar past incidents?`.trim();

        let memories: RecalledMemory[] = [];
        let memory_status: AnalysisResult["memory_status"] = "ok";
        let memory_error: string | undefined;
        try {
          memories = await recall(query);
          if (memories.length === 0) memory_status = "empty";
        } catch (e) {
          memory_status = e instanceof HindsightError ? (e.kind === "not_configured" ? "not_configured" : "unavailable") : "unavailable";
          memory_error = (e as Error).message;
        }

        const memBlock = memories.length
          ? memories.slice(0, 20).map((m, i) => `[M${i + 1}] ${m.text}`).join("\n")
          : "No historical memories were retrieved from Hindsight. Say that historical memory is insufficient.";
        const userMsg = `CURRENT INCIDENT\nID: ${inc.id}\nService: ${inc.service}\nEnvironment: ${inc.environment}\nSeverity: ${inc.severity}\nError: ${inc.errorCode}\nDescription: ${inc.description}\nSymptoms: ${inc.symptoms ?? "n/a"}\nTime: ${inc.timestamp}\n\nHINDSIGHT MEMORIES\n${memBlock}`;

        try {
          const [raw, generic] = await Promise.all([
            complete(SYSTEM_PROMPT, userMsg),
            compare_generic
              ? complete("You are an incident assistant with no historical context. Give a brief generic 2-3 sentence triage response. Plain text.", `Incident: ${inc.errorCode} ${inc.description}`)
              : Promise.resolve(undefined),
          ]);
          const a = parseJson<Partial<AnalysisResult>>(raw);
          const knownIds = new Set(memories.map((m) => m.incidentId).filter(Boolean));
          const result: AnalysisResult = {
            current_incident: inc,
            memory_used: memories.length > 0,
            memory_status, memory_error,
            recall_query: query,
            recalled_memories: memories,
            // guard against hallucinated historical incidents
            similar_incidents: (a.similar_incidents ?? []).filter((s) => memories.length > 0 && (knownIds.size === 0 || knownIds.has(s.incident_id))),
            incident_summary: a.incident_summary ?? "",
            likely_root_causes: a.likely_root_causes ?? [],
            evidence: a.evidence ?? [],
            recommended_actions: a.recommended_actions ?? [],
            confidence: a.confidence ?? "Low",
            what_to_check_next: a.what_to_check_next ?? [],
            explanation: a.explanation ?? "",
            generic_response: generic?.trim(),
          };
          return Response.json(result);
        } catch (e) {
          return Response.json({ error: `AI analysis failed: ${(e as Error).message}`, memory_status, recalled_memories: memories }, { status: 502 });
        }
      },
    },
  },
});
