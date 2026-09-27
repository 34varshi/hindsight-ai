import { HindsightError } from "./hindsight.server";

export function errorResponse(e: unknown) {
  if (e instanceof HindsightError) {
    return Response.json(
      { error: e.kind === "not_configured" ? "Hindsight is not configured. Set HINDSIGHT_BASE_URL and HINDSIGHT_API_KEY." : "Hindsight memory is temporarily unavailable.", detail: e.message, kind: e.kind },
      { status: 503 },
    );
  }
  return Response.json({ error: (e as Error).message ?? "Unexpected error" }, { status: 500 });
}
