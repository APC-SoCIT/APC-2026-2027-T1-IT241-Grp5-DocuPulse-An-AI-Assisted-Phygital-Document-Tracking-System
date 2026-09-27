import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Truck, PackageCheck, Clock, CheckCircle2, AlertCircle, 
  Tag, Send, FileText
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

export default function LogisticsProcessing() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [procurementNotes, setProcurementNotes] = useState<{ [key: string]: string }>({});
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchApprovedRequisitions();
  }, []);

  const fetchApprovedRequisitions = async () => {
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

  const handleLogisticsAction = async (id: string, newStage: string, newStatus: string) => {
    const note = procurementNotes[id] || `Logistics processing status updated to ${newStatus}.`;

    const { error: updateError } = await supabase
      .from('requisitions')
      .update({
        status: newStatus,
        workflow_stage: newStage
      })
      .eq('id', id);

    if (updateError) {
      alert(`Update error: ${updateError.message}`);
      return;
    }

    const reqItem = requisitions.find(r => r.id === id);
    if (reqItem) {
      await supabase.from('notifications').insert([{
        requisition_id: id,
        title: reqItem.title,
        previous_stage: reqItem.workflow_stage || 'Approved',
        new_stage: newStage,
        message: note,
        type: 'logistics'
      }]);
    }

    setRequisitions(requisitions.map(r => r.id === id ? { ...r, status: newStatus, workflow_stage: newStage } : r));
    setActionSuccess(`Requisition ${id} updated to ${newStatus}.`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const readyForProcurement = requisitions.filter(r => r.status === 'Approved').length;
  const activeProcurement = requisitions.filter(r => r.status === 'In Procurement' || r.workflow_stage === 'In Procurement').length;
  const fulfilledCount = requisitions.filter(r => r.status === 'Fulfilled' || r.status === 'Completed').length;

  return (
    <div className="max-w-6xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Truck className="w-3.5 h-3.5" /> LOGISTICS OFFICER WORKSPACE
          </div>
          <h1 className="text-2xl font-bold text-white">Approved Requisition Processing</h1>
          <p className="text-xs text-slate-400">Process approved requisitions, record procurement remarks, and push live status updates to requestors.</p>
        </div>
      </div>

      {actionSuccess && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-xs text-emerald-400">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{actionSuccess}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs font-medium text-slate-400 mb-1">Ready for Processing</p>
            <p className="text-2xl font-bold text-indigo-400">{readyForProcurement}</p>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs font-medium text-slate-400 mb-1">Active Procurement</p>
            <p className="text-2xl font-bold text-amber-400">{activeProcurement}</p>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs font-medium text-slate-400 mb-1">Fulfilled & Logged</p>
            <p className="text-2xl font-bold text-emerald-400">{fulfilledCount}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Procurement Queue List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-sm text-white flex items-center gap-2">
            <Truck className="w-4 h-4 text-indigo-400" /> Approved Procurement Queue
          </h2>
          <span className="text-xs text-slate-400 font-mono">{requisitions.length} Item(s)</span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading procurement queue...</div>
          ) : requisitions.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-300 font-semibold">No Approved Requisitions Available</p>
              <p className="text-slate-500 mt-1">Approved requisitions will appear here for procurement and dispatch.</p>
            </div>
          ) : (
            requisitions.map((req) => (
              <div key={req.id} className="p-6 hover:bg-slate-800/30 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-indigo-400 font-bold">{req.id}</span>
                        <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-300 border border-slate-700 rounded-md">
                          {req.category}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-0.5">{req.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">By: {req.requestor || 'Jose Mirador'} ({req.department || 'College of Computing'})</p>
                    </div>
                  </div>

                  <span className={`self-start sm:self-center px-3 py-1 text-xs font-semibold rounded-full border leading-none ${
                    req.status === 'Completed' || req.status === 'Fulfilled' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    req.status === 'In Procurement' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  }`}>
                    {req.status}
                  </span>
                </div>

                <p className="text-xs text-slate-300 mb-4">{req.description}</p>

                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="text"
                    placeholder="Log procurement note or dispatch tracking ID..."
                    value={procurementNotes[req.id] || ''}
                    onChange={(e) => setProcurementNotes({ ...procurementNotes, [req.id]: e.target.value })}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  />

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLogisticsAction(req.id, 'In Procurement', 'In Procurement')}
                      className="flex-1 sm:flex-none py-2 px-3 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <Truck className="w-3.5 h-3.5" /> Start Procurement
                    </button>
                    <button
                      onClick={() => handleLogisticsAction(req.id, 'Fulfilled & Logged', 'Completed')}
                      className="flex-1 sm:flex-none py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Fulfilled
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}