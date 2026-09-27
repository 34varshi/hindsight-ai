import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { retain } from "@/lib/hindsight.server";
import { errorResponse } from "@/lib/api-utils.server";
import { incidentToMemoryText } from "@/lib/demo-data";
import { incidents, upsertIncident } from "@/lib/store.server";

const schema = z.object({
  incident_id: z.string().min(1).max(40),
  incident_description: z.string().min(1).max(4000),
  root_cause: z.string().min(1).max(2000),
  resolution: z.string().min(1).max(2000),
  outcome: z.string().min(1).max(2000),
  service: z.string().min(1).max(100),
  environment: z.string().min(1).max(40),
  severity: z.string().min(1).max(20),
  error_code: z.string().max(60).optional(),
  timestamp: z.string().optional(),
});

export const Route = createFileRoute("/api/incidents/resolve")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const p = schema.safeParse(await request.json().catch(() => null));
        if (!p.success) return Response.json({ error: "Invalid resolution", issues: p.error.issues }, { status: 400 });
        const d = p.data;
        const timestamp = d.timestamp || new Date().toISOString();
        const content = incidentToMemoryText({
          id: d.incident_id, service: d.service, environment: d.environment, severity: d.severity, errorCode: d.error_code,
          description: d.incident_description, rootCause: d.root_cause, resolution: d.resolution, outcome: d.outcome, timestamp,
        });
        try {
          const r = await retain([{
            content, context: "resolved production incident", timestamp, document_id: d.incident_id,
            metadata: { incident_id: d.incident_id, service: d.service, severity: d.severity, environment: d.environment },
          }]);
          const existing = incidents.find((i) => i.id === d.incident_id);
          upsertIncident({
            ...(existing ?? { title: d.incident_description.slice(0, 80), errorCode: d.error_code ?? "" }),
            id: d.incident_id, service: d.service, environment: d.environment as never, severity: d.severity as never,
            description: d.incident_description, rootCause: d.root_cause, resolution: d.resolution, outcome: d.outcome,
            status: "Resolved", timestamp: existing?.timestamp ?? timestamp,
          } as never);
          return Response.json({ success: true, memory_id: r.document_id ?? r.operation_id ?? d.incident_id, message: "Incident successfully stored in Hindsight memory." });
        } catch (e) { return errorResponse(e); }
      },
    },
  },
});
