import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Clock, Building, ShieldCheck, RefreshCw, FileText } from 'lucide-react';

interface RequisitionTrackerItem {
  id: string;
  title: string;
  category: string;
  priority: string;
  description: string;
  workflow_stage: string;
  department: string;
  status: string;
  updated_at?: string;
  created_at?: string;
}

export default function RequisitionTracker() {
  const [requisitions, setRequisitions] = useState<RequisitionTrackerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSynced, setLastSynced] = useState<string>(new Date().toLocaleTimeString());

  const fetchTrackingData = async () => {
    const { data, error } = await supabase
      .from('requisitions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRequisitions(data);
      setLastSynced(new Date().toLocaleTimeString());
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTrackingData();
    const interval = setInterval(() => {
      fetchTrackingData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredRequisitions = requisitions.filter(req =>
    req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.workflow_stage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto font-sans text-slate-100">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <FileText className="w-3.5 h-3.5" /> REAL-TIME TRACKING & STATUS (DP-05)[cite: 7]
          </div>
          <h1 className="text-2xl font-bold text-white">Live Requisition Monitor</h1>
          <p className="text-xs text-slate-400">Track current workflow stages and handling departments with automatic updates[cite: 7].</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 flex items-center gap-1 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl">
            <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" /> Synced: {lastSynced}
          </span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl mb-6">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by ID, title, workflow stage, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
          <span className="text-xs text-slate-400 shrink-0">{filteredRequisitions.length} Tracked Requests</span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Connecting to real-time tracking stream...</div>
          ) : filteredRequisitions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No active tracking records found.</div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Requisition ID</th>
                  <th className="px-6 py-3.5">Title</th>
                  <th className="px-6 py-3.5">Workflow Stage[cite: 7]</th>
                  <th className="px-6 py-3.5">Handling Department[cite: 7]</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRequisitions.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4 font-mono font-semibold text-indigo-400">{req.id}</td>
                    <td className="px-6 py-4 font-medium text-white">{req.title}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-lg text-[11px] font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> {req.workflow_stage || 'Department Head Review'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-[11px]">
                        <Building className="w-3.5 h-3.5 text-slate-400" /> {req.department || 'College of Computing & IT'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-medium text-[11px]">
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(req.updated_at || req.created_at || Date.now()).toLocaleTimeString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}