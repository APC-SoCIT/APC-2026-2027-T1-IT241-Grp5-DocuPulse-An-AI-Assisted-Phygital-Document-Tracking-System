import { STAGE_SEQUENCE, type DbApprovalStep, type DbLocationScan } from "./lib/supabase";

interface Props {
  status: string;
  approvalSteps: DbApprovalStep[];
  locationScans: DbLocationScan[];
  currentLocation?: string | null;
}

const STAGE_COLORS: Record<string, string> = {
  "Department Head": "#ffbe3d",
  "Finance":         "#5b8fff",
  "Logistics":       "#2ee89a",
  "Complete":        "#2ee89a",
  "Rejected":        "#ff6b6b",
};

function fmt(ts: string) {
  return new Date(ts).toLocaleString("en-PH", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

export default function ApprovalTimeline({ status, approvalSteps, locationScans, currentLocation }: Props) {
  const isApproved = status === "approved";
  const isRejected = status === "rejected";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* ── Stage stepper ── */}
      {STAGE_SEQUENCE.map((stage, idx) => {
        const step = approvalSteps.find((s) => s.stage === stage);
        const isDone     = step?.status === "Approved";
        const isFailed   = step?.status === "Rejected" || (isRejected && !step);
        const isActive   = !isDone && !isFailed && status.toLowerCase().includes(stage.toLowerCase().split(" ")[0]);
        const color      = isDone ? "#2ee89a" : isFailed ? "#ff6b6b" : isActive ? STAGE_COLORS[stage] : "#334155";
        const isLast     = idx === STAGE_SEQUENCE.length - 1;

        return (
          <div key={stage} style={{ display: "flex", gap: 14, paddingBottom: isLast ? 0 : 22, position: "relative" }}>
            {/* Connector line */}
            {!isLast && (
              <div style={{ position: "absolute", left: 11, top: 26, bottom: 0, width: 1.5, background: isDone ? "rgba(46,232,154,0.35)" : "rgba(91,143,255,0.1)" }} />
            )}

            {/* Node */}
            <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: isDone ? "rgba(46,232,154,0.18)" : isFailed ? "rgba(255,107,107,0.15)" : isActive ? `${color}18` : "rgba(91,143,255,0.06)", border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: (isDone || isActive) ? `0 0 10px ${color}40` : "none", zIndex: 1 }}>
              {isDone   && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#2ee89a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              {isFailed && <svg width="9"  height="9"  viewBox="0 0 9 9"  fill="none"><path d="M1.5 1.5l6 6M7.5 1.5l-6 6" stroke="#ff6b6b" strokeWidth="1.5" strokeLinecap="round"/></svg>}
              {!isDone && !isFailed && <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, opacity: isActive ? 1 : 0.3 }} />}
            </div>

            {/* Content */}
            <div style={{ flex: 1, paddingTop: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: isDone ? "#e8edf8" : isActive ? "var(--color-text)" : "#5c729a", letterSpacing: "-0.01em" }}>{stage} Review</p>
                <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: isDone ? "rgba(46,232,154,0.12)" : isFailed ? "rgba(255,107,107,0.12)" : isActive ? `${color}14` : "rgba(91,143,255,0.06)", color, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {isDone ? "Approved" : isFailed ? "Rejected" : isActive ? "In Progress" : "Queued"}
                </span>
              </div>

              {step && (
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {step.action_by_name && (
                    <p style={{ fontSize: 11, color: "#94a3b8" }}>
                      <span style={{ color }}>{step.action_by_name}</span>{" "}
                      {isDone ? "approved" : "rejected"} this stage
                    </p>
                  )}
                  <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#5c729a" }}>{fmt(step.updated_at)}</p>
                </div>
              )}

              {!step && isActive && (
                <p style={{ fontSize: 11, color: "#5c729a" }}>Awaiting reviewer action</p>
              )}
            </div>
          </div>
        );
      })}

      {/* Final approved marker */}
      {isApproved && (
        <div style={{ display: "flex", gap: 14, marginTop: 4 }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,rgba(46,232,154,0.25),rgba(46,232,154,0.1))", border: "2px solid #2ee89a", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 14px rgba(46,232,154,0.5)" }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1.5 5.5l2.5 3 5.5-6" stroke="#2ee89a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div style={{ flex: 1, paddingTop: 3 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#2ee89a" }}>Fully Approved</p>
            <p style={{ fontSize: 11, color: "#5c729a" }}>All stages cleared — document processed</p>
          </div>
        </div>
      )}

      {/* ── Location log ── */}
      {locationScans.length > 0 && (
        <div style={{ marginTop: 20, borderRadius: 12, background: "rgba(8,11,24,0.6)", border: "1px solid rgba(91,143,255,0.1)", overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(91,143,255,0.07)", display: "flex", alignItems: "center", gap: 7 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="5" r="2.5" stroke="#22d3ee" strokeWidth="1.2"/><path d="M6 1a4 4 0 014 4c0 3-4 7-4 7S2 8 2 5a4 4 0 014-4z" stroke="#22d3ee" strokeWidth="1.2"/></svg>
            <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#22d3ee", letterSpacing: "0.1em", textTransform: "uppercase" }}>Location Log</p>
            {currentLocation && (
              <span style={{ marginLeft: "auto", fontSize: 10, fontFamily: "var(--font-mono)", color: "#2ee89a", background: "rgba(46,232,154,0.1)", padding: "2px 8px", borderRadius: 5, border: "1px solid rgba(46,232,154,0.2)" }}>
                Now: {currentLocation}
              </span>
            )}
          </div>
          <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8, maxHeight: 180, overflowY: "auto" }}>
            {[...locationScans].reverse().map((scan) => (
              <div key={scan.id} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22d3ee", boxShadow: "0 0 5px #22d3ee", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <span style={{ color: "#22d3ee" }}>{scan.location_tag}</span>
                    {scan.scanned_by_name && <span style={{ color: "#5c729a" }}> · by {scan.scanned_by_name}</span>}
                  </p>
                </div>
                <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "#334155", flexShrink: 0 }}>{fmt(scan.scanned_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
