import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  FileText,
  Globe,
  Activity,
  ShieldAlert,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { logsApi, analysisApi, adminApi } from "../api/client";
import type { LogStats, ThreatSummary } from "../types";
import {
  StatCard,
  LoadingOverlay,
  ErrorMsg,
  SectionHeader,
} from "../components/ui";
import { useAuth } from "../contexts/AuthContext";

const COLORS = [
  "#ef4444",
  "#f59e0b",
  "#3b82f6",
  "#22c55e",
  "#a855f7",
  "#ec4899",
];

const CHART_THEME = {
  axisColor: "#94a3b8",
  gridColor: "#1e293b",
  tooltipBg: "#1e293b",
  tooltipBorder: "#334155",
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-300 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-white font-semibold">
          {p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<LogStats | null>(null);
  const [threats, setThreats] = useState<ThreatSummary | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [statsRes, threatRes] = await Promise.all([
        logsApi.stats(),
        analysisApi.threats(),
      ]);
      setStats(statsRes.data);
      setThreats(threatRes.data);

      if (user?.role === "admin") {
        const pendingRes = await adminApi.pending();
        setPendingCount(pendingRes.data.length);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Build chart data — guard against null/undefined fields from API
  const methodData = stats
    ? Object.entries(stats.methodBreakdown ?? {}).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const statusData = stats
    ? Object.entries(stats.statusBreakdown ?? {}).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const severityData = threats
    ? [
        {
          name: "HIGH",
          value: threats.bySeverity?.HIGH || 0,
          color: "#ef4444",
        },
        {
          name: "MEDIUM",
          value: threats.bySeverity?.MEDIUM || 0,
          color: "#f59e0b",
        },
        { name: "LOW", value: threats.bySeverity?.LOW || 0, color: "#3b82f6" },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div>
      <SectionHeader
        title="Dashboard"
        subtitle="Security overview and system health"
        action={
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lgbg-slate-800 border border-slate-700 text-black-200 hover:bg-slate-700 text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        }
      />

      {error && (
        <div className="mb-4">
          <ErrorMsg message={error} />
        </div>
      )}
      {loading ? (
        <LoadingOverlay />
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total Logs"
              value={stats?.total?.toLocaleString() ?? "–"}
              icon={<FileText size={20} />}
              color="text-blue-400"
              sub="All time"
            />
            <StatCard
              label="Threats Detected"
              value={stats?.threats?.toLocaleString() ?? "–"}
              icon={<ShieldAlert size={20} />}
              color="text-red-400"
              sub={`${stats ? ((stats.threats / Math.max(stats.total, 1)) * 100).toFixed(1) : 0}% of total`}
            />
            <StatCard
              label="Threat Analyses"
              value={threats?.totalThreats?.toLocaleString() ?? "–"}
              icon={<Activity size={20} />}
              color="text-amber-400"
              sub="With AI analysis"
            />
            {user?.role === "admin" && (
              <div
                onClick={() => navigate("/pending")}
                className="cursor-pointer hover:opacity-90 transition"
              >
                <StatCard
                  label="Pending Alerts"
                  value={pendingCount}
                  icon={<AlertTriangle size={20} />}
                  color={pendingCount > 0 ? "text-amber-400" : "text-slate-400"}
                  sub="Awaiting decision"
                />
              </div>
            )}
          </div>

          {/* Charts row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* HTTP Method breakdown */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4">
                Requests by Method
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={methodData} barCategoryGap="35%">
                  <XAxis
                    dataKey="name"
                    tick={{ fill: CHART_THEME.axisColor, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: CHART_THEME.axisColor, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {methodData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Threat severity pie */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4">
                Threats by Severity
              </h3>
              {severityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={severityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {severityData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend
                      formatter={(val) => (
                        <span className="text-slate-300 text-xs">{val}</span>
                      )}
                    />
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-50 flex items-center justify-center text-slate-400 text-sm">
                  No threat data
                </div>
              )}
            </div>
          </div>

          {/* Charts row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* HTTP Status breakdown */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4">
                Response Status Codes
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusData} barCategoryGap="35%">
                  <XAxis
                    dataKey="name"
                    tick={{ fill: CHART_THEME.axisColor, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: CHART_THEME.axisColor, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {statusData.map((entry, i) => {
                      const code = parseInt(entry.name);
                      const color =
                        code >= 500
                          ? "#ef4444"
                          : code >= 400
                            ? "#f59e0b"
                            : "#22c55e";
                      return <Cell key={i} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top attacker IPs */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                <Globe size={16} className="text-red-400" />
                Top Attacker IPs
              </h3>
              {threats?.topAttackerIPs?.length ? (
                <div className="space-y-2">
                  {threats.topAttackerIPs.slice(0, 6).map((item, i) => {
                    const max = threats.topAttackerIPs?.[0]?.count ?? 1;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="font-mono text-xs text-slate-200 w-32 truncate">
                          {item.ip}
                        </span>
                        <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                          <div
                            className="bg-red-500 h-1.5 rounded-full"
                            style={{ width: `${(item.count / max) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-300 w-8 text-right">
                          {item.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">No attacker data</p>
              )}
            </div>
          </div>

          {/* Top IPs from log stats */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4">
              Top Source IPs (All Traffic)
            </h3>
            {stats?.topIPs?.length ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {stats.topIPs.slice(0, 8).map((item, i) => {
                  const max = stats.topIPs[0].count;
                  return (
                    <div key={i} className="bg-slate-700/60 rounded-lg p-3">
                      <p className="font-mono text-xs text-blue-300 truncate">
                        {item.ip}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-slate-600 rounded-full h-1">
                          <div
                            className="bg-blue-400 h-1 rounded-full"
                            style={{ width: `${(item.count / max) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-300">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">No IP data</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
