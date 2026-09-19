import { useState } from 'react';
import {
  Bot, Send, Sparkles, User, Terminal, Headphones, CheckCircle,
  Zap, Play, ArrowRight, Shield, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { v2CopilotAPI } from '../api/client';

export default function AICopilot() {
  const [mode, setMode] = useState('ANALYST'); // 'ANALYST' or 'CUSTOMER_SUPPORT'
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: (
        "### 🛡️ Paytm FraudLens Intelligence Copilot Online\n\n" +
        "I am connected to the real-time Paytm payment switch and financial fraud telemetry. " +
        "I can perform forensic audits, auto-generate FinCEN SAR regulatory filings, or switch to **Customer Support Mode** to translate cryptic decline codes into empathetic, plain-language customer guidance."
      ),
      suggested_actions: [
        { label: "Diagnose Decline for TXN-9A8F3B", action: "DIAGNOSE", target: "TXN-9A8F3B" },
        { label: "Draft FinCEN SAR for Mule Syndicate", action: "OPEN_SAR", target: "RING-01" },
        { label: "Check Active Alerts", action: "NAVIGATE_ALERTS", target: "HIGH" }
      ]
    }
  ]);

  const quickPills = mode === 'ANALYST' ? [
    "Draft a FinCEN SAR narrative for the Patel mule syndicate",
    "Why was transaction TXN-9A8F3B declined?",
    "Detect fraud rings with shared Tor exit IPs",
    "Show active merchants exceeding 0.9% CTR threshold"
  ] : [
    "Explain decline reason for customer at Croma store",
    "What is the refund arrival timeline for dispute DSP-2026-8812?",
    "Customer is furious about locked account — draft calming script",
    "How does the customer enable online transactions in their banking app?"
  ];

  async function handleSend(msgToSend = null) {
    const text = msgToSend || input;
    if (!text.trim()) return;

    const userMsg = { sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await v2CopilotAPI.chat({
        message: text,
        mode
      });

      const botMsg = {
        sender: 'bot',
        text: res.data.reply,
        suggested_actions: res.data.suggested_actions || []
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      toast.error('Copilot request failed');
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: 'An error occurred while connecting to the intelligence copilot.' }
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleExecuteAction(act) {
    try {
      await v2CopilotAPI.executeAction({
        action_type: act.action,
        target_id: act.target
      });
      toast.success(`Action '${act.label}' executed successfully! Audit log created.`, { icon: '⚡' });
    } catch (err) {
      toast.error('Action execution failed');
    }
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Copilot Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00BAF2] flex items-center justify-center text-[#002E6E] shadow-sm flex-shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-[#002E6E]">Paytm AI Copilot</h1>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#E8F7FE] text-[#002E6E] border border-[#00BAF2]/30 uppercase">
                Dual-Persona Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Instant AI assistance for fraud forensics & customer care teams
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setMode('ANALYST')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'ANALYST'
                ? 'bg-[#002E6E] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#002E6E]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Fraud Analyst Mode</span>
          </button>
          <button
            onClick={() => setMode('CUSTOMER_SUPPORT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'CUSTOMER_SUPPORT'
                ? 'bg-[#00BAF2] text-[#002E6E] shadow-sm'
                : 'text-slate-600 hover:text-[#002E6E]'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Customer Care Mode</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 overflow-y-auto space-y-4 custom-scrollbar shadow-sm">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'bot' && (
              <div className="w-8 h-8 rounded-xl bg-[#E8F7FE] text-[#002E6E] border border-[#00BAF2]/30 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                <Bot className="w-4 h-4 text-[#00BAF2]" />
              </div>
            )}

            <div className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
              m.sender === 'user'
                ? 'bg-[#002E6E] text-white shadow-sm'
                : 'bg-slate-50 border border-slate-200 text-slate-800 shadow-xs'
            }`}>
              <div className="prose prose-xs max-w-none whitespace-pre-wrap text-slate-800">
                {m.text}
              </div>

              {/* Action Buttons */}
              {m.suggested_actions?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap gap-2">
                  {m.suggested_actions.map((act, aIdx) => (
                    <button
                      key={aIdx}
                      onClick={() => handleExecuteAction(act)}
                      className="flex items-center gap-1.5 bg-[#E8F7FE] hover:bg-[#D4EFFF] text-[#002E6E] border border-[#00BAF2]/30 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer shadow-2xs active:scale-95"
                    >
                      <Zap className="w-3 h-3 text-[#00BAF2]" />
                      <span>{act.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {m.sender === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-[#00BAF2] text-[#002E6E] font-bold flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-slate-500 text-xs italic bg-slate-50 p-3 rounded-xl border border-slate-200 w-fit">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00BAF2]" />
            <span>Paytm Copilot querying fraud database & telemetry stream...</span>
          </div>
        )}
      </div>

      {/* Quick Prompt Pills & Input Box */}
      <div className="space-y-2 flex-shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px] custom-scrollbar">
          <span className="text-slate-500 flex-shrink-0 text-[10px] font-bold uppercase tracking-wider">Suggested:</span>
          {quickPills.map((pill, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(pill)}
              className="bg-white hover:bg-slate-50 text-[#002E6E] font-medium px-3 py-1 rounded-full border border-slate-200 whitespace-nowrap transition-colors flex-shrink-0 shadow-xs cursor-pointer hover:border-[#00BAF2]"
            >
              {pill}
            </button>
          ))}
        </div>

        <div className="bg-white p-2 rounded-2xl border border-slate-300 flex items-center gap-2 shadow-sm focus-within:border-[#00BAF2] focus-within:ring-2 focus-within:ring-[#00BAF2]/20">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              mode === 'ANALYST'
                ? "Ask about transaction forensics, SAR generation, decline root causes, or fraud rings..."
                : "Ask for customer-friendly decline scripts, refund status, or provisional credit policy..."
            }
            className="flex-1 bg-transparent px-3 py-1.5 text-xs text-slate-900 focus:outline-none placeholder:text-slate-400"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl bg-[#00BAF2] hover:bg-[#00a4d6] text-[#002E6E] font-bold flex items-center justify-center shadow-sm transition-all disabled:opacity-40 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
