/**
 * DTOs retornados pela API e consumidos pela interface.
 * Datas chegam serializadas como string ISO.
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'auditor';
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'archived';
  createdAt: string;
  _count?: { targets: number; aiEvaluations: number };
}

export interface TargetSummary {
  id: string;
  name: string;
  startUrl: string;
  description: string | null;
  authorizationConfirmedAt: string;
  _count?: { auditRuns: number };
}

export interface AiEvaluationSummary {
  id: string;
  scenarioTitle: string;
  modelName: string | null;
  createdAt: string;
  _count?: { findings: number };
}

export interface ProjectDetail extends ProjectSummary {
  createdBy?: { name: string };
  targets: TargetSummary[];
  aiEvaluations: AiEvaluationSummary[];
}

export interface AuditRunSummary {
  id: string;
  status: string;
  createdAt: string;
  startedAt?: string | null;
  finishedAt: string | null;
  _count?: { findings: number };
}

export interface TargetDetail extends TargetSummary {
  project: { id: string; name: string; status: 'active' | 'archived' };
  auditRuns: AuditRunSummary[];
}

export interface RecentAuditRun extends AuditRunSummary {
  target: { id: string; name: string; project: { id: string; name: string } };
}

export interface AuditDetail extends AuditRunSummary {
  toolVersion: string | null;
  errorCode: string | null;
  target: { id: string; name: string; startUrl: string; project: { id: string; name: string } };
  summary: { total: number; reviewed: number; byImpact: Record<string, number> };
}

/** Campos comuns a achados web (axe-core) e de IA (rubrica). */
export interface ReviewableFinding {
  id: string;
  ruleId: string;
  title: string;
  description: string;
  impact: string;
  reviewStatus: string;
  reviewNote: string | null;
  reviewedBy?: { name: string } | null;
}

export interface Finding extends ReviewableFinding {
  pageUrl: string;
  elementSelector: string | null;
  helpUrl: string | null;
}

export interface AiFinding extends ReviewableFinding {
  category: string;
  evidence: string | null;
  helpText: string | null;
}

export interface AiEvaluationDetail {
  id: string;
  scenarioTitle: string;
  modelName: string | null;
  modelVersion: string | null;
  prompt: string;
  responseText: string;
  createdAt: string;
  project: { id: string; name: string };
  findings: AiFinding[];
}

export interface AiScenario {
  id: string;
  title: string;
  hypothesis: string;
  suggestedPrompt: string;
}
