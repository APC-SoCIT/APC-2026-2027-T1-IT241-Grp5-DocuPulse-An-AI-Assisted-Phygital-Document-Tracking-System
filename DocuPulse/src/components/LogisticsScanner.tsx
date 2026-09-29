import { useState, useEffect, useRef, useCallback } from "react";
import apcLogo from "@/imports/apc-logo.png-removebg-preview.png";
import docupulseLogo from "@/imports/image-removebg-preview.png";
import NotificationBell from "./NotificationBell";
import type { AuthUser } from "./Login";
import { edgeCall } from "./lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

type ScanPhase = "idle" | "scanning" | "success";
type CustodyType = "scan" | "received" | "approved" | "dispatched" | "submitted";

interface CustodyEntry {
  type: CustodyType;
  location: string;
  actor: string;
  time: string;
  note: string;
}

interface MockReq {
  id: string;
  title: string;
  category: string;
  department: string;
  requestor: string;
  submittedAt: string;
  status: string;
  statusColor: string;
  priority: "Urgent" | "High" | "Normal";
  items: number;
  custody: CustodyEntry[];
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_POOL: MockReq[] = [
  {
    id: "REQ-2026-00147", title: "Office Supplies — Q4 Restock",
    category: "BMO", department: "Business Management Office",
    requestor: "James Osei", submittedAt: "2026-09-14T09:14:00+08:00",
    status: "In Transit", statusColor: "#ffbe3d", priority: "Normal", items: 12,
    custody: [
      { type: "scan",      location: "Logistics Hub B — Dispatch Bay",    actor: "Current Staff", time: "2026-09-17T14:30:00+08:00", note: "QR scan confirmed dispatch. Digital records synchronized in real time." },
      { type: "approved",  location: "Finance Department — Office 302",   actor: "Ana Reyes",     time: "2026-09-17T11:05:00+08:00", note: "Budget clearance approved. Released for logistics processing." },
      { type: "approved",  location: "Department Head — 4th Floor",       actor: "Carlos Mendez", time: "2026-09-16T16:22:00+08:00", note: "Priority verified and approved for procurement." },
      { type: "submitted", location: "DocuPulse — Digital Portal",        actor: "James Osei",    time: "2026-09-14T09:14:00+08:00", note: "Requisition submitted and awaiting first review." },
    ],
  },
  {
    id: "REQ-2026-00139", title: "Computer Equipment — Lab Upgrade",
    category: "ITRO", department: "IT & Research Operations",
    requestor: "Aiko Tanaka", submittedAt: "2026-09-12T13:45:00+08:00",
    status: "Received", statusColor: "#2ee89a", priority: "High", items: 5,
    custody: [
      { type: "scan",      location: "Logistics Hub A — Receiving Dock",  actor: "Current Staff", time: "2026-09-17T10:15:00+08:00", note: "QR scan confirmed receipt. Inventory count updated automatically." },
      { type: "received",  location: "Logistics Hub A — Warehouse Gate",  actor: "Luis Garcia",   time: "2026-09-16T15:30:00+08:00", note: "Physical delivery accepted. Packaging intact, quantity matched." },
      { type: "approved",  location: "Finance Department",                 actor: "Sara Chen",     time: "2026-09-15T14:00:00+08:00", note: "Budget clearance granted for equipment procurement." },
      { type: "approved",  location: "Department Head Office",             actor: "Elena Vasquez", time: "2026-09-14T09:30:00+08:00", note: "Technical specs reviewed and approved." },
      { type: "submitted", location: "DocuPulse — Digital Portal",        actor: "Aiko Tanaka",   time: "2026-09-12T13:45:00+08:00", note: "Initial digital submission with technical specifications." },
    ],
  },
  {
    id: "REQ-2026-00152", title: "Library Resource Procurement",
    category: "Library", department: "Library Services",
    requestor: "Lena Moreau", submittedAt: "2026-09-15T10:22:00+08:00",
    status: "Processed", statusColor: "#c084fc", priority: "Normal", items: 28,
    custody: [
      { type: "scan",      location: "Library Wing — Processing Room",    actor: "Current Staff", time: "2026-09-17T08:45:00+08:00", note: "QR scan: processing complete. Catalog records synchronized." },
      { type: "dispatched",location: "Logistics Hub C — Exit Bay",        actor: "David Park",    time: "2026-09-16T15:30:00+08:00", note: "Package dispatched to Library Wing for final intake." },
      { type: "approved",  location: "Finance Department",                 actor: "Theo Kim",      time: "2026-09-16T11:20:00+08:00", note: "Payment processed and vendor order confirmed." },
      { type: "approved",  location: "Department Head Office",             actor: "James Osei",    time: "2026-09-15T14:15:00+08:00", note: "Budget authority confirmed, acquisition approved." },
      { type: "submitted", location: "DocuPulse — Digital Portal",        actor: "Lena Moreau",   time: "2026-09-15T10:22:00+08:00", note: "Resource acquisition list submitted for approval." },
    ],
  },
  {
    id: "REQ-2026-00161", title: "Safety Equipment & PPE",
    category: "BMO", department: "Business Management Office",
    requestor: "Marco Rivera", submittedAt: "2026-09-16T14:05:00+08:00",
    status: "In Transit", statusColor: "#ffbe3d", priority: "Urgent", items: 40,
    custody: [
      { type: "scan",      location: "Logistics Hub B — Priority Lane",   actor: "Current Staff", time: "2026-09-17T13:55:00+08:00", note: "Priority QR scan. Urgent requisition fast-tracked. Sync complete." },
      { type: "approved",  location: "Finance — Priority Queue",          actor: "Ana Reyes",     time: "2026-09-17T09:30:00+08:00", note: "Emergency procurement approved. Expedited processing." },
      { type: "approved",  location: "Department Head Office",             actor: "Elena Vasquez", time: "2026-09-16T16:50:00+08:00", note: "Safety requisition escalated and approved within 2 hours." },
      { type: "submitted", location: "DocuPulse — Digital Portal",        actor: "Marco Rivera",  time: "2026-09-16T14:05:00+08:00", note: "Urgent safety equipment requisition filed." },
    ],
  },
];

const LOCATIONS = [
  "Logistics Hub A — Receiving Dock",
  "Logistics Hub B — Dispatch Bay",
  "Logistics Hub C — Exit Bay",
  "Finance Department",
  "Library Wing — Processing Room",
  "ITRO Laboratory",
  "Main Office — Ground Floor",
  "Warehouse — Section 3",
];

const CAT_COLORS: Record<string, string> = {
  BMO: "#ff6b6b", ITRO: "#2ee89a", Finance: "#5b8fff", Library: "#c084fc", Logistics: "#ffbe3d",
};

const CUSTODY_COLORS: Record<CustodyType, string> = {
  scan: "#c084fc", received: "#2ee89a", approved: "#ffbe3d",
  dispatched: "#5b8fff", submitted: "#c084fc",
};

const CUSTODY_LABELS: Record<CustodyType, string> = {
  scan: "QR Scan", received: "Received", approved: "Approved",
  dispatched: "Dispatched", submitted: "Digital Submission",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtAbs(iso: string) {
  return new Date(iso).toLocaleString("en-PH", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function fmtRel(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtShort(iso: string) {
  return new Date(iso).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true });
}

// ── Simulated QR grid (random stable pattern per seed) ───────────────────────
function qrCell(row: number, col: number, seed: number): boolean {
  const v = ((row * 7 + col * 13 + seed * 3) * 2654435761) >>> 0;
  return (v % 3) !== 0;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Corner({ pos, color, lit }: { pos: "tl"|"tr"|"bl"|"br"; color: string; lit: boolean }) {
  const L = 30; const T = 3.5; const R = 5; const S = L + 10;
  const isTop = pos === "tl" || pos === "tr";
  const isLeft = pos === "tl" || pos === "bl";
  const d = {
    tl: `M${S} ${T/2} H${R} Q${T/2} ${T/2} ${T/2} ${R} V${S}`,
    tr: `M0 ${T/2} H${S-R} Q${S-T/2} ${T/2} ${S-T/2} ${R} V${S}`,
    bl: `M${S} ${S-T/2} H${R} Q${T/2} ${S-T/2} ${T/2} ${S-R} V0`,
    br: `M0 ${S-T/2} H${S-R} Q${S-T/2} ${S-T/2} ${S-T/2} ${S-R} V0`,
  }[pos];
  return (
    <div style={{ position: "absolute", width: S, height: S, top: isTop ? 0 : undefined, bottom: !isTop ? 0 : undefined, left: isLeft ? 0 : undefined, right: !isLeft ? 0 : undefined, transition: "filter 0.35s", filter: lit ? `drop-shadow(0 0 10px ${color})` : "none" }}>
      <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} fill="none">
        <path d={d} stroke={color} strokeWidth={T} strokeLinecap="round" />
      </svg>
    </div>
  );
}

function StatusPill({ status, color }: { status: string; color: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 13px", borderRadius: 20, fontSize: 12, fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}38`, letterSpacing: "0.02em" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}`, display: "inline-block" }} />
      {status}
    </span>
  );
}

function PriorityBadge({ p }: { p: MockReq["priority"] }) {
  const cfg = {
    Urgent: { color: "#ff6b6b", bg: "rgba(255,107,107,0.12)", border: "rgba(255,107,107,0.3)" },
    High:   { color: "#ffbe3d", bg: "rgba(255,190,61,0.12)",  border: "rgba(255,190,61,0.3)"  },
    Normal: { color: "#5c729a", bg: "rgba(92,114,154,0.1)",   border: "rgba(92,114,154,0.2)"  },
  }[p];
  return (
    <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, padding: "2px 8px", borderRadius: 6, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, letterSpacing: "0.06em", textTransform: "uppercase" }}>{p}</span>
  );
}

function CustodyIcon({ type }: { type: CustodyType }) {
  switch (type) {
    case "scan":       return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="0.8" y="0.8" width="4" height="4" rx="0.6" stroke="currentColor" strokeWidth="1.2"/><rect x="8.2" y="0.8" width="4" height="4" rx="0.6" stroke="currentColor" strokeWidth="1.2"/><rect x="0.8" y="8.2" width="4" height="4" rx="0.6" stroke="currentColor" strokeWidth="1.2"/><rect x="2" y="2" width="1.6" height="1.6" fill="currentColor"/><rect x="9.4" y="2" width="1.6" height="1.6" fill="currentColor"/><rect x="2" y="9.4" width="1.6" height="1.6" fill="currentColor"/><path d="M8.2 8.2h1.4v1.4M10.8 8.2H12M8.2 10.8h1.4v1.4M10.8 10.8H12v1.4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>;
    case "received":   return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 9V11h9V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M6.5 1v7M4 5.5l2.5 2.5L9 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case "approved":   return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2"/><path d="M3.5 6.5l2.5 2.5 3.5-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case "dispatched": return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="4.5" width="7.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M8.5 6.5H10l2 2v2h-3.5V6.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><circle cx="3" cy="11" r="1" stroke="currentColor" strokeWidth="1.1"/><circle cx="8.5" cy="11" r="1" stroke="currentColor" strokeWidth="1.1"/></svg>;
    case "submitted":  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="2" y="1.5" width="9" height="11" rx="1.2" stroke="currentColor" strokeWidth="1.2"/><path d="M4.5 5h4M4.5 7.5h4M4.5 10h2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>;
  }
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function LogisticsScanner({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [phase,       setPhase]       = useState<ScanPhase>("idle");
  const [scannedReq,  setScannedReq]  = useState<MockReq | null>(null);
  const [progress,    setProgress]    = useState(0);         // 0-100 during scan
  const [flash,       setFlash]       = useState(false);     // success flash
  const [manualId,    setManualId]    = useState("");
  const [location,    setLocation]    = useState(LOCATIONS[0]);
  const [showLocDrop, setShowLocDrop] = useState(false);
  const [toast,       setToast]       = useState<string | null>(null);
  const [qrSeed,      setQrSeed]      = useState(42);        // for simulated QR pattern
  const [scanHistory, setScanHistory] = useState<{ id: string; time: string; status: string; statusColor: string }[]>([]);
  const [todayCount,  setTodayCount]  = useState(17);
  const [poolIdx,     setPoolIdx]     = useState(0);

  const scanTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initials = user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
  const reticleColor = phase === "success" ? "#2ee89a" : "#c084fc";
  const SCAN_MS = 2400;

  const triggerScan = useCallback((req: MockReq, loc: string) => {
    // Inject live location + actor into first custody entry
    const withScan: MockReq = {
      ...req,
      custody: req.custody.map((c, i) =>
        i === 0 ? { ...c, location: loc, actor: user.name, time: new Date().toISOString() } : c
      ),
    };
    setScannedReq(withScan);
    setPhase("success");
    setProgress(100);
    setFlash(true);
    setTimeout(() => setFlash(false), 600);
    setToast(req.id);
    setTodayCount((n) => n + 1);
    setQrSeed(Math.floor(Math.random() * 1000));
    setScanHistory((prev) => [
      { id: req.id, time: fmtShort(new Date().toISOString()), status: req.status, statusColor: req.statusColor },
      ...prev.slice(0, 4),
    ]);
    edgeCall("/scan", "POST", { requisition_id: req.id, location_tag: loc }).catch(() => null);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, [user.name]);

  const startScan = useCallback(() => {
    if (phase === "scanning") return;
    setPhase("scanning");
    setProgress(0);
    setQrSeed(Math.floor(Math.random() * 1000));

    // Animate progress bar
    const start = Date.now();
    if (progressTimer.current) clearInterval(progressTimer.current);
    progressTimer.current = setInterval(() => {
      const pct = Math.min(98, ((Date.now() - start) / SCAN_MS) * 100);
      setProgress(pct);
      if (pct >= 98) clearInterval(progressTimer.current!);
    }, 40);

    if (scanTimer.current) clearTimeout(scanTimer.current);
    scanTimer.current = setTimeout(() => {
      clearInterval(progressTimer.current!);
      const req = MOCK_POOL[poolIdx % MOCK_POOL.length];
      setPoolIdx((p) => p + 1);
      triggerScan(req, location);
    }, SCAN_MS);
  }, [phase, poolIdx, location, triggerScan]);

  const handleManual = () => {
    const id = manualId.trim().toUpperCase();
    if (!id) return;
    const found = MOCK_POOL.find((r) => r.id === id) || { ...MOCK_POOL[poolIdx % MOCK_POOL.length], id };
    setPoolIdx((p) => p + 1);
    triggerScan(found, location);
    setManualId("");
  };

  const handleScanNext = () => {
    setPhase("idle");
    setScannedReq(null);
    setProgress(0);
  };

  useEffect(() => () => {
    if (scanTimer.current)     clearTimeout(scanTimer.current);
    if (progressTimer.current) clearInterval(progressTimer.current);
    if (toastTimer.current)    clearTimeout(toastTimer.current);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (showLocDrop && !(e.target as Element).closest(".loc-drop")) setShowLocDrop(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showLocDrop]);

  // ── Simulated QR grid ──
  const QR_SIZE = 11;
  const qrCells = Array.from({ length: QR_SIZE }, (_, r) =>
    Array.from({ length: QR_SIZE }, (_, c) => qrCell(r, c, qrSeed))
  );

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "var(--font-body)", overflow: "hidden" }}>

      {/* ── Full-screen success flash ── */}
      {flash && <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(46,232,154,0.07)", pointerEvents: "none", animation: "flash-in 0.5s ease both" }} />}

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 24, zIndex: 100, display: "flex", alignItems: "center", gap: 12, padding: "14px 18px 14px 14px", borderRadius: 16, background: "rgba(5,9,20,0.95)", border: "1px solid rgba(46,232,154,0.45)", boxShadow: "0 8px 48px rgba(46,232,154,0.2), 0 0 0 1px rgba(46,232,154,0.08)", backdropFilter: "blur(20px)", animation: "toast-in 0.32s cubic-bezier(0.22,1,0.36,1) both" }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, rgba(46,232,154,0.25), rgba(46,232,154,0.08))", border: "1px solid rgba(46,232,154,0.55)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 20px rgba(46,232,154,0.35)" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8l4.5 4.5L14 3" stroke="#2ee89a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#2ee89a", letterSpacing: "-0.01em" }}>Scan Successful</p>
            <p style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "#5c729a", marginTop: 2 }}>{toast} · Phygital sync complete</p>
          </div>
          <div style={{ marginLeft: 8, display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#2ee89a", boxShadow: "0 0 7px #2ee89a", display: "block", animation: "pulse-glow 1.4s ease-in-out infinite" }} />
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 24px", background: "rgba(4,6,15,0.92)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(192,132,252,0.14)", position: "sticky", top: 0, zIndex: 10, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={apcLogo} alt="APC" style={{ height: 34, width: 34, objectFit: "contain" }} />
          <img src={docupulseLogo} alt="DocuPulse" style={{ height: 34, width: 52, objectFit: "contain" }} />
          <div style={{ width: 1, height: 20, background: "rgba(192,132,252,0.2)", margin: "0 4px" }} />
          <span className="glow-text" style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 400, letterSpacing: "-0.02em" }}>DocuPulse</span>
          <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: "linear-gradient(135deg,#c084fc,#5b8fff)", color: "#fff", letterSpacing: "0.1em" }}>LOGISTICS</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: "rgba(192,132,252,0.06)", border: "1px solid rgba(192,132,252,0.16)" }}>
            <span className="pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "#c084fc", boxShadow: "0 0 7px #c084fc", display: "inline-block" }} />
            <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#c084fc", letterSpacing: "0.07em" }}>PHYGITAL SYNC ACTIVE</span>
          </div>
          <NotificationBell user={user} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 12, borderLeft: "1px solid rgba(192,132,252,0.12)" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#c084fc,#5b8fff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: "var(--font-mono)" }}>{initials}</div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text)", lineHeight: 1.2 }}>{user.name}</p>
              <button onClick={onLogout} style={{ fontSize: 10, color: "var(--color-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Sign out</button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ══════════ LEFT: Scanner Panel ══════════ */}
        <aside style={{ width: 464, flexShrink: 0, display: "flex", flexDirection: "column", background: "rgba(5,8,18,0.8)", backdropFilter: "blur(20px)", borderRight: "1px solid rgba(192,132,252,0.09)", overflowY: "auto" }}>

          {/* Location picker */}
          <div style={{ padding: "16px 20px 10px" }}>
            <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "#5c729a", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 7 }}>Scanning Location</p>
            <div className="loc-drop" style={{ position: "relative" }}>
              <button onClick={() => setShowLocDrop((p) => !p)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 13px", borderRadius: 11, background: showLocDrop ? "rgba(192,132,252,0.1)" : "rgba(192,132,252,0.06)", border: `1px solid rgba(192,132,252,${showLocDrop ? 0.35 : 0.2})`, color: "#c084fc", cursor: "pointer", textAlign: "left", transition: "all 0.18s" }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="5" r="2.5" stroke="#c084fc" strokeWidth="1.2"/><path d="M6 1a4 4 0 014 4c0 3-4 7-4 7S2 8 2 5a4 4 0 014-4z" stroke="#c084fc" strokeWidth="1.2"/></svg>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{location}</span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: showLocDrop ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}><path d="M2 3.5l3 3 3-3" stroke="#c084fc" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              {showLocDrop && (
                <div style={{ position: "absolute", top: "calc(100% + 5px)", left: 0, right: 0, zIndex: 50, borderRadius: 11, background: "rgba(6,10,22,0.99)", border: "1px solid rgba(192,132,252,0.22)", boxShadow: "0 16px 48px rgba(0,0,0,0.7)", overflow: "hidden", animation: "drop-open 0.15s ease both" }}>
                  {LOCATIONS.map((loc) => {
                    const active = loc === location;
                    return (
                      <button key={loc} onClick={() => { setLocation(loc); setShowLocDrop(false); }}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "9px 14px", fontSize: 12, color: active ? "#c084fc" : "#94a3b8", background: active ? "rgba(192,132,252,0.08)" : "transparent", border: "none", cursor: "pointer", textAlign: "left", transition: "background 0.12s" }}
                        onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "rgba(192,132,252,0.04)"; }}
                        onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                        <span style={{ width: 12, flexShrink: 0 }}>
                          {active && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5L8.5 3" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{loc}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Viewfinder ── */}
          <div style={{ padding: "0 20px 14px" }}>
            <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", aspectRatio: "4/3", background: "linear-gradient(160deg,#050810 0%,#080d1c 60%,#060a18 100%)" }}>

              {/* Camera vignette */}
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)", pointerEvents: "none" }} />

              {/* Grid lines */}
              <div style={{ position: "absolute", inset: 0, opacity: 0.035, backgroundImage: "linear-gradient(rgba(192,132,252,1) 1px,transparent 1px),linear-gradient(90deg,rgba(192,132,252,1) 1px,transparent 1px)", backgroundSize: "30px 30px" }} />

              {/* Simulated QR code (visible during scanning + success) */}
              {(phase === "scanning" || phase === "success") && (
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", opacity: phase === "success" ? 0 : 0.2, transition: "opacity 0.3s" }}>
                  <div style={{ display: "grid", gap: 2, gridTemplateColumns: `repeat(${QR_SIZE}, 1fr)`, animation: "qr-shimmer 0.4s ease-in-out infinite alternate" }}>
                    {qrCells.map((row, r) =>
                      row.map((filled, c) => (
                        <div key={`${r}-${c}`} style={{ width: 7, height: 7, borderRadius: 1, background: filled ? "#c084fc" : "transparent", opacity: filled ? 0.7 : 0 }} />
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Detection box (scanning phase) */}
              {phase === "scanning" && (
                <div style={{ position: "absolute", top: "50%", left: "50%", width: 110, height: 110, transform: "translate(-50%,-50%)", border: "1.5px solid rgba(192,132,252,0.45)", borderRadius: 4, animation: "detect-pulse 0.9s ease-in-out infinite alternate", boxShadow: "0 0 20px rgba(192,132,252,0.2) inset" }} />
              )}

              {/* Scan sweep line */}
              {phase === "scanning" && (
                <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,rgba(192,132,252,0.9) 30%,#c084fc 50%,rgba(192,132,252,0.9) 70%,transparent)", boxShadow: "0 0 18px rgba(192,132,252,0.7), 0 0 40px rgba(192,132,252,0.2)", animation: "scan-sweep 1.7s ease-in-out infinite", zIndex: 3 }} />
              )}

              {/* Ambient glow */}
              {phase !== "idle" && (
                <div style={{ position: "absolute", inset: 0, background: phase === "success" ? "radial-gradient(ellipse at center, rgba(46,232,154,0.1) 0%, transparent 65%)" : "radial-gradient(ellipse at center, rgba(192,132,252,0.06) 0%, transparent 65%)", transition: "background 0.5s", pointerEvents: "none" }} />
              )}

              {/* Success state */}
              {phase === "success" && (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, animation: "fade-scale 0.4s cubic-bezier(0.22,1,0.36,1) both" }}>
                  <div style={{ width: 68, height: 68, borderRadius: "50%", background: "linear-gradient(135deg,rgba(46,232,154,0.3),rgba(46,232,154,0.08))", border: "1.5px solid rgba(46,232,154,0.65)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(46,232,154,0.4), 0 0 80px rgba(46,232,154,0.15)" }}>
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M4 14l6.5 6.5L24 5" stroke="#2ee89a" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <p style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#2ee89a", letterSpacing: "0.12em" }}>CODE DETECTED</p>
                </div>
              )}

              {/* Idle state */}
              {phase === "idle" && (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                  <svg width="52" height="52" viewBox="0 0 52 52" fill="none" style={{ opacity: 0.3 }}>
                    <rect x="4" y="4" width="16" height="16" rx="2" stroke="#c084fc" strokeWidth="1.8"/>
                    <rect x="32" y="4" width="16" height="16" rx="2" stroke="#c084fc" strokeWidth="1.8"/>
                    <rect x="4" y="32" width="16" height="16" rx="2" stroke="#c084fc" strokeWidth="1.8"/>
                    <rect x="8" y="8" width="8" height="8" fill="#c084fc" opacity="0.5"/>
                    <rect x="36" y="8" width="8" height="8" fill="#c084fc" opacity="0.5"/>
                    <rect x="8" y="36" width="8" height="8" fill="#c084fc" opacity="0.5"/>
                    <path d="M32 32h5v5M40 32h5M32 40h5v5M40 40h5v5" stroke="#c084fc" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                  <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#c084fc", letterSpacing: "0.1em", opacity: 0.5 }}>ALIGN QR CODE</p>
                </div>
              )}

              {/* Corner brackets */}
              <Corner pos="tl" color={reticleColor} lit={phase !== "idle"} />
              <Corner pos="tr" color={reticleColor} lit={phase !== "idle"} />
              <Corner pos="bl" color={reticleColor} lit={phase !== "idle"} />
              <Corner pos="br" color={reticleColor} lit={phase !== "idle"} />

              {/* Center dot */}
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 7, height: 7, borderRadius: "50%", background: reticleColor, opacity: phase === "idle" ? 0.2 : 0.65, boxShadow: `0 0 10px ${reticleColor}`, transition: "all 0.3s", zIndex: 4 }} />
            </div>

            {/* Progress bar */}
            <div style={{ marginTop: 10, height: 3, borderRadius: 2, background: "rgba(192,132,252,0.08)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, borderRadius: 2, background: phase === "success" ? "linear-gradient(90deg,#2ee89a,#c084fc)" : "linear-gradient(90deg,#c084fc,#5b8fff)", boxShadow: `0 0 8px ${phase === "success" ? "#2ee89a" : "#c084fc"}`, transition: phase === "success" ? "width 0.15s" : "width 0.04s linear" }} />
            </div>

            {/* Status row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 9 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span className="pulse" style={{ width: 7, height: 7, borderRadius: "50%", background: phase === "success" ? "#2ee89a" : phase === "scanning" ? "#ffbe3d" : "#c084fc", boxShadow: `0 0 7px ${phase === "success" ? "#2ee89a" : phase === "scanning" ? "#ffbe3d" : "#c084fc"}`, display: "inline-block" }} />
                <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: phase === "success" ? "#2ee89a" : phase === "scanning" ? "#ffbe3d" : "#c084fc", letterSpacing: "0.08em" }}>
                  {phase === "idle" ? "READY TO SCAN QR CODE" : phase === "scanning" ? `DETECTING… ${Math.round(progress)}%` : "SCAN COMPLETE"}
                </span>
              </div>
              <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#5c729a" }}>
                {new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
              </span>
            </div>
          </div>

          {/* Scan / Next button */}
          <div style={{ padding: "0 20px 14px" }}>
            {phase !== "success" ? (
              <button onClick={startScan} disabled={phase === "scanning"}
                style={{ width: "100%", padding: "13px", borderRadius: 13, fontSize: 14, fontWeight: 700, border: "none", cursor: phase === "scanning" ? "not-allowed" : "pointer", background: phase === "scanning" ? "rgba(192,132,252,0.07)" : "linear-gradient(135deg,#c084fc,#5b8fff)", color: phase === "scanning" ? "#c084fc" : "#04060f", boxShadow: phase === "scanning" ? "none" : "0 0 36px rgba(192,132,252,0.45), 0 4px 16px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, letterSpacing: "-0.01em", transition: "all 0.2s" }}>
                {phase === "scanning"
                  ? <><svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: "spin 0.8s linear infinite" }}><circle cx="7" cy="7" r="5.5" stroke="#c084fc" strokeWidth="1.5" strokeDasharray="18 16"/></svg>Scanning…</>
                  : <><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="0.8" y="0.8" width="4.5" height="4.5" rx="0.7" stroke="currentColor" strokeWidth="1.4"/><rect x="9.7" y="0.8" width="4.5" height="4.5" rx="0.7" stroke="currentColor" strokeWidth="1.4"/><rect x="0.8" y="9.7" width="4.5" height="4.5" rx="0.7" stroke="currentColor" strokeWidth="1.4"/><rect x="2.2" y="2.2" width="1.8" height="1.8" fill="currentColor"/><rect x="11.1" y="2.2" width="1.8" height="1.8" fill="currentColor"/><rect x="2.2" y="11.1" width="1.8" height="1.8" fill="currentColor"/><path d="M9.7 9.7h1.7v1.7M13 9.7h1.5M9.7 13h1.7v1.5M13 13H14.5v1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>Start Scanning</>}
              </button>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleScanNext}
                  style={{ flex: 1, padding: "12px", borderRadius: 12, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#c084fc,#5b8fff)", color: "#04060f", boxShadow: "0 0 28px rgba(192,132,252,0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="0.8" y="0.8" width="4" height="4" rx="0.6" stroke="currentColor" strokeWidth="1.3"/><rect x="8.2" y="0.8" width="4" height="4" rx="0.6" stroke="currentColor" strokeWidth="1.3"/><rect x="0.8" y="8.2" width="4" height="4" rx="0.6" stroke="currentColor" strokeWidth="1.3"/><rect x="2" y="2" width="1.6" height="1.6" fill="currentColor"/><rect x="9.4" y="2" width="1.6" height="1.6" fill="currentColor"/><rect x="2" y="9.4" width="1.6" height="1.6" fill="currentColor"/><path d="M8.2 8.2h1.4v1.4M10.8 8.2H12M8.2 10.8h1.4v1.4M10.8 10.8H12v1.4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
                  Scan Next Item
                </button>
                <button onClick={() => { setPhase("idle"); setScannedReq(null); setProgress(0); }}
                  style={{ padding: "12px 16px", borderRadius: 12, fontSize: 13, background: "rgba(255,255,255,0.04)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}>
                  Dashboard
                </button>
              </div>
            )}
          </div>

          {/* Manual entry */}
          <div style={{ padding: "0 20px 18px" }}>
            <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "#5c729a", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 7 }}>Manual Entry</p>
            <div style={{ display: "flex", gap: 7 }}>
              <input type="text" value={manualId} onChange={(e) => setManualId(e.target.value)} placeholder="REQ-2026-XXXXX"
                onKeyDown={(e) => { if (e.key === "Enter") handleManual(); }}
                style={{ flex: 1, padding: "9px 12px", borderRadius: 9, fontSize: 12, outline: "none", background: "rgba(12,18,38,0.8)", border: "1px solid rgba(192,132,252,0.18)", color: "var(--color-text)", fontFamily: "var(--font-mono)", letterSpacing: "0.06em", transition: "border-color 0.2s" }}
                onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(192,132,252,0.5)"; }}
                onBlur={(e) =>  { (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(192,132,252,0.18)"; }} />
              <button onClick={handleManual} disabled={!manualId.trim()}
                style={{ padding: "9px 14px", borderRadius: 9, fontSize: 12, fontWeight: 700, background: manualId.trim() ? "rgba(192,132,252,0.14)" : "rgba(192,132,252,0.03)", color: manualId.trim() ? "#c084fc" : "#334155", border: `1px solid rgba(192,132,252,${manualId.trim() ? 0.32 : 0.07})`, cursor: manualId.trim() ? "pointer" : "not-allowed", transition: "all 0.18s", fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
                GO
              </button>
            </div>
          </div>

          <div style={{ height: 1, background: "rgba(192,132,252,0.06)", margin: "0 20px" }} />

          {/* Recent scans */}
          <div style={{ padding: "14px 20px 10px" }}>
            <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "#5c729a", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 9 }}>Session Scans</p>
            {scanHistory.length === 0
              ? <p style={{ fontSize: 11, color: "#334155", fontFamily: "var(--font-mono)" }}>No scans yet</p>
              : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {scanHistory.map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 10px", borderRadius: 9, background: "rgba(192,132,252,0.03)", border: "1px solid rgba(192,132,252,0.07)" }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5L8.5 3" stroke="#c084fc" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <span style={{ flex: 1, fontSize: 11, fontFamily: "var(--font-mono)", color: "#c084fc", letterSpacing: "0.03em" }}>{s.id}</span>
                      <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: s.statusColor, background: `${s.statusColor}10`, padding: "1px 6px", borderRadius: 5 }}>{s.status}</span>
                      <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "#5c729a" }}>{s.time}</span>
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* Stats */}
          <div style={{ padding: "10px 20px 20px", marginTop: "auto" }}>
            <div style={{ borderRadius: 12, padding: "13px 16px", background: "linear-gradient(135deg,rgba(192,132,252,0.06),rgba(91,143,255,0.04))", border: "1px solid rgba(192,132,252,0.1)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
                {[
                  { label: "Today",   value: todayCount, color: "#c084fc" },
                  { label: "Success", value: "98.5%",    color: "#2ee89a" },
                  { label: "Pending", value: 3,           color: "#ffbe3d" },
                ].map((s, i) => (
                  <div key={s.label} style={{ textAlign: "center", borderLeft: i > 0 ? "1px solid rgba(192,132,252,0.08)" : "none", paddingLeft: i > 0 ? 0 : 0 }}>
                    <p style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-mono)", color: s.color, lineHeight: 1, textShadow: `0 0 16px ${s.color}55` }}>{s.value}</p>
                    <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "#5c729a", marginTop: 4, letterSpacing: "0.06em" }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* ══════════ RIGHT: Detail Panel ══════════ */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          {!scannedReq ? (

            /* ── Empty state ── */
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center", maxWidth: 440, padding: "0 24px" }}>
                <div style={{ width: 128, height: 128, borderRadius: 32, margin: "0 auto 32px", background: "linear-gradient(135deg,rgba(192,132,252,0.1),rgba(192,132,252,0.03))", border: "1.5px solid rgba(192,132,252,0.2)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 80px rgba(192,132,252,0.08)", animation: "idle-float 3s ease-in-out infinite" }}>
                  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" style={{ color: "#c084fc", opacity: 0.6 }}>
                    <rect x="4" y="4" width="18" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.8"/>
                    <rect x="34" y="4" width="18" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.8"/>
                    <rect x="4" y="34" width="18" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.8"/>
                    <rect x="8.5" y="8.5" width="9" height="9" fill="currentColor" opacity="0.45"/>
                    <rect x="38.5" y="8.5" width="9" height="9" fill="currentColor" opacity="0.45"/>
                    <rect x="8.5" y="38.5" width="9" height="9" fill="currentColor" opacity="0.45"/>
                    <path d="M34 34h6v6M42 34H48M34 42h6v6M42 42H48v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                  </svg>
                </div>

                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.7rem", fontWeight: 400, letterSpacing: "-0.02em", color: "#e8edf8", marginBottom: 10 }}>Ready to Scan QR Code</h2>
                <p style={{ fontSize: 14, color: "#5c729a", lineHeight: 1.7, marginBottom: 32 }}>Align the camera with a physical requisition's QR code. Scans instantly synchronize the location update to the digital record.</p>

                <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 32 }}>
                  {[
                    { label: "In system",   value: "243",   color: "#5b8fff" },
                    { label: "Avg sync",    value: "0.3s",  color: "#c084fc" },
                    { label: "Uptime",      value: "99.8%", color: "#2ee89a" },
                  ].map((s) => (
                    <div key={s.label} style={{ textAlign: "center", padding: "14px 20px", borderRadius: 14, background: `${s.color}07`, border: `1px solid ${s.color}15` }}>
                      <p style={{ fontSize: 24, fontWeight: 800, fontFamily: "var(--font-mono)", color: s.color, lineHeight: 1, marginBottom: 4, textShadow: `0 0 18px ${s.color}50` }}>{s.value}</p>
                      <p style={{ fontSize: 10, color: "#5c729a", fontFamily: "var(--font-mono)" }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                <button onClick={startScan}
                  style={{ padding: "12px 32px", borderRadius: 12, fontSize: 13, fontWeight: 700, background: "linear-gradient(135deg,rgba(192,132,252,0.14),rgba(91,143,255,0.08))", color: "#c084fc", border: "1px solid rgba(192,132,252,0.28)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 9, boxShadow: "0 0 24px rgba(192,132,252,0.1)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg,rgba(192,132,252,0.22),rgba(91,143,255,0.14))"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg,rgba(192,132,252,0.14),rgba(91,143,255,0.08))"; }}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="0.8" y="0.8" width="4" height="4" rx="0.6" stroke="currentColor" strokeWidth="1.3"/><rect x="8.2" y="0.8" width="4" height="4" rx="0.6" stroke="currentColor" strokeWidth="1.3"/><rect x="0.8" y="8.2" width="4" height="4" rx="0.6" stroke="currentColor" strokeWidth="1.3"/><rect x="2" y="2" width="1.6" height="1.6" fill="currentColor"/><rect x="9.4" y="2" width="1.6" height="1.6" fill="currentColor"/><rect x="2" y="9.4" width="1.6" height="1.6" fill="currentColor"/><path d="M8.2 8.2h1.4v1.4M10.8 8.2H12M8.2 10.8h1.4v1.4M10.8 10.8H12v1.4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
                  Begin Scanning
                </button>
              </div>
            </div>

          ) : (

            /* ── Requisition detail ── */
            <div style={{ flex: 1, overflowY: "auto", animation: "slide-in-right 0.38s cubic-bezier(0.22,1,0.36,1) both" }}>

              {/* Header band */}
              <div style={{ padding: "22px 28px 20px", borderBottom: "1px solid rgba(192,132,252,0.08)", background: `linear-gradient(180deg,${scannedReq.statusColor}0a 0%,transparent 100%)`, position: "relative" }}>

                {/* Phygital sync badge — top right */}
                <div style={{ position: "absolute", top: 20, right: 28, display: "flex", alignItems: "center", gap: 7, padding: "7px 12px", borderRadius: 10, background: "rgba(46,232,154,0.09)", border: "1px solid rgba(46,232,154,0.22)" }}>
                  <span className="pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "#2ee89a", boxShadow: "0 0 7px #2ee89a", display: "inline-block" }} />
                  <div>
                    <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#2ee89a", letterSpacing: "0.1em" }}>SYNCED</p>
                    <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#2ee89a" }}>{fmtShort(new Date().toISOString())}</p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#c084fc", letterSpacing: "0.07em" }}>{scannedReq.id}</span>
                  <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700, padding: "2px 9px", borderRadius: 6, background: `${CAT_COLORS[scannedReq.category] || "#5b8fff"}14`, color: CAT_COLORS[scannedReq.category] || "#5b8fff", border: `1px solid ${CAT_COLORS[scannedReq.category] || "#5b8fff"}28`, letterSpacing: "0.08em" }}>{scannedReq.category}</span>
                  <PriorityBadge p={scannedReq.priority} />
                </div>

                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 400, letterSpacing: "-0.01em", color: "#e8edf8", lineHeight: 1.3, marginBottom: 12 }}>{scannedReq.title}</h2>

                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
                  <StatusPill status={scannedReq.status} color={scannedReq.statusColor} />
                  <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#5c729a" }}>Scanned at <span style={{ color: "#94a3b8" }}>{location}</span></span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 9 }}>
                  {[
                    { label: "Department", value: scannedReq.department },
                    { label: "Requestor",  value: scannedReq.requestor },
                    { label: "Submitted",  value: fmtAbs(scannedReq.submittedAt) },
                    { label: "Items",      value: `${scannedReq.items} item${scannedReq.items > 1 ? "s" : ""}` },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: "rgba(192,132,252,0.04)", borderRadius: 9, padding: "9px 11px", border: "1px solid rgba(192,132,252,0.07)" }}>
                      <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "#5c729a", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{label}</p>
                      <p style={{ fontSize: 11.5, color: "#e8edf8", lineHeight: 1.3 }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chain of Custody */}
              <div style={{ padding: "22px 28px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(192,132,252,0.1)", border: "1px solid rgba(192,132,252,0.22)", display: "flex", alignItems: "center", justifyContent: "center", color: "#c084fc", flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="2.5" cy="2.5" r="1.8" stroke="currentColor" strokeWidth="1.2"/><circle cx="11.5" cy="2.5" r="1.8" stroke="currentColor" strokeWidth="1.2"/><circle cx="7" cy="11.5" r="1.8" stroke="currentColor" strokeWidth="1.2"/><path d="M4.3 2.5H9.7M11.5 4.3v5.3M4.4 4.2L3.2 6.5M5.5 11.5H2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: 13.5, fontWeight: 600, color: "#e8edf8", letterSpacing: "-0.01em", lineHeight: 1 }}>Chain of Custody</h3>
                    <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#5c729a", marginTop: 3 }}>{scannedReq.custody.length} tracked events · physical &amp; digital</p>
                  </div>
                </div>

                <div style={{ position: "relative", paddingBottom: 28 }}>
                  {/* Timeline line */}
                  <div style={{ position: "absolute", left: 18, top: 20, bottom: 28, width: 1.5, background: "linear-gradient(180deg,rgba(192,132,252,0.3) 0%,rgba(192,132,252,0.04) 100%)" }} />

                  {scannedReq.custody.map((entry, i) => {
                    const color  = CUSTODY_COLORS[entry.type];
                    const isScan = entry.type === "scan";
                    const isLast = i === scannedReq.custody.length - 1;
                    return (
                      <div key={i} style={{ display: "flex", gap: 16, paddingBottom: isLast ? 0 : 22, animation: `entry-appear 0.35s ${i * 0.07}s ease both` }}>

                        {/* Icon node */}
                        <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, background: isScan ? `linear-gradient(135deg,${color}28,${color}0c)` : `${color}10`, border: `${isScan ? 1.5 : 1}px solid ${color}${isScan ? "55" : "30"}`, display: "flex", alignItems: "center", justifyContent: "center", color, boxShadow: isScan ? `0 0 22px ${color}28` : "none", position: "relative", zIndex: 1 }}>
                          <CustodyIcon type={entry.type} />
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0, paddingTop: 3 }}>

                          {/* Row 1: type + phygital badge + timestamp */}
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700, color, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                              {CUSTODY_LABELS[entry.type]}
                            </span>
                            {isScan && (
                              <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 800, padding: "2px 8px", borderRadius: 5, background: "linear-gradient(135deg,rgba(192,132,252,0.2),rgba(46,232,154,0.1))", color: "#c084fc", border: "1px solid rgba(192,132,252,0.32)", letterSpacing: "0.1em", animation: "pulse-glow 2.5s ease-in-out infinite" }}>
                                ● PHYGITAL SYNC
                              </span>
                            )}
                            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                              <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#334155" }}>{fmtRel(entry.time)}</span>
                              <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#5c729a" }}>{fmtAbs(entry.time)}</span>
                            </div>
                          </div>

                          {/* Location */}
                          <p style={{ fontSize: 13, fontWeight: 500, color: "#e8edf8", marginBottom: 2 }}>{entry.location}</p>

                          {/* Actor */}
                          <p style={{ fontSize: 11, color: "#5c729a", marginBottom: 6 }}>
                            by <span style={{ color: "#94a3b8" }}>{entry.actor}</span>
                          </p>

                          {/* Note — highlighted for scan entries */}
                          <p style={{ fontSize: 11.5, color: isScan ? "#d8b4fe" : "#5c729a", lineHeight: 1.65, background: isScan ? "rgba(192,132,252,0.05)" : "transparent", borderRadius: isScan ? 9 : 0, padding: isScan ? "8px 11px" : "0", border: isScan ? "1px solid rgba(192,132,252,0.1)" : "none" }}>
                            {entry.note}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action bar */}
              <div style={{ padding: "14px 28px 24px", borderTop: "1px solid rgba(192,132,252,0.07)", display: "flex", alignItems: "center", gap: 10 }}>
                <button onClick={handleScanNext}
                  style={{ padding: "11px 22px", borderRadius: 12, fontSize: 13, fontWeight: 700, background: "linear-gradient(135deg,#c084fc,#5b8fff)", color: "#04060f", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 0 30px rgba(192,132,252,0.38)" }}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="0.8" y="0.8" width="4" height="4" rx="0.6" stroke="currentColor" strokeWidth="1.3"/><rect x="8.2" y="0.8" width="4" height="4" rx="0.6" stroke="currentColor" strokeWidth="1.3"/><rect x="0.8" y="8.2" width="4" height="4" rx="0.6" stroke="currentColor" strokeWidth="1.3"/><rect x="2" y="2" width="1.6" height="1.6" fill="currentColor"/><rect x="9.4" y="2" width="1.6" height="1.6" fill="currentColor"/><rect x="2" y="9.4" width="1.6" height="1.6" fill="currentColor"/><path d="M8.2 8.2h1.4v1.4M10.8 8.2H12M8.2 10.8h1.4v1.4M10.8 10.8H12v1.4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
                  Scan Next Item
                </button>
                <button onClick={() => { setPhase("idle"); setScannedReq(null); setProgress(0); }}
                  style={{ padding: "11px 18px", borderRadius: 12, fontSize: 13, background: "rgba(255,255,255,0.04)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}>
                  Return to Dashboard
                </button>
                <div style={{ flex: 1 }} />
                <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 12px", borderRadius: 9, background: "rgba(46,232,154,0.06)", border: "1px solid rgba(46,232,154,0.14)" }}>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1.5 5.5l3 3 5-5" stroke="#2ee89a" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "#2ee89a", letterSpacing: "0.04em" }}>Digital records synchronized</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <style>{`
        @keyframes scan-sweep {
          0%   { top: 5%; }
          50%  { top: 87%; }
          100% { top: 5%; }
        }
        @keyframes detect-pulse {
          from { opacity: 0.3; transform: translate(-50%,-50%) scale(0.94); }
          to   { opacity: 0.8; transform: translate(-50%,-50%) scale(1.02); }
        }
        @keyframes qr-shimmer {
          from { opacity: 0.15; }
          to   { opacity: 0.28; }
        }
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-14px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes flash-in {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes fade-scale {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes drop-open {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes entry-appear {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes idle-float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
