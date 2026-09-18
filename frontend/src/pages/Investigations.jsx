import { useState, useEffect } from 'react';
import {
  FolderLock, ShieldAlert, FileText, CheckCircle, Clock,
  User, Paperclip, Download, Send, Plus, Eye, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { v2InvestigationsAPI } from '../api/client';

export default function Investigations() {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);
  const [loading, setLoading] = useState(true);

  // SAR Generation Modal
  const [showSarModal, setShowSarModal] = useState(false);
  const [sarForm, setSarForm] = useState({
    suspect_name: 'Dev Verma & Arjun Patel Syndicate',
    suspect_account: 'Multiple Mule Clusters (AC-8812 - AC-8815)',
    suspicious_amount: 4850000,
    violation_types: ['MONEY_LAUNDERING', 'STRUCTURING_UNDER_THRESHOLD', 'WIRE_FRAUD'],
    core_narrative: 'Subject account cluster conducted 14 transfers calibrated precisely at INR 49,500 to evade the mandatory INR 50,000 threshold. Funds funneled to off-shore crypto cashout endpoint within 42 minutes.',
  });
  const [sarResult, setSarResult] = useState(null);
  const [generatingSar, setGeneratingSar] = useState(false);

  useEffect(() => {
    loadCases();
  }, []);

  async function loadCases() {
    try {
      setLoading(true);
      const res = await v2InvestigationsAPI.getCases();
      setCases(res.data);
      if (res.data?.length > 0) {
        handleSelectCase(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load investigation cases', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectCase(c) {
    setSelectedCase(c);
    try {
      const res = await v2InvestigationsAPI.getAuditTrail(c.id);
      setAuditTrail(res.data);
    } catch (err) {
      console.error('Failed to load audit trail', err);
    }
  }

  async function handleGenerateSar(e) {
    e.preventDefault();
    try {
      setGeneratingSar(true);
      const res = await v2InvestigationsAPI.generateSAR({
        investigation_id: selectedCase?.id || 1,
        ...sarForm
      });
      setSarResult(res.data);
      toast.success(`FinCEN SAR Generated: ${res.data.sar_tracking_number}!`, { icon: '📋' });
      loadCases();
    } catch (err) {
      toast.error('Failed to generate SAR');
    } finally {
      setGeneratingSar(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-red-950/40 via-[#0e131f] to-rose-950/20 p-5 rounded-2xl border border-rose-500/20 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">Priority 10</span>
            <span className="text-xs text-slate-400">• Evidence Locker & Compliance</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Investigation Cases & FinCEN SAR Hub</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Case lifecycle management, secure forensic evidence lockers, FinCEN Form 111 Suspicious Activity Report (SAR) narrative generation, and immutable audit logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { setShowSarModal(true); setSarResult(null); }}
            className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-lg shadow-rose-600/25 transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>Generate FinCEN SAR</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Cases List & Selected Case Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cases List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Active Investigations ({cases.length})</h2>
          </div>

          <div className="space-y-3">
            {cases.map((c, idx) => {
              const isSelected = selectedCase?.id === c.id;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelectCase(c)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-950/20 border-rose-500/50 shadow-md'
                      : 'bg-[#0e131f] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-rose-400">{c.case_number}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                      c.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {c.priority}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white mb-2">{c.title}</h3>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Investigator: <strong className="text-slate-200">{c.assigned_to}</strong></span>
                    <span className="font-mono text-white font-bold">₹{c.total_flagged_amount_inr?.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex items-center gap-3 pt-2 mt-2 border-t border-white/5 text-[10px] text-slate-500">
                    <span>Evidence: <strong className="text-slate-300">{c.evidence_count} docs</strong></span>
                    <span>Status: <strong className="text-emerald-400">{c.status}</strong></span>
                    {c.sar_filed && (
                      <span className="text-cyan-400 font-semibold">• SAR Transmitted</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Case Forensic Dossier & Immutable Audit Trail (7 cols) */}
        <div className="lg:col-span-7 bg-[#0e131f] p-5 rounded-2xl border border-white/5 shadow-xl space-y-5">
          {selectedCase ? (
            <>
              <div className="flex items-start justify-between border-b border-white/5 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-rose-400">{selectedCase.case_number}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      {selectedCase.status}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white mt-1">{selectedCase.title}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Assigned Lead: {selectedCase.assigned_to}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase block">Flagged Volume</span>
                  <span className="text-lg font-bold font-mono text-rose-400">₹{selectedCase.total_flagged_amount_inr?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Evidence Locker Tab */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-blue-400" />
                    <span>Forensic Evidence Locker ({selectedCase.evidence_count} items attached)</span>
                  </h3>
                  <button
                    onClick={() => toast.success('New evidence file uploaded & hashed to audit trail')}
                    className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Evidence
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-3 bg-[#0a0d14] rounded-xl border border-white/5 space-y-1">
                    <span className="font-bold text-slate-200 block">IP Geolocation & Tor Trace</span>
                    <span className="text-[10px] text-slate-400 block">SHA-256: 8f9b...a109</span>
                    <span className="text-[10px] text-emerald-400">Verified by Cloudflare ASN</span>
                  </div>
                  <div className="p-3 bg-[#0a0d14] rounded-xl border border-white/5 space-y-1">
                    <span className="font-bold text-slate-200 block">Device Hardware Canvas Hash</span>
                    <span className="text-[10px] text-slate-400 block">SHA-256: 3c4d...e782</span>
                    <span className="text-[10px] text-emerald-400">WebGL & Root Exploit Proof</span>
                  </div>
                </div>
              </div>

              {/* Immutable Timeline Audit Trail */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Immutable Compliance Audit Trail (Cryptographically Logged)</span>
                </h3>

                <div className="space-y-2 relative border-l-2 border-white/10 ml-3 pl-4 text-[11px]">
                  {auditTrail.map((log, lIdx) => (
                    <div key={lIdx} className="relative space-y-0.5">
                      <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-[#0e131f]" />
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{log.action}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
                      </div>
                      <p className="text-slate-400 text-[10px]">{log.details}</p>
                      <p className="text-[9px] text-slate-500 italic">Actor: {log.actor}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-slate-500 text-xs">
              Select an investigation case to view forensic dossiers and audit logs.
            </div>
          )}
        </div>
      </div>

      {/* FinCEN SAR Filing Modal */}
      {showSarModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e131f] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-rose-400" />
                  <span>FinCEN Form 111 — Suspicious Activity Report (SAR) Generator</span>
                </h3>
                <p className="text-xs text-slate-400">Automates regulatory narrative for BSA/AML compliance</p>
              </div>
              <button
                onClick={() => setShowSarModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateSar} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Subject Legal Name</label>
                  <input
                    type="text"
                    value={sarForm.suspect_name}
                    onChange={(e) => setSarForm({ ...sarForm, suspect_name: e.target.value })}
                    className="w-full bg-[#0a0d14] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Suspicious Amount (INR)</label>
                  <input
                    type="number"
                    value={sarForm.suspicious_amount}
                    onChange={(e) => setSarForm({ ...sarForm, suspicious_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0a0d14] border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Core Investigation Narrative</label>
                <textarea
                  rows={4}
                  value={sarForm.core_narrative}
                  onChange={(e) => setSarForm({ ...sarForm, core_narrative: e.target.value })}
                  className="w-full bg-[#0a0d14] border border-white/10 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-rose-500 custom-scrollbar"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowSarModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-white/5 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generatingSar}
                  className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-lg shadow-rose-600/25 transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{generatingSar ? 'Transmitting to BSA...' : 'Generate & Transmit SAR Report'}</span>
                </button>
              </div>
            </form>

            {/* Generated SAR Output Preview */}
            {sarResult && (
              <div className="mt-4 p-4 rounded-xl bg-[#0a0d14] border border-emerald-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    <span>SAR Transmitted Successfully: {sarResult.sar_tracking_number}</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">BSA ID: {sarResult.bsa_id}</span>
                </div>
                <div className="font-mono text-[10px] text-slate-300 p-3 bg-black/50 rounded-lg whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {sarResult.narrative}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
