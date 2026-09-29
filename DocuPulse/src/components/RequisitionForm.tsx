import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  PlusCircle, Clock, Send, X, Tag, FolderKanban, CheckCircle2, FileText, AlertTriangle, Upload, Paperclip, Search, History 
} from 'lucide-react';

interface Requisition {
  id: string;
  title: string;
  category: string;
  priority: string;
  description: string;
  created_at?: string;
  status: string;
  attachments?: string[];
}

export interface RequisitionFormProps {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  onClose?: () => void;
  onSuccess?: () => void | Promise<void>;
}

export default function RequisitionForm({ user, onClose, onSuccess }: RequisitionFormProps) {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reqTitle, setReqTitle] = useState('');
  const [reqCategory, setReqCategory] = useState('Document Approval');
  const [reqPriority, setReqPriority] = useState('Medium');
  const [reqDescription, setReqDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReq, setSelectedReq] = useState<Requisition | null>(null);

  const [formError, setFormError] = useState('');
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [confirmationMsg, setConfirmationMsg] = useState<{ id: string; timestamp: string; title: string } | null>(null);

  useEffect(() => {
    fetchRequisitions();
  }, []);

  const fetchRequisitions = async () => {
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

  const handleClose = () => {
    setMissingFields([]);
    setDuplicateWarning(false);
    setFormError('');
    setSelectedFiles([]);
    if (onClose) {
      onClose();
    } else {
      setIsModalOpen(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
    }
  };

  const handleRequisitionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setMissingFields([]);
    setDuplicateWarning(false);

    const missing: string[] = [];
    if (!reqTitle.trim()) missing.push('Requisition Title');
    if (!reqDescription.trim()) missing.push('Detailed Description');

    if (missing.length > 0) {
      setMissingFields(missing);
      setFormError('Form completeness check failed. Please fill in all required fields highlighted below.');
      return;
    }

    setLoading(true);

    try {
      const { data: existingReqs, error: queryError } = await supabase
        .from('requisitions')
        .select('title')
        .eq('title', reqTitle.trim());

      if (queryError) throw queryError;

      if (existingReqs && existingReqs.length > 0) {
        setDuplicateWarning(true);
        setFormError('Duplicate submission flagged: A requisition with this exact title already exists in the system.');
        setLoading(false);
        return;
      }

      const randomNum = Math.floor(100 + Math.random() * 900);
      const newReqId = `REQ-2026-${randomNum}`;

      const uploadedFilePaths: string[] = [];
      for (const file of selectedFiles) {
        const filePath = `attachments/${newReqId}/${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('requisition-files')
          .upload(filePath, file);
        
        if (!uploadError) {
          uploadedFilePaths.push(filePath);
        }
      }

      const newPayload = {
        id: newReqId,
        title: reqTitle.trim(),
        category: reqCategory,
        priority: reqPriority,
        description: reqDescription.trim(),
        requestor_id: user?.id || null,
        requestor: user?.name || 'Jose Mirador',
        requestor_email: user?.email || '',
        department: 'College of Computing & Information Technologies',
        workflow_stage: 'Department Head Review',
        status: 'pending_dh',
        attachments: uploadedFilePaths
      };

      const { data, error } = await supabase
        .from('requisitions')
        .insert([newPayload])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const inserted = data[0];
        setRequisitions([inserted, ...requisitions]);
        setConfirmationMsg({ 
          id: inserted.id, 
          timestamp: new Date(inserted.created_at || Date.now()).toLocaleString(), 
          title: inserted.title 
        });

        await supabase.from('notifications').insert([{
          requisition_id: inserted.id,
          title: inserted.title,
          previous_stage: 'Draft',
          new_stage: 'pending_dh',
          message: 'Validation passed with attachments. Requisition routed to Department Head approval.',
          type: 'stage_change'
        }]);

        setReqTitle('');
        setReqCategory('Document Approval');
        setReqPriority('Medium');
        setReqDescription('');
        setSelectedFiles([]);

        if (onSuccess) {
          await onSuccess();
        }

        handleClose();
      }
    } catch (err: any) {
      setFormError(`Database or storage error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequisitions = requisitions.filter(req => 
    req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderFormContent = () => (
    <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-400" /> Digital Requisition Form
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Automated validation with multiple supporting file attachments.</p>
        </div>
        <button onClick={handleClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      {formError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-xs text-red-400">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <div>
            <p className="font-semibold">{formError}</p>
            {duplicateWarning && (
              <p className="text-[11px] text-red-300/80 mt-1">Please modify the title to avoid redundant processing or rerouting.</p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleRequisitionSubmit} className="space-y-4">
        <div>
          <label className={`block text-xs font-medium mb-1 ${missingFields.includes('Requisition Title') ? 'text-red-400 font-bold' : 'text-slate-300'}`}>
            Requisition Title * {missingFields.includes('Requisition Title') && '(Missing)'}
          </label>
          <input
            type="text"
            placeholder="e.g. Clearance Certificate Verification Request"
            value={reqTitle}
            onChange={(e) => setReqTitle(e.target.value)}
            className={`w-full bg-slate-950 border rounded-xl py-2.5 px-3 text-xs text-slate-200 focus:outline-none transition ${
              missingFields.includes('Requisition Title') ? 'border-red-500 bg-red-500/5' : 'border-slate-800 focus:border-indigo-500'
            }`}
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
          <label className={`block text-xs font-medium mb-1 ${missingFields.includes('Detailed Description') ? 'text-red-400 font-bold' : 'text-slate-300'}`}>
            Detailed Description * {missingFields.includes('Detailed Description') && '(Missing)'}
          </label>
          <textarea
            rows={3}
            placeholder="Describe the purpose of this requisition..."
            value={reqDescription}
            onChange={(e) => setReqDescription(e.target.value)}
            className={`w-full bg-slate-950 border rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none transition resize-none ${
              missingFields.includes('Detailed Description') ? 'border-red-500 bg-red-500/5' : 'border-slate-800 focus:border-indigo-500'
            }`}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Supporting Documents</label>
          <div className="border border-dashed border-slate-700 bg-slate-950 rounded-xl p-4 text-center">
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-1.5">
              <Upload className="w-5 h-5 text-indigo-400" />
              <span className="text-xs text-slate-300 font-medium">Click to attach supporting files</span>
              <span className="text-[10px] text-slate-500">PDF, Images, DOCX, XLSX supported (Multiple allowed)</span>
            </label>
          </div>
          {selectedFiles.length > 0 && (
            <div className="mt-2 space-y-1">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-300">
                  <span className="truncate flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-indigo-400" /> {file.name}
                  </span>
                  <button type="button" onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))} className="text-slate-500 hover:text-red-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2 flex gap-3">
          <button type="button" onClick={handleClose} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2">
            <Send className="w-3.5 h-3.5" /> {loading ? 'Processing...' : 'Submit with Attachments'}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <FileText className="w-3.5 h-3.5" /> REQUESTOR DASHBOARD (DP-04)
          </div>
          <h1 className="text-2xl font-bold text-white">Requisition History & Tracking</h1>
          <p className="text-xs text-slate-400">Search past submissions, view current statuses, and track historical lifecycles.</p>
        </div>
        
        <button
          onClick={() => { setIsModalOpen(true); setFormError(''); setMissingFields([]); setDuplicateWarning(false); setSelectedFiles([]); }}
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
              <p className="font-semibold text-emerald-300 text-sm">Successfully Submitted with Supporting Documents!</p>
              <p className="mt-1 text-slate-300">
                Requisition ID: <span className="font-mono text-emerald-400 font-bold">{confirmationMsg.id}</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Timestamp: <span className="font-mono text-slate-300">{confirmationMsg.timestamp}</span>
              </p>
            </div>
          </div>
          <button onClick={() => setConfirmationMsg(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <h2 className="font-semibold text-sm text-white flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-indigo-400" />
            Submitted Requisitions ({filteredRequisitions.length})
          </h2>
          
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by ID, title, status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading requisitions from Supabase...</div>
          ) : filteredRequisitions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No matching requisitions found.</div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Requisition ID</th>
                  <th className="px-6 py-3.5">Title & Description</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Created At</th>
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
                        {new Date(req.created_at || Date.now()).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-medium text-[11px]">
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedReq(req)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition"
                      >
                        View Lifecycle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          {renderFormContent()}
        </div>
      )}

      {selectedReq && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-400" /> Requisition Lifecycle Status
                </h3>
                <p className="text-[11px] font-mono text-indigo-400 mt-0.5">{selectedReq.id}</p>
              </div>
              <button onClick={() => setSelectedReq(null)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Title</span>
                <p className="text-white font-medium mt-0.5">{selectedReq.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">Category</span>
                  <p className="text-slate-300 mt-0.5">{selectedReq.category}</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">Priority</span>
                  <p className="text-slate-300 mt-0.5">{selectedReq.priority}</p>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Current Lifecycle Status</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-emerald-400 font-semibold">{selectedReq.status}</span>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Description</span>
                <p className="text-slate-300 mt-0.5 leading-relaxed">{selectedReq.description}</p>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setSelectedReq(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}