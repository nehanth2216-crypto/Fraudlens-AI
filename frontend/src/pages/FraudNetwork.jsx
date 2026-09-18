import { useState, useEffect } from 'react';
import {
  Network, Share2, ShieldAlert, Users, Smartphone, Globe,
  ArrowRight, Search, Eye, Filter, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { v2NetworkAPI } from '../api/client';

export default function FraudNetwork() {
  const [rings, setRings] = useState([]);
  const [selectedRing, setSelectedRing] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRings();
  }, []);

  async function loadRings() {
    try {
      setLoading(true);
      const res = await v2NetworkAPI.getRings();
      setRings(res.data);
      if (res.data?.length > 0) {
        setSelectedRing(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load fraud rings', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-violet-950/40 via-[#0e131f] to-purple-950/20 p-5 rounded-2xl border border-violet-500/20 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-violet-400 uppercase tracking-wider bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">Priority 7</span>
            <span className="text-xs text-slate-400">• Multi-Hop Syndicate Graph & Mule Rings</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Fraud Network Graph & Ring Analysis</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Surfaces multi-hop entity relationships, shared device fingerprints, common Tor proxies, and organized money mule laundering syndicates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#0a0d14] px-4 py-2 rounded-xl border border-white/5 text-right">
            <p className="text-[10px] text-slate-400">Syndicates Detected</p>
            <p className="text-lg font-bold font-mono text-violet-400">{rings.length || 2} Rings Active</p>
            <p className="text-[9px] text-rose-400 font-semibold">₹5,740,000 Combined Exposure</p>
          </div>
        </div>
      </div>

      {/* Main Graph & Syndicate Cards Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ring List & Details (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-sm font-bold text-white">Detected Fraud Rings</h2>

          <div className="space-y-3">
            {rings.map((ring, idx) => {
              const isSelected = selectedRing?.ring_id === ring.ring_id;
              return (
                <div
                  key={idx}
                  onClick={() => { setSelectedRing(ring); setSelectedNode(null); }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-violet-950/30 border-violet-500/50 shadow-lg shadow-violet-900/20'
                      : 'bg-[#0e131f] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-violet-400">{ring.ring_id}</span>
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {ring.threat_level}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white mb-1">{ring.name}</h3>
                  <p className="text-[10px] text-slate-400 mb-2">Pivot: <strong className="text-slate-300">{ring.shared_pivot}</strong></p>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                    <span className="text-slate-400">{ring.node_count} Connected Entities</span>
                    <span className="font-mono font-bold text-rose-400">₹{ring.total_stolen_inr?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Node Inspector Drawer */}
          {selectedNode && (
            <div className="p-4 rounded-xl bg-[#0e131f] border border-blue-500/30 space-y-2 text-xs animate-fadeIn">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="font-bold text-white">Node Inspector</span>
                <span className="font-mono text-[10px] text-blue-400 uppercase">{selectedNode.type}</span>
              </div>
              <div>
                <p className="text-white font-semibold">{selectedNode.label}</p>
                <p className="text-slate-400 text-[11px]">Risk Score: <strong className="text-rose-400">{selectedNode.risk}/100</strong></p>
              </div>
              <button
                onClick={() => toast.success(`Enforced freeze on entity ${selectedNode.id}`)}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-semibold py-1.5 rounded-lg text-[11px] shadow-sm mt-2 transition-all"
              >
                Isolate & Freeze Entity
              </button>
            </div>
          )}
        </div>

        {/* Visual Graph Canvas (8 cols) */}
        <div className="lg:col-span-8 bg-[#0e131f] p-5 rounded-2xl border border-white/5 shadow-xl flex flex-col justify-between min-h-[500px] relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 z-10">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Network className="w-4 h-4 text-violet-400" />
                <span>Multi-Hop Entity Link Topology ({selectedRing?.name})</span>
              </h2>
              <p className="text-[11px] text-slate-400">Interactive visual clustering showing shared devices, Tor exit IPs, and cashout accounts</p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Graph Layout: Force-Directed
            </span>
          </div>

          {/* Graph Visualization SVG Simulation */}
          <div className="flex-1 w-full flex items-center justify-center relative my-4">
            <svg className="w-full h-80">
              {/* Connecting Edges */}
              <line x1="200" y1="160" x2="350" y2="100" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="4" opacity="0.6" />
              <line x1="200" y1="160" x2="350" y2="220" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="4" opacity="0.6" />
              <line x1="350" y1="100" x2="520" y2="80" stroke="#ef4444" strokeWidth="2.5" opacity="0.8" />
              <line x1="350" y1="220" x2="520" y2="240" stroke="#ef4444" strokeWidth="2.5" opacity="0.8" />
              <line x1="520" y1="80" x2="520" y2="240" stroke="#ef4444" strokeWidth="2" strokeDasharray="2" opacity="0.5" />
            </svg>

            {/* Simulated Node Badges */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {selectedRing?.key_nodes?.map((node, nIdx) => {
                // Fixed mock positions for clean diagram
                const positions = [
                  { left: '15%', top: '45%' },
                  { left: '42%', top: '22%' },
                  { left: '42%', top: '65%' },
                  { left: '72%', top: '15%' },
                  { left: '72%', top: '70%' },
                ];
                const pos = positions[nIdx % positions.length];
                const isSelected = selectedNode?.id === node.id;

                return (
                  <button
                    key={nIdx}
                    onClick={() => setSelectedNode(node)}
                    style={{ left: pos.left, top: pos.top }}
                    className={`absolute pointer-events-auto p-3 rounded-xl border flex items-center gap-2 transition-all transform hover:scale-110 shadow-lg text-left ${
                      isSelected
                        ? 'bg-blue-600/30 border-blue-400 ring-2 ring-blue-500'
                        : 'bg-[#0a0d14]/90 border-white/10 hover:border-violet-500/50'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-violet-500/20 text-violet-300 flex items-center justify-center flex-shrink-0">
                      {node.type === 'customer' ? <Users className="w-3.5 h-3.5" /> :
                       node.type === 'device' ? <Smartphone className="w-3.5 h-3.5" /> :
                       node.type === 'ip_address' ? <Globe className="w-3.5 h-3.5" /> :
                       <Share2 className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block leading-tight truncate max-w-[120px]">{node.label}</span>
                      <span className="text-[9px] font-mono text-rose-400 font-bold">Risk: {node.risk}/100</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Graph Legend & Status */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px] text-slate-400 z-10">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Account Node</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-violet-500" /> Device Fingerprint</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Tor IP / Proxy Node</span>
            </div>
            <span className="text-slate-500">Click any entity node to inspect forensic details</span>
          </div>
        </div>
      </div>
    </div>
  );
}
