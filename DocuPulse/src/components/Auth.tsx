import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, User, ArrowRight, Building2, ShieldCheck, UserCheck, KeyRound, Truck } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: () => void;
}

type MainTab = 'requestor' | 'employee' | 'admin';
type EmployeeSubRole = 'approver' | 'logistics';

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('requestor');
  const [employeeSubRole, setEmployeeSubRole] = useState<EmployeeSubRole>('approver');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('School of Information Technology (SoCIT)');
  const [customDepartment, setCustomDepartment] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTabSwitch = (tab: MainTab) => {
    setActiveTab(tab);
    setIsSignUp(false);
    setErrorMsg('');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (isSignUp) {
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
      if (!termsAccepted) {
        setErrorMsg('You must agree to the institutional compliance terms.');
        return;
      }
      if (activeTab !== 'requestor' && !accessCode.trim()) {
        setErrorMsg('Institutional authorization code is required.');
        return;
      }
      if (department === 'Other' && !customDepartment.trim()) {
        setErrorMsg('Please specify your school department.');
        return;
      }
    }

    setLoading(true);

    const assignedRole = 
      activeTab === 'requestor' 
        ? 'Requestor' 
        : activeTab === 'employee'
        ? (employeeSubRole === 'approver' ? 'Approver' : 'Logistics Officer')
        : 'System Manager';

    const finalDepartment = department === 'Other' ? customDepartment.trim() : department;

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: assignedRole,
            department: activeTab === 'admin' ? 'Administration' : finalDepartment,
            portal_type: activeTab === 'employee' ? employeeSubRole : activeTab
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

        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl mb-3">
          <button
            type="button"
            onClick={() => handleTabSwitch('requestor')}
            className={`py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'requestor' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Requestors
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch('employee')}
            className={`py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'employee' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> Employees
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch('admin')}
            className={`py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'admin' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Managers
          </button>
        </div>

        {activeTab === 'employee' && (
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/80 border border-slate-800/80 rounded-lg mb-4">
            <button
              type="button"
              onClick={() => setEmployeeSubRole('approver')}
              className={`py-1.5 text-[11px] font-medium rounded-md transition flex items-center justify-center gap-1 ${
                employeeSubRole === 'approver' ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3 h-3" /> Approver (Review)
            </button>
            <button
              type="button"
              onClick={() => setEmployeeSubRole('logistics')}
              className={`py-1.5 text-[11px] font-medium rounded-md transition flex items-center justify-center gap-1 ${
                employeeSubRole === 'logistics' ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Truck className="w-3 h-3" /> Logistics (Dispatch)
            </button>
          </div>
        )}

        <div className="mb-4 text-center">
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            {activeTab === 'requestor' && 'Student / Requestor Portal'}
            {activeTab === 'employee' && (employeeSubRole === 'approver' ? 'Approver Portal' : 'Logistics Officer Portal')}
            {activeTab === 'admin' && 'System Management Portal'}
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {activeTab === 'requestor' && 'Submit and track document requisitions'}
            {activeTab === 'employee' && (employeeSubRole === 'approver' ? 'Review, validate, and endorse requisitions' : 'Process dispatch and physical document tracking')}
            {activeTab === 'admin' && 'Manage system configurations and user roles'}
          </p>
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
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {activeTab !== 'admin' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">School Department</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                    >
                      <option value="School of Information Technology (SoCIT)">School of Information Technology (SoCIT)</option>
                      <option value="School of Media and Arts (SOMA)">School of Media and Arts (SOMA)</option>
                      <option value="School of Management (SOM)">School of Management (SOM)</option>
                      <option value="School of Engineering (SOE)">School of Engineering (SOE)</option>
                      <option value="Finance Department">Finance Department</option>
                      <option value="Administration">Administration</option>
                      <option value="Other">Other Department...</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab !== 'admin' && department === 'Other' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Specify Department</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="Enter your specific department"
                      value={customDepartment}
                      onChange={(e) => setCustomDepartment(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>
              )}

              {activeTab !== 'requestor' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Authorization Passcode</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="password"
                      required
                      placeholder="Enter institutional key"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>
              )}
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
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 mt-2 capitalize"
          >
            {loading ? 'Authenticating...' : isSignUp ? `Register (${activeTab === 'employee' ? employeeSubRole : activeTab})` : `Sign In (${activeTab === 'employee' ? employeeSubRole : activeTab})`} <ArrowRight className="w-4 h-4" />
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