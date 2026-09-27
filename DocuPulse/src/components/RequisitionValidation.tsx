import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  CheckSquare, CheckCircle2, XCircle, Clock, Tag, 
  UserCheck, AlertCircle, FileText
} from 'lucide-react';

interface Requisition {
  id: string;
  title: string;
  category: string;
  priority: string;
  description: string;
  requestor: string;
  department: string;
  status: string;
  workflow_stage: string;
  created_at?: string;
}

export default function RequisitionValidation() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState<{ [key: string]: string }>({});
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingRequisitions();
  }, []);

  const fetchPendingRequisitions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('requisitions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRequisitions(data);
    }
    setLoading(false);
  };

  const handleValidationAction = async (id: string, newStatus: 'Approved' | 'Rejected') => {
    const remarkText = remarks[id] || (newStatus === 'Approved' ? 'Validated and approved by Department Approver.' : 'Request returned for correction.');

    const { error: updateError } = await supabase
      .from('requisitions')
      .update({
        status: newStatus,
        workflow_stage: newStatus === 'Approved' ? 'In Logistics Processing' : 'Returned / Rejected'
      })
      .eq('id', id);

    if (updateError) {
      alert(`Failed to update status: ${updateError.message}`);
      return;
    }

    const reqItem = requisitions.find(r => r.id === id);
    if (reqItem) {
      await supabase.from('notifications').insert([{
        requisition_id: id,
        title: reqItem.title,
        previous_stage: reqItem.workflow_stage || 'Submitted',
        new_stage: newStatus === 'Approved' ? 'In Logistics Processing' : 'Returned / Rejected',
        message: `${newStatus === 'Approved' ? 'Approved' : 'Rejected'}: ${remarkText}`,
        type: 'approval'
      }]);
    }

    setRequisitions(requisitions.map(r => r.id === id ? { ...r, status: newStatus, workflow_stage: newStatus === 'Approved' ? 'In Logistics Processing' : 'Returned / Rejected' } : r));
    setActionSuccess(`Requisition ${id} marked as ${newStatus}.`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  return (
    <div className="max-w-5xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <CheckSquare className="w-3.5 h-3.5" /> AUTOMATED FORM VALIDATION
          </div>
          <h1 className="text-2xl font-bold text-white">Requisition Validation & Review</h1>
          <p className="text-xs text-slate-400">Perform validation checks for completeness and duplicate titles before passing to logistics.</p>
        </div>
      </div>

      {actionSuccess && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-xs text-emerald-400">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{actionSuccess}</span>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-500">
            Fetching pending requisitions from Supabase...
          </div>
        ) : requisitions.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No Requisitions Pending Validation</p>
            <p className="text-xs text-slate-500 mt-1">Submitted requisitions will appear here for review.</p>
          </div>
        ) : (
          requisitions.map((req) => (
            <div key={req.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 transition shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-indigo-400 font-bold">{req.id}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                        req.priority === 'Urgent' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        req.priority === 'High' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {req.priority} Priority
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-0.5">{req.title}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                    req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    req.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {req.status}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-4">{req.description}</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-950 border border-slate-800/80 rounded-xl text-xs text-slate-400 mb-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="truncate">{req.requestor || 'Jose Mirador'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="truncate">{req.category}</span>
                </div>
                <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                  <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="font-mono text-[11px] truncate">{new Date(req.created_at || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>

              {req.status === 'Submitted' && (
                <div className="pt-2 space-y-3">
                  <input
                    type="text"
                    placeholder="Add approval remarks or rejection grounds..."
                    value={remarks[req.id] || ''}
                    onChange={(e) => setRemarks({ ...remarks, [req.id]: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleValidationAction(req.id, 'Approved')}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Validate & Approve
                    </button>
                    <button
                      onClick={() => handleValidationAction(req.id, 'Rejected')}
                      className="flex-1 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Reject Request
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}