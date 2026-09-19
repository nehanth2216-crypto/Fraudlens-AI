import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('UI ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-2xl border border-rose-200 shadow-md max-w-md w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#002E6E]">Something went wrong</h2>
              <p className="text-xs text-slate-500 mt-1">
                An unexpected interface error occurred. The underlying financial services remain protected.
              </p>
            </div>
            {this.state.error?.message && (
              <div className="bg-slate-50 p-3 rounded-xl text-[11px] text-rose-700 font-mono text-left overflow-x-auto border border-slate-200">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="w-full bg-[#002E6E] hover:bg-[#003B8D] text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Dashboard</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
