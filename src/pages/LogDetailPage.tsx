import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, Layers, AlertTriangle } from 'lucide-react';
import { logsApi, analysisApi } from '../api/client';
import type { Log, AnalysisResult } from '../types';
import {
  MethodBadge, HttpStatusBadge, ThreatBadge, SeverityBadge,
  LoadingOverlay, ErrorMsg, Spinner,
} from '../components/ui';
import { useAuth } from '../contexts/AuthContext';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-slate-100">{value ?? '—'}</span>
    </div>
  );
}

export default function LogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [log, setLog] = useState<Log | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [similar, setSimilar] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const canAnalyze = user?.role === 'admin' || user?.role === 'analyst';

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true); setError('');
      try {
        const logRes = await logsApi.get(parseInt(id));
        setLog(logRes.data);
        const [analysisRes, similarRes] = await Promise.allSettled([
          analysisApi.results(parseInt(id)),
          analysisApi.similar(parseInt(id), 5),
        ]);
        if (analysisRes.status === 'fulfilled') setAnalysis(analysisRes.value.data);
        if (similarRes.status === 'fulfilled') setSimilar(similarRes.value.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load log');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleAnalyze = async () => {
    if (!id) return;
    setAnalyzing(true); setError('');
    try {
      const res = await analysisApi.analyze(parseInt(id));
      setAnalysis(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <LoadingOverlay />;
  if (!log) return <ErrorMsg message="Log not found" />;

  const CONF_COLOR = (analysis?.confidence ?? 0) >= 0.8 ? 'text-red-400' : (analysis?.confidence ?? 0) >= 0.5 ? 'text-amber-400' : 'text-green-400';

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /> Back
        </button>
        <span className="text-slate-600">/</span>
        <span className="text-slate-300 font-mono text-sm">Log #{log.id}</span>
      </div>

      {error && <div className="mb-4"><ErrorMsg message={error} /></div>}

      {/* Log Details Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold flex items-center gap-2">
            Log Entry <span className="text-slate-400 font-normal text-sm">#{log.id}</span>
          </h2>
          <div className="flex items-center gap-2">
            <ThreatBadge isThreat={!!log.isThreat} />
            {log.severity && <SeverityBadge severity={log.severity} />}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
          <Field label="IP Address" value={<span className="font-mono text-blue-300">{log.ip}</span>} />
          <Field label="Method" value={<MethodBadge method={log.method} />} />
          <Field label="Status Code" value={<HttpStatusBadge code={log.statusCode} />} />
          <Field label="Path" value={<span className="font-mono text-slate-200 break-all">{log.path}</span>} />
          <Field label="Timestamp" value={new Date(log.timestamp).toLocaleString()} />
          {log.threatType && <Field label="Threat Type" value={<span className="text-red-400">{log.threatType}</span>} />}
        </div>

        {log.userAgent && (
          <div className="mt-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">User Agent</p>
            <p className="text-xs font-mono text-slate-300 bg-slate-900 rounded-lg p-3 break-all">{log.userAgent}</p>
          </div>
        )}
        {log.rawLog && (
          <div className="mt-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Raw Log</p>
            <p className="text-xs font-mono text-green-400 bg-slate-900 rounded-lg p-3 break-all">{log.rawLog}</p>
          </div>
        )}
      </div>

      {/* Analysis Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Brain size={18} className="text-purple-400" />
            AI Analysis
          </h2>
          {canAnalyze && (
            <button onClick={handleAnalyze} disabled={analyzing}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600/20 text-purple-400
                         hover:bg-purple-600/40 text-sm transition-colors disabled:opacity-50">
              {analyzing ? <Spinner size="sm" /> : <Brain size={14} />}
              {analyzing ? 'Analyzing…' : analysis ? 'Re-analyze' : 'Run Analysis'}
            </button>
          )}
        </div>

        {analysis ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                <ThreatBadge isThreat={analysis.isThreat} />
              </div>
              {analysis.severity && (
                <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                  <SeverityBadge severity={analysis.severity} />
                </div>
              )}
              {analysis.confidence != null && (
                <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                  <p className="text-slate-400 text-xs mb-1">Confidence</p>
                  <p className={`text-lg font-bold ${CONF_COLOR}`}>{(analysis.confidence * 100).toFixed(0)}%</p>
                </div>
              )}
              {analysis.threatType && (
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-slate-400 text-xs mb-1">Threat Type</p>
                  <p className="text-sm text-red-400 font-medium">{analysis.threatType}</p>
                </div>
              )}
            </div>
            {analysis.explanation && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Explanation</p>
                <p className="text-sm text-slate-200 leading-relaxed bg-slate-900 rounded-lg p-4">{analysis.explanation}</p>
              </div>
            )}
            {analysis.recommendation && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <AlertTriangle size={12} /> Recommendation
                </p>
                <p className="text-sm text-amber-300 leading-relaxed bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  {analysis.recommendation}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <Brain size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">{canAnalyze ? 'No analysis yet. Click "Run Analysis" to start.' : 'No analysis available.'}</p>
          </div>
        )}
      </div>

      {/* Similar Logs */}
      {similar.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-white font-semibold flex items-center gap-2 mb-5">
            <Layers size={18} className="text-blue-400" /> Similar Logs
          </h2>
          <div className="space-y-2">
            {similar.map(s => (
              <div key={s.id}
                onClick={() => navigate(`/logs/${s.id}`)}
                className="flex items-center gap-4 p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/60
                           cursor-pointer transition-colors">
                <span className="text-slate-500 font-mono text-xs w-10">#{s.id}</span>
                <span className="font-mono text-xs text-blue-300 w-28 truncate">{s.ip}</span>
                <MethodBadge method={s.method} />
                <span className="font-mono text-xs text-slate-400 flex-1 truncate">{s.path}</span>
                <HttpStatusBadge code={s.statusCode} />
                <ThreatBadge isThreat={!!s.isThreat} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
