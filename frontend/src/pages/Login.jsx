import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
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
      toast.success('Welcome to FraudLens AI');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
         style={{ background: 'linear-gradient(135deg, #0b0f1a 0%, #111827 50%, #0b1929 100%)' }}>
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-[600px] h-[600px] -top-40 -left-40 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute w-[500px] h-[500px] -bottom-40 -right-40 bg-cyan-600/8 rounded-full blur-3xl" />
        <div className="absolute w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-violet-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-4 shadow-lg shadow-blue-500/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">FraudLens AI</h1>
          <p className="text-slate-400 mt-1">Intelligent Fraud Detection Platform</p>
        </div>

        {/* Login Form */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@fraudlens.ai"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-base">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/register" className="text-sm text-blue-400 hover:text-blue-300">
              Create an account →
            </Link>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="mt-6 glass-card p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Demo Credentials</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { role: 'Admin', email: 'admin@fraudlens.ai', pass: 'admin123' },
              { role: 'Analyst', email: 'analyst@fraudlens.ai', pass: 'analyst123' },
              { role: 'Investigator', email: 'investigator@fraudlens.ai', pass: 'invest123' },
              { role: 'Viewer', email: 'viewer@fraudlens.ai', pass: 'viewer123' },
            ].map(cred => (
              <button key={cred.role}
                onClick={() => { setEmail(cred.email); setPassword(cred.pass); }}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-left transition-colors">
                <span className="text-blue-400 font-medium">{cred.role}</span>
                <span className="block text-slate-500 truncate">{cred.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
