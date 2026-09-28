import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const base = process.env["HINDSIGHT_BASE_URL"] || "https://api.hindsight.vectorize.io";
        const key = process.env["HINDSIGHT_API_KEY"];
        const ns = process.env["HINDSIGHT_NAMESPACE"] || "default";
        let hindsight: "connected" | "unavailable" | "not_configured" = "not_configured";
        if (key) {
          try {
            const r = await fetch(`${base.replace(/\/+$/, "")}/v1/${ns}/banks`, { headers: { Authorization: `Bearer ${key}` } });
            hindsight = r.ok ? "connected" : "unavailable";
          } catch { hindsight = "unavailable"; }
        }
        return Response.json({ status: "ok", hindsight, llm: !!process.env["LOVABLE_API_KEY"] || !!process.env["LLM_API_KEY"] });
      },
    },
  },
});
