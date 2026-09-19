import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert, AlertTriangle, CheckCircle, Clock,
  Filter, Search, UserCheck, FolderLock, Sparkles, RefreshCw
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

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
  const highCount = alerts.filter(a => a.severity === 'HIGH').length;

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wider">
              Paytm Security Operations
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <h1 className="text-xl font-bold text-[#002E6E] tracking-tight">Fraud Alert Operations Queue</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time anomalies flagged by XGBoost ensemble, velocity checks, and mule ring detection models.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#00BAF2] cursor-pointer shadow-xs"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Severity</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Severity Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-400 block font-medium">Active Alerts</span>
          <span className="text-base font-bold text-[#002E6E] font-mono">{alerts.length}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 text-xs">
          <span className="text-rose-700 block font-medium">Critical Threats</span>
          <span className="text-base font-bold text-rose-700 font-mono">{criticalCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 text-xs">
          <span className="text-amber-800 block font-medium">High Severity</span>
          <span className="text-base font-bold text-amber-800 font-mono">{highCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-400 block font-medium">Mean Time to Resolve</span>
          <span className="text-base font-bold text-[#002E6E] font-mono">4.2 mins</span>
        </div>
      </div>

      {/* Alerts Stream */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#00BAF2] mb-2" />
            Loading fraud alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
            No alerts found matching the selected filter. All systems clear.
          </div>
        ) : (
          alerts.map((a, idx) => (
            <div
              key={idx}
              className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-[#00BAF2] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-[#002E6E]">ALERT #{a.id}</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                    a.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                    a.severity === 'HIGH' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                    'bg-sky-100 text-sky-800 border border-sky-200'
                  }`}>
                    {a.severity}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {a.created_at?.replace('T', ' ').substring(0, 19)}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{a.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{a.description}</p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  to="/explainable-ai"
                  className="inline-flex items-center gap-1 bg-[#E8F7FE] hover:bg-[#D4EFFF] text-[#002E6E] border border-[#00BAF2]/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#00BAF2]" />
                  <span>Explain Risk</span>
                </Link>

                <Link
                  to="/investigations"
                  className="inline-flex items-center gap-1 bg-[#002E6E] hover:bg-[#001F4D] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  <FolderLock className="w-3.5 h-3.5" />
                  <span>Open Case</span>
                </Link>

                <button
                  onClick={() => handleResolve(a.id)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  Resolve
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
