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
  mode: 'paired' | 'single';
  source: 'manual' | 'claude' | 'simulator';
  modelName: string | null;
  modelVersion: string | null;
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

export interface RuleStats {
  confirmed: number;
  falsePositive: number;
  decided: number;
}

export interface AiFinding extends ReviewableFinding {
  category: string;
  source: 'rubric' | 'comparison' | 'ai_judge';
  evidence: string | null;
  helpText: string | null;
  occurrences: number;
  samples: number;
  referenceOccurrences: number | null;
  guidance: { rewrite: string; systemInstruction: string } | null;
  ruleStats: RuleStats | null;
}

export interface AiResponse {
  id: string;
  variant: 'target' | 'reference';
  position: number;
  text: string;
  outcome: 'favorable' | 'unfavorable' | 'neutral' | null;
}

export interface AiScenario {
  id: string;
  title: string;
  context: string;
  hypothesis: string;
  prompt: string;
  referencePrompt: string | null;
  decision: boolean;
  disabilities: string[];
  intersectional?: string;
  validation: 'pending' | 'validated';
  /** Há respostas de demonstração para este cenário. */
  simulator: boolean;
}

export interface AiEvaluationDetail {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  scenario: Omit<AiScenario, 'simulator'> | null;
  mode: 'paired' | 'single';
  source: 'manual' | 'claude' | 'simulator';
  modelName: string | null;
  modelVersion: string | null;
  prompt: string;
  referencePrompt: string | null;
  judgeStatus: 'done' | 'failed' | null;
  createdAt: string;
  project: { id: string; name: string; status: 'active' | 'archived' };
  responses: AiResponse[];
  findings: AiFinding[];
  systemInstructions: string[];
  counts: { total: number; critical: number };
  previous: {
    id: string;
    createdAt: string;
    modelName: string | null;
    modelVersion: string | null;
    counts: { total: number; critical: number };
  } | null;
}

export interface AiRule {
  ruleId: string;
  category: string;
  title: string;
  description: string;
  impact: string;
  helpText: string;
  rewrite: string;
  systemInstruction: string;
  stats: RuleStats | null;
}

export interface AiCatalog {
  scenarios: AiScenario[];
  rules: AiRule[];
  claude: { available: boolean; model: string };
}
