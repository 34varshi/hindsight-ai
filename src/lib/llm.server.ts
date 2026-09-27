// LLM via Lovable AI Gateway (Responses API, streamed). Key stays server-side.
const MODEL = "openai/gpt-6-astra";

export const SYSTEM_PROMPT = `You are an AI incident response assistant.
Analyze the current production incident using the historical incident memories retrieved from Hindsight.
Do not invent historical incidents. Only reference incident IDs that appear in the provided memories.
Use historical memories as evidence.
Clearly distinguish observed facts, historical evidence, possible root causes, and recommended actions.
If historical memory is insufficient, say so. Do not claim certainty when evidence is insufficient.
Recommendations are suggestions, not guaranteed fixes.
Respond ONLY with a JSON object with keys:
incident_summary (string), similar_incidents (array of {incident_id, summary, root_cause, resolution, relevance}),
likely_root_causes (string[]), evidence (string[]), recommended_actions (string[]),
confidence ("Low"|"Medium"|"High"), what_to_check_next (string[]), explanation (string).`;

export async function complete(system: string, user: string): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"] || process.env["LLM_API_KEY"];
  if (!key) throw new Error("LLM API key is not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: MODEL,
      input: [{ role: "system", content: system }, { role: "user", content: user }],
      stream: true,
      store: false,
      reasoning: { effort: "low", summary: "auto" },
      include: ["reasoning.encrypted_content"],
    }),
  });
  if (!res.ok || !res.body) {
    const t = await res.text().catch(() => "");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits to continue.");
    if (res.status === 429) throw new Error("AI rate limit reached. Please try again shortly.");
    throw new Error(`AI request failed (${res.status}): ${t.slice(0, 200)}`);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "", out = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const d = line.slice(5).trim();
      if (!d || d === "[DONE]") continue;
      try {
        const ev = JSON.parse(d);
        if (ev.type === "response.output_text.delta") out += ev.delta;
        if (ev.type === "error" || ev.type === "response.failed") throw new Error(ev.error?.message ?? "AI stream error");
      } catch (e) { if ((e as Error).message.startsWith("AI")) throw e; }
    }
  }
  return out;
}

export function parseJson<T>(s: string): T {
  const m = s.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("AI returned an unparseable response");
  return JSON.parse(m[0]) as T;
}
