/**
 * Centralized API client for frontend interactions.
 */

export interface ApiResponse<T> {
  data?: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(path, {
    ...options,
    headers,
    credentials: 'same-origin',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.error?.message || `Erro HTTP ${res.status}`;
    const error = new Error(errorMsg) as Error & { code?: string; status: number };
    error.code = data.error?.code;
    error.status = res.status;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  async login(body: { email: string; password: string }) {
    return request<ApiResponse<{ id: string; email: string; name: string; role: string }>>(
      '/api/v1/auth/login',
      { method: 'POST', body: JSON.stringify(body) }
    );
  },
  async logout() {
    return request<ApiResponse<{ success: boolean }>>('/api/v1/auth/logout', { method: 'POST' });
  },
  async me() {
    return request<ApiResponse<{ user: { id: string; email: string; name: string; role: string } | null }>>(
      '/api/v1/auth/me'
    );
  },

  // Projects
  async getProjects() {
    return request<ApiResponse<any[]>>('/api/v1/projects');
  },
  async getProject(projectId: string) {
    return request<ApiResponse<any>>(`/api/v1/projects/${projectId}`);
  },
  async createProject(body: { name: string; description?: string }) {
    return request<ApiResponse<any>>('/api/v1/projects', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  async archiveProject(projectId: string) {
    return request<ApiResponse<any>>(`/api/v1/projects/${projectId}/archive`, {
      method: 'POST',
    });
  },

  // Targets
  async getTargets(projectId: string) {
    return request<ApiResponse<any[]>>(`/api/v1/projects/${projectId}/targets`);
  },
  async getTarget(targetId: string) {
    return request<ApiResponse<any>>(`/api/v1/targets/${targetId}`);
  },
  async createTarget(projectId: string, body: { name: string; startUrl: string; description?: string; authorizationConfirmed: boolean }) {
    return request<ApiResponse<any>>(`/api/v1/projects/${projectId}/targets`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // Audits
  async startAudit(targetId: string, config?: { maxPages?: number; maxDepth?: number }) {
    return request<ApiResponse<{ id: string; status: string }>>(`/api/v1/targets/${targetId}/audits`, {
      method: 'POST',
      body: JSON.stringify(config || {}),
    });
  },
  async getAudit(auditId: string) {
    return request<ApiResponse<any>>(`/api/v1/audits/${auditId}`);
  },
  async cancelAudit(auditId: string) {
    return request<ApiResponse<any>>(`/api/v1/audits/${auditId}/cancel`, {
      method: 'POST',
    });
  },
  async getTargetAudits(targetId: string) {
    return request<ApiResponse<any[]>>(`/api/v1/targets/${targetId}/audits`);
  },
  async getFindings(auditId: string, query?: { impact?: string; reviewStatus?: string; search?: string; page?: number }) {
    const params = new URLSearchParams();
    if (query?.impact) params.set('impact', query.impact);
    if (query?.reviewStatus) params.set('reviewStatus', query.reviewStatus);
    if (query?.search) params.set('search', query.search);
    if (query?.page) params.set('page', String(query.page));

    const qs = params.toString();
    return request<ApiResponse<any[]>>(`/api/v1/audits/${auditId}/findings${qs ? `?${qs}` : ''}`);
  },

  // Findings
  async reviewFinding(findingId: string, body: { reviewStatus: string; reviewNote?: string }) {
    return request<ApiResponse<any>>(`/api/v1/findings/${findingId}/review`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  async getAiScenarios() {
    return request<ApiResponse<any[]>>('/api/v1/ai-scenarios');
  },
  async createAiEvaluation(
    projectId: string,
    body: {
      scenarioId: string;
      modelName?: string;
      modelVersion?: string;
      prompt: string;
      responseText: string;
      materialAuthorized: boolean;
    }
  ) {
    return request<ApiResponse<any>>(`/api/v1/projects/${projectId}/ai-evaluations`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  async getAiEvaluation(evaluationId: string) {
    return request<ApiResponse<any>>(`/api/v1/ai-evaluations/${evaluationId}`);
  },
  async reviewAiFinding(findingId: string, body: { reviewStatus: string; reviewNote?: string }) {
    return request<ApiResponse<any>>(`/api/v1/ai-findings/${findingId}/review`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },
};
