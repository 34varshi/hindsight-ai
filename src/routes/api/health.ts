import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const base = process.env["HINDSIGHT_BASE_URL"];
        let hindsight: "connected" | "unavailable" | "not_configured" = "not_configured";
        if (base) {
          try {
            const r = await fetch(`${base.replace(/\/+$/, "")}/health`, {
              headers: process.env["HINDSIGHT_API_KEY"] ? { Authorization: `Bearer ${process.env["HINDSIGHT_API_KEY"]}` } : {},
            });
            hindsight = r.ok ? "connected" : "unavailable";
          } catch { hindsight = "unavailable"; }
        }
        return Response.json({ status: "ok", hindsight, llm: !!process.env["LOVABLE_API_KEY"] || !!process.env["LLM_API_KEY"] });
      },
    },
  },
});
