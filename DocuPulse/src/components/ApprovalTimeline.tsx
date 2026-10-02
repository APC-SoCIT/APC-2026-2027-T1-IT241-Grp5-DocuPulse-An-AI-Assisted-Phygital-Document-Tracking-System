import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Building2, Wallet, Truck, X } from 'lucide-react';

interface RequisitionChain {
  id: string;
  title: string;
  department_head_status: string;
  department_head_time?: string;
  finance_status: string;
  finance_time?: string;
  logistics_status: string;
  logistics_time?: string;
}

export default function ApprovalTimeline() {
  const [requisitions, setRequisitions] = useState<RequisitionChain[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<RequisitionChain | null>(null);

  useEffect(() => {
    fetchChainData();
  }, []);

  const fetchChainData = async () => {
    const { data, error } = await supabase
      .from('requisitions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRequisitions(data);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto font-sans text-slate-100 p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Approval Chain & Workflow Tracking (DP-06)</h1>
        <p className="text-xs text-slate-400">View Department Head approval, Finance status, Logistics processing, and timestamps[cite: 8].</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading approval chain data...</div>
        ) : requisitions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No requisitions found.</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {requisitions.map((req) => (
              <div key={req.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-indigo-400 text-xs">{req.id}</span>
                    <h3 className="text-white text-sm font-medium">{req.title}</h3>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-indigo-400" /> Dept Head: <strong className="text-slate-200">{req.department_head_status || 'Pending'}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Wallet className="w-3.5 h-3.5 text-amber-400" /> Finance: <strong className="text-slate-200">{req.finance_status || 'Pending'}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-emerald-400" /> Logistics: <strong className="text-slate-200">{req.logistics_status || 'Pending'}</strong>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReq(req)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition"
                >
                  View Timeline
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedReq && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Approval Chain Lifecycle[cite: 8]</h3>
                <p className="text-[11px] font-mono text-indigo-400">{selectedReq.id}</p>
              </div>
              <button onClick={() => setSelectedReq(null)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <Building2 className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">1. Department Head Approval[cite: 8]</span>
                    <span className="font-mono text-[10px] text-slate-400">{selectedReq.department_head_time || 'N/A'}[cite: 8]</span>
                  </div>
                  <p className="text-slate-400 mt-0.5">Status: <span className="text-indigo-300 font-medium">{selectedReq.department_head_status || 'Pending'}</span></p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <Wallet className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">2. Finance Approval[cite: 8]</span>
                    <span className="font-mono text-[10px] text-slate-400">{selectedReq.finance_time || 'N/A'}[cite: 8]</span>
                  </div>
                  <p className="text-slate-400 mt-0.5">Status: <span className="text-amber-300 font-medium">{selectedReq.finance_status || 'Pending'}</span></p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <Truck className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">3. Logistics Processing[cite: 8]</span>
                    <span className="font-mono text-[10px] text-slate-400">{selectedReq.logistics_time || 'N/A'}[cite: 8]</span>
                  </div>
                  <p className="text-slate-400 mt-0.5">Status: <span className="text-emerald-300 font-medium">{selectedReq.logistics_status || 'Pending'}</span></p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setSelectedReq(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
              >
                Close Timeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}