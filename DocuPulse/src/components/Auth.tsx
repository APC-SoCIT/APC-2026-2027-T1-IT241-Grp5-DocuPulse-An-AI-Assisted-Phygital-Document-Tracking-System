import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, User, Shield, ArrowRight, KeyRound, Building2 } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: () => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('Jose Mirador');
  const [role, setRole] = useState<'Requestor' | 'Approver' | 'Logistics Officer'>('Requestor');
  const [department, setDepartment] = useState('Information Technology');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDemoLogin = async (
    demoEmail: string, 
    demoName: string, 
    demoRole: 'Requestor' | 'Approver' | 'Logistics Officer'
  ) => {
    setErrorMsg('');
    setLoading(true);
    const demoPassword = 'password123';

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: demoPassword,
    });

    if (!signInError) {
      setLoading(false);
      onAuthSuccess();
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email: demoEmail,
      password: demoPassword,
      options: {
        data: {
          full_name: demoName,
          role: demoRole,
          department: 'Information Technology'
        }
      }
    });

    if (signUpError) {
      setErrorMsg(`Demo Login Error: ${signUpError.message}`);
    } else {
      await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });
      onAuthSuccess();
    }
    setLoading(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (isSignUp) {
      if (password.length < 6) {
        setErrorMsg('Password requirements not met: Minimum length is 6 characters.');
        return;
      }
      if (!termsAccepted) {
        setErrorMsg('You must agree to the terms and institutional compliance agreement.');
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
            role: role,
            department: department
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans selection:bg-indigo-500 selection:text-white">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-indigo-500/30 bg-slate-950 flex items-center justify-center p-1 shadow-xl shadow-indigo-600/20">
            <img src="/docupulse-logo.png" alt="DocuPulse Emblem" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-tight">DocuPulse</h1>
            <p className="text-[11px] text-indigo-400 font-semibold tracking-wide">AI-Assisted Phygital Tracking System</p>
          </div>
        </div>

        {/* Demo Fast Login Buttons */}
        <div className="mb-6 p-3 bg-slate-950/80 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-semibold mb-2">
            <KeyRound className="w-3.5 h-3.5" /> Fast Demo Access (One-Click)
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin('admin@apc.edu.ph', 'Admin Logistics', 'Logistics Officer')}
              className="py-2 px-2 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 rounded-xl text-[10px] text-indigo-200 font-semibold transition text-center"
            >
              Admin / Logistics
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin('approver@apc.edu.ph', 'Department Approver', 'Approver')}
              className="py-2 px-2 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 rounded-xl text-[10px] text-indigo-200 font-semibold transition text-center"
            >
              Approver
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin('requestor@apc.edu.ph', 'Student Requestor', 'Requestor')}
              className="py-2 px-2 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 rounded-xl text-[10px] text-indigo-200 font-semibold transition text-center"
            >
              Requestor
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Jose Mirador"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Assigned Department</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  >
                    <option value="Information Technology">School of Information Technology (SoCIT)</option>
                    <option value="Registrar">Registrar Office</option>
                    <option value="Finance">Finance Department</option>
                    <option value="Administration">Administration</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Assigned System Role</label>
                <div className="relative">
                  <Shield className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  >
                    <option value="Requestor">Requestor (Submits & Tracks Requisitions)</option>
                    <option value="Approver">Approver (Department Validation & Review)</option>
                    <option value="Logistics Officer">Logistics Officer (Procurement & Processing)</option>
                  </select>
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
                placeholder="name@apc.edu.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            {isSignUp && (
              <p className="text-[10px] text-slate-500 mt-1">Must be at least 6 characters long with valid alphanumeric structure.</p>
            )}
          </div>

          {isSignUp && (
            <div className="flex items-center gap-2 pt-1">
              <input 
                type="checkbox" 
                id="terms" 
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0"
              />
              <label htmlFor="terms" className="text-[11px] text-slate-400 select-none">
                I agree to the institutional terms and compliance agreement.
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? 'Authenticating...' : isSignUp ? 'Create Account' : 'Sign In'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-slate-400 hover:text-indigo-400 transition"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}