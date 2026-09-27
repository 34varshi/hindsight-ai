// Real Hindsight (Vectorize) client. All calls happen server-side.
// Endpoints follow the Hindsight REST API:
//   POST {base}/v1/default/banks/{bank}/memories          -> retain
//   POST {base}/v1/default/banks/{bank}/memories/recall   -> recall
//   POST {base}/v1/default/banks/{bank}/reflect           -> reflect
//   GET  {base}/v1/default/banks/{bank}/memories/list     -> list
// Paths are overridable via env in case your deployment differs.
import type { RecalledMemory } from "./types";

export class HindsightError extends Error {
  constructor(message: string, public kind: "not_configured" | "unavailable") {
    super(message);
  }
}

function cfg() {
  const base = process.env["HINDSIGHT_BASE_URL"];
  const key = process.env["HINDSIGHT_API_KEY"];
  const bank = process.env["HINDSIGHT_BANK_ID"] || "incidentmind";
  const ns = process.env["HINDSIGHT_NAMESPACE"] || "default";
  if (!base) throw new HindsightError("HINDSIGHT_BASE_URL is not configured", "not_configured");
  return { base: base.replace(/\/+$/, ""), key, prefix: `/v1/${ns}/banks/${encodeURIComponent(bank)}`, bank };
}

export function hindsightConfigured() {
  return !!process.env["HINDSIGHT_BASE_URL"];
}

async function call(path: string, init: { method: string; body?: unknown }) {
  const c = cfg();
  let res: Response;
  try {
    res = await fetch(`${c.base}${c.prefix}${path}`, {
      method: init.method,
      headers: {
        "Content-Type": "application/json",
        ...(c.key ? { Authorization: `Bearer ${c.key}` } : {}),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
    });
  } catch (e) {
    throw new HindsightError(`Hindsight unreachable: ${(e as Error).message}`, "unavailable");
  }
  const text = await res.text();
  if (!res.ok) throw new HindsightError(`Hindsight ${res.status}: ${text.slice(0, 300)}`, "unavailable");
  try { return text ? JSON.parse(text) : {}; } catch { return { raw: text }; }
}

export async function retain(items: { content: string; context?: string; timestamp?: string; document_id?: string; metadata?: Record<string, string> }[]) {
  return call("/memories", { method: "POST", body: { items, async: false } });
}

function normalize(r: any, i: number): RecalledMemory {
  const text: string = r.text ?? r.content ?? r.fact ?? JSON.stringify(r);
  const m = text.match(/INC-\d{3,}/);
  return { id: String(r.id ?? r.memory_id ?? i), text, incidentId: r.metadata?.incident_id ?? m?.[0], type: r.type ?? r.fact_type, score: r.score ?? r.relevance };
}

export async function recall(query: string): Promise<RecalledMemory[]> {
  const data = await call("/memories/recall", { method: "POST", body: { query, max_tokens: 4096, budget: "mid" } });
  const results: any[] = data.results ?? data.memories ?? data.facts ?? [];
  return results.map(normalize);
}

export async function reflect(query: string): Promise<string | null> {
  try {
    const data = await call("/reflect", { method: "POST", body: { query, budget: "low" } });
    return data.text ?? data.answer ?? null;
  } catch { return null; }
}

export async function listMemories(limit = 200): Promise<RecalledMemory[]> {
  const data = await call(`/memories/list?limit=${limit}`, { method: "GET" });
  const items: any[] = data.items ?? data.results ?? data.memories ?? [];
  return items.map(normalize);
}
