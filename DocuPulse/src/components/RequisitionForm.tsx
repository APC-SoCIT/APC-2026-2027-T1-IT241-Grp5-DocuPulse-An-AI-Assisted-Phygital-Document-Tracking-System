import React, { useState } from 'react';
import { 
  PlusCircle, Clock, Send, X, Tag, FolderKanban, CheckCircle2 
} from 'lucide-react';

interface Requisition {
  id: string;
  title: string;
  category: string;
  priority: string;
  description: string;
  timestamp: string;
  status: string;
}

export default function RequisitionForm() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([
    {
      id: 'REQ-2026-001',
      title: 'Equipment Procurement Request - IT Lab',
      category: 'Equipment / Hardware',
      priority: 'High',
      description: 'Request for additional lab equipment for the IT241 course.',
      timestamp: '2026-09-27 14:30:12',
      status: 'Submitted'
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reqTitle, setReqTitle] = useState('');
  const [reqCategory, setReqCategory] = useState('Document Approval');
  const [reqPriority, setReqPriority] = useState('Medium');
  const [reqDescription, setReqDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [confirmationMsg, setConfirmationMsg] = useState<{ id: string; timestamp: string; title: string } | null>(null);

  const handleRequisitionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!reqTitle.trim() || !reqDescription.trim()) {
      setFormError('Please fill in all required fields (Title and Description).');
      return;
    }

    const randomNum = Math.floor(100 + Math.random() * 900);
    const newReqId = `REQ-2026-${randomNum}`;
    const now = new Date();
    const formattedTimestamp = now.toISOString().replace('T', ' ').substring(0, 19);

    const newRequisition: Requisition = {
      id: newReqId,
      title: reqTitle,
      category: reqCategory,
      priority: reqPriority,
      description: reqDescription,
      timestamp: formattedTimestamp,
      status: 'Submitted'
    };

    setRequisitions([newRequisition, ...requisitions]);
    setConfirmationMsg({ id: newReqId, timestamp: formattedTimestamp, title: reqTitle });

    setReqTitle('');
    setReqCategory('Document Approval');
    setReqPriority('Medium');
    setReqDescription('');
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">DP-01: Digital Requisition Submission</h1>
          <p className="text-xs text-slate-400">Submit new requisition forms digitally without manual processing.</p>
        </div>
        
        <button
          onClick={() => { setIsModalOpen(true); setFormError(''); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition"
        >
          <PlusCircle className="w-4 h-4" /> Submit Requisition
        </button>
      </div>

      {confirmationMsg && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start justify-between gap-3 text-xs text-emerald-400 relative">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
            <div>
              <p className="font-semibold text-emerald-300 text-sm">Requisition Submitted Successfully!</p>
              <p className="mt-1 text-slate-300">
                Requisition ID: <span className="font-mono text-emerald-400 font-bold">{confirmationMsg.id}</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Recorded Timestamp: <span className="font-mono text-slate-300">{confirmationMsg.timestamp}</span>
              </p>
            </div>
          </div>
          <button onClick={() => setConfirmationMsg(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-sm text-white flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-indigo-400" />
            Submitted Requisitions
          </h2>
          <span className="text-xs text-slate-400">{requisitions.length} Total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Requisition ID</th>
                <th className="px-6 py-3.5">Title & Description</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Submission Timestamp</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {requisitions.map((req) => (
                <tr key={req.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-6 py-4 font-mono font-semibold text-indigo-400">{req.id}</td>
                  <td className="px-6 py-4 max-w-xs">
                    <p className="font-medium text-white">{req.title}</p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{req.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-[11px]">
                      <Tag className="w-3 h-3 text-slate-400" /> {req.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {req.timestamp}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-medium text-[11px]">
                      {req.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-indigo-400" /> Digital Requisition Form
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Fill in the details to submit a new requisition request.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <p className="mb-4 text-xs text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">{formError}</p>
            )}

            <form onSubmit={handleRequisitionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Requisition Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Clearance Certificate Verification Request"
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={reqCategory}
                    onChange={(e) => setReqCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  >
                    <option value="Document Approval">Document Approval</option>
                    <option value="Academic Record">Academic Record</option>
                    <option value="Equipment / Hardware">Equipment / Hardware</option>
                    <option value="Administrative Form">Administrative Form</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={reqPriority}
                    onChange={(e) => setReqPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Detailed Description *</label>
                <textarea
                  rows={3}
                  placeholder="Describe the purpose of this requisition..."
                  value={reqDescription}
                  onChange={(e) => setReqDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2">
                  <Send className="w-3.5 h-3.5" /> Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}