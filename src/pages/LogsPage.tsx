import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Trash2, RefreshCw, ChevronRight } from 'lucide-react';
import { logsApi, analysisApi } from '../api/client';
import type { Log, LogFilters } from '../types';
import {
  MethodBadge, HttpStatusBadge, ThreatBadge, Pagination,
  LoadingOverlay, ErrorMsg, SectionHeader, ConfirmDialog, Spinner,
} from '../components/ui';
import { useAuth } from '../contexts/AuthContext';

const METHODS = ['', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export default function LogsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<Log[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [filters, setFilters] = useState<LogFilters>({ page: 1, limit: 50 });
  const [rawFilters, setRawFilters] = useState({ ip: '', method: '', startDate: '', endDate: '', status: '', threat: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [analyzingIds, setAnalyzingIds] = useState<Set<number>>(new Set());
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });

  const load = async (f: LogFilters) => {
    setLoading(true); setError('');
    try {
      const res = await logsApi.list(f);
      setLogs(res.data.logs ?? []);
      if (res.data.pagination) setPagination(res.data.pagination);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(filters); }, [filters]);

  const applyFilters = () => {
    const f: LogFilters = { page: 1, limit: filters.limit };
    if (rawFilters.ip) f.ip = rawFilters.ip;
    if (rawFilters.method) f.method = rawFilters.method;
    if (rawFilters.startDate) f.startDate = rawFilters.startDate;
    if (rawFilters.endDate) f.endDate = rawFilters.endDate;
    if (rawFilters.status) f.status = parseInt(rawFilters.status);
    if (rawFilters.threat === 'true') f.threat = true;
    if (rawFilters.threat === 'false') f.threat = false;
    setFilters(f);
  };

  const clearFilters = () => {
    setRawFilters({ ip: '', method: '', startDate: '', endDate: '', status: '', threat: '' });
    setFilters({ page: 1, limit: 50 });
  };

  const handleAnalyze = async (id: number) => {
    setAnalyzingIds(s => new Set(s).add(id));
    try {
      await analysisApi.analyze(id);
      // Refresh logs to show updated threat status
      await load(filters);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzingIds(s => { const n = new Set(s); n.delete(id); return n; });
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.id) return;
    try {
      await logsApi.delete(deleteDialog.id);
      setDeleteDialog({ open: false, id: null });
      await load(filters);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const canAnalyze = user?.role === 'admin' || user?.role === 'analyst';
  const canDelete = user?.role === 'admin';

  return (
    <div>
      <SectionHeader
        title="Security Logs"
        subtitle={`${(pagination?.total ?? 0).toLocaleString()} total records`}
        action={
          <div className="flex gap-2">
            <div onClick={() => setShowFilters(s => !s)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors cursor-pointer
                ${showFilters ? 'border-blue-500/50 bg-blue-600/20 text-blue-400' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
              <Filter size={14} />
              Filters
            </div>
            <div onClick={() => !loading && load(filters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white text-sm transition-colors hover:bg-slate-800 cursor-pointer ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </div>
          </div>
        }
      />

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-slate-300 text-xs mb-1 block">IP Address</label>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={rawFilters.ip} onChange={e => setRawFilters(f => ({ ...f, ip: e.target.value }))}
                  placeholder="192.168.1.1"
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="text-slate-300 text-xs mb-1 block">Method</label>
              <select value={rawFilters.method} onChange={e => setRawFilters(f => ({ ...f, method: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none">
                {METHODS.map(m => <option key={m} value={m}>{m || 'All methods'}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-300 text-xs mb-1 block">Threat Only</label>
              <select value={rawFilters.threat} onChange={e => setRawFilters(f => ({ ...f, threat: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none">
                <option value="">All</option>
                <option value="true">Threats only</option>
                <option value="false">Clean only</option>
              </select>
            </div>
            <div>
              <label className="text-slate-300 text-xs mb-1 block">Status Code</label>
              <input value={rawFilters.status} onChange={e => setRawFilters(f => ({ ...f, status: e.target.value }))}
                placeholder="404"
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-slate-300 text-xs mb-1 block">Start Date</label>
              <input type="date" value={rawFilters.startDate} onChange={e => setRawFilters(f => ({ ...f, startDate: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-slate-300 text-xs mb-1 block">End Date</label>
              <input type="date" value={rawFilters.endDate} onChange={e => setRawFilters(f => ({ ...f, endDate: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-2">
            <div onClick={applyFilters}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors cursor-pointer">
              Apply Filters
            </div>
            <div onClick={clearFilters}
              className="px-4 py-2 rounded-lg border border-slate-600 text-slate-400 hover:text-white text-sm transition-colors hover:bg-slate-700 cursor-pointer">
              Clear
            </div>
          </div>
        </div>
      )}

      {error && <div className="mb-4"><ErrorMsg message={error} /></div>}

      {/* Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {loading ? <LoadingOverlay /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  {['ID', 'Timestamp', 'IP', 'Method', 'Path', 'Status', 'Threat', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-slate-300 font-semibold text-xs uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500">No logs found</td>
                  </tr>
                ) : logs.map(log => (
                  <tr key={log.id}
                    className="border-b border-slate-700/50 hover:bg-slate-700/40 transition-colors">
                    <td className="px-4 py-3 text-slate-300 font-mono text-xs">{log.id}</td>
                    <td className="px-4 py-3 text-slate-300 text-xs whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-blue-300">{log.ip}</td>
                    <td className="px-4 py-3"><MethodBadge method={log.method} /></td>
                    <td className="px-4 py-3 text-slate-200 font-mono text-xs max-w-48 truncate" title={log.path}>
                      {log.path}
                    </td>
                    <td className="px-4 py-3"><HttpStatusBadge code={log.statusCode} /></td>
                    <td className="px-4 py-3"><ThreatBadge isThreat={!!log.isThreat} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <div onClick={() => navigate(`/logs/${log.id}`)}
                          className="p-1.5 rounded hover:bg-slate-600 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="View details">
                          <ChevronRight size={14} />
                        </div>
                        {canAnalyze && !log.isThreat && (
                          <div onClick={() => !analyzingIds.has(log.id) && handleAnalyze(log.id)}
                            className={`px-2 py-1 rounded text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 transition-colors cursor-pointer ${analyzingIds.has(log.id) ? 'opacity-50 pointer-events-none' : ''}`}
                            title="Run AI analysis">
                            {analyzingIds.has(log.id) ? <Spinner size="sm" /> : 'Analyze'}
                          </div>
                        )}
                        {canDelete && (
                          <div onClick={() => setDeleteDialog({ open: true, id: log.id })}
                            className="p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete">
                            <Trash2 size={14} />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        page={pagination?.page ?? 1}
        pages={pagination?.pages ?? 0}
        total={pagination?.total ?? 0}
        onPage={p => setFilters(f => ({ ...f, page: p }))}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete Log"
        message={`Are you sure you want to delete log #${deleteDialog.id}?`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, id: null })}
      />
    </div>
  );
}
