// Incident list (operational records). Knowledge/memory lives in Hindsight, not here.
// This in-process list resets on server restart; swap for a database for production.
import { DEMO_INCIDENTS } from "./demo-data";
import type { Incident } from "./types";

const g = globalThis as unknown as { __incidents?: Incident[] };
export const incidents: Incident[] = (g.__incidents ??= [...DEMO_INCIDENTS]);

export function upsertIncident(i: Incident) {
  const idx = incidents.findIndex((x) => x.id === i.id);
  if (idx >= 0) incidents[idx] = { ...incidents[idx], ...i };
  else incidents.unshift(i);
}

export function nextIncidentId() {
  const max = incidents.reduce((m, i) => Math.max(m, parseInt(i.id.replace(/\D/g, "")) || 0), 0);
  return `INC-${String(max + 1).padStart(3, "0")}`;
}
