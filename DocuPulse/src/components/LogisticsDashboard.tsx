import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  LayoutDashboard, RefreshCw, Activity, AlertTriangle, Clock, 
  CheckCircle2, Eye, Filter, ArrowUpDown
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

export default function LogisticsDashboard() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
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

  const filteredItems = requisitions.filter(item => {
    const matchesDept = filterDepartment === 'All' || item.department === filterDepartment;
    const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
    return matchesDept && matchesStatus;
  });

  const totalActive = requisitions.filter(r => r.status !== 'Completed' && r.status !== 'Rejected').length;
  const highPriority = requisitions.filter(r => r.priority === 'High' || r.priority === 'Urgent').length;
  const inProcurement = requisitions.filter(r => r.workflow_stage === 'In Logistics Processing' || r.status === 'In Procurement').length;
  const completed = requisitions.filter(r => r.status === 'Completed' || r.status === 'Approved').length;

  return (
    <div className="max-w-6xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <LayoutDashboard className="w-3.5 h-3.5" /> LOGISTICS STAFF OPERATIONS
          </div>
          <h1 className="text-2xl font-bold text-white">Institution Workflow Dashboard</h1>
          <p className="text-xs text-slate-400">Monitor active requisitions across all departments and track real-time workflow stages.</p>
        </div>

        <button
          onClick={fetchQueue}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 text-xs font-semibold rounded-xl transition shadow-lg"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} /> Refresh Live Queue
        </button>
      </div>

      {/* KPI Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs font-medium text-slate-400 mb-1">Total Active</p>
            <p className="text-2xl font-bold text-white">{totalActive}</p>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs font-medium text-slate-400 mb-1">High / Urgent Priority</p>
            <p className="text-2xl font-bold text-amber-400">{highPriority}</p>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs font-medium text-slate-400 mb-1">In Procurement Stage</p>
            <p className="text-2xl font-bold text-indigo-300">{inProcurement}</p>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs font-medium text-slate-400 mb-1">Completed & Fulfilled</p>
            <p className="text-2xl font-bold text-emerald-400">{completed}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mr-2">
            <Filter className="w-3.5 h-3.5 text-indigo-400" /> Filter By:
          </div>

          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 transition"
          >
            <option value="All">All Departments</option>
            <option value="College of Computing & Information Technologies">College of Computing</option>
            <option value="Registrar Office">Registrar Office</option>
            <option value="Administrative & Human Resources">Administrative & HR</option>
            <option value="Finance & Accounting">Finance & Accounting</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 transition"
          >
            <option value="All">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Approved">Approved</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <p className="text-xs text-slate-400 font-mono">{filteredItems.length} Requisition(s) Shown</p>
      </div>

      {/* Main Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-4 font-mono">Requisition ID</th>
                <th className="px-5 py-4">Title & Requestor</th>
                <th className="px-5 py-4">Department</th>
                <th className="px-5 py-4 text-center">Priority</th>
                <th className="px-5 py-4 text-center">Workflow Stage</th>
                <th className="px-5 py-4 text-center">Status</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-slate-500">
                    Loading workflow queue...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-slate-500">
                    No requisitions match selected filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-5 py-4 font-mono font-bold text-indigo-400 whitespace-nowrap">{req.id}</td>
                    <td className="px-5 py-4 max-w-xs">
                      <p className="font-bold text-white text-xs leading-snug">{req.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">By: {req.requestor || 'Jose Mirador'}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-300 text-xs max-w-xs truncate">{req.department || 'College of Computing'}</td>
                    
                    {/* Priority Badge */}
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-1 text-[11px] font-semibold rounded-lg border leading-none ${
                        req.priority === 'Urgent' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        req.priority === 'High' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {req.priority}
                      </span>
                    </td>

                    {/* Workflow Stage Badge */}
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <span className="inline-block px-3 py-1 text-[11px] font-medium bg-slate-800/90 text-indigo-300 border border-slate-700 rounded-lg leading-none">
                        {req.workflow_stage || 'Submitted'}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <span className={`inline-block px-3 py-1 text-[11px] font-semibold rounded-full border leading-none ${
                        req.status === 'Approved' || req.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        req.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {req.status || 'Submitted'}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <button 
                        onClick={() => alert(`Details for ${req.id}:\n\nTitle: ${req.title}\nDescription: ${req.description}`)}
                        className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg transition inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}