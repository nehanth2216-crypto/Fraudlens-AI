import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert, AlertTriangle, CheckCircle, Clock,
  Filter, Search, UserCheck, FolderLock, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { alertsAPI } from '../api/client';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');

  useEffect(() => {
    loadAlerts();
  }, [severityFilter]);

  async function loadAlerts() {
    try {
      setLoading(true);
      const res = await alertsAPI.list({ severity: severityFilter || undefined, limit: 50 });
      setAlerts(res.data);
    } catch (err) {
      console.error('Failed to load alerts', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleResolve(alertId) {
    try {
      await alertsAPI.resolve(alertId, { resolution: 'RESOLVED_VALID_CUSTOMER', notes: 'Manually verified with cardholder' });
      toast.success(`Alert #${alertId} resolved!`);
      loadAlerts();
    } catch (err) {
      toast.error('Resolve failed');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0e131f] p-5 rounded-2xl border border-white/5 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Fraud Alert Operations Queue</h1>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Real-time alerts flagged by ML ensemble, anomaly detection, and velocity rules</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#0a0d14] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Severity</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Alerts Stream */}
      <div className="space-y-3">
        {alerts.map((a, idx) => (
          <div
            key={idx}
            className="bg-[#0e131f] p-4 rounded-xl border border-white/5 hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
          >
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-rose-400">ALERT #{a.id}</span>
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded ${
                  a.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                  a.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}>
                  {a.severity}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {a.created_at?.replace('T', ' ').substring(0, 19)}
                </span>
              </div>

              <h3 className="text-xs font-bold text-white">{a.title}</h3>
              <p className="text-[11px] text-slate-400">{a.description}</p>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0">
              <Link
                to="/explainable-ai"
                className="flex items-center gap-1 bg-fuchsia-600/20 hover:bg-fuchsia-600/30 text-fuchsia-300 border border-fuchsia-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Explain Risk</span>
              </Link>

              <Link
                to="/investigations"
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm"
              >
                <FolderLock className="w-3.5 h-3.5" />
                <span>Open Case</span>
              </Link>

              <button
                onClick={() => handleResolve(a.id)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-lg border border-white/10 transition-colors"
              >
                Resolve
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
