import { useState } from 'react';
import { 
  Package, CheckCircle2, Truck, 
  MessageSquare, Send, Tag, Filter 
} from 'lucide-react';

interface RequisitionItem {
  id: string;
  title: string;
  category: string;
  priority: string;
  requestor: string;
  department: string;
  timestamp: string;
  status: 'Approved' | 'In Procurement' | 'Procurement Complete' | 'On Hold';
  processingRemarks: string[];
}

export default function LogisticsProcessing() {
  const [requisitions, setRequisitions] = useState<RequisitionItem[]>([
    {
      id: 'REQ-2026-001',
      title: 'Equipment Procurement Request - IT Lab',
      category: 'Equipment / Hardware',
      priority: 'High',
      requestor: 'Jose Mirador',
      department: 'College of Computing & Information Technologies',
      timestamp: '2026-09-27 14:30:12',
      status: 'Approved',
      processingRemarks: ['Approved by Department Head. Transferred to Logistics.']
    },
    {
      id: 'REQ-2026-004',
      title: '20x High-Tube Winter/Sports Socks & Belts',
      category: 'Administrative Form',
      priority: 'Medium',
      requestor: 'Victoria Santos',
      department: 'Administrative & Human Resources',
      timestamp: '2026-09-28 09:15:00',
      status: 'In Procurement',
      processingRemarks: ['Vendor purchase order issued to supplier.', 'Awaiting batch delivery arrival.']
    }
  ]);

  const [selectedReq, setSelectedReq] = useState<RequisitionItem | null>(null);
  const [newRemark, setNewRemark] = useState('');
  const [newStatus, setNewStatus] = useState<RequisitionItem['status']>('In Procurement');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const handleUpdateLogistics = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    const updatedRemarks = newRemark.trim() 
      ? [...selectedReq.processingRemarks, `[${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}] ${newRemark.trim()}`]
      : selectedReq.processingRemarks;

    const updatedList = requisitions.map((item) => {
      if (item.id === selectedReq.id) {
        return {
          ...item,
          status: newStatus,
          processingRemarks: updatedRemarks
        };
      }
      return item;
    });

    setRequisitions(updatedList);
    setSelectedReq(null);
    setNewRemark('');
  };

  const filteredRequisitions = requisitions.filter(req => {
    if (filterStatus === 'All') return true;
    return req.status === filterStatus;
  });

  return (
    <div className="max-w-5xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Truck className="w-4 h-4" /> Logistics Officer Workspace
          </div>
          <h1 className="text-2xl font-bold text-white">Approved Requisition Processing</h1>
          <p className="text-xs text-slate-400">Process approved requisitions, record procurement remarks, and push live status updates to requestors.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-transparent text-slate-200 focus:outline-none cursor-pointer pr-2"
          >
            <option value="All" className="bg-slate-900 text-slate-200">All Requests</option>
            <option value="Approved" className="bg-slate-900 text-slate-200">Pending Logistics Action</option>
            <option value="In Procurement" className="bg-slate-900 text-slate-200">In Procurement</option>
            <option value="Procurement Complete" className="bg-slate-900 text-slate-200">Procurement Complete</option>
            <option value="On Hold" className="bg-slate-900 text-slate-200">On Hold</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Ready for Processing</p>
            <p className="text-2xl font-bold text-indigo-400 mt-1">
              {requisitions.filter(r => r.status === 'Approved').length}
            </p>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Active Procurement</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">
              {requisitions.filter(r => r.status === 'In Procurement').length}
            </p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Fulfilled & Logged</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {requisitions.filter(r => r.status === 'Procurement Complete').length}
            </p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-sm text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-indigo-400" />
            Approved Procurement Queue
          </h2>
          <span className="text-xs text-slate-400">{filteredRequisitions.length} Item(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Requisition ID</th>
                <th className="px-6 py-3.5">Title & Requestor</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Latest Remark</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRequisitions.map((req) => (
                <tr key={req.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-6 py-4 font-mono font-semibold text-indigo-400">{req.id}</td>
                  <td className="px-6 py-4 max-w-xs">
                    <p className="font-medium text-white">{req.title}</p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">By: {req.requestor} ({req.department})</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-[11px]">
                      <Tag className="w-3 h-3 text-slate-400" /> {req.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-xs text-slate-400 truncate">
                    {req.processingRemarks[req.processingRemarks.length - 1] || 'No remarks recorded'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full font-medium text-[11px] ${
                      req.status === 'Approved' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                      req.status === 'In Procurement' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      req.status === 'Procurement Complete' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => { setSelectedReq(req); setNewStatus(req.status); setNewRemark(''); }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition inline-flex items-center gap-1.5 text-xs font-medium shadow"
                    >
                      Process / Log
                    </button>
                  </td>
                </tr>
              ))}
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

            <form onSubmit={handleUpdateLogistics} className="space-y-4">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Requestor:</span>
                  <span className="text-slate-200 font-medium">{selectedReq.requestor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Department:</span>
                  <span className="text-slate-200 font-medium">{selectedReq.department}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Update Procurement Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as RequisitionItem['status'])}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="In Procurement">In Procurement (Procurement activities begin)</option>
                  <option value="Procurement Complete">Procurement Complete (Items received/fulfilled)</option>
                  <option value="On Hold">On Hold (Vendor delay or clarification needed)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Add Processing Remarks</label>
                <textarea
                  rows={3}
                  placeholder="Record PO numbers, vendor quotes, or delivery timelines..."
                  value={newRemark}
                  onChange={(e) => setNewRemark(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              {selectedReq.processingRemarks.length > 0 && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <p className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> Processing Log Trail:
                  </p>
                  <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                    {selectedReq.processingRemarks.map((remark, idx) => (
                      <p key={idx} className="text-[11px] text-slate-300 border-l-2 border-indigo-500/40 pl-2 py-0.5">
                        {remark}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" /> Log & Notify Requestor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}