import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Search, 
  RefreshCw, 
  FileText, 
  ShieldCheck, 
  LogOut,
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface FinanceDashboardProps {
  user: any;
  onSignOut: () => void;
}

interface Requisition {
  id: string;
  created_at: string;
  student_name: string;
  student_id: string;
  document_type: string;
  amount: number;
  payment_status: 'Pending' | 'Verified' | 'Rejected';
  receipt_url?: string;
  notes?: string;
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ user, onSignOut }) => {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequisitions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('requisitions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequisitions(data || []);
    } catch (err) {
      console.error('Error fetching financial records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequisitions();

    const channel = supabase
      .channel('finance-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requisitions' }, () => {
        fetchRequisitions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleVerifyPayment = async (id: string, status: 'Verified' | 'Rejected') => {
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from('requisitions')
        .update({ 
          payment_status: status,
          verified_by: user.email,
          verified_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      await fetchRequisitions();
    } catch (err) {
      alert('Failed to update status.');
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const totalVerified = requisitions
    .filter(r => r.payment_status === 'Verified')
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  const pendingCount = requisitions.filter(r => r.payment_status === 'Pending').length;
  const verifiedCount = requisitions.filter(r => r.payment_status === 'Verified').length;

  const filteredRequisitions = requisitions.filter(req => {
    const matchesSearch = 
      req.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.document_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'All' || req.payment_status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Finance & Treasury Portal
              <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400">
                Auditor View
              </span>
            </h1>
            <p className="text-xs text-slate-400">Fee Verification & Payment Audit Queue</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400 hidden sm:inline">
            Logged in as <strong className="text-slate-200">{user?.email}</strong>
          </span>
          <button
            onClick={onSignOut}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Pending Approvals</p>
              <h3 className="text-2xl font-bold text-amber-400 mt-1">{pendingCount}</h3>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Verified Cleared</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">{verifiedCount}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Revenue Collected</p>
              <h3 className="text-2xl font-bold text-white mt-1">₱{totalVerified.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/30 p-4 rounded-2xl border border-slate-800">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search student, ID, or document..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition placeholder:text-slate-600"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
              {(['All', 'Pending', 'Verified', 'Rejected'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    filterStatus === status 
                      ? 'bg-slate-800 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <button
              onClick={fetchRequisitions}
              className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/40">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs uppercase font-semibold">
              <tr>
                <th className="py-3.5 px-4">Student Info</th>
                <th className="py-3.5 px-4">Document Details</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Receipt</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRequisitions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No requisitions matching criteria found.
                  </td>
                </tr>
              ) : (
                filteredRequisitions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-100">{item.student_name || 'N/A'}</div>
                      <div className="text-xs text-slate-500">{item.student_id || 'ID Pending'}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-slate-200 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        {item.document_type || 'Official Requisition'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-200">
                      ₱{(item.amount || 150).toFixed(2)}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        item.payment_status === 'Verified'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : item.payment_status === 'Rejected'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {item.payment_status || 'Pending'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {item.receipt_url ? (
                        <a 
                          href={item.receipt_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs text-indigo-400 hover:underline inline-flex items-center gap-1"
                        >
                          View Receipt
                        </a>
                      ) : (
                        <span className="text-xs text-slate-600">No upload</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {item.payment_status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={processingId === item.id}
                            onClick={() => handleVerifyPayment(item.id, 'Verified')}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition disabled:opacity-50"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            disabled={processingId === item.id}
                            onClick={() => handleVerifyPayment(item.id, 'Rejected')}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-950 border border-rose-800 hover:bg-rose-900 text-rose-300 text-xs font-semibold transition disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Audited</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};