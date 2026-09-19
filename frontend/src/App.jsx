import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Alerts from './pages/Alerts';
import ScamPrevention from './pages/ScamPrevention';
import PaymentFailureDiagnosis from './pages/PaymentFailureDiagnosis';
import PaymentRecovery from './pages/PaymentRecovery';
import AccountTakeover from './pages/AccountTakeover';
import CustomerComplaints from './pages/CustomerComplaints';
import MerchantHealth from './pages/MerchantHealth';
import FraudNetwork from './pages/FraudNetwork';
import ExplainableAI from './pages/ExplainableAI';
import AICopilot from './pages/AICopilot';
import Investigations from './pages/Investigations';
import Analytics from './pages/Analytics';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#F4F7FB] flex items-center justify-center text-slate-700 text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="h-11 px-3.5 rounded-2xl bg-white shadow-md border border-slate-200 flex items-center justify-center gap-1.5">
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L4 19.5H9L12 12.5L15 19.5H20L12 3Z" fill="#002E6E" />
              <path d="M12 3L15 19.5H20L12 3Z" fill="#00BAF2" />
            </svg>
            <span className="text-sm font-black">
              <span className="text-[#002E6E]">Ap</span>
              <span className="text-[#00BAF2]">ex</span>
            </span>
          </div>
          <div className="w-6 h-6 rounded-full border-2 border-[#00BAF2] border-t-transparent animate-spin" />
          <span className="font-semibold text-[#002E6E]">Connecting to Apex Security Shield...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
      <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
      
      {/* V2 Priority Routes */}
      <Route path="/scam-prevention" element={<ProtectedRoute><ScamPrevention /></ProtectedRoute>} />
      <Route path="/payment-failures" element={<ProtectedRoute><PaymentFailureDiagnosis /></ProtectedRoute>} />
      <Route path="/payment-recovery" element={<ProtectedRoute><PaymentRecovery /></ProtectedRoute>} />
      <Route path="/account-takeover" element={<ProtectedRoute><AccountTakeover /></ProtectedRoute>} />
      <Route path="/customer-complaints" element={<ProtectedRoute><CustomerComplaints /></ProtectedRoute>} />
      <Route path="/merchant-health" element={<ProtectedRoute><MerchantHealth /></ProtectedRoute>} />
      <Route path="/fraud-network" element={<ProtectedRoute><FraudNetwork /></ProtectedRoute>} />
      <Route path="/explainable-ai" element={<ProtectedRoute><ExplainableAI /></ProtectedRoute>} />
      <Route path="/copilot" element={<ProtectedRoute><AICopilot /></ProtectedRoute>} />
      <Route path="/investigations" element={<ProtectedRoute><Investigations /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
