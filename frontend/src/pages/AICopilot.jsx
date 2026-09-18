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
        "### 🛡️ FraudLens Intelligence Copilot Online\n\n" +
        "I am connected to the real-time financial fraud database and payment switch telemetry. " +
        "I can conduct technical forensics queries, generate FinCEN SAR drafts, or switch to Customer Support Mode to translate technical decline codes into friendly customer assistance scripts."
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
      <div className="bg-[#0e131f] p-4 rounded-2xl border border-white/5 shadow-md flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white">FraudLens AI Copilot</h1>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                DUAL-PERSONA
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Contextual intelligence for fraud analysts and customer care teams</p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center bg-[#0a0d14] p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setMode('ANALYST')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'ANALYST'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Fraud Analyst Mode</span>
          </button>
          <button
            onClick={() => setMode('CUSTOMER_SUPPORT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'CUSTOMER_SUPPORT'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Customer Support Mode</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 bg-[#0e131f] rounded-2xl border border-white/5 p-4 overflow-y-auto space-y-4 custom-scrollbar shadow-inner">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'bot' && (
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
              m.sender === 'user'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-[#0a0d14] border border-white/10 text-slate-200 shadow-sm'
            }`}>
              <div className="prose prose-invert prose-xs max-w-none whitespace-pre-wrap">
                {m.text}
              </div>

              {/* Action Buttons */}
              {m.suggested_actions?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-2">
                  {m.suggested_actions.map((act, aIdx) => (
                    <button
                      key={aIdx}
                      onClick={() => handleExecuteAction(act)}
                      className="flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors shadow-sm active:scale-95"
                    >
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>{act.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {m.sender === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs italic">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
            <span>Copilot analyzing fraud database & telemetry...</span>
          </div>
        )}
      </div>

      {/* Quick Prompt Pills & Input Box */}
      <div className="space-y-2 flex-shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px] custom-scrollbar">
          <span className="text-slate-500 flex-shrink-0 text-[10px] font-semibold">Suggested:</span>
          {quickPills.map((pill, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(pill)}
              className="bg-[#0e131f] hover:bg-white/10 text-slate-300 px-3 py-1 rounded-full border border-white/10 whitespace-nowrap transition-colors flex-shrink-0"
            >
              {pill}
            </button>
          ))}
        </div>

        <div className="bg-[#0e131f] p-2 rounded-2xl border border-white/10 flex items-center gap-2 shadow-xl">
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
            className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white focus:outline-none placeholder:text-slate-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/25 transition-all disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
