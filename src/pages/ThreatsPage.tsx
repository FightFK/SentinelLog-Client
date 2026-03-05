import { useEffect, useState } from 'react';
import { RefreshCw, Shield, TrendingUp, Target } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';
import { analysisApi } from '../api/client';
import type { ThreatSummary } from '../types';
import { SeverityBadge, StatCard, LoadingOverlay, ErrorMsg, SectionHeader } from '../components/ui';

const SEV_COLORS: Record<string, string> = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#3b82f6' };

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-300 mb-1">{label}</p>
      <p className="text-white font-semibold">{payload[0].value?.toLocaleString()}</p>
    </div>
  );
}

export default function ThreatsPage() {
  const [data, setData] = useState<ThreatSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [severity, setSeverity] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const params: Record<string, string> = {};
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;
      if (severity) params.severity = severity;
      const res = await analysisApi.threats(params);
      setData(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load threat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const threatTypeData = data?.topThreatTypes?.slice(0, 10).map(t => ({
    name: t.type.length > 20 ? t.type.slice(0, 20) + '…' : t.type,
    fullName: t.type,
    value: t.count,
  })) ?? [];

  const radarData = threatTypeData.slice(0, 6).map(t => ({
    subject: t.name,
    value: t.value,
  }));

  return (
    <div>
      <SectionHeader
        title="Threat Analysis"
        subtitle="AI-powered security threat overview"
        action={
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700
                       text-slate-400 hover:text-white text-sm transition-colors hover:bg-slate-800">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        }
      />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-slate-800 border border-slate-700 rounded-xl p-4">
        <div>
          <label className="text-slate-300 text-xs block mb-1">From</label>
          <input type="date" value={dateRange.start} onChange={e => setDateRange(d => ({ ...d, start: e.target.value }))}
            className="px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none" />
        </div>
        <div>
          <label className="text-slate-300 text-xs block mb-1">To</label>
          <input type="date" value={dateRange.end} onChange={e => setDateRange(d => ({ ...d, end: e.target.value }))}
            className="px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none" />
        </div>
        <div>
          <label className="text-slate-300 text-xs block mb-1">Severity</label>
          <select value={severity} onChange={e => setSeverity(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none">
            <option value="">All</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={load}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors">
            Apply
          </button>
        </div>
      </div>

      {error && <div className="mb-4"><ErrorMsg message={error} /></div>}
      {loading ? <LoadingOverlay /> : !data ? null : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Threats" value={(data.totalThreats ?? 0).toLocaleString()}
              icon={<Shield size={20} />} color="text-red-400" />
            <StatCard label="HIGH Severity"
              value={<><span className="text-2xl font-bold text-red-400">{data.bySeverity?.HIGH ?? 0}</span></>}
              icon={<TrendingUp size={20} />} color="text-red-400" />
            <StatCard label="MEDIUM Severity"
              value={<span className="text-2xl font-bold text-amber-400">{data.bySeverity?.MEDIUM ?? 0}</span>}
              icon={<TrendingUp size={20} />} color="text-amber-400" />
            <StatCard label="LOW Severity"
              value={<span className="text-2xl font-bold text-blue-400">{data.bySeverity?.LOW ?? 0}</span>}
              icon={<TrendingUp size={20} />} color="text-blue-400" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Top threat types bar */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4">Top Threat Types</h3>
              {threatTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={threatTypeData} layout="vertical" barCategoryGap="20%">
                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 11 }} axisLine={false} tickLine={false} width={130} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-slate-500 text-sm py-8 text-center">No threat type data</p>}
            </div>

            {/* Radar chart */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4">Threat Pattern Radar</h3>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Radar name="Threats" dataKey="value" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : <p className="text-slate-500 text-sm py-8 text-center">Not enough data for radar</p>}
            </div>
          </div>

          {/* Severity breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Severity bar */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4">Severity Distribution</h3>
              <div className="space-y-3">
                {(['HIGH', 'MEDIUM', 'LOW'] as const).map(sev => {
                  const count = data.bySeverity?.[sev] ?? 0;
                  const total = data.totalThreats || 1;
                  return (
                    <div key={sev} className="flex items-center gap-3">
                      <div className="w-16"><SeverityBadge severity={sev} /></div>
                      <div className="flex-1 bg-slate-700 rounded-full h-2">
                        <div className="h-2 rounded-full transition-all"
                          style={{ width: `${(count / total) * 100}%`, backgroundColor: SEV_COLORS[sev] }} />
                      </div>
                      <span className="text-slate-300 text-sm w-10 text-right">{count}</span>
                      <span className="text-slate-400 text-xs w-10">{((count / total) * 100).toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top attacker IPs */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                <Target size={16} className="text-red-400" /> Top Attacker IPs
              </h3>
              {(data.topAttackerIPs?.length ?? 0) > 0 ? (
                <div className="space-y-2">
                  {(data.topAttackerIPs ?? []).slice(0, 8).map((item, i) => {
                    const max = data.topAttackerIPs![0].count;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="font-mono text-xs text-slate-200 w-32 truncate">{item.ip}</span>
                        <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                          <div className="bg-red-500 h-1.5 rounded-full"
                            style={{ width: `${(item.count / max) * 100}%` }} />
                        </div>
                        <span className="text-xs text-slate-300 w-8 text-right">{item.count}</span>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-slate-500 text-sm">No attacker data</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
