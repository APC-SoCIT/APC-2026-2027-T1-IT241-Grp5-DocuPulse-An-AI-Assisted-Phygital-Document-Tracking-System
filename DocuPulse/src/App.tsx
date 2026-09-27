import { useState } from 'react';
import RequisitionForm from './components/RequisitionForm';
import RequisitionValidation from './components/RequisitionValidation';
import LogisticsProcessing from './components/LogisticsProcessing';
import LogisticsDashboard from './components/LogisticsDashboard';
import NotificationsFeed from './components/NotificationsFeed';
import { FileText, CheckSquare, Send, Truck, LayoutDashboard, Bell } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dp01' | 'dp02' | 'dp11' | 'dp16' | 'dp21'>('dp21');

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
      <aside className="w-64 border-r border-slate-800 bg-slate-900 p-4 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="flex items-center gap-2 mb-8 px-2">
            <FileText className="w-6 h-6 text-indigo-400" />
            <span className="font-bold text-xl tracking-tight text-white">DocuPulse</span>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('dp21')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'dp21' 
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Bell className="w-4 h-4" /> DP-21 Notifications
            </button>

            <button
              onClick={() => setActiveTab('dp16')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'dp16' 
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> DP-16 Logistics Dashboard
            </button>

            <button
              onClick={() => setActiveTab('dp01')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'dp01' 
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Send className="w-4 h-4" /> DP-01 Form Submission
            </button>

            <button
              onClick={() => setActiveTab('dp02')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'dp02' 
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <CheckSquare className="w-4 h-4" /> DP-02 Validation
            </button>

            <button
              onClick={() => setActiveTab('dp11')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'dp11' 
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Truck className="w-4 h-4" /> DP-11 Logistics Processing
            </button>
          </nav>
        </div>

        <div className="text-[11px] text-slate-500 px-2">
          DocuPulse Modular Architecture
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        {activeTab === 'dp21' && <NotificationsFeed />}
        {activeTab === 'dp16' && <LogisticsDashboard />}
        {activeTab === 'dp01' && <RequisitionForm />}
        {activeTab === 'dp02' && <RequisitionValidation />}
        {activeTab === 'dp11' && <LogisticsProcessing />}
      </main>
    </div>
  );
}