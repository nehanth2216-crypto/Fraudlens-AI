import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert, TrendingUp, CheckCircle, AlertTriangle, ArrowUpRight,
  ShieldCheck, AlertCircle, RotateCcw, UserX, MessageSquareQuote, Store,
  Network, Sparkles, Bot, RefreshCw, Zap
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { dashboardAPI, v2FailuresAPI, v2RecoveryAPI, v2AtoAPI } from '../api/client';

const trendData = [
  { day: 'Mon', legit: 4200, fraud: 38 },
  { day: 'Tue', legit: 5100, fraud: 45 },
  { day: 'Wed', legit: 4800, fraud: 32 },
  { day: 'Thu', legit: 6200, fraud: 61 },
  { day: 'Fri', legit: 7400, fraud: 89 },
  { day: 'Sat', legit: 8900, fraud: 104 },
  { day: 'Sun', legit: 6800, fraud: 52 },
];

const failureData = [
  { name: 'Cardholder Action', value: 48, color: '#f59e0b' },
  { name: 'Risk / Fraud Block', value: 20, color: '#ef4444' },
  { name: 'Network Outage', value: 25, color: '#3b82f6' },
  { name: 'Integration Error', value: 7, color: '#8b5cf6' },
];

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalTransactions: 1200,
    fraudPreventedInr: 14250000,
    recoveredRevenueInr: 3480000,
    activeAtoThreats: 2,
    monitoredMerchants: 45,
    criticalAlertsCount: 7
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [dashRes, failRes, recRes] = await Promise.allSettled([
          dashboardAPI.overview(),
          v2FailuresAPI.getAnalytics(),
          v2RecoveryAPI.getStats()
        ]);
        if (recRes.status === 'fulfilled' && recRes.value.data) {
          setStats(prev => ({
            ...prev,
            recoveredRevenueInr: recRes.value.data.total_recovered_amount_inr || prev.recoveredRevenueInr
          }));
        }
      } catch (err) {
        console.error("Dashboard overview load error", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-950/40 via-[#0e131f] to-indigo-950/30 p-5 rounded-2xl border border-blue-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">Enterprise Operations</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">FraudLens AI V2 — Command Center</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Real-time financial crime detection, payment decline diagnostics, automated chargeback recovery, and syndicate network surveillance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/copilot"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-blue-500/25 transition-all"
          >
            <Bot className="w-4 h-4" />
            <span>AI Copilot</span>
          </Link>
          <Link
            to="/payment-failures"
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl border border-white/10 transition-all"
          >
            <RefreshCw className="w-4 h-4 text-blue-400" />
            <span>Smart Retry Engine</span>
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0e131f] p-4 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Fraud Prevented (YTD)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">₹14,250,000</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>+18.4% vs last month</span>
          </div>
        </div>

        <div className="bg-[#0e131f] p-4 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Dispute Revenue Recovered</span>
            <RotateCcw className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">₹{stats.recoveredRevenueInr.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-cyan-400 mt-1 flex items-center gap-1">
            <span>Win Rate: <strong>70.8%</strong> (Compelling Evidence 3.0)</span>
          </div>
        </div>

        <div className="bg-[#0e131f] p-4 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Active ATO Compromises</span>
            <UserX className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-400 font-mono">{stats.activeAtoThreats} Alerts Active</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>1 Impossible Travel, 1 Credential Stuffing</span>
          </div>
        </div>

        <div className="bg-[#0e131f] p-4 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Merchant Portfolio Health</span>
            <Store className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">95.6% Compliant</div>
          <div className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
            <span>2 Merchants Exceed 0.9% CTR Limit</span>
          </div>
        </div>
      </div>

      {/* 10 Priority Fast-Access Hub */}
      <div className="bg-[#0e131f] p-5 rounded-2xl border border-white/5 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white">V2 Mission-Critical Priorities</h2>
            <p className="text-[11px] text-slate-400">Jump directly to specialized intelligence centers</p>
          </div>
          <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">10 Modules Online</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { title: '1. Scam Prevention', path: '/scam-prevention', icon: ShieldCheck, desc: 'APP, romance & Ponzi schemes', color: 'from-emerald-600/20 to-teal-900/10' },
            { title: '2. Failure Diagnosis', path: '/payment-failures', icon: AlertCircle, desc: 'Decline codes & Smart Retry', color: 'from-amber-600/20 to-yellow-900/10' },
            { title: '3. Recovery & Disputes', path: '/payment-recovery', icon: RotateCcw, desc: 'Chargeback representment', color: 'from-cyan-600/20 to-blue-900/10' },
            { title: '4. Account Takeover', path: '/account-takeover', icon: UserX, desc: 'Impossible travel & credential stuffing', color: 'from-rose-600/20 to-red-900/10' },
            { title: '5. Complaint Intel', path: '/customer-complaints', icon: MessageSquareQuote, desc: 'Sentiment & CFPB/Reg E risk', color: 'from-purple-600/20 to-indigo-900/10' },
            { title: '6. Merchant Risk', path: '/merchant-health', icon: Store, desc: 'CTR thresholds & payout holds', color: 'from-blue-600/20 to-cyan-900/10' },
            { title: '7. Network Graph', path: '/fraud-network', icon: Network, desc: 'Syndicates & mule rings', color: 'from-violet-600/20 to-purple-900/10' },
            { title: '8. Explainable AI', path: '/explainable-ai', icon: Sparkles, desc: 'SHAP waterfall & counterfactuals', color: 'from-fuchsia-600/20 to-pink-900/10' },
            { title: '9. AI Copilot', path: '/copilot', icon: Bot, desc: 'Analyst & Support dual-agent', color: 'from-indigo-600/20 to-blue-900/10' },
            { title: '10. Case & SAR Hub', path: '/investigations', icon: ShieldAlert, desc: 'Evidence & FinCEN compliance', color: 'from-red-600/20 to-rose-900/10' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                to={item.path}
                className={`p-3 rounded-xl bg-gradient-to-br ${item.color} border border-white/5 hover:border-white/20 transition-all flex flex-col justify-between group hover:scale-[1.02] shadow-sm`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-4 h-4 text-slate-200 group-hover:text-blue-400 transition-colors" />
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white truncate">{item.title}</h3>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Analytics Charts & Live Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Volume & Interceptions Chart */}
        <div className="lg:col-span-2 bg-[#0e131f] p-5 rounded-2xl border border-white/5 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Weekly Interception & Throughput Velocity</h3>
              <p className="text-[11px] text-slate-400">Legitimate transaction flow vs ML-intercepted fraud attempts</p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-blue-400"><span className="w-2 h-2 rounded-full bg-blue-500" /> Legitimate</span>
              <span className="flex items-center gap-1 text-rose-400"><span className="w-2 h-2 rounded-full bg-rose-500" /> Flagged Fraud</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="legitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="fraudGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161b22', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="legit" stroke="#3b82f6" fillOpacity={1} fill="url(#legitGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="fraud" stroke="#ef4444" fillOpacity={1} fill="url(#fraudGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Decline Taxonomy Donut */}
        <div className="bg-[#0e131f] p-5 rounded-2xl border border-white/5 shadow-md flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Decline Code Taxonomy</h3>
            <p className="text-[11px] text-slate-400 mb-3">Root cause failure distribution</p>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={failureData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {failureData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#161b22', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-white/5 text-[11px]">
            {failureData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-mono font-semibold">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
