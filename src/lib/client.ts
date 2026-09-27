import { useSyncExternalStore } from "react";
import type { AnalysisResult, Incident } from "./types";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error ?? `Request failed (${res.status})`), { data, status: res.status });
  return data as T;
}

// Session state shared across pages: last analysis + demo-mode progress.
type State = { analysis: AnalysisResult | null; demoStep: number; retainedIds: string[] };
let state: State = { analysis: null, demoStep: 0, retainedIds: [] };
const subs = new Set<() => void>();
let loaded = false;
function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try { const s = sessionStorage.getItem("im-state"); if (s) state = { ...state, ...JSON.parse(s) }; } catch { /* ignore */ }
}
export function setAppState(p: Partial<State>) {
  state = { ...state, ...p };
  try { sessionStorage.setItem("im-state", JSON.stringify(state)); } catch { /* ignore */ }
  subs.forEach((f) => f());
}
const server: State = { analysis: null, demoStep: 0, retainedIds: [] };
export function useAppState() {
  return useSyncExternalStore(
    (f) => { subs.add(f); return () => subs.delete(f); },
    () => { load(); return state; },
    () => server,
  );
}

export type { Incident };
export const fmtDate = (s: string) => new Date(s).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
