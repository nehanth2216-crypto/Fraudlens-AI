import { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, X, FileText, User, Clock, Filter, AlertCircle } from 'lucide-react';
import { auditAPI } from '../api/client';
import toast from 'react-hot-toast';

export default function AuditTrailModal({ isOpen, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen, actionFilter]);

  async function loadLogs() {
    try {
      setLoading(true);
      const res = await auditAPI.list({ action: actionFilter || undefined, limit: 50 });
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to load audit logs', err);
      toast.error('Could not load audit logs');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-4xl rounded-2xl border border-slate-200 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#002E6E] text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5 text-[#00BAF2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#002E6E]">Regulatory & Compliance Audit Trail</h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                  Immutable
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cryptographically sequenced record of all alert actions, case filings, and ML stream events
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadLogs}
              disabled={loading}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              title="Refresh logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#00BAF2]' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-3.5 border-b border-slate-100 bg-white flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-[#00BAF2]"
            >
              <option value="">All Audit Actions</option>
              <option value="ALERT_RESOLVED">Alert Resolutions</option>
              <option value="ALERT_ASSIGNED">Alert Assignments</option>
              <option value="ALERT_COMMENT_ADDED">Investigation Notes</option>
              <option value="STREAM">Stream Telemetry Events</option>
              <option value="LOGIN">User Logins</option>
            </select>
          </div>
          <span className="text-slate-500 font-mono text-[11px]">
            {logs.length} events recorded
          </span>
        </div>

        {/* Logs Table */}
        <div className="overflow-y-auto p-4 space-y-2.5 flex-1">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#00BAF2] mb-2" />
              Fetching audit records from database...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <FileText className="w-6 h-6 mx-auto mb-2 text-slate-300" />
              No audit records matching filter criteria
            </div>
          ) : (
            logs.map((log) => {
              const isResolve = log.action.includes('RESOLVE');
              const isAssign = log.action.includes('ASSIGN');
              const isComment = log.action.includes('COMMENT');

              let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
              if (isResolve) badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
              else if (isAssign) badgeStyle = 'bg-cyan-50 text-[#002E6E] border-cyan-200';
              else if (isComment) badgeStyle = 'bg-blue-50 text-blue-800 border-blue-200';

              return (
                <div
                  key={log.id}
                  className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                        {log.action}
                      </span>
                      {log.entity_type && (
                        <span className="text-[10px] font-medium text-slate-500">
                          {log.entity_type} #{log.entity_id}
                        </span>
                      )}
                      <span className="text-slate-400 text-[10px] flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {new Date(log.timestamp).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="text-slate-800 font-medium text-[12px] leading-relaxed">
                      {log.details || 'No additional details logged'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="w-6 h-6 rounded-lg bg-[#002E6E]/10 text-[#002E6E] flex items-center justify-center font-bold text-[10px]">
                      <User className="w-3 h-3" />
                    </div>
                    <span className="text-[11px] font-bold text-[#002E6E]">
                      {log.user_name || 'System / Officer'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
          <span>Compliant with RBI FinTech Audit Standards & FinCEN Guidelines</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#002E6E] text-white font-bold hover:bg-[#003B8D] transition-all cursor-pointer"
          >
            Close Audit Trail
          </button>
        </div>
      </div>
    </div>
  );
}
