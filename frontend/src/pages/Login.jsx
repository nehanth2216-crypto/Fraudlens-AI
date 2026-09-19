import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('analyst@fraudlens.ai');
  const [password, setPassword] = useState('analyst123');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome to Apex AI');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (userEmail, userPass) => {
    setEmail(userEmail);
    setPassword(userPass);
    toast.success(`Loaded credentials for ${userEmail}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#F4F7FB] px-4 py-8">
      {/* Paytm soft ambient background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[500px] h-[500px] -top-32 -left-32 bg-[#00BAF2]/10 rounded-full blur-3xl" />
        <div className="absolute w-[500px] h-[500px] -bottom-32 -right-32 bg-[#002E6E]/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Apex Logo & Brand in Paytm Colors */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-2xl bg-white shadow-md border border-slate-200 mb-3">
            <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L4 19.5H9L12 12.5L15 19.5H20L12 3Z" fill="#002E6E" />
              <path d="M12 3L15 19.5H20L12 3Z" fill="#00BAF2" />
            </svg>
            <span className="text-3xl font-black tracking-tight">
              <span className="text-[#002E6E]">Ap</span>
              <span className="text-[#00BAF2]">ex</span>
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#002E6E] tracking-tight">
            Apex <span className="text-[#00BAF2]">AI</span>
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Financial Crime & Risk Intelligence Shield
          </p>
          <div className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-[#E8F7FE] text-[#002E6E] text-[10px] font-bold border border-[#00BAF2]/30">
            Paytm AI Hackathon — Track 2 Demo
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xl space-y-5">
          <div>
            <h2 className="text-lg font-bold text-[#002E6E]">Sign In to Portal</h2>
            <p className="text-xs text-slate-500">Access real-time transaction telemetry & fraud models</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Work Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@fraudlens.ai"
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#00BAF2] focus:ring-2 focus:ring-[#00BAF2]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#00BAF2] focus:ring-2 focus:ring-[#00BAF2]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00BAF2] hover:bg-[#00a4d6] text-[#002E6E] font-extrabold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs tracking-wide cursor-pointer active:scale-98"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{loading ? 'Authenticating...' : 'Sign In to Apex AI'}</span>
              {!loading && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </form>

          {/* Quick Login Helper for Hackathon Judges */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">1-Click Demo Login</span>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Ready
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {[
                { role: 'Fraud Analyst', email: 'analyst@fraudlens.ai', pass: 'analyst123', badge: 'Default' },
                { role: 'FinTech Admin', email: 'admin@fraudlens.ai', pass: 'admin123', badge: 'Full Access' },
                { role: 'Investigator', email: 'investigator@fraudlens.ai', pass: 'invest123', badge: 'SAR Hub' },
                { role: 'Audit Viewer', email: 'viewer@fraudlens.ai', pass: 'viewer123', badge: 'Read Only' },
              ].map(cred => (
                <button
                  key={cred.role}
                  type="button"
                  onClick={() => handleQuickLogin(cred.email, cred.pass)}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                    email === cred.email
                      ? 'bg-[#E8F7FE] border-[#00BAF2] text-[#002E6E]'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#002E6E]">{cred.role}</span>
                    <span className="text-[9px] text-slate-400 font-semibold">{cred.badge}</span>
                  </div>
                  <span className="block text-[10px] text-slate-500 truncate mt-0.5">{cred.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-500 mt-5 font-medium">
          Paytm AI Hackathon 2026 • Track 2 Submission
        </p>
      </div>
    </div>
  );
}
