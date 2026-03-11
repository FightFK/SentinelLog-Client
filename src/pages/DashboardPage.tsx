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
import { logsApi } from "../api/client";
import type { DashboardData } from "../types";
import {
  StatCard,
  LoadingOverlay,
  ErrorMsg,
  SectionHeader,
} from "../components/ui";
import { useAuth } from "../contexts/AuthContext";

const COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#22c55e", "#a855f7", "#ec4899"];

const CHART_THEME = { axisColor: "#94a3b8" };

const SEVERITY_COLOR: Record<string, string> = {
  HIGH: "#ef4444",
  MEDIUM: "#f59e0b",
  LOW: "#3b82f6",
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-300 mb-1">{label}</p>
      <p className="text-white font-semibold">{payload[0].value?.toLocaleString()}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await logsApi.dashboard();
      console.log("[Dashboard] raw res:", res);
      console.log("[Dashboard] res.data:", res.data);
      setData(res.data);
    } catch (err: unknown) {
      console.error("[Dashboard] error:", err);
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const methodData = (data?.requests_by_method ?? []).map(d => ({ name: d.method, value: d.count }));
  const statusData = (data?.response_status_codes ?? []).map(d => ({ name: d.status_code, value: d.count }));
  const severityData = (data?.threats_by_severity ?? []).map(d => ({
    name: d.threat_level,
    value: d.count,
    color: SEVERITY_COLOR[d.threat_level] ?? "#94a3b8",
  }));

  const summary = data?.summary;

  return (
    <div>
      <SectionHeader
        title="Dashboard"
        subtitle="Security overview and system health"
        action={
          <div
            onClick={load}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 text-sm transition cursor-pointer ${loading ? "opacity-50 pointer-events-none" : ""}`}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </div>
        }
      />

      {error && <div className="mb-4"><ErrorMsg message={error} /></div>}

      {loading ? (
        <LoadingOverlay />
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total Logs"
              value={summary?.total_logs?.toLocaleString() ?? "–"}
              icon={<FileText size={20} />}
              color="text-blue-400"
              sub="All time"
            />
            <StatCard
              label="Threats Detected"
              value={summary?.threats_detected?.count?.toLocaleString() ?? "–"}
              icon={<ShieldAlert size={20} />}
              color="text-red-400"
              sub={`${summary?.threats_detected?.percent?.toFixed(1) ?? 0}% of total`}
            />
            <StatCard
              label="Threat Analyses"
              value={summary?.threat_analyses?.toLocaleString() ?? "–"}
              icon={<Activity size={20} />}
              color="text-amber-400"
              sub="With AI analysis"
            />
            {user?.role === "admin" && (
              <div onClick={() => navigate("/pending")} className="cursor-pointer hover:opacity-90 transition">
                <StatCard
                  label="Pending Alerts"
                  value={summary?.pending_alerts ?? 0}
                  icon={<AlertTriangle size={20} />}
                  color={(summary?.pending_alerts ?? 0) > 0 ? "text-amber-400" : "text-slate-400"}
                  sub="Awaiting decision"
                />
              </div>
            )}
          </div>

          {/* Charts row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4">Requests by Method</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={methodData} barCategoryGap="35%">
                  <XAxis dataKey="name" tick={{ fill: CHART_THEME.axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: CHART_THEME.axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {methodData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4">Threats by Severity</h3>
              {severityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={severityData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {severityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Legend formatter={(val) => <span className="text-slate-300 text-xs">{val}</span>} />
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">No threat data</div>
              )}
            </div>
          </div>

          {/* Charts row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4">Response Status Codes</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusData} barCategoryGap="35%">
                  <XAxis dataKey="name" tick={{ fill: CHART_THEME.axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: CHART_THEME.axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {statusData.map((entry, i) => {
                      const code = parseInt(entry.name);
                      const color = code >= 500 ? "#ef4444" : code >= 400 ? "#f59e0b" : "#22c55e";
                      return <Cell key={i} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                <Globe size={16} className="text-red-400" />
                Top Attacker IPs
              </h3>
              {data?.top_attacker_ips?.length ? (
                <div className="space-y-2">
                  {data.top_attacker_ips.slice(0, 6).map((item, i) => {
                    const max = data.top_attacker_ips[0]?.threat_count ?? 1;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="font-mono text-xs text-slate-200 w-32 truncate">{item.ip}</span>
                        <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                          <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${(item.threat_count / max) * 100}%` }} />
                        </div>
                        <span className={`text-xs font-bold w-14 text-right ${SEVERITY_COLOR[item.top_threat_level] ? "" : ""}`}
                          style={{ color: SEVERITY_COLOR[item.top_threat_level] ?? "#94a3b8" }}>
                          {item.threat_count} {item.top_threat_level}
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

          {/* Top Source IPs */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4">Top Source IPs (All Traffic)</h3>
            {data?.top_source_ips?.length ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {data.top_source_ips.slice(0, 8).map((item, i) => {
                  const max = data.top_source_ips[0].count;
                  return (
                    <div key={i} className="bg-slate-700/60 rounded-lg p-3">
                      <p className="font-mono text-xs text-blue-300 truncate">{item.ip}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-slate-600 rounded-full h-1">
                          <div className="bg-blue-400 h-1 rounded-full" style={{ width: `${(item.count / max) * 100}%` }} />
                        </div>
                        <span className="text-xs text-slate-300">{item.count}</span>
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
