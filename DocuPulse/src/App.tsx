import { useState } from 'react';
import RequisitionForm from './components/RequisitionForm';
import RequisitionValidation from './components/RequisitionValidation';
import LogisticsProcessing from './components/LogisticsProcessing';
import LogisticsDashboard from './components/LogisticsDashboard';
import NotificationsFeed from './components/NotificationsFeed';
import { 
  FileText, CheckSquare, Send, Truck, LayoutDashboard, Bell, 
  ChevronRight, Menu, Shield, Search, Sparkles
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dp01' | 'dp02' | 'dp11' | 'dp16' | 'dp21'>('dp16');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState<'Logistics Staff' | 'Requestor' | 'Approver'>('Logistics Staff');

  const navItems = [
    {
      id: 'dp16',
      label: 'Logistics Dashboard',
      code: 'DP-16',
      icon: LayoutDashboard,
      badge: 'Live Queue'
    },
    {
      id: 'dp01',
      label: 'Requisition Submission',
      code: 'DP-01',
      icon: Send,
      badge: 'Form'
    },
    {
      id: 'dp02',
      label: 'Automated Validation',
      code: 'DP-02',
      icon: CheckSquare,
      badge: 'System'
    },
    {
      id: 'dp11',
      label: 'Logistics Processing',
      code: 'DP-11',
      icon: Truck,
      badge: 'Procurement'
    },
    {
      id: 'dp21',
      label: 'Notifications Hub',
      code: 'DP-21',
      icon: Bell,
      badge: '2 New',
      badgeColor: 'bg-indigo-500 text-white'
    }
  ];

  const getBreadcrumb = () => {
    switch (activeTab) {
      case 'dp16': return 'Logistics Staff / Institutional Dashboard';
      case 'dp01': return 'Requestor / Submit Requisition';
      case 'dp02': return 'Validation Engine / Completeness Checks';
      case 'dp11': return 'Logistics Officer / Workflow Processing';
      case 'dp21': return 'Communications / Notifications Feed';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } transition-all duration-300 border-r border-slate-800/80 bg-slate-900/90 backdrop-blur-md p-4 flex flex-col justify-between z-30 relative hidden md:flex`}
      >
        <div>
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              {isSidebarOpen && (
                <div>
                  <h1 className="font-bold text-base tracking-tight text-white leading-tight">DocuPulse</h1>
                  <p className="text-[10px] text-slate-400 font-medium">Phygital Document Tracking</p>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          <div className="px-2 mb-4">
            {isSidebarOpen ? (
              <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[11px] font-semibold text-slate-300">{userRole}</span>
                </div>
                <button 
                  onClick={() => setUserRole(userRole === 'Logistics Staff' ? 'Requestor' : 'Logistics Staff')}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium underline"
                >
                  Switch
                </button>
              </div>
            ) : (
              <div className="flex justify-center p-2 bg-slate-950 border border-slate-800 rounded-xl" title={userRole}>
                <Shield className="w-4 h-4 text-indigo-400" />
              </div>
            )}
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-all group ${
                    isActive 
                      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-lg shadow-indigo-600/10' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Icon className={`w-4 h-4 shrink-0 transition ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    {isSidebarOpen && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </div>

                  {isSidebarOpen && (
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                      item.badgeColor || (isActive ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-slate-800 text-slate-400')
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="px-2 pt-4 border-t border-slate-800/80">
          {isSidebarOpen ? (
            <div className="p-3 bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-xl">
              <div className="flex items-center gap-1.5 text-indigo-400 text-[11px] font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5" /> APC System v2.4
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">Module updates synced to institutional workflow.</p>
            </div>
          ) : (
            <div className="flex justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex md:hidden items-center gap-2">
              <div className="p-1.5 bg-indigo-600/20 text-indigo-400 rounded-lg">
                <FileText className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-white">DocuPulse</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span>DocuPulse</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-slate-200 font-medium">{getBreadcrumb()}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden lg:block w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search Requisition ID or Item..."
                className="w-full bg-slate-950 border border-slate-800/80 rounded-xl py-1.5 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <button
              onClick={() => setActiveTab('dp21')}
              className="relative p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl transition"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse"></span>
            </button>

            <div className="h-4 w-px bg-slate-800 mx-1"></div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-indigo-600/20">
                JM
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-white leading-tight">Jose Mirador</p>
                <p className="text-[10px] text-slate-400">IT Student / Requestor</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-950">
          <div className="animate-in fade-in duration-200">
            {activeTab === 'dp16' && <LogisticsDashboard />}
            {activeTab === 'dp01' && <RequisitionForm />}
            {activeTab === 'dp02' && <RequisitionValidation />}
            {activeTab === 'dp11' && <LogisticsProcessing />}
            {activeTab === 'dp21' && <NotificationsFeed />}
          </div>
        </main>
      </div>
    </div>
  );
}