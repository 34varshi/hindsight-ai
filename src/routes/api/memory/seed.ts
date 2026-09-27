import { createFileRoute } from "@tanstack/react-router";
import { retain } from "@/lib/hindsight.server";
import { errorResponse } from "@/lib/api-utils.server";
import { DEMO_INCIDENTS, incidentToMemoryText } from "@/lib/demo-data";

// Retains the resolved demo incidents into the Hindsight bank (one-time bootstrap).
export const Route = createFileRoute("/api/memory/seed")({
  server: {
    handlers: {
      POST: async () => {
        const items = DEMO_INCIDENTS.filter((i) => i.status === "Resolved").map((i) => ({
          content: incidentToMemoryText(i), context: "resolved production incident", timestamp: i.timestamp, document_id: i.id,
          metadata: { incident_id: i.id, service: i.service, severity: i.severity, environment: i.environment },
        }));
        try {
          for (let k = 0; k < items.length; k += 5) await retain(items.slice(k, k + 5));
          return Response.json({ success: true, retained: items.length });
        } catch (e) { return errorResponse(e); }
      },
    },
  },
});
