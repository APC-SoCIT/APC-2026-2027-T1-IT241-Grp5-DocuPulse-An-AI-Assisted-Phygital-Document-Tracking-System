import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import RequisitionForm from './components/RequisitionForm';
import RequisitionValidation from './components/RequisitionValidation';
import LogisticsProcessing from './components/LogisticsProcessing';
import LogisticsDashboard from './components/LogisticsDashboard';
import NotificationsFeed from './components/NotificationsFeed';
import Auth from './components/Auth';
import { 
  FileText, CheckSquare, Send, Truck, LayoutDashboard, Bell, 
  ChevronRight, Menu, Shield, LogOut
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
    { id: 'dp01', label: 'Requisition Submission', code: 'DP-01', icon: Send, badge: 'Form', roles: ['Requestor', 'Approver', 'Logistics Officer'] },
    { id: 'dp02', label: 'Automated Validation', code: 'DP-02', icon: CheckSquare, badge: 'Validation', roles: ['Approver', 'Logistics Officer'] },
    { id: 'dp11', label: 'Logistics Processing', code: 'DP-11', icon: Truck, badge: 'Procurement', roles: ['Logistics Officer'] },
    { id: 'dp16', label: 'Logistics Dashboard', code: 'DP-16', icon: LayoutDashboard, badge: 'Live Queue', roles: ['Logistics Officer'] },
    { id: 'dp21', label: 'Notifications Hub', code: 'DP-21', icon: Bell, badge: 'Hub', roles: ['Requestor', 'Approver', 'Logistics Officer'] }
  ];

  const allowedNavItems = allNavItems.filter(item => item.roles.includes(role));

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 border-r border-slate-800 bg-slate-900 p-4 flex flex-col justify-between hidden md:flex`}>
        <div>
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              {isSidebarOpen && (
                <div>
                  <h1 className="font-bold text-base tracking-tight text-white leading-tight">DocuPulse</h1>
                  <p className="text-[10px] text-slate-400 font-medium">Phygital Tracking</p>
                </div>
              )}
            </div>
            
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
              <Menu className="w-4 h-4" />
            </button>
          </div>

          <div className="px-2 mb-4">
            {isSidebarOpen ? (
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[11px] font-semibold text-slate-300">{role}</span>
                </div>
              </div>
            ) : (
              <div className="flex justify-center p-2 bg-slate-950 border border-slate-800 rounded-xl" title={role}>
                <Shield className="w-4 h-4 text-indigo-400" />
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
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition ${
                    isActive 
                      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                    {isSidebarOpen && <span className="truncate">{item.label}</span>}
                  </div>
                  {isSidebarOpen && (
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800/60 transition"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {isSidebarOpen && <span>Sign Out</span>}
        </button>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>DocuPulse RBAC</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-slate-200 font-medium">{role} Scope</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                {profile?.full_name ? profile.full_name.charAt(0) : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-white leading-tight">{profile?.full_name || 'User'}</p>
                <p className="text-[10px] text-slate-400">{role}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-950">
          {activeTab === 'dp01' && <RequisitionForm />}
          {activeTab === 'dp02' && <RequisitionValidation />}
          {activeTab === 'dp11' && <LogisticsProcessing />}
          {activeTab === 'dp16' && <LogisticsDashboard />}
          {activeTab === 'dp21' && <NotificationsFeed />}
        </main>
      </div>
    </div>
  );
}