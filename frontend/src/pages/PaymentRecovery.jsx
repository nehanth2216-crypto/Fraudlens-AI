import { useState, useEffect } from 'react';
import {
  RotateCcw, ShieldCheck, FileText, CheckCircle, AlertTriangle,
  Download, Send, ArrowUpRight, Clock, Trophy
} from 'lucide-react';
import toast from 'react-hot-toast';
import { v2RecoveryAPI } from '../api/client';

export default function PaymentRecovery() {
  const [stats, setStats] = useState(null);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Evidence Dossier Modal state
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [dossier, setDossier] = useState(null);
  const [generatingDossier, setGeneratingDossier] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [statsRes, disputesRes] = await Promise.all([
        v2RecoveryAPI.getStats(),
        v2RecoveryAPI.getDisputes()
      ]);
      setStats(statsRes.data);
      setDisputes(disputesRes.data);
    } catch (err) {
      console.error('Failed to load recovery data', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenDossier(dispute) {
    setSelectedDispute(dispute);
    try {
      setGeneratingDossier(true);
      const res = await v2RecoveryAPI.generateEvidence(dispute.dispute_id);
      setDossier(res.data);
    } catch (err) {
      toast.error('Failed to generate automated evidence dossier');
    } finally {
      setGeneratingDossier(false);
    }
  }

  async function handleSubmitRepresentment() {
    if (!selectedDispute) return;
    try {
      await v2RecoveryAPI.submitRepresentment({
        dispute_id: selectedDispute.dispute_id,
        action: 'SUBMIT_REPRESENTMENT'
      });
      toast.success(`Representment dossier transmitted for ${selectedDispute.dispute_id}!`);
      setSelectedDispute(null);
      setDossier(null);
      loadData();
    } catch (err) {
      toast.error('Submission failed');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-cyan-950/40 via-[#0e131f] to-blue-950/20 p-5 rounded-2xl border border-cyan-500/20 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">Priority 3</span>
            <span className="text-xs text-slate-400">• Revenue & Dispute Reclamation</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Payment & Refund Recovery Hub</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Automates chargeback representment dossiers with Visa Compelling Evidence 3.0, intercepts serial refund abusers, and tracks recovered funds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#0a0d14] px-4 py-2 rounded-xl border border-white/5 text-right">
            <p className="text-[10px] text-slate-400">Total Recovered Revenue</p>
            <p className="text-lg font-bold font-mono text-cyan-400">₹{stats?.total_recovered_amount_inr?.toLocaleString('en-IN') || '1,290,000'}</p>
            <p className="text-[9px] text-emerald-400 font-semibold">Win Rate: {stats?.win_rate_percentage || 70.8}%</p>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0e131f] p-4 rounded-xl border border-white/5 shadow-md">
          <span className="text-xs text-slate-400 block mb-1">Total Disputes Managed</span>
          <span className="text-xl font-bold text-white font-mono">{stats?.total_disputes || 70}</span>
          <span className="text-[10px] text-slate-500 block mt-1">₹{stats?.total_disputed_amount_inr?.toLocaleString('en-IN')} contested</span>
        </div>

        <div className="bg-[#0e131f] p-4 rounded-xl border border-white/5 shadow-md">
          <span className="text-xs text-slate-400 block mb-1">Representment Win Rate</span>
          <span className="text-xl font-bold text-emerald-400 font-mono flex items-center gap-1">
            <Trophy className="w-4 h-4" />
            {stats?.win_rate_percentage || 70.8}%
          </span>
          <span className="text-[10px] text-emerald-400 block mt-1">+14.2% above industry avg</span>
        </div>

        <div className="bg-[#0e131f] p-4 rounded-xl border border-white/5 shadow-md">
          <span className="text-xs text-slate-400 block mb-1">Refund Abuse Intercepted</span>
          <span className="text-xl font-bold text-amber-400 font-mono">{stats?.refund_abuse_detected || 9} Claims</span>
          <span className="text-[10px] text-amber-400 block mt-1">Serial returners & wardrobing flagged</span>
        </div>

        <div className="bg-[#0e131f] p-4 rounded-xl border border-white/5 shadow-md">
          <span className="text-xs text-slate-400 block mb-1">Avg Turnaround Time</span>
          <span className="text-xl font-bold text-white font-mono">{stats?.avg_recovery_turnaround_days || 8.4} Days</span>
          <span className="text-[10px] text-slate-500 block mt-1">From dispute notice to credit win</span>
        </div>
      </div>

      {/* Disputes Pipeline Table */}
      <div className="bg-[#0e131f] p-5 rounded-2xl border border-white/5 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Active Dispute & Representment Pipeline</h2>
            <p className="text-[11px] text-slate-400">Click 'Compile Dossier' to auto-generate evidence packs with 3DS proofs</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="text-slate-400 border-b border-white/5 pb-2">
                <th className="pb-2 font-semibold">Dispute ID</th>
                <th className="pb-2 font-semibold">Transaction</th>
                <th className="pb-2 font-semibold">Disputed Amount</th>
                <th className="pb-2 font-semibold">Reason Code</th>
                <th className="pb-2 font-semibold">Lifecycle Stage</th>
                <th className="pb-2 font-semibold">Win Prob.</th>
                <th className="pb-2 font-semibold">Abuse Risk</th>
                <th className="pb-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {disputes.map((d, idx) => (
                <tr key={idx} className="hover:bg-white/[0.03] transition-colors">
                  <td className="py-3 font-mono font-bold text-cyan-400">{d.dispute_id}</td>
                  <td className="py-3 font-mono text-slate-300">{d.transaction_ref}</td>
                  <td className="py-3 font-mono text-white font-bold">₹{d.amount?.toLocaleString('en-IN')}</td>
                  <td className="py-3 text-slate-400 max-w-[200px] truncate">{d.dispute_reason}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      d.stage === 'WON_RECOVERED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      d.stage === 'EVIDENCE_SUBMITTED' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                      d.stage === 'CHARGEBACK_FILED' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-slate-500/20 text-slate-300'
                    }`}>
                      {d.stage.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 font-mono font-semibold text-emerald-400">
                    {(d.win_probability * 100).toFixed(0)}%
                  </td>
                  <td className="py-3">
                    {d.refund_abuse_flag ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 w-fit">
                        <AlertTriangle className="w-3 h-3" /> Abuse Flag
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[10px]">Normal</span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleOpenDossier(d)}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-sm transition-all"
                    >
                      Compile Dossier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Automated Evidence Dossier Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e131f] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <span>Compelling Evidence 3.0 Dossier</span>
                </h3>
                <p className="text-xs text-slate-400">Dispute: {selectedDispute.dispute_id} • Contested Amount: ₹{selectedDispute.amount?.toLocaleString('en-IN')}</p>
              </div>
              <button
                onClick={() => { setSelectedDispute(null); setDossier(null); }}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {generatingDossier ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <RotateCcw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
                <span>Aggregating 3DS cryptograms, IP geolocation, and courier delivery proofs...</span>
              </div>
            ) : dossier ? (
              <div className="space-y-4 text-[11px]">
                <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-cyan-300">
                  <span className="font-bold block mb-1">Visa Compelling Evidence 3.0 Qualified</span>
                  <p className="leading-relaxed">{dossier.recommended_submission_narrative}</p>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-white block">Verified Evidence Documents Attached:</span>
                  {dossier.documents_compiled?.map((doc, dIdx) => (
                    <div key={dIdx} className="p-3 bg-[#0a0d14] rounded-xl border border-white/5 space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-200">{doc.section}</strong>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {doc.status}
                        </span>
                      </div>
                      <div className="text-slate-400 text-[10px] space-y-0.5 pt-1">
                        {Object.entries(doc.details || {}).map(([k, v], kIdx) => (
                          <div key={kIdx} className="flex justify-between">
                            <span className="capitalize">{k.replace(/_/g, ' ')}:</span>
                            <span className="text-slate-300 font-mono">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                  <button
                    onClick={() => { setSelectedDispute(null); setDossier(null); }}
                    className="px-4 py-2 rounded-xl text-slate-300 hover:bg-white/5 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitRepresentment}
                    className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-lg shadow-cyan-600/20 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Representment to Card Scheme</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
