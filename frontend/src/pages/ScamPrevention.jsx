import { useState, useEffect } from 'react';
import {
  ShieldCheck, AlertTriangle, Play, CheckCircle, ShieldAlert,
  Flame, PhoneCall, Zap, UserCheck, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { v2ScamAPI } from '../api/client';

export default function ScamPrevention() {
  const [intel, setIntel] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simulation state
  const [simForm, setSimForm] = useState({
    scam_type: 'ROMANCE_CONFIDENCE',
    victim_account_id: 1,
    amount: 45000,
    beneficiary_name: 'Investment Advisor John',
    urgency_trigger: 'IMMEDIATE_RELEASE',
    coercive_channel: 'WHATSAPP_CALL',
  });
  const [simResult, setSimResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    loadIntelligence();
  }, []);

  async function loadIntelligence() {
    try {
      setLoading(true);
      const res = await v2ScamAPI.getIntelligence();
      setIntel(res.data);
    } catch (err) {
      console.error('Failed to load scam intelligence', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSimulate(e) {
    e.preventDefault();
    try {
      setSimulating(true);
      const res = await v2ScamAPI.simulate(simForm);
      setSimResult(res.data);
      if (res.data.scam_detected) {
        toast.error(`Scam Pattern Intercepted! Risk: ${res.data.risk_score}/100`, { icon: '🚨' });
      } else {
        toast.success('Transaction cleared behavioral scam screening', { icon: '✅' });
      }
    } catch (err) {
      toast.error('Simulation execution failed');
    } finally {
      setSimulating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950/40 via-[#0e131f] to-teal-950/20 p-5 rounded-2xl border border-emerald-500/20 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Priority 1</span>
            <span className="text-xs text-slate-400">• Behavioral Scam Defense</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Fraud & Scam Prevention Hub</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Detects Authorized Push Payment (APP) scams, digital arrest impersonation, romance confidence fraud, and synthetic mule accounts before funds settle.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#0a0d14] px-4 py-2 rounded-xl border border-white/5 text-right">
            <p className="text-[10px] text-slate-400">Total Scam Loss Intercepted</p>
            <p className="text-lg font-bold font-mono text-emerald-400">₹14,250,000</p>
          </div>
        </div>
      </div>

      {/* Active Threat Advisories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {intel?.active_advisories?.map((adv, idx) => (
          <div key={idx} className="bg-[#0e131f] p-4 rounded-xl border border-rose-500/20 flex items-start gap-3 shadow-md">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 flex-shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xs font-bold text-white">{adv.title}</h3>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">{adv.severity}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{adv.recommended_delay}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Threat Profiles & Interactive Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scam Campaign Profiles (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Active Scam Modus Operandi & Typologies</span>
            <span className="text-[10px] text-slate-400">({intel?.scam_types?.length || 5} active)</span>
          </h2>

          <div className="space-y-3">
            {intel?.scam_types?.map((scam, idx) => (
              <div key={idx} className="bg-[#0e131f] p-4 rounded-xl border border-white/5 hover:border-white/15 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <h3 className="text-xs font-bold text-white">{scam.title}</h3>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    scam.current_threat_level === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {scam.current_threat_level}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 mb-3">{scam.description}</p>

                <div className="bg-[#0a0d14] p-2.5 rounded-lg border border-white/5 space-y-1 text-[11px]">
                  <div className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Behavioral Signatures</div>
                  {scam.indicators?.map((ind, iIdx) => (
                    <div key={iIdx} className="text-slate-300 flex items-center gap-1.5">
                      <span className="text-emerald-400 text-xs">›</span>
                      <span>{ind}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Coercion Vector: <strong className="text-slate-200">{scam.coercion_type}</strong></span>
                  <span>Avg Loss: <strong className="font-mono text-emerald-400">₹{scam.avg_loss?.toLocaleString('en-IN')}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Scam Simulator Sandbox (5 cols) */}
        <div className="lg:col-span-5 bg-[#0e131f] p-5 rounded-2xl border border-white/5 shadow-xl h-fit">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Live Scam Scenario Simulator</h2>
          </div>
          <p className="text-[11px] text-slate-400 mb-4">
            Stress-test the behavioral heuristics engine with simulated social engineering payloads.
          </p>

          <form onSubmit={handleSimulate} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Scam Typology</label>
              <select
                value={simForm.scam_type}
                onChange={(e) => setSimForm({ ...simForm, scam_type: e.target.value })}
                className="w-full bg-[#0a0d14] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="ROMANCE_CONFIDENCE">Romance & Confidence Scheme</option>
                <option value="AUTHORIZED_PUSH_PAYMENT">Authorized Push Payment (APP)</option>
                <option value="IMPERSONATION_OFFICIAL">Law Enforcement / Digital Arrest</option>
                <option value="INVESTMENT_PONZI">High-Yield Investment / Crypto</option>
                <option value="TECH_SUPPORT_TAKEOVER">Remote Screen Share / Tech Support</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Transfer Amount (INR)</label>
                <input
                  type="number"
                  value={simForm.amount}
                  onChange={(e) => setSimForm({ ...simForm, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#0a0d14] border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Victim Account ID</label>
                <input
                  type="number"
                  value={simForm.victim_account_id}
                  onChange={(e) => setSimForm({ ...simForm, victim_account_id: parseInt(e.target.value) || 1 })}
                  className="w-full bg-[#0a0d14] border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Psychological Urgency Trigger</label>
              <select
                value={simForm.urgency_trigger}
                onChange={(e) => setSimForm({ ...simForm, urgency_trigger: e.target.value })}
                className="w-full bg-[#0a0d14] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="IMMEDIATE_RELEASE">Immediate Release Required (Hospital / Fine)</option>
                <option value="POLICE_THREAT">Digital Arrest / Warrant Imminent</option>
                <option value="UNDER_DURESS">Coerced Voice Call in Progress</option>
                <option value="STANDARD">Standard Transfer (No Stated Urgency)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Coercive Communication Channel</label>
              <select
                value={simForm.coercive_channel}
                onChange={(e) => setSimForm({ ...simForm, coercive_channel: e.target.value })}
                className="w-full bg-[#0a0d14] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="WHATSAPP_CALL">WhatsApp Voice Call (Unknown International Code)</option>
                <option value="TELEGRAM_BOT">Telegram VIP Trading Bot</option>
                <option value="SCREEN_SHARE">AnyDesk / TeamViewer Active Screen Session</option>
                <option value="NORMAL_APP">Standard Mobile Banking App</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={simulating}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all mt-2 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{simulating ? 'Evaluating Signals...' : 'Run Real-Time Scam Evaluation'}</span>
            </button>
          </form>

          {/* Simulation Output Card */}
          {simResult && (
            <div className={`mt-5 p-4 rounded-xl border ${
              simResult.scam_detected ? 'bg-rose-950/30 border-rose-500/40' : 'bg-emerald-950/30 border-emerald-500/40'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {simResult.scam_detected ? (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  )}
                  <span className="text-xs font-bold text-white">{simResult.scam_title}</span>
                </div>
                <span className="font-mono text-xs font-bold text-white px-2 py-0.5 rounded bg-black/40">
                  Risk: {simResult.risk_score}/100
                </span>
              </div>

              <div className="space-y-1.5 text-[11px] mt-2">
                <div className="flex justify-between text-slate-300">
                  <span>Confidence:</span>
                  <strong className="font-mono text-white">{(simResult.confidence * 100).toFixed(0)}%</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Coercion Intensity:</span>
                  <strong className="text-amber-400">{simResult.coercion_level}</strong>
                </div>
                <div className="pt-2 border-t border-white/10">
                  <span className="text-slate-400 block mb-1">Recommended Automated Interception:</span>
                  <span className="font-bold text-xs text-rose-300 bg-rose-500/20 px-2 py-1 rounded block border border-rose-500/30">
                    {simResult.recommended_interception}
                  </span>
                </div>

                {simResult.behavioral_red_flags?.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Triggered Red Flags:</span>
                    <ul className="list-disc list-inside text-rose-300 text-[10px] mt-1 space-y-0.5">
                      {simResult.behavioral_red_flags.map((flag, fIdx) => (
                        <li key={fIdx}>{flag}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
