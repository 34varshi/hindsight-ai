import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { incidents, nextIncidentId, upsertIncident } from "@/lib/store.server";

const schema = z.object({
  id: z.string().max(40).optional(),
  service: z.string().min(1).max(100),
  environment: z.enum(["Production", "Staging", "Development"]),
  severity: z.enum(["Critical", "High", "Medium", "Low"]),
  errorCode: z.string().max(60).default(""),
  description: z.string().min(1).max(4000),
  symptoms: z.string().max(4000).optional(),
  timestamp: z.string().optional(),
});

export const Route = createFileRoute("/api/incidents/")({
  server: {
    handlers: {
      GET: async () => Response.json({ incidents, next_id: nextIncidentId() }),
      POST: async ({ request }) => {
        const p = schema.safeParse(await request.json().catch(() => null));
        if (!p.success) return Response.json({ error: "Invalid incident", issues: p.error.issues }, { status: 400 });
        const d = p.data;
        const inc = {
          ...d, id: d.id || nextIncidentId(), title: d.description.slice(0, 80),
          status: "Investigating" as const, source: "live" as const, timestamp: d.timestamp || new Date().toISOString(),
        };
        upsertIncident(inc);
        return Response.json({ incident: inc });
      },
    },
  },
});
