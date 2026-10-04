import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, User, KeyRound, Receipt, ArrowRight, UserPlus, LogIn } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: () => void;
}

export default function FinanceAuth({ onAuthSuccess }: AuthProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [passcode, setPasscode] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (isRegistering) {
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
      if (!passcode.trim()) {
        setErrorMsg('Finance Department authorization key is required.');
        return;
      }
      if (!termsAccepted) {
        setErrorMsg('You must agree to the institutional compliance terms.');
        return;
      }
    }

    setLoading(true);

    if (isRegistering) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'Finance Officer',
            department: 'Finance Department',
            portal_type: 'finance'
          }
        }
      });
      if (error) setErrorMsg(error.message);
      else onAuthSuccess();
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErrorMsg(error.message);
      else onAuthSuccess();
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans selection:bg-emerald-500 selection:text-white">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-emerald-500/30 bg-slate-950 flex items-center justify-center p-2 shadow-xl shadow-emerald-600/20">
            <Receipt className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-tight">DocuPulse</h1>
            <p className="text-[11px] text-emerald-400 font-semibold tracking-wide">Finance & Treasury Office</p>
          </div>
        </div>

        <div className="mb-5 text-center">
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            {isRegistering ? 'Create Finance Account' : 'Finance Officer Portal'}
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isRegistering ? 'Register for fee clearance & receipt verification' : 'Sign in to process financial holds and document payments'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Authorization Key</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="Enter Finance department key"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Institutional Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="email"
                required
                placeholder="finance@apc.edu.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {isRegistering && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="terms-finance"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-0"
              />
              <label htmlFor="terms-finance" className="text-[11px] text-slate-400 select-none">
                I agree to the institutional compliance agreement.
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? 'Authenticating...' : isRegistering ? (
              <><UserPlus className="w-4 h-4" /> Register (Finance)</>
            ) : (
              <><LogIn className="w-4 h-4" /> Sign In (Finance) <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={() => { setIsRegistering(!isRegistering); setErrorMsg(''); }}
            className="text-xs text-slate-400 hover:text-emerald-400 transition"
          >
            {isRegistering ? 'Already registered? Sign In' : "Don't have an account? Register"}
          </button>
        </div>

      </div>
    </div>
  );
}