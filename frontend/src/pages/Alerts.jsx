import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert, AlertTriangle, CheckCircle, Clock,
  Filter, Search, UserCheck, FolderLock, Sparkles, RefreshCw,
  Plus, X, Send, MessageSquare, ArrowRight, User, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { alertsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useRealtimeStream } from '../hooks/useRealtimeStream';

export default function Alerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Drawer / Investigation State
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // Manual Alert Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    transaction_id: 1,
    severity: 'HIGH',
    alert_type: 'HIGH_RISK_TRANSACTION',
    title: '',
    description: '',
  });
  const [creatingAlert, setCreatingAlert] = useState(false);

  // Real-time WebSocket hook
  const handleRealtimeAlert = useCallback((newAlert) => {
    setAlerts(prev => [newAlert, ...prev]);
  }, []);

  const handleRealtimeAlertUpdated = useCallback((data) => {
    setAlerts(prev => prev.map(a => (a.id === data.id ? { ...a, ...data } : a)));
    if (selectedAlert && selectedAlert.id === data.id) {
      setSelectedAlert(prev => ({ ...prev, ...data }));
    }
  }, [selectedAlert]);

  const { isConnected } = useRealtimeStream({
    onAlert: handleRealtimeAlert,
    onAlertUpdated: handleRealtimeAlertUpdated,
  });

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await alertsAPI.list({
        severity: severityFilter || undefined,
        status: statusFilter || undefined,
        limit: 50,
      });
      setAlerts(res.data);
    } catch (err) {
      console.error('Failed to load alerts', err);
    } finally {
      setLoading(false);
    }
  }, [severityFilter, statusFilter]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Open Alert Details Drawer
  const openAlertDetails = async (alert) => {
    setSelectedAlert(alert);
    try {
      setDrawerLoading(true);
      const [detailRes, commentsRes] = await Promise.all([
        alertsAPI.get(alert.id),
        alertsAPI.getComments(alert.id),
      ]);
      setSelectedAlert(detailRes.data);
      setComments(commentsRes.data || []);
    } catch (err) {
      console.error('Failed to load alert details', err);
    } finally {
      setDrawerLoading(false);
    }
  };

  // Status Change Handler
  const handleStatusChange = async (alertId, newStatus) => {
    try {
      await alertsAPI.update(alertId, { status: newStatus });
      toast.success(`Alert #${alertId} status updated to ${newStatus}`);
      loadAlerts();
      if (selectedAlert && selectedAlert.id === alertId) {
        setSelectedAlert(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      toast.error('Failed to update alert status');
    }
  };

  // Quick Resolve Handler
  const handleResolve = async (alertId, isFalsePositive = false) => {
    try {
      const resolution = isFalsePositive ? 'FALSE_POSITIVE_VERIFIED' : 'RESOLVED_FUNDS_RECOVERED';
      const notes = isFalsePositive
        ? 'Verified legitimate customer activity; no fraud risk found.'
        : 'Confirmed fraudulent interception. Card blocked, funds safely protected.';
      await alertsAPI.resolve(alertId, { resolution, is_false_positive: isFalsePositive, notes });
      toast.success(isFalsePositive ? `Alert #${alertId} marked as False Positive` : `Alert #${alertId} resolved!`);
      loadAlerts();
      if (selectedAlert && selectedAlert.id === alertId) {
        setSelectedAlert(prev => ({
          ...prev,
          status: isFalsePositive ? 'FALSE_POSITIVE' : 'RESOLVED',
          resolution,
          notes,
        }));
      }
    } catch (err) {
      toast.error('Resolve failed');
    }
  };

  // Assign Handler
  const handleAssign = async (alertId, userId) => {
    try {
      await alertsAPI.assign(alertId, { user_id: userId });
      toast.success(`Alert #${alertId} assigned!`);
      loadAlerts();
      if (selectedAlert && selectedAlert.id === alertId) {
        setSelectedAlert(prev => ({ ...prev, status: 'INVESTIGATING', assigned_to: userId }));
      }
    } catch (err) {
      toast.error('Assignment failed');
    }
  };

  // Add Comment Handler
  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedAlert) return;
    setPostingComment(true);
    try {
      const res = await alertsAPI.addComment(selectedAlert.id, { comment: newComment.trim() });
      setComments(prev => [...prev, res.data.comment]);
      setNewComment('');
      toast.success('Investigation note saved to audit log');
    } catch (err) {
      toast.error('Failed to post comment');
    } finally {
      setPostingComment(false);
    }
  };

  // Manual Alert Creation Submit
  const handleCreateAlertSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    setCreatingAlert(true);
    try {
      await alertsAPI.create({
        ...createForm,
        transaction_id: Number(createForm.transaction_id),
      });
      toast.success('New fraud alert created in queue');
      setShowCreateModal(false);
      setCreateForm({
        transaction_id: 1,
        severity: 'HIGH',
        alert_type: 'HIGH_RISK_TRANSACTION',
        title: '',
        description: '',
      });
      loadAlerts();
    } catch (err) {
      toast.error('Failed to create alert');
    } finally {
      setCreatingAlert(false);
    }
  };

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
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-[11px] text-slate-500 font-medium">
              {isConnected ? 'Real-Time Telemetry Live' : 'Connecting WebSocket...'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#002E6E] tracking-tight">Fraud Alert Operations Queue</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time anomalies flagged by XGBoost ensemble, velocity checks, and mule ring detection models.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
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

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#00BAF2] cursor-pointer shadow-xs"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open / New</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
            <option value="FALSE_POSITIVE">False Positive</option>
          </select>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 bg-[#00BAF2] hover:bg-[#00a4d6] text-[#002E6E] px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Alert</span>
          </button>
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

      {/* Alerts Stream List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#00BAF2] mb-2" />
            Loading fraud alerts from database...
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
            No alerts found matching the selected filter. All systems operational.
          </div>
        ) : (
          alerts.map((a) => {
            const isCritical = a.severity === 'CRITICAL';
            const isResolved = a.status === 'RESOLVED' || a.status === 'FALSE_POSITIVE';

            return (
              <div
                key={a.id}
                className={`bg-white p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:border-[#00BAF2] ${
                  isCritical ? 'border-rose-200 bg-rose-50/10' : 'border-slate-200'
                }`}
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
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      a.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                      a.status === 'FALSE_POSITIVE' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                      a.status === 'INVESTIGATING' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {a.status}
                    </span>
                    {a.assignee_name && (
                      <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                        <User className="w-2.5 h-2.5" />
                        {a.assignee_name}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 font-mono">
                      {a.created_at?.replace('T', ' ').substring(0, 19)}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{a.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{a.description}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                  <button
                    onClick={() => openAlertDetails(a)}
                    className="inline-flex items-center gap-1.5 bg-[#E8F7FE] hover:bg-[#D4EFFF] text-[#002E6E] border border-[#00BAF2]/30 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#00BAF2]" />
                    <span>Investigate ({a.comment_count || 0})</span>
                  </button>

                  <Link
                    to="/investigations"
                    className="inline-flex items-center gap-1 bg-[#002E6E] hover:bg-[#001F4D] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    <FolderLock className="w-3.5 h-3.5" />
                    <span>SAR Case</span>
                  </Link>

                  {!isResolved ? (
                    <button
                      onClick={() => handleResolve(a.id, false)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-colors cursor-pointer"
                    >
                      Resolve
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Closed
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Collaborative Investigation Detail Drawer */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#002E6E]">ALERT #{selectedAlert.id}</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                    selectedAlert.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                    'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {selectedAlert.severity}
                  </span>
                </div>
                <h2 className="text-sm font-bold text-slate-900 line-clamp-1">{selectedAlert.title}</h2>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs">
              {/* Forensics Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h3 className="font-bold text-[#002E6E] text-xs">Transaction Forensics</h3>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Transaction ID</span>
                    <span className="font-mono font-bold text-slate-800">
                      {selectedAlert.transaction?.transaction_id || `TXN-${selectedAlert.transaction_id}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Amount</span>
                    <span className="font-mono font-bold text-rose-600">
                      ₹{Number(selectedAlert.transaction?.amount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Payment Method</span>
                    <span className="font-medium text-slate-800">
                      {selectedAlert.transaction?.payment_method || 'UPI / NetBanking'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Timestamp</span>
                    <span className="font-mono text-slate-600">
                      {selectedAlert.created_at?.slice(0, 19).replace('T', ' ')}
                    </span>
                  </div>
                </div>
                <p className="text-slate-600 text-[11px] pt-2 border-t border-slate-200 leading-relaxed">
                  {selectedAlert.description}
                </p>
              </div>

              {/* Status Progression Stepper */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">Alert Lifecycle Status</label>
                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                  {['OPEN', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(selectedAlert.id, st)}
                      className={`py-2 px-1 rounded-xl border font-bold transition-all cursor-pointer ${
                        selectedAlert.status === st
                          ? 'bg-[#002E6E] text-white border-[#002E6E] shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assignee Selection */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">Assigned Investigator</label>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedAlert.assigned_to || ''}
                    onChange={(e) => handleAssign(selectedAlert.id, Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#00BAF2]"
                  >
                    <option value="">Unassigned</option>
                    <option value="1">Admin User (FinTech Admin)</option>
                    <option value="2">Sarah Chen (Fraud Analyst)</option>
                    <option value="3">James Wilson (Lead Investigator)</option>
                  </select>
                </div>
              </div>

              {/* Resolution Action Panel */}
              <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-2">
                <h4 className="font-bold text-emerald-900 text-xs">Quick Resolution Actions</h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleResolve(selectedAlert.id, false)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    Mark Resolved (Fraud Blocked)
                  </button>
                  <button
                    onClick={() => handleResolve(selectedAlert.id, true)}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    False Positive
                  </button>
                </div>
              </div>

              {/* Collaborative Investigation Notes Thread */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[#002E6E] text-xs flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#00BAF2]" />
                    <span>Investigation Notes ({comments.length})</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">Recorded in Compliance Audit Trail</span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <p className="text-slate-400 italic text-[11px]">No notes posted yet. Start the investigation below.</p>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-[#002E6E]">{c.user_name}</span>
                          <span className="text-slate-400 font-mono">
                            {new Date(c.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-700 text-[11px] leading-relaxed">{c.comment}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Post Note Form */}
                <form onSubmit={handlePostComment} className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add notes: cardholder contacted, IP verified..."
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#00BAF2]"
                  />
                  <button
                    type="submit"
                    disabled={postingComment || !newComment.trim()}
                    className="bg-[#002E6E] hover:bg-[#003B8D] text-white p-2 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual "+ Create Alert" Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#002E6E]">Create Custom Fraud Alert</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAlertSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Transaction ID</label>
                <input
                  type="number"
                  value={createForm.transaction_id}
                  onChange={(e) => setCreateForm({ ...createForm, transaction_id: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Severity Level</label>
                  <select
                    value={createForm.severity}
                    onChange={(e) => setCreateForm({ ...createForm, severity: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alert Category</label>
                  <select
                    value={createForm.alert_type}
                    onChange={(e) => setCreateForm({ ...createForm, alert_type: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="HIGH_RISK_TRANSACTION">High-Risk Txn</option>
                    <option value="ANOMALY_DETECTED">Anomaly Detected</option>
                    <option value="RULE_VIOLATION">Rule Violation</option>
                    <option value="SUSPICIOUS_PATTERN">Suspicious Pattern</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alert Title</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g. Unverified Beneficiary Withdrawal"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description & Reasoning</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Details observed during investigation or customer call..."
                  rows={3}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAlert}
                  className="px-4 py-2 rounded-xl bg-[#002E6E] hover:bg-[#003B8D] text-white font-bold transition-all shadow-xs"
                >
                  {creatingAlert ? 'Creating...' : 'Submit to Queue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
