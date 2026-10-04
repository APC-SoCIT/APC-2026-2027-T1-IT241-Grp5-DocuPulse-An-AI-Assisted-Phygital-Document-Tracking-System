import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Truck, Receipt, MonitorCheck, BookOpen, LogOut, FileText, CheckCircle, Clock, Shield, Plus, X, Loader2, RefreshCw } from 'lucide-react';

interface DashboardProps {
  user: any;
  onSignOut: () => void;
}

export function RequestorDashboard({ user, onSignOut }: DashboardProps) {
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [documentType, setDocumentType] = useState('Official Transcript of Records (OTR)');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchRequisitions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('document_requisitions')
      .select('*')
      .eq('requestor_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRequisitions(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequisitions();
  }, [user.id]);

  const handleSubmitRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    const trackingNo = `DP-${Math.floor(100000 + Math.random() * 900000)}`;
    const userDept = user?.user_metadata?.department || 'School of Information Technology (SoCIT)';

    const { error } = await supabase.from('document_requisitions').insert([
      {
        requestor_id: user.id,
        document_type: documentType,
        department: userDept,
        tracking_number: trackingNo,
        status: 'Pending Review',
        remarks: remarks.trim() || null
      }
    ]);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setIsModalOpen(false);
      setRemarks('');
      fetchRequisitions();
    }
    setSubmitting(false);
  };

  const activeCount = requisitions.filter(r => r.status !== 'Completed' && r.status !== 'Rejected').length;
  const completedCount = requisitions.filter(r => r.status === 'Completed').length;

  return (
    <DashboardLayout title="Requestor Portal" role="Requestor" badgeColor="bg-indigo-500/20 text-indigo-400 border-indigo-500/30" icon={<User className="w-5 h-5 text-indigo-400" />} user={user} onSignOut={onSignOut}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Active Requisitions" value={activeCount.toString()} icon={<Clock className="w-4 h-4 text-amber-400" />} />
        <StatCard label="Approved Documents" value={completedCount.toString()} icon={<CheckCircle className="w-4 h-4 text-emerald-400" />} />
        <StatCard label="Department" value={user?.user_metadata?.department || 'N/A'} icon={<FileText className="w-4 h-4 text-indigo-400" />} />
      </div>

      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 mb-1">Submit New Document Requisition</h3>
            <p className="text-xs text-slate-400">Select required academic or administrative records to initialize phygital tracking.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" /> New Request
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-slate-200 mb-4">Your Requisitions Queue</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-xs text-slate-500 gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> Fetching requisitions...
          </div>
        ) : requisitions.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No requisitions submitted yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="pb-3 px-2">Tracking No.</th>
                  <th className="pb-3 px-2">Document Type</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2">Date Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {requisitions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-2 font-mono text-indigo-400 font-semibold">{item.tracking_number}</td>
                    <td className="py-3 px-2 text-slate-200">{item.document_type}</td>
                    <td className="py-3 px-2">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-slate-400">{new Date(item.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">New Requisition Request</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmitRequisition} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Document Type</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="Official Transcript of Records (OTR)">Official Transcript of Records (OTR)</option>
                  <option value="Certificate of Grades (COG)">Certificate of Grades (COG)</option>
                  <option value="Certificate of Enrollment (COE)">Certificate of Enrollment (COE)</option>
                  <option value="Diploma / Graduation Certificate">Diploma / Graduation Certificate</option>
                  <option value="Honorable Dismissal / Transfer Credentials">Honorable Dismissal / Transfer Credentials</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Purpose / Remarks (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="State purpose of request (e.g., employment, scholarship, transfer)"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Submit Requisition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
function StaffQueueTable({ roleName, actionLabels }: { roleName: string; actionLabels: { primary: string; secondary: string; primaryStatus: string; secondaryStatus: string } }) {
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('document_requisitions')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setRequisitions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    setProcessingId(id);
    await supabase
      .from('document_requisitions')
      .update({ status: newStatus })
      .eq('id', id);

    fetchQueue();
    setProcessingId(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-200">{roleName} Review Queue</h3>
        <button onClick={fetchQueue} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 transition">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-xs text-slate-500 gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> Fetching pending requisitions...
        </div>
      ) : requisitions.length === 0 ? (
        <p className="text-xs text-slate-500 py-6 text-center">No requisitions in the queue.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="pb-3 px-2">Tracking No.</th>
                <th className="pb-3 px-2">Department</th>
                <th className="pb-3 px-2">Document</th>
                <th className="pb-3 px-2">Current Status</th>
                <th className="pb-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {requisitions.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-2 font-mono text-cyan-400 font-semibold">{item.tracking_number}</td>
                  <td className="py-3 px-2 text-slate-300">{item.department}</td>
                  <td className="py-3 px-2 text-slate-200">{item.document_type}</td>
                  <td className="py-3 px-2">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => updateStatus(item.id, actionLabels.secondaryStatus)}
                        disabled={processingId === item.id}
                        className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-[11px] font-semibold transition"
                      >
                        {actionLabels.secondary}
                      </button>
                      <button
                        onClick={() => updateStatus(item.id, actionLabels.primaryStatus)}
                        disabled={processingId === item.id}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold transition shadow-md shadow-emerald-600/20"
                      >
                        {actionLabels.primary}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function LogisticsDashboard({ user, onSignOut }: DashboardProps) {
  return (
    <DashboardLayout title="Logistics & Dispatch" role="Logistics Officer" badgeColor="bg-cyan-500/20 text-cyan-400 border-cyan-500/30" icon={<Truck className="w-5 h-5 text-cyan-400" />} user={user} onSignOut={onSignOut}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Pending Deliveries" value="8" icon={<Clock className="w-4 h-4 text-amber-400" />} />
        <StatCard label="Dispatched Today" value="24" icon={<CheckCircle className="w-4 h-4 text-cyan-400" />} />
        <StatCard label="Active Smart Lockers" value="100%" icon={<Shield className="w-4 h-4 text-emerald-400" />} />
      </div>
      <StaffQueueTable
        roleName="Logistics Dispatch"
        actionLabels={{
          primary: 'Dispatch Package',
          secondary: 'Mark Delivery Hold',
          primaryStatus: 'In Transit',
          secondaryStatus: 'Logistics Hold'
        }}
      />
    </DashboardLayout>
  );
}

export function FinanceDashboard({ user, onSignOut }: DashboardProps) {
  return (
    <DashboardLayout title="Finance & Treasury" role="Finance Officer" badgeColor="bg-emerald-500/20 text-emerald-400 border-emerald-500/30" icon={<Receipt className="w-5 h-5 text-emerald-400" />} user={user} onSignOut={onSignOut}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Pending Payments" value="5" icon={<Clock className="w-4 h-4 text-amber-400" />} />
        <StatCard label="Verified Today" value="41" icon={<CheckCircle className="w-4 h-4 text-emerald-400" />} />
        <StatCard label="Account Balance Holds" value="2" icon={<Shield className="w-4 h-4 text-red-400" />} />
      </div>
      <StaffQueueTable
        roleName="Finance Clearance"
        actionLabels={{
          primary: 'Clear Payment',
          secondary: 'Apply Balance Hold',
          primaryStatus: 'Payment Cleared',
          secondaryStatus: 'Finance Hold'
        }}
      />
    </DashboardLayout>
  );
}

export function ItroDashboard({ user, onSignOut }: DashboardProps) {
  return (
    <DashboardLayout title="IT Resource Office (ITRO)" role="ITRO Staff" badgeColor="bg-blue-500/20 text-blue-400 border-blue-500/30" icon={<MonitorCheck className="w-5 h-5 text-blue-400" />} user={user} onSignOut={onSignOut}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Active System Users" value="1,240" icon={<User className="w-4 h-4 text-blue-400" />} />
        <StatCard label="IoT Nodes Online" value="16/16" icon={<CheckCircle className="w-4 h-4 text-emerald-400" />} />
        <StatCard label="Security Logs" value="Normal" icon={<Shield className="w-4 h-4 text-emerald-400" />} />
      </div>
      <StaffQueueTable
        roleName="System Operations"
        actionLabels={{
          primary: 'Approve System Release',
          secondary: 'Flag Exception',
          primaryStatus: 'Completed',
          secondaryStatus: 'Rejected'
        }}
      />
    </DashboardLayout>
  );
}

export function LibraryDashboard({ user, onSignOut }: DashboardProps) {
  return (
    <DashboardLayout title="Library & Media Center" role="Librarian" badgeColor="bg-amber-500/20 text-amber-400 border-amber-500/30" icon={<BookOpen className="w-5 h-5 text-amber-400" />} user={user} onSignOut={onSignOut}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Pending Book Holds" value="4" icon={<Clock className="w-4 h-4 text-amber-400" />} />
        <StatCard label="Cleared Requisitions" value="18" icon={<CheckCircle className="w-4 h-4 text-emerald-400" />} />
        <StatCard label="Unreturned Items" value="1" icon={<Shield className="w-4 h-4 text-red-400" />} />
      </div>
      <StaffQueueTable
        roleName="Library Resource Clearance"
        actionLabels={{
          primary: 'Grant Clearance',
          secondary: 'Unreturned Resource Hold',
          primaryStatus: 'Library Cleared',
          secondaryStatus: 'Library Hold'
        }}
      />
    </DashboardLayout>
  );
}

function DashboardLayout({ title, role, badgeColor, icon, user, onSignOut, children }: any) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl mb-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
              {icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white">{title}</h1>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badgeColor}`}>
                  {role}
                </span>
              </div>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={onSignOut}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
      <div>
        <p className="text-[11px] font-medium text-slate-400">{label}</p>
        <p className="text-lg font-bold text-white mt-0.5">{value}</p>
      </div>
      <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl">{icon}</div>
    </div>
  );
}