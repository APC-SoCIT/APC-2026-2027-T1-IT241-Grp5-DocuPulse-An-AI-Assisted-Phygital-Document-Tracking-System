import React from 'react';
import { User, Truck, Receipt, MonitorCheck, BookOpen, LogOut, FileText, CheckCircle, Clock, Shield } from 'lucide-react';

interface DashboardProps {
  user: any;
  onSignOut: () => void;
}

export function RequestorDashboard({ user, onSignOut }: DashboardProps) {
  return (
    <DashboardLayout title="Requestor Portal" role="Requestor" badgeColor="bg-indigo-500/20 text-indigo-400 border-indigo-500/30" icon={<User className="w-5 h-5 text-indigo-400" />} user={user} onSignOut={onSignOut}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Active Requisitions" value="3" icon={<Clock className="w-4 h-4 text-amber-400" />} />
        <StatCard label="Approved Documents" value="12" icon={<CheckCircle className="w-4 h-4 text-emerald-400" />} />
        <StatCard label="Department" value={user?.user_metadata?.department || 'N/A'} icon={<FileText className="w-4 h-4 text-indigo-400" />} />
      </div>
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
        <h3 className="text-sm font-bold text-slate-200 mb-2">Submit New Document Requisition</h3>
        <p className="text-xs text-slate-400 mb-4">Select required academic or administrative records to initialize phygital tracking.</p>
        <button className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-indigo-600/20">
          + New Requisition Request
        </button>
      </div>
    </DashboardLayout>
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
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
        <h3 className="text-sm font-bold text-slate-200 mb-2">Physical Document Dispatch Queue</h3>
        <p className="text-xs text-slate-400">Manage physical routing, IoT bag scanning, and intra-campus handoffs.</p>
      </div>
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
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
        <h3 className="text-sm font-bold text-slate-200 mb-2">Fee Verification & Payment Auditing</h3>
        <p className="text-xs text-slate-400">Review OR receipts, validate student accounts, and release financial clearance holds.</p>
      </div>
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
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
        <h3 className="text-sm font-bold text-slate-200 mb-2">System Operations & IoT Infrastructure</h3>
        <p className="text-xs text-slate-400">Monitor hardware sensors, access control rules, and system credentials.</p>
      </div>
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
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
        <h3 className="text-sm font-bold text-slate-200 mb-2">Library Clearance & Resource Audit</h3>
        <p className="text-xs text-slate-400">Verify student library clearance and clear document request holds.</p>
      </div>
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