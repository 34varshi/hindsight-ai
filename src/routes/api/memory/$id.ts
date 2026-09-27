import { createFileRoute } from "@tanstack/react-router";
import { recall } from "@/lib/hindsight.server";
import { errorResponse } from "@/lib/api-utils.server";
import { incidents } from "@/lib/store.server";

// Look up everything Hindsight remembers about one incident, plus related incidents.
export const Route = createFileRoute("/api/memory/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = params.id.slice(0, 40);
        const incident = incidents.find((i) => i.id === id) ?? null;
        try {
          const memories = await recall(`Incident ${id}${incident ? ` ${incident.service} ${incident.description}` : ""}`);
          const stored = memories.filter((m) => m.incidentId === id || m.text.includes(id));
          const related = [...new Set(memories.map((m) => m.incidentId).filter((x): x is string => !!x && x !== id))];
          return Response.json({ id, incident, stored, related });
        } catch (e) { return errorResponse(e); }
      },
    },
  },
});
