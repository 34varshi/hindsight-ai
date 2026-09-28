// Incident list (operational records). Knowledge/memory lives in Hindsight, not here.
// This in-process list resets on server restart; swap for a database for production.
import { DEMO_INCIDENTS } from "./demo-data";
import type { Incident } from "./types";

const g = globalThis as unknown as { __incidents?: Incident[] };
const seeded: Incident[] = DEMO_INCIDENTS.map((i) => ({ ...i, source: "seeded" as const }));
function dedupe(list: Incident[]) {
  const seen = new Set<string>();
  return list.filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)));
}
export const incidents: Incident[] = (g.__incidents ??= dedupe(seeded));
// Clean any accidental duplicates left in a long-running process.
{ const clean = dedupe(incidents); if (clean.length !== incidents.length) incidents.splice(0, incidents.length, ...clean);
  const demoIds = new Set(DEMO_INCIDENTS.map((i) => i.id));
  for (const i of incidents) i.source ??= demoIds.has(i.id) ? "seeded" : "live"; }

export function upsertIncident(i: Incident) {
  const idx = incidents.findIndex((x) => x.id === i.id);
  if (idx >= 0) incidents[idx] = { ...incidents[idx], ...i };
  else incidents.unshift({ ...i, source: i.source ?? "live" });
}

export function nextIncidentId() {
  const max = incidents.reduce((m, i) => Math.max(m, parseInt(i.id.replace(/\D/g, "")) || 0), 0);
  return `INC-${String(max + 1).padStart(3, "0")}`;
}
