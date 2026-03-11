// ─── User / Auth ──────────────────────────────────────────────────────────────
export type Role = 'viewer' | 'analyst' | 'admin';

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export interface AuthData {
  token: string;
  expires_in: string;
  user: User;
}

// ─── Log ──────────────────────────────────────────────────────────────────────
export interface Log {
  id: number;
  ip?: string;
  ipAddress?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  userAgent?: string;
  timestamp: string;
  rawLog?: string;
  isThreat?: boolean;
  threatType?: string;
  severity?: Severity;
  source?: string;
  eventType?: string;
  description?: string | null;
  createdAt?: string;
}

export interface LogPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface LogsResponse {
  logs: Log[];
  pagination: LogPagination;
}

export interface LogStats {
  total: number;
  threats: number;
  topIPs: { ip: string; count: number }[];
  methodBreakdown?: Record<string, number>;
  statusBreakdown?: Record<string, number>;
}

// ─── Analysis ─────────────────────────────────────────────────────────────────
export type Severity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface DashboardData {
  summary: {
    total_logs: number;
    threats_detected: { count: number; percent: number };
    threat_analyses: number;
    pending_alerts: number;
  };
  requests_by_method: { method: string; count: number }[];
  threats_by_severity: { threat_level: string; count: number }[];
  response_status_codes: { status_code: string; count: number }[];
  top_source_ips: { ip: string; count: number }[];
  top_attacker_ips: { ip: string; threat_count: number; top_threat_level: string }[];
}

export interface AnalysisResult {
  logId: number;
  isThreat: boolean;
  threatType?: string;
  severity?: Severity;
  confidence?: number;
  explanation?: string;
  recommendation?: string;
  similarLogs?: Log[];
}

export interface ThreatSummary {
  totalThreats?: number;
  bySeverity?: Partial<Record<Severity, number>>;
  topThreatTypes?: { type: string; count: number }[];
  topAttackerIPs?: { ip: string; count: number }[];
}

export interface ThreatOverview {
  summary: {
    total: number;
    high: number;
    medium: number;
    low: number;
  };
  severity_distribution: { severity: string; count: number }[];
  top_threat_types: { attack_type: string; count: number }[];
  top_attacker_ips: { ip: string; threat_count: number; top_threat_level: string }[];
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export type Decision = 'block' | 'ignore' | 'monitor' | 'alert';

export interface ThreatAnalysis {
  summary?: string;
  confidence?: number;
  indicators?: string[];
  attack_type?: string;
  threat_level?: string;
  recommendations?: string[];
}

export interface PendingAlert {
  id: number;
  logId: number;
  analysisId?: number;
  threatLevel: Severity;
  analysis?: ThreatAnalysis;
  status?: string;
  createdAt: string;
  resolvedAt?: string | null;
  log?: Log;
}

export interface AdminDecision {
  id: number;
  userId?: number | null;
  logId?: number;
  pendingId?: number;
  action: string;
  reason?: string | null;
  duration?: number;
  threatLevel?: string;
  analysisData?: {
    summary?: string;
    confidence?: number;
    indicators?: string[];
    attack_type?: string;
    threat_level?: string;
    recommendations?: string[];
  };
  applied?: boolean;
  decidedAt: string;
}

// ─── Agent ────────────────────────────────────────────────────────────────────
export type AgentStatus = 'active' | 'disconnected' | 'inactive';
export type CommandStatus = 'pending' | 'executing' | 'success' | 'failed' | 'timeout';

export interface Agent {
  id: number;
  agentId: string;
  hostname: string;
  ipAddress: string;
  status: AgentStatus;
  lastSeen: string;
  version: string;
  createdAt: string;
}

export interface AgentCommand {
  id: number;
  commandType: string;
  payload: Record<string, unknown>;
  status: CommandStatus;
  result?: Record<string, unknown>;
  createdAt: string;
  executedAt?: string;
}

// ─── API Response wrapper ─────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

// ─── Filter / Query types ─────────────────────────────────────────────────────
export interface LogFilters {
  page?: number;
  limit?: number;
  ip?: string;
  method?: string;
  startDate?: string;
  endDate?: string;
  threat?: boolean;
  status?: number;
}
