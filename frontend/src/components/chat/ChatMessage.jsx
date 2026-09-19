import { useState } from 'react';
import { Copy, Check, Zap, Bot, User, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export function FormattedText({ text, isUser = false }) {
  if (!text) return null;

  // Split by double newline for paragraphs
  const paragraphs = text.split('\n\n');

  return (
    <div className={`space-y-2.5 text-xs leading-relaxed ${isUser ? 'text-white' : 'text-slate-800'}`}>
      {paragraphs.map((para, pIdx) => {
        // Check for headers like ### Header
        if (para.startsWith('### ')) {
          const title = para.replace('### ', '');
          return (
            <h4
              key={pIdx}
              className={`text-sm font-bold tracking-tight pb-1 border-b ${
                isUser ? 'text-white border-white/20' : 'text-[#002E6E] border-slate-200'
              }`}
            >
              {title}
            </h4>
          );
        }

        // Check for bullet lists
        if (para.includes('\n* ') || para.startsWith('* ')) {
          const lines = para.split('\n');
          return (
            <ul key={pIdx} className="space-y-1 my-1 list-disc pl-4">
              {lines.map((line, lIdx) => {
                const cleanLine = line.replace(/^\*\s*/, '');
                return (
                  <li key={lIdx} className="leading-snug">
                    <InlineFormatted text={cleanLine} isUser={isUser} />
                  </li>
                );
              })}
            </ul>
          );
        }

        return (
          <p key={pIdx} className="leading-relaxed">
            <InlineFormatted text={para} isUser={isUser} />
          </p>
        );
      })}
    </div>
  );
}

function InlineFormatted({ text, isUser }) {
  // Regex to split by bold (**text**) and inline code (`code`)
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return (
    <>
      {parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const inner = part.slice(2, -2);
          return (
            <strong
              key={idx}
              className={`font-extrabold ${isUser ? 'text-white underline decoration-[#00BAF2]' : 'text-[#002E6E]'}`}
            >
              {inner}
            </strong>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          const inner = part.slice(1, -1);
          return (
            <code
              key={idx}
              className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${
                isUser ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-[#002E6E] font-bold'
              }`}
            >
              {inner}
            </code>
          );
        }
        return part;
      })}
    </>
  );
}

export default function ChatMessage({ message, onExecuteAction }) {
  const [copied, setCopied] = useState(false);
  const isBot = message.sender === 'bot';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    toast.success('Copied to clipboard!', { id: 'copy-toast' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex items-start gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}>
      {isBot && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#002E6E] to-[#005CE6] text-[#00BAF2] flex items-center justify-center flex-shrink-0 mt-1 shadow-sm border border-[#00BAF2]/30">
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div
        className={`max-w-2xl rounded-2xl p-4 shadow-sm transition-all relative group ${
          isBot
            ? 'bg-white border border-slate-200 text-slate-800'
            : 'bg-[#002E6E] text-white'
        }`}
      >
        {/* Message Header Bar for Bot */}
        {isBot && (
          <div className="flex items-center justify-between gap-3 mb-2.5 pb-2 border-b border-slate-100 text-[10px]">
            <div className="flex items-center gap-1.5 text-[#002E6E] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00BAF2] animate-ping" />
              <span>Apex Intelligence Telemetry</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-[#002E6E] rounded-md hover:bg-slate-100 cursor-pointer"
                title="Copy response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <FormattedText text={message.text} isUser={!isBot} />

        {/* Suggested Operational Actions */}
        {isBot && message.suggested_actions && message.suggested_actions.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
              Recommended 1-Click Actions:
            </span>
            <div className="flex flex-wrap gap-2">
              {message.suggested_actions.map((act, aIdx) => (
                <button
                  key={aIdx}
                  type="button"
                  onClick={() => onExecuteAction && onExecuteAction(act)}
                  className="flex items-center gap-1.5 bg-[#E8F7FE] hover:bg-[#D4EFFF] text-[#002E6E] border border-[#00BAF2]/40 px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  <Zap className="w-3 h-3 text-[#00BAF2] fill-[#00BAF2]" />
                  <span>{act.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className={`mt-2 text-[10px] font-mono flex items-center justify-end gap-1 ${
          isBot ? 'text-slate-400' : 'text-blue-200/70'
        }`}>
          <Clock className="w-2.5 h-2.5" />
          <span>{message.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {!isBot && (
        <div className="w-8 h-8 rounded-xl bg-[#00BAF2] text-[#002E6E] font-black flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
