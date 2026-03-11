import { useEffect, useState } from 'react';
import { Server, RefreshCw, Terminal, ChevronDown, ChevronUp, Wifi, WifiOff } from 'lucide-react';
import { adminApi } from '../api/client';
import type { Agent, AgentCommand } from '../types';
import { StatusBadge, LoadingOverlay, ErrorMsg, SectionHeader, Spinner } from '../components/ui';

const COMMAND_TYPES = ['block_ip', 'unblock_ip', 'reload_nginx', 'get_status', 'run_script', 'update_config'];

interface CommandPanelProps {
  agent: Agent;
  onSent: () => void;
}

function CommandPanel({ agent, onSent }: CommandPanelProps) {
  const [commandType, setCommandType] = useState('get_status');
  const [payload, setPayload] = useState('{}');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSend = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const p = JSON.parse(payload);
      await adminApi.sendCommand(agent.id, commandType, p);
      setSuccess('Command sent successfully!');
      onSent();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send command');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-slate-700/50">
      <h4 className="text-slate-300 text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-1.5">
        <Terminal size={13} /> Send Command
      </h4>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-slate-300 text-xs mb-1 block">Command Type</label>
          <select value={commandType} onChange={e => setCommandType(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none">
            {COMMAND_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-slate-300 text-xs mb-1 block">Payload (JSON)</label>
          <input value={payload} onChange={e => setPayload(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm
                       font-mono focus:outline-none" />
        </div>
      </div>
      {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
      {success && <p className="text-green-400 text-xs mb-2">{success}</p>}
      <div onClick={loading ? undefined : handleSend}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500
                   text-white text-sm font-semibold transition-colors cursor-pointer ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
        {loading ? <Spinner size="sm" /> : <Terminal size={14} />}
        Send
      </div>
    </div>
  );
}

interface AgentCardProps {
  agent: Agent;
}

function AgentCard({ agent }: AgentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [commands, setCommands] = useState<AgentCommand[]>([]);
  const [loadingCmds, setLoadingCmds] = useState(false);

  const loadCommands = async () => {
    setLoadingCmds(true);
    try {
      const res = await adminApi.agentCommands(agent.id, 10);
      setCommands(res.data);
    } catch { /* ignore */ }
    finally { setLoadingCmds(false); }
  };

  const handleExpand = () => {
    setExpanded(e => !e);
    if (!expanded) loadCommands();
  };

  return (
    <div className={`bg-slate-800 border rounded-xl p-5 transition-colors
      ${agent.status === 'active' ? 'border-green-500/30' : 'border-slate-700'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${agent.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
            {agent.status === 'active' ? <Wifi size={18} /> : <WifiOff size={18} />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-semibold text-sm">{agent.hostname}</span>
              <StatusBadge status={agent.status} />
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <span className="font-mono text-blue-300">{agent.ipAddress}</span>
              <span>•</span>
              <span>v{agent.version}</span>
              <span>•</span>
              <span>ID: <span className="font-mono">{agent.agentId.slice(0, 8)}…</span></span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Last seen: {new Date(agent.lastSeen).toLocaleString()}
            </p>
          </div>
        </div>
        <div onClick={handleExpand}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700
                     text-slate-400 hover:text-white text-xs transition-colors hover:bg-slate-700 cursor-pointer">
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {expanded ? 'Collapse' : 'Details'}
        </div>
      </div>

      {expanded && (
        <div>
          <CommandPanel agent={agent} onSent={loadCommands} />

          {/* Command history */}
          <div className="mt-4">
            <h4 className="text-slate-300 text-xs font-semibold uppercase tracking-wide mb-3">Recent Commands</h4>
            {loadingCmds ? (
              <div className="flex justify-center py-4"><Spinner size="sm" /></div>
            ) : commands.length === 0 ? (
              <p className="text-slate-500 text-xs">No commands yet</p>
            ) : (
              <div className="space-y-2">
                {commands.map(cmd => (
                  <div key={cmd.id} className="flex items-center gap-3 bg-slate-700/50 rounded-lg px-3 py-2">
                    <span className="font-mono text-xs bg-slate-700 text-slate-200 px-1.5 py-0.5 rounded">{cmd.commandType}</span>
                    <StatusBadge status={cmd.status} />
                    <span className="text-xs text-slate-400 ml-auto">{new Date(cmd.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [staleChecking, setStaleChecking] = useState(false);
  const [staleMsg, setStaleMsg] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await adminApi.agents();
      setAgents(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleStaleCheck = async () => {
    setStaleChecking(true); setStaleMsg('');
    try {
      const res = await adminApi.staleCheck();
      setStaleMsg(`Marked ${res.data.marked_disconnected} agent(s) as disconnected`);
      await load();
    } catch (err: unknown) {
      setStaleMsg(err instanceof Error ? err.message : 'Stale check failed');
    } finally {
      setStaleChecking(false);
    }
  };

  const handleBroadcast = async () => {
    try {
      await adminApi.sendCommand('broadcast', 'get_status', {});
      setStaleMsg('Broadcast sent to all active agents');
    } catch (err: unknown) {
      setStaleMsg(err instanceof Error ? err.message : 'Broadcast failed');
    }
  };

  const activeCount = agents.filter(a => a.status === 'active').length;

  return (
    <div>
      <SectionHeader
        title="Agent Management"
        subtitle={`${agents.length} registered • ${activeCount} active`}
        action={
          <div className="flex gap-2">
            <div onClick={handleBroadcast}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700
                         text-slate-400 hover:text-white text-sm transition-colors hover:bg-slate-800 cursor-pointer">
              <Terminal size={14} /> Broadcast Status
            </div>
            <div onClick={staleChecking ? undefined : handleStaleCheck}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700
                         text-slate-400 hover:text-white text-sm transition-colors hover:bg-slate-800 cursor-pointer ${staleChecking ? 'opacity-50 pointer-events-none' : ''}`}>
              <RefreshCw size={14} className={staleChecking ? 'animate-spin' : ''} />
              Stale Check
            </div>
            <div onClick={loading ? undefined : load}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700
                         text-slate-400 hover:text-white text-sm transition-colors hover:bg-slate-800 cursor-pointer ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </div>
          </div>
        }
      />

      {staleMsg && (
        <div className="mb-4 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg p-3 text-sm">{staleMsg}</div>
      )}
      {error && <div className="mb-4"><ErrorMsg message={error} /></div>}

      {loading ? <LoadingOverlay /> : agents.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <Server size={40} className="text-slate-400 mx-auto mb-3 opacity-60" />
          <p className="text-white font-semibold">No agents registered</p>
          <p className="text-slate-300 text-sm">Install the Linux agent on target servers to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {agents.map(agent => <AgentCard key={agent.id} agent={agent} />)}
        </div>
      )}
    </div>
  );
}
