import { useState } from 'react';
import { 
  LayoutDashboard, Filter, AlertTriangle, Clock, 
  Building2, Activity, Tag, RefreshCw, Eye, CheckCircle2 
} from 'lucide-react';

interface RequisitionOverview {
  id: string;
  title: string;
  department: string;
  requestor: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  workflowStage: 'Submitted' | 'Dept Head Review' | 'In Logistics' | 'Procurement Active' | 'Completed';
  status: 'Pending' | 'In Progress' | 'Action Required' | 'Fulfilled';
  timestamp: string;
}

export default function LogisticsDashboard() {
  const [requisitions, setRequisitions] = useState<RequisitionOverview[]>([
    {
      id: 'REQ-2026-001',
      title: 'Equipment Procurement Request - IT Lab',
      department: 'College of Computing & Information Technologies',
      requestor: 'Jose Mirador',
      priority: 'High',
      workflowStage: 'In Logistics',
      status: 'In Progress',
      timestamp: '2026-09-27 14:30:12'
    },
    {
      id: 'REQ-2026-002',
      title: 'Clearance Form Verification Set',
      department: 'Registrar Office',
      requestor: 'Chōnan Tachibana',
      priority: 'Urgent',
      workflowStage: 'Dept Head Review',
      status: 'Action Required',
      timestamp: '2026-09-27 16:10:05'
    },
    {
      id: 'REQ-2026-003',
      title: 'Formal Apparel & Driver Gloves for Ceremony',
      department: 'Administrative & Human Resources',
      requestor: 'Victoria Santos',
      priority: 'Medium',
      workflowStage: 'Procurement Active',
      status: 'In Progress',
      timestamp: '2026-09-28 08:15:00'
    },
    {
      id: 'REQ-2026-004',
      title: 'Office Stationery & Printer Cartridge Refills',
      department: 'Finance & Accounting',
      requestor: 'Juan Carlos Roxas',
      priority: 'Low',
      workflowStage: 'Completed',
      status: 'Fulfilled',
      timestamp: '2026-09-28 09:40:22'
    }
  ]);

  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedReq, setSelectedReq] = useState<RequisitionOverview | null>(null);

  const departments = [
    'All',
    'College of Computing & Information Technologies',
    'Registrar Office',
    'Administrative & Human Resources',
    'Finance & Accounting',
    'Student Affairs Office'
  ];

  const filteredRequisitions = requisitions.filter((item) => {
    const matchesDept = selectedDept === 'All' || item.department === selectedDept;
    const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;
    return matchesDept && matchesStatus;
  });

  const handleStageAdvance = (id: string, nextStage: RequisitionOverview['workflowStage'], nextStatus: RequisitionOverview['status']) => {
    setRequisitions((prev) =>
      prev.map((req) => (req.id === id ? { ...req, workflowStage: nextStage, status: nextStatus } : req))
    );
    setSelectedReq(null);
  };

  return (
    <div className="max-w-6xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <LayoutDashboard className="w-4 h-4" /> Logistics Staff Operations
          </div>
          <h1 className="text-2xl font-bold text-white">DP-16: Institution-Wide Workflow Dashboard</h1>
          <p className="text-xs text-slate-400">Monitor active requisitions across all departments and track real-time workflow stages.</p>
        </div>

        <button 
          onClick={() => setRequisitions([...requisitions])}
          className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-300 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-indigo-400" /> Refresh Live Queue
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Total Active</p>
            <p className="text-2xl font-bold text-white mt-1">{requisitions.filter(r => r.status !== 'Fulfilled').length}</p>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-red-500/30 p-4 rounded-2xl flex items-center justify-between bg-red-500/5">
          <div>
            <p className="text-xs font-medium text-red-400">High / Urgent Priority</p>
            <p className="text-2xl font-bold text-red-400 mt-1">
              {requisitions.filter(r => r.priority === 'High' || r.priority === 'Urgent').length}
            </p>
          </div>
          <div className="p-3 bg-red-500/10 text-red-400 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">In Procurement Stage</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">
              {requisitions.filter(r => r.workflowStage === 'Procurement Active' || r.workflowStage === 'In Logistics').length}
            </p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Completed & Fulfilled</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {requisitions.filter(r => r.status === 'Fulfilled').length}
            </p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 font-medium">Filter By:</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs"
            >
              {departments.map((dept, i) => (
                <option key={i} value={dept} className="bg-slate-900 text-slate-200">{dept}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
            <Tag className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs"
            >
              <option value="All" className="bg-slate-900 text-slate-200">All Statuses</option>
              <option value="In Progress" className="bg-slate-900 text-slate-200">In Progress</option>
              <option value="Action Required" className="bg-slate-900 text-slate-200">Action Required</option>
              <option value="Fulfilled" className="bg-slate-900 text-slate-200">Fulfilled</option>
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-500">{filteredRequisitions.length} Requisition(s) Shown</span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Requisition ID</th>
                <th className="px-6 py-3.5">Title & Requestor</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Priority</th>
                <th className="px-6 py-3.5">Workflow Stage</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRequisitions.map((req) => {
                const isHighOrUrgent = req.priority === 'High' || req.priority === 'Urgent';

                return (
                  <tr 
                    key={req.id} 
                    className={`transition ${isHighOrUrgent ? 'bg-red-500/5 hover:bg-red-500/10' : 'hover:bg-slate-800/30'}`}
                  >
                    <td className="px-6 py-4 font-mono font-semibold text-indigo-400">{req.id}</td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="font-medium text-white flex items-center gap-1.5">
                        {req.title}
                        {isHighOrUrgent && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
                            HIGH PRIORITY
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">By: {req.requestor}</p>
                    </td>
                    <td className="px-6 py-4 max-w-xs text-slate-300 truncate">{req.department}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                        req.priority === 'Urgent' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        req.priority === 'High' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {req.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-[11px] font-medium">
                        {req.workflowStage}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                        req.status === 'Fulfilled' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        req.status === 'Action Required' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedReq(req)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition inline-flex items-center gap-1 text-xs font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedReq && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <span className="font-mono text-xs text-indigo-400 font-bold">{selectedReq.id}</span>
                <h2 className="text-lg font-bold text-white mt-0.5">{selectedReq.title}</h2>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Department:</span>
                  <span className="text-slate-200 font-medium">{selectedReq.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Submitted By:</span>
                  <span className="text-slate-200 font-medium">{selectedReq.requestor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Workflow Stage:</span>
                  <span className="text-indigo-400 font-semibold">{selectedReq.workflowStage}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-2">Advance Workflow Stage:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleStageAdvance(selectedReq.id, 'Procurement Active', 'In Progress')}
                    className="p-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-left transition"
                  >
                    <p className="font-semibold text-xs">Procurement Active</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Move to active sourcing</p>
                  </button>

                  <button
                    onClick={() => handleStageAdvance(selectedReq.id, 'Completed', 'Fulfilled')}
                    className="p-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-left transition"
                  >
                    <p className="font-semibold text-xs">Mark Completed</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Fulfill requisition request</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}