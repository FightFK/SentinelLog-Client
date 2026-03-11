import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Shield,
  Target,
  Lightbulb,
  BarChart2,
} from 'lucide-react';

import { adminApi } from '../api/client';
import type { PendingAlert, Decision } from '../types';

import {
  SeverityBadge,
  LoadingOverlay,
  ErrorMsg,
  SectionHeader,
  ConfirmDialog,
} from '../components/ui';


function parseRaw(raw?: string) {
  try { return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}


/* ---------------- Threat Badge ---------------- */

function ThreatLevelBadge({ level }: { level?: string }) {

  const map: Record<string, string> = {
    HIGH: 'bg-red-500/15 text-red-300 border border-red-500/30',
    MEDIUM: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    LOW: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
  };

  const cls =
    map[level ?? ''] ??
    'bg-slate-700 text-slate-300 border border-slate-600';

  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${cls}`}>
      {level ?? 'UNKNOWN'}
    </span>
  );
}


/* ---------------- Confidence Meter ---------------- */

function ConfidenceMeter({ value }: { value?: number }) {

  if (value == null) return null;

  const pct = Math.min(100, Math.max(0, value));

  const color =
    pct >= 80 ? 'bg-red-500'
      : pct >= 50 ? 'bg-amber-500'
        : 'bg-blue-500';

  return (
    <div className="flex items-center gap-2">

      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">

        <div
          className={`h-full ${color}`}
          style={{ width: `${pct}%` }}
        />

      </div>

      <span className="text-xs text-slate-300 tabular-nums w-8 text-right">
        {pct}%
      </span>

    </div>
  );
}


/* ---------------- Decisions ---------------- */

const DECISIONS: { value: Decision; label: string; color: string }[] = [
  { value: 'block', label: 'Block IP', color: 'bg-red-600 hover:bg-red-700' },
  { value: 'ignore', label: 'Ignore', color: 'bg-green-600 hover:bg-green-700' },
  { value: 'monitor', label: 'Monitor', color: 'bg-amber-600 hover:bg-amber-700' },
  { value: 'alert', label: 'Alert', color: 'bg-slate-600 hover:bg-slate-700' },
];


/* ---------------- Decide Modal ---------------- */

function DecideModal({
  alert,
  onClose,
  onDecide,
}: {
  alert: PendingAlert
  onClose: () => void
  onDecide: (action: Decision, reason: string, duration?: number) => Promise<void>
}) {

  const [decision, setDecision] = useState<Decision>('block');
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState<number>(3600);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ip =
    alert.log?.ipAddress ??
    alert.log?.ip ??
    '—';

  const attackType =
    alert.analysis?.attack_type ??
    'Unknown Threat';

  const submit = async () => {

    setLoading(true);
    setError('');

    try {

      await onDecide(decision, reason, duration);
      onClose();

    } catch (err: unknown) {

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to submit decision'
      );

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">

      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-xl">

        <h3 className="text-white text-lg font-semibold mb-1">
          Take Action
        </h3>

        <p className="text-slate-300 text-sm mb-4">
          Alert #{alert.id} — <span className="text-red-400">{attackType}</span>
        </p>

        <div className="bg-slate-800 rounded-lg p-3 flex justify-between items-center mb-4">

          <span className="text-xs text-slate-400 uppercase">
            Source IP
          </span>

          <span className="text-blue-300 font-mono text-sm font-bold">
            {ip}
          </span>

        </div>


        <div className="grid grid-cols-2 gap-2 mb-4">

          {DECISIONS.map(d => (

            <div
              key={d.value}
              onClick={() => setDecision(d.value)}
              className={`py-2 text-sm text-center rounded-lg text-white font-semibold cursor-pointer
              ${decision === d.value ? d.color : 'bg-slate-700 hover:bg-slate-600'}`}
            >
              {d.label}
            </div>

          ))}

        </div>


        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          placeholder="Reason (optional)"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white mb-3"
        />

        <div className="flex items-center gap-3 mb-4">
          <label className="text-xs text-slate-400 whitespace-nowrap">Duration (seconds)</label>
          <input
            type="number"
            value={duration}
            onChange={e => setDuration(Number(e.target.value))}
            min={0}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white"
          />
        </div>


        {error && <ErrorMsg message={error} />}


        <div className="flex gap-3 mt-3">

          <div
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer text-center"
          >
            Cancel
          </div>

          <div
            onClick={submit}
            className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white cursor-pointer text-center"
          >
            {loading ? 'Submitting...' : 'Submit'}
          </div>

        </div>

      </div>

    </div>

  );

}


/* ---------------- Alert Card Component ---------------- */

function AlertCard({
  alert,
  onDecide,
  onDismiss,
}: {
  alert: PendingAlert
  onDecide: () => void
  onDismiss: () => void
}) {

  const [expanded, setExpanded] = useState(false);

  const raw = parseRaw(alert.log?.rawLog);

  const ip =
    alert.log?.ipAddress ??
    alert.log?.ip ??
    '—';

  const attackType =
    alert.analysis?.attack_type ??
    'Unknown Threat';

  const {
    confidence,
    indicators = [],
    recommendations = [],
    summary
  } = alert.analysis ?? {};


  return (

    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-600">

      <div className="p-5">

        <div className="flex justify-between items-start gap-4">

          <div className="flex gap-3">

            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
              <AlertTriangle size={18} />
            </div>

            <div>

              <div className="flex items-center gap-2 mb-1">

                <span className="text-white font-semibold">
                  {attackType}
                </span>

                <ThreatLevelBadge level={alert.threatLevel} />

                {alert.log?.severity &&
                  <SeverityBadge severity={alert.log.severity} />
                }

              </div>

              <div className="text-xs text-slate-400 flex gap-2 flex-wrap">

                <span className="font-mono text-blue-300 font-bold">
                  {ip}
                </span>

                <span>•</span>

                <span>
                  Alert #{alert.id}
                </span>

                <span>•</span>

                <span>
                  {new Date(alert.createdAt).toLocaleString()}
                </span>

              </div>

            </div>

          </div>


          <div className="flex gap-2">

            <div
              onClick={onDecide}
              className="px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
            >
              <Eye size={13} />
              Take Action
            </div>

            <div
              onClick={onDismiss}
              className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 cursor-pointer"
            >
              <Trash2 size={15} />
            </div>

            <div
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 cursor-pointer"
            >
              {expanded
                ? <ChevronUp size={15} />
                : <ChevronDown size={15} />}
            </div>

          </div>

        </div>


        {confidence != null && (

          <div className="mt-3">

            <span className="text-xs text-slate-400">
              AI Confidence
            </span>

            <ConfidenceMeter value={confidence} />

          </div>

        )}

      </div>


      {expanded && (

        <div className="border-t border-slate-700 bg-slate-900/40 p-5 space-y-4">

          {summary && (

            <div>

              <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
                <BarChart2 size={12} />
                Summary
              </div>

              <p className="text-sm text-slate-200">
                {summary}
              </p>

            </div>

          )}


          {indicators.length > 0 && (

            <div>

              <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
                <Target size={12} />
                Indicators
              </div>

              <ul className="space-y-1">

                {indicators.map((i, idx) => (

                  <li key={idx} className="text-sm text-slate-200 flex gap-2">

                    <span className="text-red-400">
                      ▸
                    </span>

                    {i}

                  </li>

                ))}

              </ul>

            </div>

          )}


          {recommendations.length > 0 && (

            <div>

              <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
                <Lightbulb size={12} />
                Recommendations
              </div>

              <ul className="space-y-1">

                {recommendations.map((r, idx) => (

                  <li key={idx} className="text-sm text-slate-200 flex gap-2">

                    <span className="text-amber-400">
                      {idx + 1}.
                    </span>

                    {r}

                  </li>

                ))}

              </ul>

            </div>

          )}


          {raw && (

            <div>

              <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
                <Shield size={12} />
                Log Details
              </div>

              <pre className="bg-slate-900 p-3 rounded-lg text-xs text-slate-300 overflow-x-auto">
                {JSON.stringify(raw, null, 2)}
              </pre>

            </div>

          )}

        </div>

      )}

    </div>

  );

}


/* ---------------- Page ---------------- */

export default function PendingAlertsPage() {

  const [alerts, setAlerts] = useState<PendingAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<PendingAlert | null>(null);

  const [dismissDialog, setDismissDialog] = useState({
    open: false,
    id: null as number | null,
  });

  const load = async () => {

    setLoading(true);
    setError('');

    try {

      const res = await adminApi.pending();
      setAlerts(res.data);

    } catch (err: unknown) {

      setError(
        err instanceof Error
          ? err.message
          : 'Load failed'
      );

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {
    load();
  }, []);

  const handleDecide = async (
    action: Decision,
    reason: string,
    duration?: number
  ) => {

    if (!selected) return;

    await adminApi.decide(
      selected.id,
      action,
      reason,
      duration
    );

    setSelected(null);
    await load();

  };

  const handleDismiss = async () => {

    if (!dismissDialog.id) return;

    await adminApi.dismissPending(
      dismissDialog.id
    );

    setDismissDialog({
      open: false,
      id: null
    });

    await load();

  };

  return (
    <>
      <div>

        <SectionHeader
          title="Pending Alerts"
          subtitle={
            alerts.length
              ? `${alerts.length} alerts pending`
              : 'No pending alerts'
          }
          action={

            <div
              onClick={load}
              className="flex items-center gap-2 px-3 py-2 border border-slate-700 rounded-lg text-sm text-slate-400 hover:bg-slate-800 cursor-pointer"
            >

              <RefreshCw
                size={14}
                className={loading ? 'animate-spin' : ''}
              />

            </div>

          }
        />

        {error &&
          <ErrorMsg message={error} />
        }

        {loading
          ? <LoadingOverlay />
          : alerts.length === 0
            ? (

              <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">

                <CheckCircle
                  size={40}
                  className="text-green-400 mx-auto mb-3"
                />

                <p className="text-white font-semibold">
                  No alerts detected
                </p>

                <p className="text-slate-400 text-sm">
                  All systems operating normally
                </p>

              </div>

            )
            : (

              <div className="space-y-3">

                {alerts.map(alert => (

                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onDecide={() => setSelected(alert)}
                    onDismiss={() =>
                      setDismissDialog({
                        open: true,
                        id: alert.id
                      })
                    }
                  />

                ))}

              </div>

            )}

      </div>

      {selected && (
        <DecideModal
          alert={selected}
          onClose={() => setSelected(null)}
          onDecide={handleDecide}
        />
      )}

      <ConfirmDialog
        open={dismissDialog.open}
        title="Warning "
        message="Are you sure you want to dismiss this alert?"
        onConfirm={handleDismiss}
        onCancel={() => setDismissDialog({ open: false, id: null })}
      />
    </>
  );

}