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
  symptoms?: string;
  rootCause?: string;
  resolution?: string;
  outcome?: string;
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
  symptoms?: string;
  timestamp: string;
}

export interface RecalledMemory {
  id: string;
  text: string;
  incidentId?: string;
  type?: string;
  score?: number;
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
  memory_error?: string;
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
  generic_response?: string;
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
  timestamp?: string;
}
