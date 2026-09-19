import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert, TrendingUp, CheckCircle, AlertTriangle, ArrowUpRight,
  ShieldCheck, AlertCircle, RotateCcw, UserX, MessageSquareQuote, Store,
  Network, Sparkles, Bot, RefreshCw, Zap, HelpCircle, ArrowRight
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
  { name: 'Cardholder Action (OTP/Limits)', value: 48, color: '#f59e0b' },
  { name: 'Risk / Fraud Block', value: 20, color: '#dc2626' },
  { name: 'Bank Network Outage', value: 25, color: '#002E6E' },
  { name: 'Technical / Timeout', value: 7, color: '#00BAF2' },
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
      {/* Paytm Hero Banner */}
      <div className="bg-gradient-to-r from-[#002E6E] via-[#003B8D] to-[#005CE6] text-white p-6 rounded-2xl shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-white/15 text-[#00BAF2] border border-white/20 tracking-wider uppercase">
              Paytm AI Hackathon • Track 2
            </span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-300 font-bold bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-400/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Shield Active
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white hero-banner-title">
            Paytm FraudLens AI — Command Center
          </h1>
          <p className="text-xs md:text-sm text-blue-100/90 mt-1.5 max-w-2xl leading-relaxed">
            Real-time financial crime detection, automated UPI failure diagnostics, and intelligent chargeback recovery — making digital finance simpler, faster, and more human.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 flex-shrink-0">
          <Link
            to="/copilot"
            className="flex items-center gap-2 bg-[#00BAF2] hover:bg-[#00a4d6] text-[#002E6E] text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Bot className="w-4 h-4" />
            <span>Ask AI Copilot</span>
          </Link>
          <Link
            to="/payment-failures"
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-white/20 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-[#00BAF2]" />
            <span>Smart Retry Engine</span>
          </Link>
        </div>
      </div>

      {/* 4 Core KPI Stat Cards in Crisp White */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-[#00BAF2] transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>Fraud Prevented (YTD)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#002E6E] font-mono tracking-tight">₹14,250,000</div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1.5 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+18.4% prevented vs last month</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Interception before money leaves user accounts</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-[#00BAF2] transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>Dispute Revenue Recovered</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-[#00BAF2] flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#002E6E] font-mono tracking-tight">
            ₹{stats.recoveredRevenueInr.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-[#0077c8] font-semibold mt-1.5 flex items-center gap-1">
            <span>Win Rate: <strong>70.8%</strong> (Automated Evidence)</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Defends merchants from friendly fraud chargebacks</p>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-[#00BAF2] transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>Active Account Threats (ATO)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono tracking-tight">
            {stats.activeAtoThreats} Suspicious Logins
          </div>
          <div className="text-[11px] text-rose-700 font-semibold mt-1.5 flex items-center gap-1">
            <span>1 Impossible Travel, 1 Credential Reuse</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Accounts locked automatically to protect funds</p>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-[#00BAF2] transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>Merchant Portfolio Health</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#002E6E] font-mono tracking-tight">95.6% Safe</div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1.5 flex items-center gap-1">
            <span>2 Merchants on High-Risk Watchlist</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Monitored for chargeback ratio thresholds</p>
        </div>
      </div>

      {/* 10 Specialized Paytm AI Modules (Easy Navigation) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-[#002E6E] flex items-center gap-2">
              <span>Paytm FinTech Intelligence Modules</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F7FE] text-[#002E6E] border border-[#00BAF2]/30">
                10 Systems Ready
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Click any module to inspect real-time forensics, recovery actions, and explainable AI models
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { title: '1. Scam Prevention', path: '/scam-prevention', icon: ShieldCheck, desc: 'APP, digital arrest & Ponzi detection', bg: 'bg-emerald-50/70 hover:bg-emerald-50 border-emerald-200 text-emerald-900' },
            { title: '2. Failure Diagnosis', path: '/payment-failures', icon: AlertCircle, desc: 'UPI failure codes & Smart Retry', bg: 'bg-amber-50/70 hover:bg-amber-50 border-amber-200 text-amber-900' },
            { title: '3. Recovery & Disputes', path: '/payment-recovery', icon: RotateCcw, desc: 'Automated chargeback evidence', bg: 'bg-cyan-50/70 hover:bg-cyan-50 border-cyan-200 text-cyan-900' },
            { title: '4. Account Takeover', path: '/account-takeover', icon: UserX, desc: 'Impossible travel & session hijacking', bg: 'bg-rose-50/70 hover:bg-rose-50 border-rose-200 text-rose-900' },
            { title: '5. Complaint Intel', path: '/customer-complaints', icon: MessageSquareQuote, desc: 'Customer sentiment & regulatory risk', bg: 'bg-indigo-50/70 hover:bg-indigo-50 border-indigo-200 text-indigo-900' },
            { title: '6. Merchant Risk', path: '/merchant-health', icon: Store, desc: 'Chargeback thresholds & payout holds', bg: 'bg-blue-50/70 hover:bg-blue-50 border-blue-200 text-blue-900' },
            { title: '7. Network Graph', path: '/fraud-network', icon: Network, desc: 'Mule accounts & syndicate rings', bg: 'bg-violet-50/70 hover:bg-violet-50 border-violet-200 text-violet-900' },
            { title: '8. Explainable AI', path: '/explainable-ai', icon: Sparkles, desc: 'SHAP score breakdown & counterfactuals', bg: 'bg-fuchsia-50/70 hover:bg-fuchsia-50 border-fuchsia-200 text-fuchsia-900' },
            { title: '9. AI Copilot', path: '/copilot', icon: Bot, desc: 'Dual-mode Analyst & Care Agent', bg: 'bg-sky-50/70 hover:bg-sky-50 border-sky-200 text-sky-900' },
            { title: '10. Case & SAR Hub', path: '/investigations', icon: ShieldAlert, desc: 'FinCEN SAR filing & audit trail', bg: 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-900' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                to={item.path}
                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between group hover:scale-[1.02] shadow-xs ${item.bg}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 rounded-lg bg-white shadow-xs">
                    <Icon className="w-4 h-4 text-[#002E6E]" />
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#002E6E] transition-colors" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 truncate">{item.title}</h3>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{item.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Analytics Charts & Live Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Volume & Interceptions Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#002E6E]">Weekly Transaction Volume & Fraud Interception</h3>
              <p className="text-[11px] text-slate-500">Live comparison: Legitimate volume vs ML-blocked attack attempts</p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 font-semibold text-[#002E6E]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#002E6E]" /> Legitimate Flow
              </span>
              <span className="flex items-center gap-1 font-semibold text-rose-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Blocked Fraud
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="legitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#002E6E" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#002E6E" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="fraudGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Area type="monotone" dataKey="legit" stroke="#002E6E" fillOpacity={1} fill="url(#legitGrad)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="fraud" stroke="#dc2626" fillOpacity={1} fill="url(#fraudGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Decline Taxonomy Donut */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#002E6E] mb-1">Decline Code Diagnosis</h3>
            <p className="text-[11px] text-slate-500 mb-3">Root causes behind payment declines</p>

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
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-[11px]">
            {failureData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-medium">{item.name}</span>
                </span>
                <span className="font-mono font-bold text-slate-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
