import { useState, useEffect } from 'react';
import {
  Sparkles, TrendingUp, TrendingDown, CheckCircle, AlertTriangle,
  Sliders, ArrowRight, Cpu, HelpCircle, RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import toast from 'react-hot-toast';
import { v2XaiAPI } from '../api/client';

export default function ExplainableAI() {
  const [txnId, setTxnId] = useState(1);
  const [xaiData, setXaiData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Counterfactual sliders state
  const [hypoAmount, setHypoAmount] = useState(15000);
  const [knownDevice, setKnownDevice] = useState(true);
  const [auth3DS, setAuth3DS] = useState(true);
  const [cfResult, setCfResult] = useState(null);
  const [simulatingCf, setSimulatingCf] = useState(false);

  useEffect(() => {
    loadAttribution(txnId);
  }, [txnId]);

  async function loadAttribution(id) {
    try {
      setLoading(true);
      const res = await v2XaiAPI.getAttribution(id);
      setXaiData(res.data);
      // Auto run initial counterfactual
      handleRunCounterfactual(res.data);
    } catch (err) {
      console.error('Failed to load XAI data', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRunCounterfactual(initial = null) {
    try {
      setSimulatingCf(true);
      const res = await v2XaiAPI.counterfactual({
        transaction_id: txnId,
        hypothetical_amount: hypoAmount,
        simulate_known_device: knownDevice,
        simulate_3ds_success: auth3DS
      });
      setCfResult(res.data);
    } catch (err) {
      console.error('Counterfactual simulation failed', err);
    } finally {
      setSimulatingCf(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-fuchsia-950/40 via-[#0e131f] to-pink-950/20 p-5 rounded-2xl border border-fuchsia-500/20 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-fuchsia-400 uppercase tracking-wider bg-fuchsia-500/10 px-2 py-0.5 rounded border border-fuchsia-500/20">Priority 8</span>
            <span className="text-xs text-slate-400">• Transparent Decision Attributions</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Explainable AI (XAI) & Counterfactuals</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Generates SHAP-style waterfall attribution values, plain-language decision rationales, and simulates counterfactual 'what-if' risk trajectories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#0a0d14] px-3 py-1.5 rounded-xl border border-white/5">
            <span className="text-xs text-slate-400">Transaction ID:</span>
            <input
              type="number"
              value={txnId}
              onChange={(e) => setTxnId(parseInt(e.target.value) || 1)}
              className="w-16 bg-white/5 border border-white/10 rounded px-2 py-0.5 text-xs text-white font-mono text-center"
            />
          </div>
        </div>
      </div>

      {/* Decision Summary Card */}
      {xaiData && (
        <div className="bg-[#0e131f] p-5 rounded-2xl border border-white/5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Executive Decision Rationale</span>
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {xaiData.decision} ({xaiData.final_risk_score}/100)
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {xaiData.executive_narrative}
            </p>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 text-center">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Model Confidence</span>
              <span className="text-xl font-bold font-mono text-emerald-400">{(xaiData.model_confidence * 100).toFixed(0)}%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Baseline Prior</span>
              <span className="text-xl font-bold font-mono text-slate-300">{xaiData.base_rate} pts</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Waterfall Chart & Counterfactual Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Waterfall Chart & Driver Badges (7 cols) */}
        <div className="lg:col-span-7 bg-[#0e131f] p-5 rounded-2xl border border-white/5 shadow-md space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-fuchsia-400" />
              <span>SHAP-Style Waterfall Feature Contributions</span>
            </h2>
            <p className="text-[11px] text-slate-400">Positive factors push risk score higher; negative factors reduce risk</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={xaiData?.waterfall_attributions || []} layout="vertical">
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="feature" type="category" stroke="#64748b" fontSize={10} width={130} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161b22', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                />
                <ReferenceLine x={0} stroke="#475569" />
                <Bar dataKey="delta">
                  {xaiData?.waterfall_attributions?.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.delta > 0 ? '#ef4444' : '#10b981'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Drivers Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5">
            <div className="space-y-2">
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Primary Risk Contributors (+)</span>
              </span>
              <div className="space-y-1.5">
                {xaiData?.top_positive_drivers?.map((d, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/20 text-[11px]">
                    <div className="flex justify-between font-bold text-white">
                      <span>{d.name}</span>
                      <span className="text-rose-400 font-mono">{d.impact}</span>
                    </div>
                    <p className="text-slate-400 text-[10px] mt-0.5">{d.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Protective Signals (-)</span>
              </span>
              <div className="space-y-1.5">
                {xaiData?.top_negative_drivers?.map((d, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-[11px]">
                    <div className="flex justify-between font-bold text-white">
                      <span>{d.name}</span>
                      <span className="text-emerald-400 font-mono">{d.impact}</span>
                    </div>
                    <p className="text-slate-400 text-[10px] mt-0.5">{d.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Counterfactual "What-If" Sandbox (5 cols) */}
        <div className="lg:col-span-5 bg-[#0e131f] p-5 rounded-2xl border border-white/5 shadow-xl h-fit space-y-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-pink-400" />
            <h2 className="text-sm font-bold text-white">Counterfactual Scenario Sandbox</h2>
          </div>
          <p className="text-[11px] text-slate-400">
            Adjust hypothetical factors to see what minimal interventions would flip the risk decision from DECLINE to APPROVE.
          </p>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Hypothetical Amount:</span>
                <span className="font-mono text-emerald-400 font-bold">₹{hypoAmount.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min={1000}
                max={50000}
                step={1000}
                value={hypoAmount}
                onChange={(e) => setHypoAmount(parseInt(e.target.value))}
                className="w-full accent-pink-500 cursor-pointer"
              />
            </div>

            <div className="p-3 bg-[#0a0d14] rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">Verified Known Device</span>
                <span className="text-[10px] text-slate-500">Originated from user's primary trusted mobile</span>
              </div>
              <input
                type="checkbox"
                checked={knownDevice}
                onChange={(e) => setKnownDevice(e.target.checked)}
                className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
              />
            </div>

            <div className="p-3 bg-[#0a0d14] rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">3DS 2.2 Biometric Success</span>
                <span className="text-[10px] text-slate-500">Issuer biometric frictionless match</span>
              </div>
              <input
                type="checkbox"
                checked={auth3DS}
                onChange={(e) => setAuth3DS(e.target.checked)}
                className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
              />
            </div>

            <button
              onClick={() => handleRunCounterfactual()}
              disabled={simulatingCf}
              className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-600/25 transition-all disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{simulatingCf ? 'Re-scoring Tree Ensembles...' : 'Re-Evaluate Counterfactual Trajectory'}</span>
            </button>
          </div>

          {/* Counterfactual Outcome */}
          {cfResult && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/30 to-teal-950/20 border border-emerald-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Simulated Counterfactual Verdict</span>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  {cfResult.simulated_decision} ({cfResult.simulated_risk_score}/100)
                </span>
              </div>

              <div className="text-[11px] text-slate-300 leading-relaxed bg-[#0a0d14] p-3 rounded-lg border border-white/5">
                {cfResult.counterfactual_verdict}
              </div>

              <div className="space-y-1 text-[10px]">
                <span className="text-slate-400 font-semibold block">Simulated Feature Deltas:</span>
                {cfResult.applied_adjustments?.map((adj, aIdx) => (
                  <div key={aIdx} className="text-emerald-300 flex items-center gap-1.5">
                    <span>✓</span>
                    <span>{adj}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
