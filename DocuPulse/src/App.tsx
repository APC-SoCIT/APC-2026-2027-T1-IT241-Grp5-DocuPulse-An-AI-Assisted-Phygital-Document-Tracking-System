import { useState } from 'react';
import RequisitionForm from './components/RequisitionForm';
import RequisitionValidation from './components/RequisitionValidation';
import { FileText, CheckSquare, Send } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dp01' | 'dp02'>('dp01');

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
          </nav>
        </div>

        <div className="text-[11px] text-slate-500 px-2">
          DocuPulse Modular Architecture
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        {activeTab === 'dp01' && <RequisitionForm />}
        {activeTab === 'dp02' && <RequisitionValidation />}
      </main>
    </div>
  );
}