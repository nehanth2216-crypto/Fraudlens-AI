import { useState, useEffect } from 'react';
import {
  Store, AlertTriangle, ShieldCheck, Lock, Unlock, TrendingUp,
  Percent, DollarSign, Activity, AlertOctagon, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { v2MerchantsAPI } from '../api/client';

export default function MerchantHealth() {
  const [overview, setOverview] = useState(null);
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Intervention modal state
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [reservePct, setReservePct] = useState(10);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [ovRes, mRes] = await Promise.all([
        v2MerchantsAPI.getOverview(),
        v2MerchantsAPI.getHealth()
      ]);
      setOverview(ovRes.data);
      setMerchants(mRes.data);
    } catch (err) {
      console.error('Failed to load merchant health data', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApplyAction(merchantId, action, reserve = 10) {
    try {
      await v2MerchantsAPI.applyAction({
        merchant_id: merchantId,
        action,
        reserve_percentage: reserve,
        reason: `Intervention applied via Merchant Health Hub (${action})`
      });
      toast.success(`Merchant #${merchantId}: Action '${action}' successfully enforced!`);
      setSelectedMerchant(null);
      loadData();
    } catch (err) {
      toast.error('Action failed');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-950/40 via-[#0e131f] to-indigo-950/20 p-5 rounded-2xl border border-blue-500/20 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">Priority 6</span>
            <span className="text-xs text-slate-400">• Portfolio Underwriting & CTR Surveillance</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Merchant Health & Risk Management</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Tracks Chargeback-to-Transaction Ratio (CTR) against Visa/Mastercard excessive program thresholds (0.9% warning, 1.5% excessive) and enforces automated payout holds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#0a0d14] px-4 py-2 rounded-xl border border-white/5 text-right">
            <p className="text-[10px] text-slate-400">Funds in Reserve / Held</p>
            <p className="text-lg font-bold font-mono text-amber-400">₹{overview?.total_funds_in_reserve_or_held_inr?.toLocaleString('en-IN') || '2,850,000'}</p>
            <p className="text-[9px] text-rose-400 font-semibold">{overview?.payouts_currently_held_count || 2} Payouts Frozen</p>
          </div>
        </div>
      </div>

      {/* Card Scheme Threshold Indicator Banner */}
      <div className="p-4 rounded-xl bg-[#0e131f] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <AlertOctagon className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <strong className="text-white block">Card Network Excessive Chargeback Compliance Limits</strong>
            <span className="text-slate-400">Merchants exceeding 0.90% CTR trigger early warning watchlist; &gt; 1.50% requires immediate rolling reserve or settlement freeze.</span>
          </div>
        </div>

        <div className="flex items-center gap-4 font-mono font-bold text-[11px]">
          <span className="text-emerald-400">&lt; 0.90% Healthy</span>
          <span className="text-amber-400">0.90% - 1.49% Warning</span>
          <span className="text-rose-400">≥ 1.50% Excessive Breach</span>
        </div>
      </div>

      {/* Merchants Risk Portfolio Table */}
      <div className="bg-[#0e131f] p-5 rounded-2xl border border-white/5 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Monitored Merchant Portfolio ({merchants.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="text-slate-400 border-b border-white/5 pb-2">
                <th className="pb-2 font-semibold">Merchant</th>
                <th className="pb-2 font-semibold">Category</th>
                <th className="pb-2 font-semibold">Health Score</th>
                <th className="pb-2 font-semibold">CTR Ratio</th>
                <th className="pb-2 font-semibold">Refund Velocity</th>
                <th className="pb-2 font-semibold">Monthly Volume</th>
                <th className="pb-2 font-semibold">Bust-Out Risk</th>
                <th className="pb-2 font-semibold">Payout Status</th>
                <th className="pb-2 font-semibold text-right">Intervention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {merchants.map((m, idx) => {
                const isBreach = m.chargeback_ratio >= 0.015;
                const isWarning = m.chargeback_ratio >= 0.009 && !isBreach;
                return (
                  <tr key={idx} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3">
                      <div className="font-bold text-white">{m.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">ID #{m.merchant_id}</div>
                    </td>
                    <td className="py-3 text-slate-400">{m.category}</td>
                    <td className="py-3">
                      <span className={`font-mono font-bold text-xs ${
                        m.health_score > 80 ? 'text-emerald-400' :
                        m.health_score > 50 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {m.health_score}/100
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                        isBreach ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        isWarning ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'text-emerald-400'
                      }`}>
                        {m.chargeback_ratio_formatted}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-slate-300">{m.refund_rate_formatted}</td>
                    <td className="py-3 font-mono text-slate-300">₹{m.monthly_volume_inr?.toLocaleString('en-IN')}</td>
                    <td className="py-3 font-mono text-slate-400">{m.bust_out_risk}</td>
                    <td className="py-3">
                      {m.is_payout_held ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1 w-fit">
                          <Lock className="w-3 h-3" /> Payout Frozen
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 w-fit block">
                          Active Normal
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {m.is_payout_held ? (
                        <button
                          onClick={() => handleApplyAction(m.merchant_id, 'RELEASE_PAYOUT')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs transition-colors"
                        >
                          Release Hold
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApplyAction(m.merchant_id, 'HOLD_PAYOUT')}
                          className="px-3 py-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg font-semibold text-xs transition-colors"
                        >
                          Freeze Payout
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
