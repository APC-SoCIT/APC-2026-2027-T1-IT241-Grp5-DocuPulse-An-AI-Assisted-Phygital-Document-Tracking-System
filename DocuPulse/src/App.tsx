import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import RequisitionForm from './components/RequisitionForm';
import RequisitionValidation from './components/RequisitionValidation';
import LogisticsProcessing from './components/LogisticsProcessing';
import LogisticsDashboard from './components/LogisticsDashboard';
import NotificationsFeed from './components/NotificationsFeed';
import Auth from './components/Auth';
import { 
  CheckSquare, Send, Truck, LayoutDashboard, Bell, 
  ChevronRight, Menu, Shield, LogOut, Layers, Search
} from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('dp01');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setProfile(data);
      if (data.role === 'Logistics Officer') setActiveTab('dp16');
      else if (data.role === 'Approver') setActiveTab('dp02');
      else setActiveTab('dp01');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (!session) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  const role = profile?.role || 'Requestor';

  const allNavItems = [
    { id: 'dp01', label: 'Requisitions', icon: Send, badge: 'Form', roles: ['Requestor', 'Approver', 'Logistics Officer'] },
    { id: 'dp02', label: 'Validation', icon: CheckSquare, badge: 'Review', roles: ['Approver', 'Logistics Officer'] },
    { id: 'dp11', label: 'Logistics', icon: Truck, badge: 'Procurement', roles: ['Logistics Officer'] },
    { id: 'dp16', label: 'Dashboard', icon: LayoutDashboard, badge: 'Live Queue', roles: ['Logistics Officer'] },
    { id: 'dp21', label: 'Notifications', icon: Bell, badge: 'Hub', roles: ['Requestor', 'Approver', 'Logistics Officer'] }
  ];

  const allowedNavItems = allNavItems.filter(item => item.roles.includes(role));

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dp01': return 'Digital Requisition Submission';
      case 'dp02': return 'Entry Validation Engine';
      case 'dp11': return 'Logistics Sourcing & Processing';
      case 'dp16': return 'Institutional Logistics Dashboard';
      case 'dp21': return 'Automated Communication Feed';
      default: return 'Workspace';
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden antialiased selection:bg-indigo-500 selection:text-white">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 border-r border-slate-800/80 bg-slate-900/80 backdrop-blur-xl p-4 flex flex-col justify-between hidden md:flex z-30 shrink-0`}>
        <div>
          <div className="mb-6">
            {isSidebarOpen ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-indigo-500/30 bg-slate-950 flex items-center justify-center p-0.5 shadow-lg shadow-indigo-600/20">
                    <img src="/docupulse-logo.png" alt="DocuPulse Logo" className="w-full h-full object-contain" />
                  </div>
                  <div className="truncate">
                    <h1 className="font-bold text-base tracking-tight text-white leading-tight truncate">DocuPulse</h1>
                    <p className="text-[9px] text-indigo-400 font-semibold tracking-wide truncate">PHYGITAL TRACKING</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)} 
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition shrink-0"
                  title="Collapse Sidebar"
                >
                  <Menu className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-indigo-500/30 bg-slate-950 flex items-center justify-center p-0.5 shadow-lg shadow-indigo-600/20">
                  <img src="/docupulse-logo.png" alt="DocuPulse Logo" className="w-full h-full object-contain" />
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(true)} 
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  title="Expand Sidebar"
                >
                  <Menu className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="mb-5">
            {isSidebarOpen ? (
              <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="text-[11px] font-semibold text-slate-200 truncate">{role}</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              </div>
            ) : (
              <div className="flex justify-center p-2.5 bg-slate-950 border border-slate-800 rounded-xl" title={role}>
                <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
              </div>
            )}
          </div>

          <nav className="space-y-1.5">
            {allowedNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={!isSidebarOpen ? item.label : undefined}
                  className={`w-full flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'} p-2.5 rounded-xl text-xs font-medium transition-all group ${
                    isActive 
                      ? 'bg-gradient-to-r from-indigo-600/20 to-indigo-600/5 text-indigo-300 border border-indigo-500/30 shadow-md shadow-indigo-600/10' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    {isSidebarOpen && <span className="truncate">{item.label}</span>}
                  </div>
                  {isSidebarOpen && (
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                      isActive ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800/80">
          <button
            onClick={handleSignOut}
            title={!isSidebarOpen ? "Sign Out" : undefined}
            className={`w-full flex items-center ${isSidebarOpen ? 'justify-start gap-3' : 'justify-center'} p-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {isSidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            <div className="flex md:hidden items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-indigo-500/30 bg-slate-950 flex items-center justify-center p-0.5">
                <img src="/docupulse-logo.png" alt="DocuPulse Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-sm text-white">DocuPulse</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-mono">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>DocuPulse</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-slate-200 font-medium">{getTabTitle()}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search Requisitions..."
                className="w-full bg-slate-950 border border-slate-800/80 rounded-xl py-1.5 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <button
              onClick={() => setActiveTab('dp21')}
              className="relative p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl transition"
              title="Notifications Feed"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-slate-900 animate-pulse"></span>
            </button>

            <div className="h-4 w-px bg-slate-800"></div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-indigo-600/20">
                {profile?.full_name ? profile.full_name.charAt(0) : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-white leading-tight">{profile?.full_name || 'User'}</p>
                <p className="text-[10px] text-slate-400">{role}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-950 relative">
          <div className="max-w-6xl mx-auto space-y-6">
            {activeTab === 'dp01' && <RequisitionForm />}
            {activeTab === 'dp02' && <RequisitionValidation />}
            {activeTab === 'dp11' && <LogisticsProcessing />}
            {activeTab === 'dp16' && <LogisticsDashboard />}
            {activeTab === 'dp21' && <NotificationsFeed />}
          </div>
        </main>
      </div>
    </div>
  );
}