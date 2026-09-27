export type Severity = "Critical" | "High" | "Medium" | "Low";
export type Environment = "Production" | "Staging" | "Development";
export type Status = "Resolved" | "Investigating" | "Open";

export interface Incident {
  id: string;
  service: string;
  environment: Environment;
  severity: Severity;
  errorCode: string;
  title: string;
  description: string;
  symptoms?: string | undefined;
  rootCause?: string | undefined;
  resolution?: string | undefined;
  outcome?: string | undefined;
  status: Status;
  timestamp: string;
}

export interface NewIncidentInput {
  id: string;
  service: string;
  environment: Environment;
  severity: Severity;
  errorCode: string;
  description: string;
  symptoms?: string | undefined;
  timestamp: string;
}

export interface RecalledMemory {
  id: string;
  text: string;
  incidentId?: string | undefined;
  type?: string | undefined;
  score?: number | undefined;
}

export interface SimilarIncident {
  incident_id: string;
  summary: string;
  root_cause: string;
  resolution: string;
  relevance: string;
}

export interface AnalysisResult {
  current_incident: NewIncidentInput;
  memory_used: boolean;
  memory_status: "ok" | "empty" | "unavailable" | "not_configured";
  memory_error?: string | undefined;
  recall_query: string;
  recalled_memories: RecalledMemory[];
  similar_incidents: SimilarIncident[];
  incident_summary: string;
  likely_root_causes: string[];
  evidence: string[];
  recommended_actions: string[];
  confidence: "Low" | "Medium" | "High";
  what_to_check_next: string[];
  explanation: string;
  generic_response?: string | undefined;
}

export interface ResolveInput {
  incident_id: string;
  incident_description: string;
  root_cause: string;
  resolution: string;
  outcome: string;
  service: string;
  environment: string;
  severity: string;
  timestamp?: string | undefined;
}
