import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, ArrowRightLeft, ShieldAlert, FolderLock, Users,
  ShieldCheck, AlertCircle, RotateCcw, UserX, MessageSquareQuote,
  Store, Network, Sparkles, Bot, BarChart3, LogOut, Menu, X,
  Bell, Shield, Eye, ChevronRight
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
    title: 'V2 Intelligence Modules',
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
    title: 'AI & Intelligence',
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

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0d14] text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} flex-shrink-0 bg-[#0e131f] border-r border-white/5 flex flex-col transition-all duration-300 z-30`}>
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-white/5 justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-bold bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">FraudLens</h1>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">V2</span>
                </div>
                <p className="text-[10px] text-slate-400 tracking-wider">ENTERPRISE INTELLIGENCE</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-4 custom-scrollbar">
          {navigationGroups.map((group, gIdx) => (
            <div key={gIdx}>
              {sidebarOpen && (
                <div className="px-3 mb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
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
                      className={`flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group relative
                        ${active
                          ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-900/20'
                          : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 border border-transparent'
                        }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
                      {sidebarOpen && (
                        <span className="ml-3 truncate flex-1">{label}</span>
                      )}
                      {sidebarOpen && badge && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          badge === 'Live' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse' :
                          'bg-purple-500/20 text-purple-300 border border-purple-500/30'
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
        <div className="p-3 border-t border-white/5 bg-[#0a0d14]/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-inner">
              {user?.name?.[0] || 'A'}
            </div>
            {sidebarOpen && (
              <div className="truncate text-left">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Administrator'}</p>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping"></span>
                  {user?.role || 'ADMIN'}
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { logout(); navigate('/login'); }}
              title="Log out"
              className="p-1.5 text-slate-400 hover:text-red-400 rounded-md hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/5"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-[#0e131f]/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 bg-blue-950/40 border border-blue-500/20 px-3 py-1.5 rounded-full text-xs text-blue-300">
              <Eye className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>Real-Time Telemetry Stream: <strong className="text-emerald-400 font-mono">ONLINE</strong></span>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 border-l border-white/10 pl-4">
              <span>Risk Engine: <span className="text-slate-300 font-mono">XGBoost v2.4 + Isolation Forest</span></span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/copilot"
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md shadow-blue-600/20 transition-all transform active:scale-95"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Launch Copilot</span>
            </Link>

            <Link
              to="/alerts"
              className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute 1 top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
              <span className="absolute 1 top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
            </Link>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#0a0d14] custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
