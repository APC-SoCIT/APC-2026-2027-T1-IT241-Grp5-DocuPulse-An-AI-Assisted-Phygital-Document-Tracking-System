import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

import Auth from './components/Auth';
import LogisticsAuth from './components/LogisticsAuth';
import FinanceAuth from './components/FinanceAuth';
import ItroAuth from './components/ItroAuth';
import LibraryAuth from './components/LibraryAuth';

import { FinanceDashboard } from './components/FinanceDashboard';
import { ItroDashboard } from './components/ItroDashboard';
import { LibraryDashboard } from './components/LibraryDashboard';

import {
  RequestorDashboard,
  LogisticsDashboard,
} from './components/Dashboards';

type PortalView = 'requestor' | 'logistics' | 'finance' | 'itro' | 'library';

export default function App() {
  const [currentPortal, setCurrentPortal] = useState<PortalView>('requestor');
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionUser(session?.user ?? null);
      setInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user ?? null);
      setInitializing(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSessionUser(null);
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
        Initializing DocuPulse Session...
      </div>
    );
  }

  if (sessionUser) {
    const role = sessionUser.user_metadata?.role;

    switch (role) {
      case 'Logistics Officer':
        return <LogisticsDashboard user={sessionUser} onSignOut={handleSignOut} />;
      case 'Finance Officer':
        return <FinanceDashboard user={sessionUser} onSignOut={handleSignOut} />;
      case 'ITRO Staff':
        return <ItroDashboard user={sessionUser} onSignOut={handleSignOut} />;
      case 'Librarian':
        return <LibraryDashboard user={sessionUser} onSignOut={handleSignOut} />;
      case 'Requestor':
      default:
        return <RequestorDashboard user={sessionUser} onSignOut={handleSignOut} />;
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-3 flex justify-center gap-2 sticky top-0 z-50">
        <button
          onClick={() => setCurrentPortal('requestor')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            currentPortal === 'requestor'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Requestor
        </button>
        <button
          onClick={() => setCurrentPortal('logistics')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            currentPortal === 'logistics'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Logistics
        </button>
        <button
          onClick={() => setCurrentPortal('finance')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            currentPortal === 'finance'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Finance
        </button>
        <button
          onClick={() => setCurrentPortal('itro')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            currentPortal === 'itro'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          ITRO
        </button>
        <button
          onClick={() => setCurrentPortal('library')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            currentPortal === 'library'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Library
        </button>
      </nav>

      <div className="flex-1 flex items-center justify-center">
        {currentPortal === 'requestor' && <Auth onAuthSuccess={() => {}} />}
        {currentPortal === 'logistics' && <LogisticsAuth onAuthSuccess={() => {}} />}
        {currentPortal === 'finance' && <FinanceAuth onAuthSuccess={() => {}} />}
        {currentPortal === 'itro' && <ItroAuth onAuthSuccess={() => {}} />}
        {currentPortal === 'library' && <LibraryAuth onAuthSuccess={() => {}} />}
      </div>
    </div>
  );
} 