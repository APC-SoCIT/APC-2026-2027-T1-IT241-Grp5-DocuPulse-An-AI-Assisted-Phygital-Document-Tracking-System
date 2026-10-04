import React, { useState } from "react";
import apcLogo from "@/imports/apc-logo.png-removebg-preview.png";
import docupulseLogo from "@/imports/image-removebg-preview.png";
import { supabase } from "./lib/supabase";

export type Role = "admin" | "user" | "logistics";
export interface AuthUser {
  id: string;
  username: string; // email
  name: string;
  role: Role;
}

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8)       score++;
  if (/[A-Z]/.test(pw))    score++;
  if (/[0-9]/.test(pw))    score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { label: "Too short", color: "#ff6b6b" },
    { label: "Weak",      color: "#ff6b6b" },
    { label: "Fair",      color: "#ffbe3d" },
    { label: "Good",      color: "#5b8fff" },
    { label: "Strong",    color: "#2ee89a" },
  ];
  return { score, ...levels[Math.min(score, 4)] };
}

function Field({ label, icon, children, error }: { label: string; icon: React.ReactNode; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 10, fontFamily: "var(--font-mono)", color: "#94a3b8", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 7 }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", opacity: 0.4, pointerEvents: "none" }}>{icon}</span>
        {children}
      </div>
      {error && <p style={{ fontSize: 11, color: "#ff6b6b", marginTop: 5 }}>{error}</p>}
    </div>
  );
}

const inputStyle = (hasError?: boolean): React.CSSProperties => ({
  width: "100%", paddingLeft: 38, paddingRight: 14, paddingTop: 11, paddingBottom: 11,
  borderRadius: 10, fontSize: 13, outline: "none",
  background: "rgba(16,22,44,0.7)",
  border: `1px solid ${hasError ? "#f87171" : "#334155"}`,
  color: "var(--color-text)", fontFamily: "var(--font-body)", transition: "border-color 0.2s",
});

export default function Login({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [view, setView]         = useState<"login" | "register" | "success">("login");

  const [loginEmail,   setLoginEmail]   = useState("");
  const [loginPass,    setLoginPass]    = useState("");
  const [loginError,   setLoginError]   = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPass,     setShowPass]     = useState(false);

  const [regName,    setRegName]    = useState("");
  const [regEmail,   setRegEmail]   = useState("");
  const [regPass,    setRegPass]    = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [showRegPass,    setShowRegPass]    = useState(false);
  const [showConfirm,    setShowConfirm]    = useState(false);
  const [regTouched,     setRegTouched]     = useState(false);
  const [regSuccess,     setRegSuccess]     = useState("");
  const [regError,       setRegError]       = useState("");
  const [regLoading,     setRegLoading]     = useState(false);

  const strength = passwordStrength(regPass);

  const regErrors = {
    name:    !regName.trim() ? "Full name is required" : "",
    email:   !regEmail.includes("@") ? "Enter a valid email" : "",
    pass:    regPass.length < 8 ? "At least 8 characters" : "",
    confirm: regPass !== regConfirm ? "Passwords do not match" : "",
  };
  const regValid = Object.values(regErrors).every((e) => !e);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPass,
      });
      if (error) {
        setLoginError("Invalid email or password.");
      } else if (data.user) {
        const meta = data.user.user_metadata;
        onLogin({
          id:       data.user.id,
          username: data.user.email ?? loginEmail,
          name:     meta.name || data.user.email || "User",
          role:     (meta.role as Role) || "user",
        });
      }
    } catch {
      setLoginError("Network error. Please try again.");
    }
    setLoginLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegTouched(true);
    setRegError("");
    if (!regValid) return;
    setRegLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: regEmail.trim(),
        password: regPass,
        options: {
          data: { name: regName.trim(), role: "user" },
        },
      });
      if (error) {
        setRegError(error.message);
      } else if (data.user) {
        setRegSuccess(regName.trim().split(" ")[0]);
        setView("success");
      }
    } catch {
      setRegError("Network error. Please try again.");
    }
    setRegLoading(false);
  };

  const resetRegister = () => {
    setRegName(""); setRegEmail(""); setRegPass(""); setRegConfirm("");
    setRegTouched(false); setRegError("");
    setView("login");
  };

  const eyeIcon = (show: boolean, toggle: () => void) => (
    <button type="button" onClick={toggle}
      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-muted)", opacity: 0.5, padding: 0 }}>
      {show
        ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.3"/><circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 2l10 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
        : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.3"/><circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>
      }
    </button>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ fontFamily: "var(--font-body)" }}>
      <div style={{ position: "fixed", top: "15%",   left: "8%",   width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(91,143,255,0.15) 0%,transparent 70%)", pointerEvents: "none", filter: "blur(40px)" }} />
      <div style={{ position: "fixed", bottom: "10%", right: "6%",  width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle,rgba(192,132,252,0.15) 0%,transparent 70%)", pointerEvents: "none", filter: "blur(40px)" }} />
      <div style={{ position: "fixed", top: "50%",   right: "20%", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle,rgba(34,211,238,0.10) 0%,transparent 70%)", pointerEvents: "none", filter: "blur(30px)" }} />

      <div style={{ width: "100%", maxWidth: view === "register" ? 480 : 420, position: "relative", transition: "max-width 0.3s" }}>
        <div style={{ position: "absolute", inset: -2, borderRadius: 24, background: "linear-gradient(135deg,rgba(91,143,255,0.5),rgba(192,132,252,0.4),rgba(34,211,238,0.3))", filter: "blur(1px)", zIndex: 0 }} />

        <div className="glass" style={{ borderRadius: 22, padding: view === "register" ? "32px 34px" : "40px 36px", position: "relative", zIndex: 1 }}>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 22 }}>
            <img src={apcLogo}       alt="APC logo"      style={{ height: 48, width: 48, objectFit: "contain" }} />
            <img src={docupulseLogo} alt="DocuPulse logo" style={{ height: 48, width: 74, objectFit: "contain" }} />
          </div>

          {view === "success" && (
            <div style={{ textAlign: "center", padding: "10px 0 20px" }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", margin: "0 auto 18px", background: "linear-gradient(135deg,rgba(46,232,154,0.2),rgba(46,232,154,0.06))", border: "1px solid rgba(46,232,154,0.4)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 24px rgba(46,232,154,0.25)" }}>
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><path d="M4 13l6 6 12-12" stroke="#2ee89a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h2 className="glow-text" style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 400, letterSpacing: "-0.02em", marginBottom: 8 }}>Account Created!</h2>
              <p style={{ color: "var(--color-muted)", fontSize: 13, marginBottom: 6 }}>Welcome, <span style={{ color: "var(--color-text)" }}>{regSuccess}</span>. Check your email to confirm your account.</p>
              <p style={{ fontSize: 11, color: "var(--color-muted)", marginBottom: 24 }}>Once confirmed, you can sign in with your credentials.</p>
              <button onClick={resetRegister} className="btn-gradient"
                style={{ padding: "11px 36px", borderRadius: 10, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}>
                Back to Sign In →
              </button>
            </div>
          )}

          {view === "login" && (
            <>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <h1 className="glow-text" style={{ fontFamily: "var(--font-display)", fontSize: "1.9rem", fontWeight: 400, letterSpacing: "-0.03em", marginBottom: 5 }}>DocuPulse</h1>
                <p style={{ color: "var(--color-muted)", fontSize: 13 }}>Asia Pacific College · Document Tracking</p>
                <div style={{ margin: "14px auto 0", width: 48, height: 2, background: "linear-gradient(90deg,transparent,#5b8fff,#c084fc,transparent)", borderRadius: 1 }} />
              </div>

              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Field label="Email" icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="12" height="8" rx="1.5" stroke="#5b8fff" strokeWidth="1.3"/><path d="M1 4l6 4 6-4" stroke="#5b8fff" strokeWidth="1.3" strokeLinecap="round"/></svg>}>
                  <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="yourname@apc.edu.ph" autoComplete="email" style={inputStyle(!!loginError)} />
                </Field>

                <Field label="Password" icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="6" width="10" height="7" rx="1.5" stroke="#5b8fff" strokeWidth="1.3"/><path d="M4.5 6V4.5a2.5 2.5 0 015 0V6" stroke="#5b8fff" strokeWidth="1.3" strokeLinecap="round"/><circle cx="7" cy="9.5" r="1" fill="#5b8fff"/></svg>}>
                  <input type={showPass ? "text" : "password"} value={loginPass} onChange={(e) => setLoginPass(e.target.value)} placeholder="Enter password" autoComplete="current-password" style={{ ...inputStyle(!!loginError), paddingRight: 36 }} />
                  {eyeIcon(showPass, () => setShowPass((p) => !p))}
                </Field>

                {loginError && (
                  <div style={{ background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "var(--color-red)", textAlign: "center" }}>
                    {loginError}
                  </div>
                )}

                <button type="submit" disabled={loginLoading || !loginEmail || !loginPass} className="btn-gradient"
                  style={{ width: "100%", padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 600, marginTop: 4, opacity: loginLoading || !loginEmail || !loginPass ? 0.5 : 1, cursor: loginLoading || !loginEmail || !loginPass ? "not-allowed" : "pointer", border: "none" }}>
                  {loginLoading ? "Signing in…" : "Sign In →"}
                </button>
              </form>

              <div style={{ textAlign: "center", marginTop: 20 }}>
                <span style={{ fontSize: 13, color: "var(--color-muted)" }}>{"Don't have an account? "}</span>
                <button onClick={() => setView("register")}
                  style={{ fontSize: 13, fontWeight: 600, color: "#a5c0ff", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textDecorationColor: "rgba(165,192,255,0.3)", textUnderlineOffset: 3 }}>
                  Create account
                </button>
              </div>

              <div style={{ marginTop: 18, background: "rgba(91,143,255,0.06)", border: "1px solid rgba(91,143,255,0.12)", borderRadius: 10, padding: "12px 14px" }}>
                <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--color-muted)", letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase" }}>Seed Accounts (after /setup)</p>
                {[
                  { role: "Admin",     cred: "admin@apc.edu.ph / admin123",      color: "#5b8fff" },
                  { role: "Logistics", cred: "logistics@apc.edu.ph / logistics1", color: "#22d3ee" },
                  { role: "Requestor", cred: "Register to create account",         color: "#c084fc" },
                ].map((a) => (
                  <div key={a.role} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "var(--color-muted)" }}>{a.role}</span>
                    <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: a.color, background: `${a.color}18`, padding: "2px 8px", borderRadius: 6 }}>{a.cred}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {view === "register" && (
            <>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <h1 className="glow-text" style={{ fontFamily: "var(--font-display)", fontSize: "1.7rem", fontWeight: 400, letterSpacing: "-0.03em", marginBottom: 5 }}>Create Account</h1>
                <p style={{ color: "var(--color-muted)", fontSize: 13 }}>Join DocuPulse at Asia Pacific College</p>
                <div style={{ margin: "12px auto 0", width: 48, height: 2, background: "linear-gradient(90deg,transparent,#c084fc,#5b8fff,transparent)", borderRadius: 1 }} />
              </div>

              <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                <Field label="Full Name" error={regTouched && regErrors.name ? regErrors.name : ""}
                  icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="5" r="3" stroke="#c084fc" strokeWidth="1.3"/><path d="M1 13c0-2.8 2.7-5 6-5s6 2.2 6 5" stroke="#c084fc" strokeWidth="1.3" strokeLinecap="round"/></svg>}>
                  <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="e.g. Juan dela Cruz" style={inputStyle(regTouched && !!regErrors.name)} />
                  {regName.trim() && !regErrors.name && <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#2ee89a" }}>✓</span>}
                </Field>

                <Field label="Email Address" error={regTouched && regErrors.email ? regErrors.email : ""}
                  icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="12" height="8" rx="1.5" stroke="#c084fc" strokeWidth="1.3"/><path d="M1 4l6 4 6-4" stroke="#c084fc" strokeWidth="1.3" strokeLinecap="round"/></svg>}>
                  <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="yourname@apc.edu.ph" autoComplete="email" style={inputStyle(regTouched && !!regErrors.email)} />
                  {regEmail.includes("@") && !regErrors.email && <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#2ee89a" }}>✓</span>}
                </Field>

                <div>
                  <Field label="Password" error={regTouched && regErrors.pass ? regErrors.pass : ""}
                    icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="6" width="10" height="7" rx="1.5" stroke="#c084fc" strokeWidth="1.3"/><path d="M4.5 6V4.5a2.5 2.5 0 015 0V6" stroke="#c084fc" strokeWidth="1.3" strokeLinecap="round"/><circle cx="7" cy="9.5" r="1" fill="#c084fc"/></svg>}>
                    <input type={showRegPass ? "text" : "password"} value={regPass} onChange={(e) => setRegPass(e.target.value)} placeholder="Min. 8 characters" autoComplete="new-password" style={{ ...inputStyle(regTouched && !!regErrors.pass), paddingRight: 36 }} />
                    {eyeIcon(showRegPass, () => setShowRegPass((p) => !p))}
                  </Field>
                  {regPass && (
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(strength.score / 4) * 100}%`, background: strength.color, borderRadius: 2, transition: "width 0.3s, background 0.3s", boxShadow: `0 0 6px ${strength.color}` }} />
                      </div>
                      <span style={{ fontSize: 10, color: strength.color, fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{strength.label}</span>
                    </div>
                  )}
                </div>

                <Field label="Confirm Password" error={regTouched && regErrors.confirm ? regErrors.confirm : ""}
                  icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 4" stroke="#c084fc" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}>
                  <input type={showConfirm ? "text" : "password"} value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)} placeholder="Re-enter password" autoComplete="new-password" style={{ ...inputStyle(regTouched && !!regErrors.confirm), paddingRight: 36 }} />
                  {eyeIcon(showConfirm, () => setShowConfirm((p) => !p))}
                </Field>

                {regError && (
                  <div style={{ background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "var(--color-red)", textAlign: "center" }}>
                    {regError}
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: "rgba(91,143,255,0.06)", border: "1px solid rgba(91,143,255,0.12)" }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#5b8fff" strokeWidth="1.2"/><path d="M6 5.5v3M6 4h.01" stroke="#5b8fff" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  <p style={{ fontSize: 11, color: "var(--color-muted)" }}>New accounts are assigned <span style={{ color: "#a5c0ff" }}>Requestor</span> role by default. Contact admin to request elevated access.</p>
                </div>

                <button type="submit" disabled={regLoading} className="btn-gradient"
                  style={{ width: "100%", padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 600, marginTop: 2, border: "none", cursor: regLoading ? "not-allowed" : "pointer", opacity: regLoading ? 0.6 : 1, background: "linear-gradient(135deg,#c084fc,#5b8fff)", boxShadow: "0 0 20px rgba(192,132,252,0.35)" }}>
                  {regLoading ? "Creating account…" : "Create Account →"}
                </button>
              </form>

              <div style={{ textAlign: "center", marginTop: 18 }}>
                <span style={{ fontSize: 13, color: "var(--color-muted)" }}>Already have an account? </span>
                <button onClick={() => setView("login")}
                  style={{ fontSize: 13, fontWeight: 600, color: "#a5c0ff", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textDecorationColor: "rgba(165,192,255,0.3)", textUnderlineOffset: 3 }}>
                  Sign in
                </button>
              </div>
            </>
          )}
        </div>

        <p style={{ textAlign: "center", marginTop: 18, fontSize: 11, color: "var(--color-muted)", fontFamily: "var(--font-mono)" }}>
          © 2026 Asia Pacific College. All rights reserved.
        </p>
      </div>
    </div>
  );
}