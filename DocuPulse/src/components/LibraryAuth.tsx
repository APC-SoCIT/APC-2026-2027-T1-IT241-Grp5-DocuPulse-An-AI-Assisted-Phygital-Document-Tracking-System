import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, User, ArrowRight, BookOpen } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: () => void;
}

export default function LibraryAuth({ onAuthSuccess }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (isSignUp) {
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
      if (!termsAccepted) {
        setErrorMsg('You must agree to library clearance terms.');
        return;
      }
    }

    setLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'Librarian',
            department: 'Learning Resource Center / Library',
            portal_type: 'library'
          }
        }
      });
      if (error) setErrorMsg(error.message);
      else onAuthSuccess();
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) setErrorMsg(error.message);
      else onAuthSuccess();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans selection:bg-amber-500 selection:text-white">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-amber-500/30 bg-slate-950 flex items-center justify-center p-1 shadow-xl shadow-amber-600/20">
            <BookOpen className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-tight">Library Portal</h1>
            <p className="text-[11px] text-amber-400 font-semibold tracking-wide">Resource Audit & Clearance</p>
          </div>
        </div>

        <div className="mb-4 text-center">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            {isSignUp ? 'Create Librarian Account' : 'Librarian Sign In'}
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isSignUp ? 'Register to manage resource clearances and book holds' : 'Sign in to access library audit queue'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Librarian Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Institutional Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="email"
                required
                placeholder="library@apc.edu.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          {isSignUp && (
            <div className="flex items-center gap-2 pt-1">
              <input 
                type="checkbox" 
                id="terms-library" 
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-amber-600 focus:ring-0"
              />
              <label htmlFor="terms-library" className="text-[11px] text-slate-400 select-none">
                I agree to library resource policies.
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? 'Authenticating...' : isSignUp ? 'Register Librarian' : 'Sign In'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-slate-400 hover:text-amber-400 transition"
          >
            {isSignUp ? 'Already registered? Sign In' : "New Librarian? Register Account"}
          </button>
        </div>

      </div>
    </div>
  );
}