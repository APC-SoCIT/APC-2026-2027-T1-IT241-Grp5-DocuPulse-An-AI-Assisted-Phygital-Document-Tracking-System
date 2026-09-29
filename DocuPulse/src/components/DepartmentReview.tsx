import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle2, XCircle, ShieldCheck, Bell, ArrowRight } from 'lucide-react';

interface RequisitionReviewItem {
  id: string;
  title: string;
  description: string;
  department: string;
  status: string;
  workflow_stage: string;
}

interface NotificationItem {
  id: string;
  requisition_id: string;
  title: string;
  new_stage: string;
  message: string;
  created_at: string;
}

export default function DepartmentReview() {
  const [requisitions, setRequisitions] = useState<RequisitionReviewItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: reqData } = await supabase
      .from('requisitions')
      .select('*')
      .order('created_at', { ascending: false });

    if (reqData) setRequisitions(reqData);

    const { data: notifData } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (notifData) setNotifications(notifData);

    setLoading(false);
  };

  const handleAuthorize = async (req: RequisitionReviewItem, approved: boolean) => {
    const nextStage = approved ? 'Finance Review' : 'Rejected by Department Head';
    const nextStatus = approved ? 'pending_finance' : 'rejected';

    const { error } = await supabase
      .from('requisitions')
      .update({
        workflow_stage: nextStage,
        status: nextStatus,
        department_head_status: approved ? 'Approved' : 'Rejected',
        department_head_time: new Date().toISOString()
      })
      .eq('id', req.id);

    if (!error) {
      await supabase.from('notifications').insert([{
        requisition_id: req.id,
        title: req.title,
        previous_stage: req.workflow_stage || 'Department Head Review',
        new_stage: nextStage,
        message: approved ? 'Authorized by Department Head. Requisition forwarded to Finance.' : 'Requisition rejected during Department Head review.',
        type: 'stage_change'
      }]);

      setActionMsg(`Requisition ${req.id} successfully processed and notification generated[cite: 10].`);
      fetchData();
    }
  };

  return (
    <div className="max-w-5xl mx-auto font-sans text-slate-100 p-4">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <ShieldCheck className="w-3.5 h-3.5" /> Department Head Review (DP-08)[cite: 10]
        </div>
        <h1 className="text-2xl font-bold text-white">Requisition Authorization Gate</h1>
        <p className="text-xs text-slate-400">Review requisition forms and authorize valid requests to proceed to Finance with automatic notification logs[cite: 10].</p>
      </div>

      {actionMsg && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-xs text-emerald-400">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" /> Pending Department Head Reviews
          </h2>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading requisitions...</div>
          ) : requisitions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No requisitions require review.</div>
          ) : (
            <div className="space-y-4">
              {requisitions.map((req) => (
                <div key={req.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-400">{req.id}</span>
                    <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full text-[11px]">
                      {req.workflow_stage || 'Department Head Review'}[cite: 10]
                    </span>
                  </div>
                  <div>
                    <h3 className="text-white text-sm font-medium">{req.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{req.description}</p>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
                    <button
                      onClick={() => handleAuthorize(req, false)}
                      className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 rounded-xl text-xs font-semibold transition flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button
                      onClick={() => handleAuthorize(req, true)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Authorize to Finance[cite: 10] <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-fit">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-400" /> Stored Notification History[cite: 10]
          </h2>

          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No notifications generated yet.</p>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-indigo-400">{notif.requisition_id}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{new Date(notif.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-white font-medium">{notif.title}</p>
                  <p className="text-[11px] text-slate-400">{notif.message}</p>
                  <div className="pt-1">
                    <span className="inline-block px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">
                      Stage: {notif.new_stage}[cite: 10]
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}