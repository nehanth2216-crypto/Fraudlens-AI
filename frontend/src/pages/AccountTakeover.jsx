import { useState, useEffect } from 'react';
import {
  UserX, ShieldAlert, Zap, Globe, KeyRound, Smartphone,
  CheckCircle, Play, AlertTriangle, Shield, Clock, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { v2AtoAPI } from '../api/client';

export default function AccountTakeover() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Live evaluation sandbox state
  const [evalForm, setEvalForm] = useState({
    account_id: 102,
    current_ip: '185.220.101.5',
    device_fingerprint: 'fp_headless_curl_linux',
    failed_attempts_in_5min: 6,
  });
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const res = await v2AtoAPI.getEvents();
      setEvents(res.data);
    } catch (err) {
      console.error('Failed to load ATO events', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemediate(eventId, action) {
    try {
      await v2AtoAPI.remediate({ event_id: eventId, action });
      toast.success(`Action '${action}' applied to Event #${eventId}!`, { icon: '🛡️' });
      loadData();
    } catch (err) {
      toast.error('Remediation action failed');
    }
  }

  async function handleEvaluate(e) {
    e.preventDefault();
    try {
      setEvaluating(true);
      const res = await v2AtoAPI.evaluateSession(evalForm);
      toast.error(`High-Risk ATO Event Triggered! Risk: ${res.data.risk_score}/100`, { icon: '🚨' });
      loadData();
    } catch (err) {
      toast.error('Evaluation failed');
    } finally {
      setEvaluating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-rose-950/40 via-[#0e131f] to-red-950/20 p-5 rounded-2xl border border-rose-500/20 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">Priority 4</span>
            <span className="text-xs text-slate-400">• Identity & Session Defense</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Account Takeover (ATO) Command Center</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Detects credential stuffing botnets, impossible travel geo-velocity spikes, SIM swap MFA fatigue, and executes automated session killswitches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#0a0d14] px-4 py-2 rounded-xl border border-white/5 text-right">
            <p className="text-[10px] text-slate-400">Active ATO Threats Today</p>
            <p className="text-lg font-bold font-mono text-rose-400">{events.length || 3} Detected</p>
            <p className="text-[9px] text-emerald-400">Automated Killswitches Armed</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Active ATO Stream & Live Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Detected ATO Events (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Real-Time Detected ATO Incidents</span>
              <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">LIVE FEED</span>
            </h2>
          </div>

          <div className="space-y-3">
            {events.map((ev, idx) => (
              <div key={idx} className="bg-[#0e131f] p-4 rounded-xl border border-white/5 hover:border-rose-500/30 transition-all space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-xs font-bold text-white font-mono">Account #{ev.account_id}</span>
                    <span className="text-[10px] text-slate-400">• Trigger: <strong>{ev.trigger_type}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                      ev.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {ev.severity}
                    </span>
                    <span className="text-xs font-mono font-bold text-rose-400">
                      Score: {ev.risk_score}/100
                    </span>
                  </div>
                </div>

                {/* Details Section */}
                <div className="bg-[#0a0d14] p-3 rounded-lg border border-white/5 text-[11px] space-y-1.5">
                  {ev.trigger_type === 'IMPOSSIBLE_TRAVEL' && ev.details?.geo_velocity && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                        <Globe className="w-3.5 h-3.5" />
                        <span>Impossible Travel: {ev.details.geo_velocity.origin_location} ➔ {ev.details.geo_velocity.destination_location}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1">
                        <div>Distance: <strong className="text-slate-200">{ev.details.geo_velocity.distance_km} km</strong></div>
                        <div>Time Elapsed: <strong className="text-slate-200">{ev.details.geo_velocity.time_delta_mins} mins</strong></div>
                        <div>Calculated Speed: <strong className="text-rose-400 font-mono font-bold">{ev.details.geo_velocity.calculated_speed_kmh} km/h</strong></div>
                        <div>Flight Limit: <strong className="text-slate-300">850 km/h</strong></div>
                      </div>
                    </div>
                  )}

                  {ev.trigger_type === 'CREDENTIAL_STUFFING' && (
                    <div className="space-y-0.5">
                      <div className="text-amber-300 font-semibold flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Credential Stuffing Velocity Spike</span>
                      </div>
                      <p className="text-slate-400 text-[10px]">{ev.details?.credential_stuffing_alert || `${ev.details?.failed_attempts} failed attempts from rotating proxy subnets`}</p>
                    </div>
                  )}

                  {ev.trigger_type === 'SIM_SWAP_MFA_FATIGUE' && (
                    <div className="space-y-0.5">
                      <div className="text-rose-300 font-semibold flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Carrier IMSI / SIM Swap Alert</span>
                      </div>
                      <p className="text-slate-400 text-[10px]">Carrier change reported followed by immediate OTP fatigue requests</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-white/5 text-[10px] text-slate-500">
                    <span>Action Status: <strong className="text-slate-300">{ev.action_taken}</strong></span>
                    <span>Mitigated: <strong className={ev.is_mitigated ? "text-emerald-400" : "text-rose-400"}>{ev.is_mitigated ? "YES" : "PENDING ACTION"}</strong></span>
                  </div>
                </div>

                {/* Remediation Killswitch Buttons */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleRemediate(ev.id, 'STEP_UP_MFA')}
                    className="px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold rounded-lg border border-white/10 transition-colors"
                  >
                    Force Step-Up MFA
                  </button>
                  <button
                    onClick={() => handleRemediate(ev.id, 'TERMINATE_SESSION')}
                    className="px-3 py-1 bg-amber-600/80 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                  >
                    Kill Session Tokens
                  </button>
                  <button
                    onClick={() => handleRemediate(ev.id, 'FREEZE_ACCOUNT')}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                  >
                    Freeze Account
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live ATO Evaluation Sandbox (5 cols) */}
        <div className="lg:col-span-5 bg-[#0e131f] p-5 rounded-2xl border border-white/5 shadow-xl h-fit space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-bold text-white">Live Session Risk Evaluator</h2>
          </div>
          <p className="text-[11px] text-slate-400">
            Inject synthetic session coordinates, IP hops, and brute-force counts to trigger defensive countermeasures.
          </p>

          <form onSubmit={handleEvaluate} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Target Account ID</label>
              <input
                type="number"
                value={evalForm.account_id}
                onChange={(e) => setEvalForm({ ...evalForm, account_id: parseInt(e.target.value) || 1 })}
                className="w-full bg-[#0a0d14] border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Session Ingress IP</label>
              <input
                type="text"
                value={evalForm.current_ip}
                onChange={(e) => setEvalForm({ ...evalForm, current_ip: e.target.value })}
                className="w-full bg-[#0a0d14] border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Simulates Frankfurt Tor Exit Node (6,500 km from Mumbai)</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Device Fingerprint Hash</label>
              <input
                type="text"
                value={evalForm.device_fingerprint}
                onChange={(e) => setEvalForm({ ...evalForm, device_fingerprint: e.target.value })}
                className="w-full bg-[#0a0d14] border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Failed Auth Attempts (Last 5 mins)</label>
              <input
                type="number"
                value={evalForm.failed_attempts_in_5min}
                onChange={(e) => setEvalForm({ ...evalForm, failed_attempts_in_5min: parseInt(e.target.value) || 0 })}
                className="w-full bg-[#0a0d14] border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
              />
            </div>

            <button
              type="submit"
              disabled={evaluating}
              className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25 transition-all mt-2 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{evaluating ? 'Analyzing Geovelocity...' : 'Evaluate Session & Trigger Killswitch'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
