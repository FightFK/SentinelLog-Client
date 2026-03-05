import { useEffect, useState } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight as ChevRight } from 'lucide-react';
import { adminApi } from '../api/client';
import type { AdminDecision } from '../types';
import { LoadingOverlay, ErrorMsg, SectionHeader } from '../components/ui';

const DECISION_STYLES: Record<string, string> = {
  block: 'bg-red-500/20 text-red-300 border-red-500/40',
  whitelist: 'bg-green-500/20 text-green-300 border-green-500/40',
  monitor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  dismiss: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
};

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<AdminDecision[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (p: number) => {
    setLoading(true); setError('');
    try {
      const res = await adminApi.decisions(p, 50);
      setDecisions(res.data.decisions ?? []);
      if (res.data.pagination) setPagination(res.data.pagination);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load decisions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page); }, [page]);

  const pages = Math.ceil((pagination?.total ?? 0) / 50);

  return (
    <div>
      <SectionHeader
        title="Decision History"
        subtitle={`${pagination?.total ?? 0} decisions recorded`}
        action={
          <button onClick={() => load(page)} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700
                       text-slate-400 hover:text-white text-sm transition-colors hover:bg-slate-800">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        }
      />

      {error && <div className="mb-4"><ErrorMsg message={error} /></div>}

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {loading ? <LoadingOverlay /> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {['Decision', 'IP Address', 'Note', 'Log ID', 'Date'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-300 font-semibold text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {decisions.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-slate-500">No decisions yet</td></tr>
              ) : decisions.map(d => (
                <tr key={d.id} className="border-b border-slate-700/50 hover:bg-slate-700/40">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${DECISION_STYLES[d.decision] ?? DECISION_STYLES.dismiss}`}>
                      {d.decision}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-blue-300">{d.ip}</td>
                  <td className="px-4 py-3 text-slate-300 text-xs max-w-xs truncate">{d.note ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-300 text-xs font-mono">{d.logId ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                    {new Date(d.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-slate-400">{pagination?.total ?? 0} records</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300
                         hover:bg-slate-800 disabled:opacity-40 transition-colors">
              <ChevronLeft size={14} /> Prev
            </button>
            <span className="px-3 py-1.5 text-slate-400">Page {page} / {pages}</span>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300
                         hover:bg-slate-800 disabled:opacity-40 transition-colors">
              Next <ChevRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
