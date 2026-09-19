import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, ArrowRightLeft, ShieldAlert, FolderLock,
  ShieldCheck, AlertCircle, RotateCcw, UserX, MessageSquareQuote,
  Store, Network, Sparkles, Bot, BarChart3, LogOut, Menu, X,
  Bell, Shield, Eye, HelpCircle, CheckCircle2, AlertTriangle, ArrowUpRight
} from 'lucide-react';

const navigationGroups = [
  {
    title: 'Core Operations',
    items: [
      { path: '/', label: 'Command Center', icon: LayoutDashboard },
      { path: '/transactions', label: 'Live Transactions', icon: ArrowRightLeft },
      { path: '/alerts', label: 'Fraud Alerts', icon: ShieldAlert, badge: 'Live' },
      { path: '/investigations', label: 'Cases & SAR Hub', icon: FolderLock },
    ]
  },
  {
    title: 'Paytm V2 Intelligence',
    items: [
      { path: '/scam-prevention', label: 'Scam Prevention', icon: ShieldCheck },
      { path: '/payment-failures', label: 'Failure Diagnosis', icon: AlertCircle },
      { path: '/payment-recovery', label: 'Recovery & Disputes', icon: RotateCcw },
      { path: '/account-takeover', label: 'Account Takeover (ATO)', icon: UserX },
      { path: '/customer-complaints', label: 'Complaint Intel', icon: MessageSquareQuote },
      { path: '/merchant-health', label: 'Merchant Health', icon: Store },
      { path: '/fraud-network', label: 'Network Graph', icon: Network },
      { path: '/explainable-ai', label: 'Explainable AI (XAI)', icon: Sparkles },
    ]
  },
  {
    title: 'AI & Analytics',
    items: [
      { path: '/copilot', label: 'AI Copilot (Dual-Mode)', icon: Bot, badge: 'AI' },
      { path: '/analytics', label: 'Portfolio Analytics', icon: BarChart3 },
    ]
  }
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showGuideModal, setShowGuideModal] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F7FB] text-slate-800 font-sans">
      {/* Sidebar: Authentic Paytm Deep Navy */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} flex-shrink-0 bg-gradient-to-b from-[#002E6E] via-[#002458] to-[#001A3D] text-white flex flex-col transition-all duration-300 z-30 shadow-xl`}>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-4 border-b border-white/10 justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {/* Apex Logo Badge in Paytm Colors */}
            <div className="h-10 px-2.5 rounded-xl bg-white flex items-center justify-center gap-1.5 shadow-md flex-shrink-0">
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                <path d="M12 3L4 19.5H9L12 12.5L15 19.5H20L12 3Z" fill="#002E6E" />
                <path d="M12 3L15 19.5H20L12 3Z" fill="#00BAF2" />
              </svg>
              <span className="text-xs font-black tracking-tight">
                <span className="text-[#002E6E]">Ap</span>
                <span className="text-[#00BAF2]">ex</span>
              </span>
            </div>
            {sidebarOpen && (
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm font-bold text-white tracking-tight">Apex <span className="text-[#00BAF2]">AI</span></h1>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-[#00BAF2]/20 text-[#00BAF2] border border-[#00BAF2]/30">V2</span>
                </div>
                <p className="text-[9px] text-blue-200/70 font-semibold tracking-wider uppercase">Paytm FinTech Shield</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-4 custom-scrollbar">
          {navigationGroups.map((group, gIdx) => (
            <div key={gIdx}>
              {sidebarOpen && (
                <div className="px-3 mb-1.5 text-[10px] font-bold text-blue-200/60 uppercase tracking-wider">
                  {group.title}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map(({ path, label, icon: Icon, badge }) => {
                  const active = location.pathname === path;
                  return (
                    <Link
                      key={path}
                      to={path}
                      title={!sidebarOpen ? label : undefined}
                      className={`flex items-center px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group relative
                        ${active
                          ? 'bg-[#00BAF2] text-[#002E6E] shadow-md shadow-cyan-900/30 font-bold scale-[1.01]'
                          : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-[#002E6E]' : 'text-blue-200'}`} />
                      {sidebarOpen && (
                        <span className="ml-3 truncate flex-1">{label}</span>
                      )}
                      {sidebarOpen && badge && (
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                          badge === 'Live'
                            ? (active ? 'bg-[#002E6E] text-white' : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30')
                            : (active ? 'bg-[#002E6E] text-white' : 'bg-cyan-400/20 text-cyan-200 border border-cyan-400/30')
                        }`}>
                          {badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User profile & sidebar toggle footer */}
        <div className="p-3 border-t border-white/10 bg-black/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#00BAF2] text-[#002E6E] font-extrabold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
              {user?.name?.[0] || 'P'}
            </div>
            {sidebarOpen && (
              <div className="truncate text-left">
                <p className="text-xs font-bold text-white truncate">{user?.name || 'Paytm Officer'}</p>
                <p className="text-[10px] text-cyan-300 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                  {user?.role || 'FINTECH ADMIN'}
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { logout(); navigate('/login'); }}
              title="Log out"
              className="p-1.5 text-blue-200 hover:text-rose-300 rounded-lg hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area: Paytm Light Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header: Crisp White with Paytm Accents */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-20 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-medium text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Paytm Gateway Telemetry: <strong className="font-semibold text-emerald-900">ACTIVE</strong></span>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 border-l border-slate-200 pl-4">
              <span>Risk Engine: <span className="font-semibold text-[#002E6E]">Paytm AI Shield v2.4 (XGBoost)</span></span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Explainer Guide Button */}
            <button
              onClick={() => setShowGuideModal(true)}
              className="flex items-center gap-1.5 bg-[#E8F7FE] hover:bg-[#D4EFFF] text-[#002E6E] text-xs font-bold px-3 py-1.5 rounded-xl border border-[#00BAF2]/30 transition-all cursor-pointer"
              title="Click for a simple guide on how to understand this platform"
            >
              <HelpCircle className="w-4 h-4 text-[#00BAF2]" />
              <span>How It Works (Guide)</span>
            </button>

            {/* AI Copilot Fast Action */}
            <Link
              to="/copilot"
              className="flex items-center gap-1.5 bg-[#00BAF2] hover:bg-[#00a4d6] text-[#002E6E] text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-sm transition-all transform active:scale-95"
            >
              <Bot className="w-4 h-4" />
              <span>Launch Copilot</span>
            </Link>

            {/* Alerts Bell */}
            <Link
              to="/alerts"
              className="relative p-2 text-slate-600 hover:text-[#002E6E] rounded-xl hover:bg-slate-100 transition-colors"
              title="View Fraud Alerts"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
            </Link>

            {/* User Profile Chip in Top Bar */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-xl bg-[#002E6E] text-white flex items-center justify-center text-xs font-black shadow-xs">
                {user?.name?.[0] || 'O'}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <span className="text-xs font-bold text-[#002E6E] block truncate max-w-[130px]">{user?.name || 'Officer'}</span>
                <span className="text-[10px] text-slate-500 font-medium">{user?.role || 'FINTECH ADMIN'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#F4F7FB] custom-scrollbar">
          {children}
        </main>
      </div>

      {/* User-Friendly Explainer Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#00BAF2]/20 flex items-center justify-center text-[#002E6E]">
                  <Shield className="w-5 h-5 text-[#00BAF2]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#002E6E]">Apex FraudLens AI — Quick Guide</h2>
                  <p className="text-xs text-slate-500">Track 2: "Make Insurance, Lending and Fintech simpler, faster and more human"</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="bg-[#E8F7FE] p-3.5 rounded-xl border border-[#00BAF2]/20">
                <h3 className="font-bold text-[#002E6E] text-sm mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00BAF2]" />
                  What is Apex AI?
                </h3>
                <p>
                  Apex AI is an intelligent financial fraud intelligence shield built for the <strong>Paytm ecosystem</strong>. It analyzes transactions, device telemetry, and behavioral patterns in milliseconds to prevent scams and keep user payments safe.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                  Traffic Light Risk Scoring System
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="font-bold text-emerald-800 flex items-center gap-1.5 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      Score 0 – 30: SAFE
                    </div>
                    <p className="text-[11px] text-emerald-900">
                      Normal customer payment. Processed instantly without disruption.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="font-bold text-amber-800 flex items-center gap-1.5 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      Score 31 – 70: REVIEW
                    </div>
                    <p className="text-[11px] text-amber-900">
                      Unusual device, amount, or location. Triggers quick 2FA/OTP check.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                    <div className="font-bold text-rose-800 flex items-center gap-1.5 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      Score 71 – 100: BLOCKED
                    </div>
                    <p className="text-[11px] text-rose-900">
                      Known scam pattern or mule syndicate. Payment blocked immediately.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                  Key Sections to Explore in This Demo
                </h3>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <Link
                    to="/transactions"
                    onClick={() => setShowGuideModal(false)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-[#00BAF2] hover:bg-[#F0F9FF] transition-all flex items-center justify-between"
                  >
                    <div>
                      <strong className="text-[#002E6E] block">1. Live Transactions</strong>
                      <span className="text-slate-500">Inspect real-time payments & risk scores</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[#00BAF2]" />
                  </Link>
                  <Link
                    to="/copilot"
                    onClick={() => setShowGuideModal(false)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-[#00BAF2] hover:bg-[#F0F9FF] transition-all flex items-center justify-between"
                  >
                    <div>
                      <strong className="text-[#002E6E] block">2. AI Copilot</strong>
                      <span className="text-slate-500">Chat with Analyst or Customer Support AI</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[#00BAF2]" />
                  </Link>
                  <Link
                    to="/payment-failures"
                    onClick={() => setShowGuideModal(false)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-[#00BAF2] hover:bg-[#F0F9FF] transition-all flex items-center justify-between"
                  >
                    <div>
                      <strong className="text-[#002E6E] block">3. Failure Diagnosis</strong>
                      <span className="text-slate-500">Smart Retry engine for failed UPI payments</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[#00BAF2]" />
                  </Link>
                  <Link
                    to="/investigations"
                    onClick={() => setShowGuideModal(false)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-[#00BAF2] hover:bg-[#F0F9FF] transition-all flex items-center justify-between"
                  >
                    <div>
                      <strong className="text-[#002E6E] block">4. Case & SAR Hub</strong>
                      <span className="text-slate-500">FinCEN compliant fraud reports</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[#00BAF2]" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="bg-[#002E6E] hover:bg-[#001F4D] text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Got It! Continue to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
