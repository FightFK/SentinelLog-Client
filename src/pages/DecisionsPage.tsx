import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { adminApi } from '../api/client';
import type { AdminDecision } from '../types';
import { LoadingOverlay, ErrorMsg, SectionHeader } from '../components/ui';

const DECISION_STYLES: Record<string, string> = {
  block: 'bg-red-500/20 text-red-300 border-red-500/40',
  ignore: 'bg-green-500/20 text-green-300 border-green-500/40',
  monitor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  alert: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
};

function extractIp(indicators?: string[]): string {
  const hit = indicators?.find(i => i.toLowerCase().startsWith('ip address:'));
  return hit ? hit.split(':').slice(1).join(':').trim() : '—';
}

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<AdminDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await adminApi.decisions();
      setDecisions(Array.isArray(res.data) ? res.data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load decisions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <SectionHeader
        title="Decision History"
        subtitle={`${decisions.length} decisions recorded`}
        action={
          <div onClick={load}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700
                       text-slate-400 hover:text-white text-sm transition-colors hover:bg-slate-800 cursor-pointer">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </div>
        }
      />

      {error && <div className="mb-4"><ErrorMsg message={error} /></div>}

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {loading ? <LoadingOverlay /> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {['Action', 'IP Address', 'Threat', 'Attack Type', 'Reason', 'Duration', 'Log ID', 'Date'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-300 font-semibold text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {decisions.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-slate-500">No decisions yet</td></tr>
              ) : decisions.map(d => (
                <tr key={d.id} className="border-b border-slate-700/50 hover:bg-slate-700/40">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${DECISION_STYLES[d.action] ?? 'bg-slate-500/20 text-slate-300 border-slate-500/40'}`}>
                      {d.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-blue-300">{extractIp(d.analysisData?.indicators)}</td>
                  <td className="px-4 py-3">
                    {d.threatLevel && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
                        d.threatLevel === 'HIGH' ? 'bg-red-500/15 text-red-300' :
                        d.threatLevel === 'MEDIUM' ? 'bg-amber-500/15 text-amber-300' :
                        'bg-blue-500/15 text-blue-300'
                      }`}>{d.threatLevel}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-xs">{d.analysisData?.attack_type ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-300 text-xs max-w-xs truncate">{d.reason ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-300 text-xs font-mono">{d.duration != null ? `${d.duration}s` : '—'}</td>
                  <td className="px-4 py-3 text-slate-300 text-xs font-mono">{d.logId ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                    {new Date(d.decidedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>


    </div>
  );
}
