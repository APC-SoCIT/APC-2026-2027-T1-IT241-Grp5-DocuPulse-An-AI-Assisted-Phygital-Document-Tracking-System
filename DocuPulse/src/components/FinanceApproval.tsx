import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Wallet, CheckCircle2, XCircle, PauseCircle, AlertTriangle, ArrowRight } from 'lucide-react';

interface FinanceRequisition {
  id: string;
  title: string;
  estimated_cost?: number;
  status: string;
  workflow_stage: string;
}

export default function FinanceApproval() {
  const [requisitions, setRequisitions] = useState<FinanceRequisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  
  const totalBudget = 500000;
  const currentUtilized = 320000;

  useEffect(() => {
    fetchFinanceRequisitions();
  }, []);

  const fetchFinanceRequisitions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('requisitions')
      .select('*')
      .in('status', ['pending_finance', 'Pending Finance Review', 'Approved by Library/Dept Head'])
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRequisitions(data);
    }
    setLoading(false);
  };

  const handleFinanceDecision = async (req: FinanceRequisition, action: 'approve' | 'reject' | 'hold') => {
    let nextStatus = '';
    let nextStage = '';

    if (action === 'approve') {
      nextStatus = 'pending_logistics';
      nextStage = 'Logistics Processing';
    } else if (action === 'reject') {
      nextStatus = 'rejected_finance';
      nextStage = 'Rejected by Finance';
    } else {
      nextStatus = 'on_hold';
      nextStage = 'On Hold (Budget Review)';
    }

    const { error } = await supabase
      .from('requisitions')
      .update({ 
        status: nextStatus,
        workflow_stage: nextStage,
        finance_status: action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'On Hold',
        finance_time: new Date().toISOString()
      })
      .eq('id', req.id);

    if (!error) {
      setActionMsg(`Requisition ${req.id} status updated to: ${nextStage}.`);
      fetchFinanceRequisitions();
    }
  };

  return (
    <div className="max-w-5xl mx-auto font-sans text-slate-100 p-4">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Wallet className="w-3.5 h-3.5" /> Finance Officer Budget Review (DP-10)
        </div>
        <h1 className="text-2xl font-bold text-white">Finance Budget Impact & Approvals</h1>
        <p className="text-xs text-slate-400">Review budget utilization, check estimated costs, prevent overspending, and route approved items to Logistics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs block uppercase font-semibold">Total Allocated Department Budget</span>
          <p className="text-2xl font-bold text-white mt-1 font-mono">₱{totalBudget.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs block uppercase font-semibold">Current Budget Utilization</span>
          <p className="text-2xl font-bold text-indigo-400 mt-1 font-mono">₱{currentUtilized.toLocaleString()} ({Math.round((currentUtilized/totalBudget)*100)}%)</p>
        </div>
      </div>

      {actionMsg && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-xs text-emerald-400">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-indigo-400" /> Pending Finance Review Queue
        </h2>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading finance queue...</div>
        ) : requisitions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No pending requisitions require budget review.</div>
        ) : (
          <div className="space-y-4">
            {requisitions.map((req) => {
              const estimatedCost = req.estimated_cost || 45000;
              const isOverBudget = currentUtilized + estimatedCost > totalBudget;

              return (
                <div key={req.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-400">{req.id}</span>
                    <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-full text-[11px]">
                      {req.workflow_stage || 'Pending Finance Review'}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-white text-sm font-medium">{req.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Estimated Cost: <strong className="text-slate-200 font-mono">₱{estimatedCost.toLocaleString()}</strong></p>
                    </div>

                    {isOverBudget && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Exceeds Budget Limit</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
                    <button
                      onClick={() => handleFinanceDecision(req, 'hold')}
                      className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition flex items-center gap-1"
                    >
                      <PauseCircle className="w-3.5 h-3.5" /> Hold
                    </button>
                    <button
                      onClick={() => handleFinanceDecision(req, 'reject')}
                      className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 rounded-xl text-xs font-semibold transition flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button
                      onClick={() => handleFinanceDecision(req, 'approve')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Route to Logistics <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}