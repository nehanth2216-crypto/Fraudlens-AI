import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightLeft, Search, Filter, ShieldAlert, Sparkles,
  AlertCircle, RefreshCw, Eye, CheckCircle, XCircle, Clock
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0e131f] p-5 rounded-2xl border border-white/5 shadow-md">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Live Transaction Stream</h1>
          <p className="text-xs text-slate-400 mt-0.5">Real-time ledger with automated ML risk scoring and decline triage</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search transaction ID or rail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#0a0d14] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 w-64"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0a0d14] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="HELD">Held (Risk)</option>
            <option value="REVERSED">Reversed</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#0e131f] p-5 rounded-2xl border border-white/5 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="text-slate-400 border-b border-white/5 pb-2">
                <th className="pb-2 font-semibold">Transaction Ref</th>
                <th className="pb-2 font-semibold">Timestamp</th>
                <th className="pb-2 font-semibold">Amount</th>
                <th className="pb-2 font-semibold">Payment Rail</th>
                <th className="pb-2 font-semibold">Risk Score</th>
                <th className="pb-2 font-semibold">Status</th>
                <th className="pb-2 font-semibold text-right">Forensic Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTxns.map((t, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 font-mono font-bold text-white">{t.transaction_id}</td>
                  <td className="py-3 text-slate-400 font-mono">{t.timestamp?.replace('T', ' ').substring(0, 19)}</td>
                  <td className="py-3 font-mono text-white font-bold">₹{t.amount?.toLocaleString('en-IN')}</td>
                  <td className="py-3 font-mono text-slate-300">
                    <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">{t.payment_method}</span>
                  </td>
                  <td className="py-3">
                    <span className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                      (t.risk_score || 25) > 80 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      (t.risk_score || 25) > 50 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {t.risk_score || 25}/100
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.status === 'COMPLETED' ? 'text-emerald-400 bg-emerald-500/10' :
                      t.status === 'FAILED' ? 'text-rose-400 bg-rose-500/10' :
                      'text-amber-400 bg-amber-500/10'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/explainable-ai`}
                        className="flex items-center gap-1 bg-fuchsia-600/20 hover:bg-fuchsia-600/30 text-fuchsia-300 border border-fuchsia-500/30 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Explain AI</span>
                      </Link>

                      {t.status === 'FAILED' && (
                        <Link
                          to={`/payment-failures`}
                          className="flex items-center gap-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Smart Retry</span>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
