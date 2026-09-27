import { createFileRoute } from "@tanstack/react-router";
import { listMemories, recall } from "@/lib/hindsight.server";
import { errorResponse } from "@/lib/api-utils.server";

export const Route = createFileRoute("/api/memory/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const q = new URL(request.url).searchParams.get("q");
        try {
          const memories = q ? await recall(q.slice(0, 500)) : await listMemories();
          return Response.json({ memories });
        } catch (e) { return errorResponse(e); }
      },
    },
  },
});
