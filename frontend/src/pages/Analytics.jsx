import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldAlert, AlertTriangle, TrendingUp, DollarSign, Activity,
  CheckCircle2, ArrowUpRight, Filter, RefreshCw, ExternalLink,
  MapPin, CreditCard, ChevronRight, Layers, PieChart as PieIcon,
  HelpCircle, Eye
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';
import { analyticsAPI, fraudAPI } from '../api/client';
import toast from 'react-hot-toast';

const RISK_COLORS = {
  LOW: '#10b981',       // Emerald
  MEDIUM: '#f59e0b',    // Amber
  HIGH: '#f97316',      // Orange
  CRITICAL: '#ef4444',  // Red
};

export default function Analytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [riskDist, setRiskDist] = useState([]);
  const [locations, setLocations] = useState([]);
  const [highRiskTxns, setHighRiskTxns] = useState([]);

  // Timeframe filter state
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchAnalyticsData();
  }, [days]);

  async function fetchAnalyticsData() {
    try {
      if (!overview) setLoading(true);
      else setRefreshing(true);

      const [ovRes, trRes, pmRes, rdRes, locRes, hrRes] = await Promise.all([
        analyticsAPI.overview(),
        analyticsAPI.fraudTrends(days),
        analyticsAPI.paymentMethods(),
        analyticsAPI.riskDistribution(),
        analyticsAPI.locations(),
        fraudAPI.highRisk(),
      ]);

      setOverview(ovRes.data || {});
      setTrends(trRes.data || []);
      setPaymentMethods(pmRes.data || []);
      setRiskDist(rdRes.data || []);
      setLocations((locRes.data || []).slice(0, 5));
      setHighRiskTxns((hrRes.data || []).slice(0, 6));
    } catch (err) {
      console.error('Failed to load analytics data', err);
      toast.error('Unable to fetch live analytics telemetry');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Format currency in Indian format (Lakhs / Crores)
  const formatINR = (val) => {
    if (!val && val !== 0) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${Number(val).toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
        <p className="text-sm font-mono text-slate-400">Loading live fraud analytics telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Investigation Mission Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#0e131f] p-5 rounded-2xl border border-white/5 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Fraud Intelligence & Portfolio Analytics</h1>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              PAYTM FINTECH RADAR
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time loss quantification, UPI & payment rail exposure, and priority investigation triaging
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-[#161d2d] rounded-lg p-1 border border-white/5 text-xs">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1 rounded-md transition-all font-medium ${
                  days === d
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {d}D
              </button>
            ))}
          </div>

          <button
            onClick={fetchAnalyticsData}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs border border-white/5 transition-colors"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Core KPI Cards (Directly answering Questions 1, 2, 3, 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Analyzed */}
        <div className="bg-[#0e131f] p-5 rounded-2xl border border-white/5 shadow-md relative overflow-hidden group hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Analyzed</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono">
              {(overview?.total_transactions || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>Throughput:</span>
              <strong className="text-slate-300 font-mono">{formatINR(overview?.amount_processed)}</strong>
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-cyan-500 opacity-60" />
        </div>

        {/* Card 2: Flagged Suspicious */}
        <div className="bg-[#0e131f] p-5 rounded-2xl border border-white/5 shadow-md relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Flagged Suspicious</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-400 font-mono">
              {(overview?.fraud_detected || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>High Risk:</span>
              <strong className="text-amber-300 font-mono">{overview?.high_risk_transactions || 0}</strong>
              <span className="text-slate-500">|</span>
              <span>Critical:</span>
              <strong className="text-rose-400 font-mono">{overview?.critical_alerts || 0}</strong>
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 opacity-60" />
        </div>

        {/* Card 3: Fraud / Attack Rate */}
        <div className="bg-[#0e131f] p-5 rounded-2xl border border-white/5 shadow-md relative overflow-hidden group hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Fraud Detection Rate</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-400 font-mono">
              {overview?.fraud_detection_rate || 0}%
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>Open investigations:</span>
              <strong className="text-blue-400 font-mono">{overview?.open_investigations || 0} cases</strong>
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-600 to-pink-500 opacity-60" />
        </div>

        {/* Card 4: Amount at Risk */}
        <div className="bg-[#0e131f] p-5 rounded-2xl border border-white/5 shadow-md relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Capital at Risk</span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-red-400 font-mono">
              {formatINR(overview?.amount_at_risk)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-semibold">Protected:</span>
              <span className="text-slate-300 font-mono">
                {formatINR((overview?.amount_processed || 0) - (overview?.amount_at_risk || 0))}
              </span>
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-rose-400 opacity-60" />
        </div>
      </div>

      {/* 3. Middle Section: Two Core Investigative Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart A: Fraud vs Legitimate Transaction Volume */}
        <div className="bg-[#0e131f] p-5 rounded-2xl border border-white/5 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Transaction Volume: Legitimate vs Suspicious</span>
              </h2>
              <p className="text-[11px] text-slate-400">Daily transaction volume with high-risk anomaly overlay</p>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">
              Last {days} Days
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={10}
                  tickFormatter={(v) => v ? v.slice(5) : ''}
                />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                  formatter={(val, name) => [val, name === 'total' ? 'Total Volume' : 'Suspicious Flagged']}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
                />
                <Bar dataKey="total" name="Legitimate" fill="#3b82f6" stackId="a" radius={[0, 0, 2, 2]} />
                <Bar dataKey="fraudulent" name="Suspicious" fill="#ef4444" stackId="a" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: Fraud Rate Velocity (%) Trend */}
        <div className="bg-[#0e131f] p-5 rounded-2xl border border-white/5 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Fraud Rate Velocity & Attack Trend</span>
              </h2>
              <p className="text-[11px] text-slate-400">Percentage of transactions flagged daily by ML & rule engines</p>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              SLA Target: &lt;1.5%
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fraudRateGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={10}
                  tickFormatter={(v) => v ? v.slice(5) : ''}
                />
                <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                  formatter={(val) => [`${val}%`, 'Daily Fraud Rate']}
                />
                <Area
                  type="monotone"
                  dataKey="fraud_rate"
                  name="Fraud Rate %"
                  stroke="#ef4444"
                  fill="url(#fraudRateGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Bottom Grid: Fraud Pattern Intelligence (Answering Questions 5 & 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Fraud by Payment Rail / Type */}
        <div className="bg-[#0e131f] p-5 rounded-2xl border border-white/5 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-blue-400" />
              <span>Fraud by Payment Rail</span>
            </h2>
            <span className="text-[10px] text-slate-500 uppercase font-mono">Attack Rate</span>
          </div>
          <p className="text-[11px] text-slate-400">Vulnerability breakdown across FinTech payment instruments</p>

          <div className="space-y-3 pt-2">
            {paymentMethods.map((pm, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{pm.payment_method}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono text-[11px]">
                      {pm.fraudulent} / {pm.total} txns
                    </span>
                    <span className={`font-mono font-bold text-[11px] ${
                      pm.fraud_rate > 10 ? 'text-rose-400' : 'text-amber-400'
                    }`}>
                      {pm.fraud_rate}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-[#161d2d] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      pm.fraud_rate > 10 ? 'bg-rose-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(pm.fraud_rate * 4, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Risk Level Distribution */}
        <div className="bg-[#0e131f] p-5 rounded-2xl border border-white/5 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Portfolio Risk Distribution</span>
            </h2>
            <span className="text-[10px] text-slate-500 uppercase font-mono">Triage Tiers</span>
          </div>
          <p className="text-[11px] text-slate-400">Classified transactions across 4 automated risk bands</p>

          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="risk_level"
                >
                  {riskDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.risk_level] || '#3b82f6'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                  formatter={(val, name) => [`${val} transactions`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-white/5">
            {riskDist.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: RISK_COLORS[item.risk_level] || '#3b82f6' }}
                  />
                  {item.risk_level}
                </span>
                <span className="font-mono font-bold text-white">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Top Geographic Attack Clusters */}
        <div className="bg-[#0e131f] p-5 rounded-2xl border border-white/5 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Top Geographic Risk Nodes</span>
            </h2>
            <span className="text-[10px] text-slate-500 uppercase font-mono">Geo Clusters</span>
          </div>
          <p className="text-[11px] text-slate-400">High-throughput cities with concentrated alert activity</p>

          <div className="space-y-2.5 pt-2">
            {locations.map((loc, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-[#141b2a] border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-[10px] font-mono font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-medium text-slate-200">{loc.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-300">{loc.count}</span>
                  <span className="text-[10px] text-slate-500">txns</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Top Suspicious Transactions → Actionable Investigation Table (Answering Question 7) */}
      <div className="bg-[#0e131f] rounded-2xl border border-white/5 shadow-md overflow-hidden">
        <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">Priority Transactions Requiring Investigation</h2>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono">
                ACTION REQUIRED
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live transactions flagged by the ML Risk Engine exceeding critical risk thresholds
            </p>
          </div>

          <Link
            to="/investigations"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs border border-blue-500/30 transition-colors font-medium self-start sm:self-auto"
          >
            <span>Open Investigation Hub</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-[#121826] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment Rail</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Triage Level</th>
                <th className="py-3 px-4">System Decision</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {highRiskTxns.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-500">
                    No critical risk transactions pending triage.
                  </td>
                </tr>
              ) : (
                highRiskTxns.map((txn) => (
                  <tr key={txn.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">
                      {txn.transaction_id}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      ₹{Number(txn.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-slate-300">
                        {txn.payment_method || 'UPI'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {txn.timestamp ? new Date(txn.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-rose-400">
                          {txn.risk_score}/100
                        </span>
                        <div className="w-12 h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-500 rounded-full"
                            style={{ width: `${txn.risk_score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        txn.risk_level === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      }`}>
                        {txn.risk_level}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {txn.decision || 'REVIEW'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to="/investigations"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 group-hover:underline"
                      >
                        <span>Investigate</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
