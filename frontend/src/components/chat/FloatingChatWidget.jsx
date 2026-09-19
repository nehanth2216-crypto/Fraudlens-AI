import { useState, useRef, useEffect } from 'react';
import {
  Bot, X, Send, Sparkles, Terminal, Headphones,
  Zap, RefreshCw, Maximize2, Minimize2, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { v2CopilotAPI } from '../../api/client';
import ChatMessage from './ChatMessage';

export default function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('ANALYST');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: (
        "### 🛡️ Apex AI Quick Assistant\n\n" +
        "I am your instant FinTech copilot. Ask me to diagnose payment declines, look up high-risk accounts, or draft customer-care scripts."
      ),
      suggested_actions: [
        { label: "Diagnose TXN-9A8F3B", action: "DIAGNOSE", target: "TXN-9A8F3B" },
        { label: "Check Mule Ring", action: "NAVIGATE_NETWORK", target: "RING-01" },
      ],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const quickPills = mode === 'ANALYST' ? [
    "Why was TXN-9A8F3B declined?",
    "Show mule cluster accounts",
    "Draft SAR for structuring"
  ] : [
    "Explain decline to customer",
    "Refund timeline for dispute",
    "Enable online transactions"
  ];

  async function handleSend(msgToSend = null) {
    const text = msgToSend || input;
    if (!text.trim()) return;

    const userMsg = {
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await v2CopilotAPI.chat({
        message: text,
        mode,
      });

      const botMsg = {
        sender: 'bot',
        text: res.data.reply,
        suggested_actions: res.data.suggested_actions || [],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      toast.error('Copilot query failed');
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: 'Unable to reach the copilot service. Please try again.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleExecuteAction(act) {
    try {
      await v2CopilotAPI.executeAction({
        action_type: act.action,
        target_id: act.target,
      });
      toast.success(`Action '${act.label}' executed! Audit log created.`, { icon: '⚡' });
    } catch (err) {
      toast.error('Action execution failed');
    }
  }

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-[#002E6E] to-[#005CE6] text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20 group"
        >
          <div className="w-7 h-7 rounded-xl bg-[#00BAF2] text-[#002E6E] flex items-center justify-center font-black shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div className="text-left hidden sm:block">
            <span className="text-xs font-black tracking-tight block">Ask Apex AI</span>
            <span className="text-[10px] text-blue-200 block -mt-0.5">Instant Copilot</span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute -top-1 -right-1" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -top-1 -right-1" />
        </button>
      )}

      {/* Floating Chatbox Modal / Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[440px] h-[580px] max-h-[85vh] bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-[#002E6E] to-[#0047AB] text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#00BAF2] text-[#002E6E] flex items-center justify-center font-black">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-white tracking-tight">Apex Copilot</h3>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-white/15 text-[#00BAF2] border border-white/20">
                    Live
                  </span>
                </div>
                <p className="text-[10px] text-blue-100/80">Paytm FinTech Crime & Care Shield</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-xl">
              <button
                onClick={() => setMode('ANALYST')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  mode === 'ANALYST'
                    ? 'bg-[#002E6E] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#002E6E]'
                }`}
              >
                Analyst
              </button>
              <button
                onClick={() => setMode('CUSTOMER_SUPPORT')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  mode === 'CUSTOMER_SUPPORT'
                    ? 'bg-[#00BAF2] text-[#002E6E] shadow-xs'
                    : 'text-slate-600 hover:text-[#002E6E]'
                }`}
              >
                Customer Care
              </button>
            </div>

            <button
              onClick={() => setMessages(messages.slice(0, 1))}
              className="text-[10px] text-slate-400 hover:text-slate-700 font-medium underline"
            >
              Clear Chat
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 custom-scrollbar bg-[#F8FAFC]">
            {messages.map((m, idx) => (
              <ChatMessage
                key={idx}
                message={m}
                onExecuteAction={handleExecuteAction}
              />
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-500 text-[11px] bg-white p-2.5 rounded-xl border border-slate-200 w-fit shadow-xs">
                <RefreshCw className="w-3 h-3 animate-spin text-[#00BAF2]" />
                <span>Apex Copilot reasoning...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Pills & Input Dock */}
          <div className="p-3 bg-white border-t border-slate-200 space-y-2">
            {/* Suggestion Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] custom-scrollbar">
              {quickPills.map((pill, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(pill)}
                  className="bg-slate-50 hover:bg-slate-100 text-[#002E6E] font-semibold px-2.5 py-1 rounded-full border border-slate-200 whitespace-nowrap transition-colors flex-shrink-0 cursor-pointer"
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 focus-within:border-[#00BAF2] focus-within:ring-2 focus-within:ring-[#00BAF2]/20 focus-within:bg-white">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={
                  mode === 'ANALYST'
                    ? "Ask about SAR, decline codes, or fraud rings..."
                    : "Ask for customer decline explanation scripts..."
                }
                className="flex-1 bg-transparent px-2 text-xs text-slate-800 focus:outline-none placeholder:text-slate-400"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-xl bg-[#00BAF2] hover:bg-[#00a4d6] text-[#002E6E] font-bold flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
