import type {
  ApiResponse, AuthData, User, Log, LogsResponse, LogStats,
  AnalysisResult, ThreatSummary, PendingAlert, AdminDecision,
  Agent, AgentCommand, LogFilters, Decision,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

function getToken(): string | null {
  return localStorage.getItem('sentinel_token');
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<ApiResponse<T>> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error ?? `HTTP ${res.status}`);
  }
  return json as ApiResponse<T>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request<AuthData>('POST', '/api/auth/login', { email, password }),

  register: (email: string, password: string, name: string, role?: string) =>
    request<User>('POST', '/api/auth/register', { email, password, name, role }),

  me: () => request<User>('GET', '/api/auth/me'),

  updateMe: (data: { name?: string; oldPassword?: string; newPassword?: string }) =>
    request<User>('PUT', '/api/auth/me', data),

  listUsers: () => request<User[]>('GET', '/api/auth/users'),

  patchUser: (id: number, data: { role?: string; isActive?: boolean }) =>
    request<User>('PATCH', `/api/auth/users/${id}`, data),
};

// ─── Logs ─────────────────────────────────────────────────────────────────────
function buildQuery(params: Record<string, unknown>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const logsApi = {
  list: (filters?: LogFilters) =>
    request<LogsResponse>('GET', `/api/logs${buildQuery((filters ?? {}) as Record<string, unknown>)}`),

  stats: () => request<LogStats>('GET', '/api/logs/stats'),

  get: (id: number) => request<Log>('GET', `/api/logs/${id}`),

  create: (data: Partial<Log>) => request<Log>('POST', '/api/logs', data),

  delete: (id: number) => request<null>('DELETE', `/api/logs/${id}`),
};

// ─── Analysis ─────────────────────────────────────────────────────────────────
export const analysisApi = {
  analyze: (logId: number) =>
    request<AnalysisResult>('POST', '/api/analysis/analyze', { logId }),

  batch: (logIds: number[]) =>
    request<{ processed: number; results: AnalysisResult[] }>('POST', '/api/analysis/batch', { logIds }),

  similar: (logId: number, limit = 10) =>
    request<Log[]>('GET', `/api/analysis/similar/${logId}?limit=${limit}`),

  results: (logId: number) =>
    request<AnalysisResult>('GET', `/api/analysis/results/${logId}`),

  threats: (params?: { startDate?: string; endDate?: string; severity?: string }) =>
    request<ThreatSummary>('GET', `/api/analysis/threats${buildQuery(params ?? {})}`),

  embedding: (logId: number) =>
    request<{ message: string }>('POST', '/api/analysis/embedding', { logId }),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  pending: () => request<PendingAlert[]>('GET', '/api/admin/pending'),

  decide: (alertId: number, decision: Decision, note?: string) =>
    request<{ decisionId: string; decision: string }>(
      'POST', `/api/admin/decide/${alertId}`, { decision, note }
    ),

  dismissPending: (alertId: number) =>
    request<null>('DELETE', `/api/admin/pending/${alertId}`),

  decisions: (page = 1, limit = 50) =>
    request<{ decisions: AdminDecision[]; pagination: { page: number; total: number } }>(
      'GET', `/api/admin/decisions?page=${page}&limit=${limit}`
    ),

  learnedRules: () =>
    request<{ totalRules: number; autoBlocked: number; autoMonitored: number;
      rules: { pattern: string; action: string; count: number }[] }>(
      'GET', '/api/admin/learned-rules'
    ),

  regenerateEmbeddings: (limit = 100) =>
    request<{ processed: number; succeeded: number; failed: number }>(
      'POST', '/api/admin/regenerate-embeddings', { limit }
    ),

  agents: () => request<Agent[]>('GET', '/api/admin/agents'),

  sendCommand: (
    agentId: number | 'broadcast',
    commandType: string,
    payload: Record<string, unknown>,
    timeoutSeconds = 300,
  ) =>
    request<{ commandId: number; status: string; agentId: string }>(
      'POST', `/api/admin/agents/${agentId}/command`,
      { commandType, payload, timeoutSeconds }
    ),

  agentCommands: (agentId: number, limit = 50) =>
    request<AgentCommand[]>('GET', `/api/admin/agents/${agentId}/commands?limit=${limit}`),

  staleCheck: (threshold_minutes = 10) =>
    request<{ marked_disconnected: number }>(
      'POST', '/api/admin/agents/stale-check', { threshold_minutes }
    ),
};
