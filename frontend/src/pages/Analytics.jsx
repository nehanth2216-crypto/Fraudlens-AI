import { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, DollarSign, ShieldCheck, MapPin,
  Calendar, Layers, PieChart as PieIcon
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { analyticsAPI } from '../api/client';

const monthlyTrends = [
  { month: 'Apr', volume: 18.2, fraud: 0.42 },
  { month: 'May', volume: 21.5, fraud: 0.38 },
  { month: 'Jun', volume: 24.8, fraud: 0.51 },
  { month: 'Jul', volume: 29.1, fraud: 0.44 },
  { month: 'Aug', volume: 34.0, fraud: 0.39 },
  { month: 'Sep', volume: 38.5, fraud: 0.32 },
];

const railDistribution = [
  { name: 'UPI', volume: 48, color: '#3b82f6' },
  { name: 'Credit / Debit Card', volume: 32, color: '#8b5cf6' },
  { name: 'NetBanking', volume: 12, color: '#10b981' },
  { name: 'Wallet / Prepaid', volume: 8, color: '#f59e0b' },
];

export default function Analytics() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0e131f] p-5 rounded-2xl border border-white/5 shadow-md">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Portfolio Analytics & Fraud Intelligence</h1>
          <p className="text-xs text-slate-400 mt-0.5">Macro financial trends, payment rail distribution, and risk mitigation metrics</p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-300 font-mono">
          <span>Overall Platform Fraud Rate: <strong className="text-emerald-400 font-bold">0.32%</strong></span>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Volume & Fraud Rate */}
        <div className="bg-[#0e131f] p-5 rounded-2xl border border-white/5 shadow-md space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white">Monthly Transaction Volume vs Fraud Rate</h2>
            <p className="text-[11px] text-slate-400">Total authorized volume (₹ Crores) vs fraud loss percentage</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#161b22', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="volume" stroke="#3b82f6" fillOpacity={1} fill="url(#volGrad)" strokeWidth={2} name="Volume (₹ Cr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Rail Share */}
        <div className="bg-[#0e131f] p-5 rounded-2xl border border-white/5 shadow-md space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white">Payment Method & Rail Distribution</h2>
            <p className="text-[11px] text-slate-400">Throughput share by payment instrument</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={railDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="volume">
                  {railDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#161b22', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-white/5">
            {railDistribution.map((r, idx) => (
              <div key={idx} className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                  {r.name}
                </span>
                <span className="font-mono font-bold text-white">{r.volume}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
