import { useState, useEffect } from 'react';
import {
  AlertCircle, RefreshCw, CheckCircle, ArrowRight, Zap,
  TrendingUp, Clock, Shuffle, CheckSquare, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { v2FailuresAPI } from '../api/client';

export default function PaymentFailureDiagnosis() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Smart retry runner state
  const [retryTxnId, setRetryTxnId] = useState(1);
  const [allowRailSwitch, setAllowRailSwitch] = useState(true);
  const [retryResult, setRetryResult] = useState(null);
  const [retrying, setRetrying] = useState(false);

  // Manual diagnosis state
  const [selectedDeclineCode, setSelectedDeclineCode] = useState('51_INSUFFICIENT_FUNDS');
  const [diagnosisResult, setDiagnosisResult] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const res = await v2FailuresAPI.getAnalytics();
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to load failure analytics', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDiagnose(code) {
    try {
      setSelectedDeclineCode(code);
      const res = await v2FailuresAPI.diagnose({
        transaction_id: retryTxnId,
        decline_code: code,
        raw_message: `Decline triggered with reason code ${code}`
      });
      setDiagnosisResult(res.data);
      toast.success(`Root cause analyzed for ${code}`);
    } catch (err) {
      toast.error('Diagnosis failed');
    }
  }

  async function handleSmartRetry(e) {
    e.preventDefault();
    try {
      setRetrying(true);
      const res = await v2FailuresAPI.smartRetry({
        transaction_id: retryTxnId,
        allow_rail_switch: allowRailSwitch
      });
      setRetryResult(res.data);
      if (res.data.retry_eligible) {
        toast.success(`Smart Retry Computed! Win Probability: ${(res.data.recovery_probability * 100).toFixed(0)}%`);
      } else {
        toast.error('Retry not permitted: Terminal decline code');
      }
    } catch (err) {
      toast.error('Failed to run smart retry engine');
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-950/40 via-[#0e131f] to-yellow-950/20 p-5 rounded-2xl border border-amber-500/20 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Priority 2</span>
            <span className="text-xs text-slate-400">• Intelligent Payment Resilience</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Payment Failure Diagnosis & Smart Retry</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Deconstructs decline codes across a 4-tier failure taxonomy, separates network errors from genuine fraud, and automates intelligent retry routing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#0a0d14] px-4 py-2 rounded-xl border border-white/5 text-right">
            <p className="text-[10px] text-slate-400">Recovered Payment Revenue</p>
            <p className="text-lg font-bold font-mono text-emerald-400">₹3,480,000</p>
            <p className="text-[9px] text-slate-500">296 of 412 failed transactions recovered</p>
          </div>
        </div>
      </div>

      {/* 4-Tier Category Heatmap */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {analytics?.category_breakdown?.map((cat, idx) => (
          <div key={idx} className="bg-[#0e131f] p-4 rounded-xl border border-white/5 relative overflow-hidden shadow-md">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold text-slate-300">{cat.category.replace(/_/g, ' ')}</span>
              <span className="font-mono font-bold" style={{ color: cat.color }}>{cat.percentage}%</span>
            </div>
            <div className="text-2xl font-black text-white font-mono">{cat.count} <span className="text-xs font-normal text-slate-500">declines</span></div>
            <div className="w-full bg-white/5 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Decline Codes Table & Smart Retry Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Decline Codes (7 cols) */}
        <div className="lg:col-span-7 bg-[#0e131f] p-5 rounded-2xl border border-white/5 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Decline Code Taxonomy & Diagnostic Inspector</h2>
              <p className="text-[11px] text-slate-400">Click any code to inspect issuer root causes</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-slate-400 border-b border-white/5 pb-2">
                  <th className="pb-2 font-semibold">Decline Code</th>
                  <th className="pb-2 font-semibold">Failure Domain</th>
                  <th className="pb-2 font-semibold">Volume</th>
                  <th className="pb-2 font-semibold">Recoverability</th>
                  <th className="pb-2 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {analytics?.top_decline_codes?.map((code, idx) => {
                  const isSelected = selectedDeclineCode === code.code;
                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-white/[0.03] transition-colors cursor-pointer ${isSelected ? 'bg-blue-600/10' : ''}`}
                      onClick={() => handleDiagnose(code.code)}
                    >
                      <td className="py-2.5 font-mono font-bold text-slate-200">{code.code}</td>
                      <td className="py-2.5 text-slate-400">{code.category}</td>
                      <td className="py-2.5 font-mono text-white">{code.count}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          code.recoverable === 'Very High' ? 'bg-emerald-500/20 text-emerald-300' :
                          code.recoverable === 'High' ? 'bg-teal-500/20 text-teal-300' :
                          code.recoverable === 'Medium' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-rose-500/20 text-rose-300'
                        }`}>
                          {code.recoverable}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDiagnose(code.code); }}
                          className="text-xs text-blue-400 hover:text-blue-300 underline"
                        >
                          Diagnose
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Diagnostic Root Cause Viewer */}
          {diagnosisResult && (
            <div className="mt-4 p-4 rounded-xl bg-[#0a0d14] border border-blue-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-400" />
                  <span>Diagnosis for {diagnosisResult.decline_code}</span>
                </span>
                <span className="text-[10px] font-mono text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  Domain: {diagnosisResult.category}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                {diagnosisResult.root_cause}
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Prescribed Action:</span>
                  <strong className="text-slate-200">{diagnosisResult.suggested_action}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Recommended Alternative Rail:</span>
                  <strong className="font-mono text-emerald-400">{diagnosisResult.alternative_rail_suggested || 'N/A (Card Only)'}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Smart Retry Engine Sandbox (5 cols) */}
        <div className="lg:col-span-5 bg-[#0e131f] p-5 rounded-2xl border border-white/5 shadow-xl h-fit space-y-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-amber-400 animate-spin-slow" />
            <h2 className="text-sm font-bold text-white">Smart Retry Engine Execution</h2>
          </div>
          <p className="text-[11px] text-slate-400">
            Computes dynamic retry delays and intelligent fallback rail swaps to maximize transaction recovery.
          </p>

          <form onSubmit={handleSmartRetry} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Target Failed Transaction ID</label>
              <input
                type="number"
                value={retryTxnId}
                onChange={(e) => setRetryTxnId(parseInt(e.target.value) || 1)}
                className="w-full bg-[#0a0d14] border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="p-3 bg-[#0a0d14] rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">Allow Smart Rail Swap</span>
                <span className="text-[10px] text-slate-500">Auto-switch to UPI or secondary gateway if issuer drops</span>
              </div>
              <input
                type="checkbox"
                checked={allowRailSwitch}
                onChange={(e) => setAllowRailSwitch(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={retrying}
              className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-600/25 transition-all mt-2 disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{retrying ? 'Calculating Retry Matrix...' : 'Run Smart Retry Optimization'}</span>
            </button>
          </form>

          {/* Retry Plan Output */}
          {retryResult && (
            <div className={`p-4 rounded-xl border ${
              retryResult.retry_eligible ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-rose-950/20 border-rose-500/40'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  {retryResult.retry_eligible ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                  <span>{retryResult.retry_eligible ? 'Retry Approved & Feasible' : 'Retry Aborted'}</span>
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  Win Prob: {(retryResult.recovery_probability * 100).toFixed(0)}%
                </span>
              </div>

              <div className="space-y-2 text-[11px] mt-3">
                <div className="flex justify-between text-slate-300">
                  <span>Backoff Window:</span>
                  <strong className="font-mono text-white">{retryResult.recommended_backoff_sec} seconds</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Target Fallback Rail:</span>
                  <strong className="font-mono text-cyan-400">{retryResult.alternative_rail || 'Default Acquirer'}</strong>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Execution Action Plan:</span>
                  <ul className="space-y-1">
                    {retryResult.action_plan?.map((step, sIdx) => (
                      <li key={sIdx} className="text-slate-300 flex items-start gap-1.5">
                        <span className="text-amber-400 text-xs mt-0.5">›</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
