/**
 * Centralized API client for frontend interactions.
 * Única porta de saída HTTP da interface (§13.2): trata sessão expirada e erros de validação.
 */
import type {
  AiCatalog,
  AiEvaluationDetail,
  AuditDetail,
  Finding,
  ProjectDetail,
  ProjectSummary,
  RecentAuditRun,
  TargetDetail,
  User,
} from '@/lib/types';

export interface ApiResponse<T> {
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type FieldErrors = Record<string, string[] | undefined>;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly fields: FieldErrors = {}
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function redirectToLogin() {
  if (typeof window === 'undefined' || window.location.pathname === '/login') return;
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.assign(`/login?next=${next}`);
}

async function send(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(path, { ...options, headers, credentials: 'same-origin' });
  if (res.ok) return res;

  const body = await res.json().catch(() => ({}));
  if (res.status === 401 && !path.startsWith('/api/v1/auth/')) redirectToLogin();

  throw new ApiError(
    body.error?.message || `Erro HTTP ${res.status}`,
    res.status,
    body.error?.code,
    body.error?.details?.fields ?? {}
  );
}

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const res = await send(path, options);
  return res.json();
}

function post<T>(path: string, body?: unknown) {
  return request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });
}

function patch<T>(path: string, body: unknown) {
  return request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
}

export interface CreateAiEvaluationInput {
  scenarioId: string;
  mode: 'paired' | 'single';
  prompt: string;
  referencePrompt?: string;
  source: 'manual' | 'claude' | 'simulator';
  repetitions: number;
  targetResponses: string[];
  referenceResponses: string[];
  modelName?: string;
  modelVersion?: string;
  secondOpinion: boolean;
  materialAuthorized: boolean;
}

export interface ReviewInput {
  reviewStatus: string;
  reviewNote?: string;
}

export const api = {
  // Auth
  login: (body: { email: string; password: string }) => post<User>('/api/v1/auth/login', body),
  logout: () => post<{ success: boolean }>('/api/v1/auth/logout'),
  me: () => request<User>('/api/v1/auth/me'),

  // Projects
  getProjects: () => request<ProjectSummary[]>('/api/v1/projects'),
  getProject: (projectId: string) => request<ProjectDetail>(`/api/v1/projects/${projectId}`),
  createProject: (body: { name: string; description?: string }) =>
    post<ProjectSummary>('/api/v1/projects', body),
  archiveProject: (projectId: string) => post<ProjectSummary>(`/api/v1/projects/${projectId}/archive`),

  // Targets
  getTarget: (targetId: string) => request<TargetDetail>(`/api/v1/targets/${targetId}`),
  createTarget: (
    projectId: string,
    body: { name: string; startUrl: string; description?: string; authorizationConfirmed: boolean }
  ) => post<{ id: string }>(`/api/v1/projects/${projectId}/targets`, body),

  // Audits
  getRecentAudits: (limit = 5) => request<RecentAuditRun[]>(`/api/v1/audits?limit=${limit}`),
  startAudit: (targetId: string, config: { maxPages: number; maxDepth: number }) =>
    post<{ id: string; status: string }>(`/api/v1/targets/${targetId}/audits`, config),
  getAudit: (auditId: string) => request<AuditDetail>(`/api/v1/audits/${auditId}`),
  cancelAudit: (auditId: string) => post<{ id: string }>(`/api/v1/audits/${auditId}/cancel`),
  getFindings(auditId: string, query: { impact?: string; reviewStatus?: string; search?: string } = {}) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => value && params.set(key, value));
    const qs = params.toString();
    return request<Finding[]>(`/api/v1/audits/${auditId}/findings${qs ? `?${qs}` : ''}`);
  },
  async getAuditReport(auditId: string): Promise<string> {
    const res = await send(`/api/v1/audits/${auditId}/report`);
    return res.text();
  },
  auditReportDownloadUrl: (auditId: string) => `/api/v1/audits/${auditId}/report?download=true`,

  // Findings
  reviewFinding: (findingId: string, body: ReviewInput) =>
    patch<Finding>(`/api/v1/findings/${findingId}/review`, body),

  // AI evaluations
  getAiCatalog: () => request<AiCatalog>('/api/v1/ai-catalog'),
  createAiEvaluation: (projectId: string, body: CreateAiEvaluationInput) =>
    post<{ id: string }>(`/api/v1/projects/${projectId}/ai-evaluations`, body),
  getAiEvaluation: (evaluationId: string) =>
    request<AiEvaluationDetail>(`/api/v1/ai-evaluations/${evaluationId}`),
  reviewAiFinding: (findingId: string, body: ReviewInput) =>
    patch<unknown>(`/api/v1/ai-findings/${findingId}/review`, body),
  aiReportDownloadUrl: (evaluationId: string) =>
    `/api/v1/ai-evaluations/${evaluationId}/report?download=true`,
};

/** Mensagem amigável a partir de qualquer erro capturado. */
export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
