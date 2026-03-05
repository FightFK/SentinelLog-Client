import { type ReactNode } from 'react';
import type { Severity, Role, AgentStatus, CommandStatus } from '../types';

// ─── Severity badge ───────────────────────────────────────────────────────────
const SEVERITY_STYLES: Record<Severity, string> = {
  HIGH: 'bg-red-500/20 text-red-300 border border-red-500/40',
  MEDIUM: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
  LOW: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${SEVERITY_STYLES[severity]}`}>
      {severity}
    </span>
  );
}

// ─── Role badge ───────────────────────────────────────────────────────────────
const ROLE_STYLES: Record<Role, string> = {
  admin: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
  analyst: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40',
  viewer: 'bg-slate-500/20 text-slate-300 border border-slate-500/40',
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${ROLE_STYLES[role]}`}>
      {role}
    </span>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-500/20 text-green-300 border border-green-500/40',
  disconnected: 'bg-red-500/20 text-red-300 border border-red-500/40',
  inactive: 'bg-slate-500/20 text-slate-300 border border-slate-500/40',
  pending: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
  executing: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
  success: 'bg-green-500/20 text-green-300 border border-green-500/40',
  failed: 'bg-red-500/20 text-red-300 border border-red-500/40',
  timeout: 'bg-orange-500/20 text-orange-300 border border-orange-500/40',
};

export function StatusBadge({ status }: { status: AgentStatus | CommandStatus | string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${STATUS_STYLES[status] ?? STATUS_STYLES['inactive']}`}>
      {status}
    </span>
  );
}

// ─── HTTP Method badge ────────────────────────────────────────────────────────
const METHOD_STYLES: Record<string, string> = {
  GET: 'bg-green-500/15 text-green-300',
  POST: 'bg-blue-500/15 text-blue-300',
  PUT: 'bg-amber-500/15 text-amber-300',
  PATCH: 'bg-orange-500/15 text-orange-300',
  DELETE: 'bg-red-500/15 text-red-300',
};

export function MethodBadge({ method }: { method?: string }) {
  const upper = (method ?? '').toUpperCase();
  const style = METHOD_STYLES[upper] ?? 'bg-slate-500/20 text-slate-300';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono ${style}`}>
      {upper || '—'}
    </span>
  );
}

// ─── HTTP Status badge ────────────────────────────────────────────────────────
export function HttpStatusBadge({ code }: { code?: number }) {
  if (code == null) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-slate-500/20 text-slate-400">—</span>;
  let style = 'bg-green-500/20 text-green-300';
  if (code >= 400 && code < 500) style = 'bg-amber-500/20 text-amber-300';
  if (code >= 500) style = 'bg-red-500/20 text-red-300';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold ${style}`}>
      {code}
    </span>
  );
}

// ─── Threat badge ─────────────────────────────────────────────────────────────
export function ThreatBadge({ isThreat }: { isThreat: boolean }) {
  if (isThreat) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/40">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
        THREAT
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-slate-500/20 text-slate-300 border border-slate-500/40">
      CLEAN
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  color?: string;
  sub?: string;
}

export function StatCard({ label, value, icon, color = 'text-blue-400', sub }: StatCardProps) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 flex items-center gap-4">
      {icon && (
        <div className={`p-3 rounded-lg bg-slate-700/60 ${color}`}>
          {icon}
        </div>
      )}
      <div>
        <p className="text-slate-300 text-sm font-medium">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {sub && <p className="text-slate-400 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sz = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }[size];
  return (
    <div className={`${sz} animate-spin rounded-full border-2 border-slate-600 border-t-blue-400`} />
  );
}

export function LoadingOverlay() {
  return (
    <div className="flex items-center justify-center py-16">
      <Spinner size="lg" />
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ message = 'No data found' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── Error Message ────────────────────────────────────────────────────────────
export function ErrorMsg({ message }: { message: string }) {
  return (
    <div className="bg-red-500/15 border border-red-500/40 text-red-300 rounded-lg p-3 text-sm font-medium">
      {message}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-slate-300 text-sm mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  onPage: (p: number) => void;
}

export function Pagination({ page, pages, total, onPage }: PaginationProps) {
  if (pages <= 1) return null;
  const items: (number | '...')[] = [];
  const range = (from: number, to: number) => 
    Array.from({ length: to - from + 1 }, (_, i) => from + i);
  if (pages <= 7) {
    items.push(...range(1, pages));
  } else if (page <= 4) {
    items.push(...range(1, 5), '...', pages);
  } else if (page >= pages - 3) {
    items.push(1, '...', ...range(pages - 4, pages));
  } else {
    items.push(1, '...', page - 1, page, page + 1, '...', pages);
  }

  return (
    <div className="flex items-center justify-between mt-4 text-sm">
      <span className="text-slate-300">{total} records</span>
      <div className="flex gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200
                     disabled:opacity-40 hover:bg-slate-700 transition-colors"
        >‹</button>
        {items.map((item, i) =>
          item === '...' ? (
            <span key={`e${i}`} className="px-3 py-1.5 text-slate-400">…</span>
          ) : (
            <button
              key={item}
              onClick={() => onPage(item as number)}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                item === page
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
              }`}
            >{item}</button>
          )
        )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === pages}
          className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200
                     disabled:opacity-40 hover:bg-slate-700 transition-colors"
        >›</button>
      </div>
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  danger?: boolean;
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
        <p className="text-slate-300 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-600 text-slate-200 hover:bg-slate-800 transition-colors text-sm">
            Cancel
          </button>
          <button onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
