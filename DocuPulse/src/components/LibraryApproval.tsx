import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BookOpen, CheckCircle2, XCircle, Paperclip, ShieldAlert } from 'lucide-react';

interface LibraryRequisition {
  id: string;
  title: string;
  category: string;
  description: string;
  department: string;
  status: string;
  attachments?: string[];
}

export default function LibraryApproval() {
  const [requisitions, setRequisitions] = useState<LibraryRequisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    fetchLibraryRequisitions();
  }, []);

  const fetchLibraryRequisitions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('requisitions')
      .select('*')
      .in('category', ['Library Acquisition', 'Guidance Requisition', 'Document Approval'])
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRequisitions(data);
    }
    setLoading(false);
  };

  const handleLibraryDecision = async (req: LibraryRequisition, approved: boolean) => {
    const nextStatus = approved ? 'Approved by Library/Dept Head' : 'Rejected';
    const { error } = await supabase
      .from('requisitions')
      .update({ 
        status: nextStatus,
        workflow_stage: approved ? 'Processed' : 'Terminated'
      })
      .eq('id', req.id);

    if (!error) {
      setActionMsg(`Requisition ${req.id} was successfully ${approved ? 'approved' : 'rejected'}[cite: 11].`);
      fetchLibraryRequisitions();
    }
  };

  return (
    <div className="max-w-5xl mx-auto font-sans text-slate-100 p-4">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <BookOpen className="w-3.5 h-3.5" /> Library & Guidance Digital Approval (DP-09)[cite: 11]
        </div>
        <h1 className="text-2xl font-bold text-white">Library Acquisition Queue</h1>
        <p className="text-xs text-slate-400">Review, inspect supporting documents, and digitally sign acquisition or guidance requisitions remotely[cite: 11].</p>
      </div>

      {actionMsg && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-xs text-emerald-400">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" /> Pending Library Acquisition Requests[cite: 11]
        </h2>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading library queue...</div>
        ) : requisitions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No pending library acquisition or guidance requests found.</div>
        ) : (
          <div className="space-y-4">
            {requisitions.map((req) => (
              <div key={req.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-400">{req.id}</span>
                  <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full text-[11px]">
                    {req.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-white text-sm font-medium">{req.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{req.description}</p>
                </div>

                {req.attachments && req.attachments.length > 0 && (
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Supporting Documents Visible[cite: 11]:</span>
                    <div className="flex flex-wrap gap-2">
                      {req.attachments.map((file, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 text-indigo-300 rounded text-xs">
                          <Paperclip className="w-3 h-3" /> {file.split('/').pop()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                  <span className="text-[11px] text-slate-400">Current Status: <strong className="text-slate-200">{req.status}</strong></span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLibraryDecision(req, false)}
                      className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 rounded-xl text-xs font-semibold transition flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject[cite: 11]
                    </button>
                    <button
                      onClick={() => handleLibraryDecision(req, true)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Digitally Approve[cite: 11]
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}