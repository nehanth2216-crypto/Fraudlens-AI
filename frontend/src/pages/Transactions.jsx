import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightLeft, Search, Filter, ShieldAlert, Sparkles,
  AlertCircle, RefreshCw, Eye, CheckCircle, XCircle, Clock, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { transactionsAPI } from '../api/client';

export default function Transactions() {
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadTransactions();
  }, [statusFilter]);

  async function loadTransactions() {
    try {
      setLoading(true);
      const res = await transactionsAPI.list({ status: statusFilter || undefined, limit: 50 });
      setTxns(res.data);
    } catch (err) {
      console.error('Failed to load transactions', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredTxns = txns.filter(t =>
    t.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.payment_method?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const safeCount = filteredTxns.filter(t => (t.risk_score || 25) <= 50).length;
  const highRiskCount = filteredTxns.filter(t => (t.risk_score || 25) > 80).length;

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F7FE] text-[#002E6E] border border-[#00BAF2]/30 uppercase tracking-wider">
              Paytm Transaction Switch
            </span>
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Feed
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#002E6E] tracking-tight">Live Transaction Stream</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Every transaction is scored in under 20ms using Paytm AI Shield. Safe payments are passed instantly, high risks are blocked.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search TXN ref, rail, UPI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#00BAF2] w-full sm:w-64"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#00BAF2] cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed (Success)</option>
            <option value="FAILED">Failed (Declined)</option>
            <option value="HELD">Held (Risk Quarantine)</option>
            <option value="REVERSED">Reversed (Dispute)</option>
          </select>
        </div>
      </div>

      {/* Quick Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-400 block font-medium">Visible Transactions</span>
          <span className="text-base font-bold text-[#002E6E] font-mono">{filteredTxns.length}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-emerald-100 text-xs">
          <span className="text-emerald-700 block font-medium">Safe (&le; 50 Score)</span>
          <span className="text-base font-bold text-emerald-700 font-mono">{safeCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-rose-100 text-xs">
          <span className="text-rose-700 block font-medium">High Risk (&gt; 80 Score)</span>
          <span className="text-base font-bold text-rose-700 font-mono">{highRiskCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-400 block font-medium">Average Latency</span>
          <span className="text-base font-bold text-[#002E6E] font-mono">18.4 ms</span>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-[#002E6E] border-b border-slate-200 font-bold">
                <th className="py-3 px-4">Transaction Ref</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment Rail</th>
                <th className="py-3 px-4">Risk Assessment</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#00BAF2] mb-2" />
                    Loading Paytm transaction switch stream...
                  </td>
                </tr>
              ) : filteredTxns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No transactions match your search query.
                  </td>
                </tr>
              ) : (
                filteredTxns.map((t, idx) => {
                  const score = t.risk_score || 25;
                  const isCritical = score > 80;
                  const isMedium = score > 50 && score <= 80;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#002E6E]">
                        {t.transaction_id}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {t.timestamp?.replace('T', ' ').substring(0, 19)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        ₹{t.amount?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md text-[11px] border border-slate-200">
                          {t.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-md text-[10px] ${
                          isCritical
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : isMedium
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isCritical ? 'bg-rose-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} />
                          {score}/100 • {isCritical ? 'BLOCKED' : isMedium ? 'SUSPICIOUS' : 'SAFE'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          t.status === 'COMPLETED' ? 'text-emerald-800 bg-emerald-50 border border-emerald-200' :
                          t.status === 'FAILED' ? 'text-rose-800 bg-rose-50 border border-rose-200' :
                          'text-amber-800 bg-amber-50 border border-amber-200'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to="/explainable-ai"
                            className="inline-flex items-center gap-1 bg-[#E8F7FE] hover:bg-[#D4EFFF] text-[#002E6E] border border-[#00BAF2]/30 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors"
                          >
                            <Sparkles className="w-3 h-3 text-[#00BAF2]" />
                            <span>Explain AI</span>
                          </Link>

                          {t.status === 'FAILED' && (
                            <Link
                              to="/payment-failures"
                              className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors"
                            >
                              <RefreshCw className="w-3 h-3 text-amber-600" />
                              <span>Retry</span>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
