import { useState, useEffect } from 'react';
import {
  MessageSquareQuote, Scale, AlertTriangle, CheckCircle, Send,
  TrendingDown, ShieldAlert, Sparkles, Filter, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { v2ComplaintsAPI } from '../api/client';

export default function CustomerComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Live text analyzer state
  const [sampleText, setSampleText] = useState(
    "I was charged ₹75,000 without authorization via UPI. Your support told me to wait 7 days. This is a direct violation of Reg E and I am filing a formal complaint with the CFPB and Ombudsman immediately."
  );
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadComplaints();
  }, []);

  async function loadComplaints() {
    try {
      setLoading(true);
      const res = await v2ComplaintsAPI.getList();
      setComplaints(res.data);
    } catch (err) {
      console.error('Failed to load complaints', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze() {
    try {
      setAnalyzing(true);
      const res = await v2ComplaintsAPI.analyzeText(sampleText);
      setAnalysisResult(res.data);
      toast.success('NLP sentiment & regulatory exposure analyzed!');
    } catch (err) {
      toast.error('Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleEscalate(id) {
    try {
      await v2ComplaintsAPI.escalate(id);
      toast.success(`Complaint #${id} escalated to Executive Regulatory Compliance Desk!`);
      loadComplaints();
    } catch (err) {
      toast.error('Escalation failed');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-purple-950/40 via-[#0e131f] to-indigo-950/20 p-5 rounded-2xl border border-purple-500/20 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">Priority 5</span>
            <span className="text-xs text-slate-400">• Regulatory & Sentiment Intelligence</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Customer Complaint Intelligence Hub</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Performs real-time sentiment scoring, catches high-exposure regulatory keywords (CFPB, EFTA Reg E, Banking Ombudsman), and auto-generates resolution scripts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#0a0d14] px-4 py-2 rounded-xl border border-white/5 text-right">
            <p className="text-[10px] text-slate-400">Regulatory Escalation SLA</p>
            <p className="text-lg font-bold font-mono text-purple-400">&lt; 4 Hours</p>
            <p className="text-[9px] text-emerald-400">100% On-Time Compliance</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Complaints Stream & Real-Time NLP Analyzer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Complaints Stream (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Customer Disputes & Grievance Stream</span>
              <span className="text-[10px] text-slate-400 font-mono">({complaints.length} incoming)</span>
            </h2>
          </div>

          <div className="space-y-3">
            {complaints.map((c, idx) => (
              <div key={idx} className="bg-[#0e131f] p-4 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all space-y-2.5 shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-purple-400">{c.complaint_id}</span>
                      <span className="text-xs font-bold text-white">{c.customer_name}</span>
                      <span className="text-[10px] text-slate-400">via {c.channel}</span>
                    </div>
                    <h3 className="text-xs font-semibold text-slate-200">{c.subject}</h3>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {c.regulatory_flag && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
                        <Scale className="w-3 h-3" /> REGULATORY RISK
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      c.urgency === 'REGULATORY_ESCALATION' ? 'bg-purple-500/20 text-purple-300' :
                      c.urgency === 'HIGH' ? 'bg-rose-500/20 text-rose-300' :
                      'bg-amber-500/20 text-amber-300'
                    }`}>
                      {c.urgency?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed bg-[#0a0d14] p-3 rounded-lg border border-white/5">
                  "{c.body}"
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <div className="flex items-center gap-3">
                    <span>Sentiment: <strong className={c.sentiment_score < -0.5 ? "text-rose-400" : "text-amber-400"}>{c.sentiment_score}</strong></span>
                    <span>Category: <strong className="text-slate-300">{c.category?.replace(/_/g, ' ')}</strong></span>
                  </div>

                  {c.status !== 'ESCALATED' ? (
                    <button
                      onClick={() => handleEscalate(c.id)}
                      className="text-xs font-semibold text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1 rounded-lg border border-purple-500/20 transition-colors"
                    >
                      Escalate to Legal
                    </button>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Escalated to Compliance Desk
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-Time NLP Complaint Analyzer (5 cols) */}
        <div className="lg:col-span-5 bg-[#0e131f] p-5 rounded-2xl border border-white/5 shadow-xl h-fit space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white">Live Complaint NLP & Regulatory Analyzer</h2>
          </div>
          <p className="text-[11px] text-slate-400">
            Paste any customer email, chatbot transcript, or regulator letter to score sentiment and extract immediate resolution steps.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Customer Grievance Text</label>
              <textarea
                rows={4}
                value={sampleText}
                onChange={(e) => setSampleText(e.target.value)}
                className="w-full bg-[#0a0d14] border border-white/10 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-purple-500 custom-scrollbar"
                placeholder="Type or paste complaint body..."
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{analyzing ? 'Extracting Sentiment...' : 'Analyze Sentiment & Regulatory Risk'}</span>
            </button>
          </div>

          {/* NLP Analysis Output */}
          {analysisResult && (
            <div className="mt-4 p-4 rounded-xl bg-[#0a0d14] border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs font-bold text-white">NLP Classification Result</span>
                {analysisResult.regulatory_exposure ? (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                    CFPB / REG E EXPOSURE DETECTED
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-400 font-bold">Standard Grievance</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Category:</span>
                  <strong className="text-slate-200">{analysisResult.category?.replace(/_/g, ' ')}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Urgency Tier:</span>
                  <strong className="text-purple-400">{analysisResult.urgency?.replace(/_/g, ' ')}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Sentiment Polarity:</span>
                  <strong className="font-mono text-rose-400">{analysisResult.sentiment_score} (Severe Dissatisfaction)</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Identified Themes:</span>
                  <strong className="text-slate-300">{analysisResult.key_themes?.join(', ') || 'N/A'}</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">AI-Prescribed Resolution Script:</span>
                <p className="text-[11px] text-emerald-300 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-500/30 leading-relaxed">
                  {analysisResult.suggested_action}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
