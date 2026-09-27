import { createFileRoute } from "@tanstack/react-router";
import { listMemories } from "@/lib/hindsight.server";
import { incidents } from "@/lib/store.server";

export const Route = createFileRoute("/api/stats")({
  server: {
    handlers: {
      GET: async () => {
        let memory_records: number | null = null;
        try { memory_records = (await listMemories(500)).length; } catch { memory_records = null; }
        const resolved = incidents.filter((i) => i.status === "Resolved");
        const causes = resolved.map((i) => (i.rootCause ?? "").toLowerCase());
        const recurring = resolved.filter((i) => {
          const k = (i.rootCause ?? "").toLowerCase().split(" ").slice(0, 3).join(" ");
          return causes.filter((c) => c.includes(k)).length > 1;
        }).length;
        return Response.json({ total: incidents.length, resolved: resolved.length, memory_records, similar_found: recurring });
      },
    },
  },
});
