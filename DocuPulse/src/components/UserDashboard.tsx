import { useState, useMemo, useEffect, useCallback } from "react";
import docupulseLogo from "../assets/docupulse-logo.png";
import RequisitionForm from "./RequisitionForm";
import NotificationsFeed from "./NotificationsFeed";
import { supabase, type DbRequisition } from "../lib/supabase";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "requestor" | "approver" | "logistics" | "admin" | string;
}

export interface SubmittedReq {
  id: string;
  title: string;
  category: string;
  description: string;
  submittedBy: string;
  submittedAt: string;
  status: "pending_dh" | "review" | "approved" | "rejected" | string;
  files?: { name: string; size: string; type: string }[];
}

export function dbRowToReq(row: DbRequisition): SubmittedReq {
  return {
    id: row.requisition_id || row.id,
    title: row.title || "Untitled Requisition",
    category: row.category || "General",
    description: row.justification || row.description || "",
    submittedBy: row.requestor_name || row.requestor || "Unknown",
    submittedAt: row.created_at || new Date().toISOString(),
    status: row.status || "pending_dh",
    files: row.attachment_metadata || [],
  };
}

type ReqStatus = "pending_dh" | "review" | "approved" | "rejected" | string;

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string; step: number }> = {
  pending_dh: {
    label: "Pending Dept Head",
    color: "#ffbe3d",
    bg: "rgba(255,190,61,0.12)",
    border: "rgba(255,190,61,0.3)",
    step: 1,
  },
  review: {
    label: "In Review",
    color: "#a5c0ff",
    bg: "rgba(165,192,255,0.12)",
    border: "rgba(165,192,255,0.3)",
    step: 2,
  },
  approved: {
    label: "Approved",
    color: "#2ee89a",
    bg: "rgba(46,232,154,0.12)",
    border: "rgba(46,232,154,0.3)",
    step: 4,
  },
  rejected: {
    label: "Rejected",
    color: "#ff6b6b",
    bg: "rgba(255,107,107,0.12)",
    border: "rgba(255,107,107,0.3)",
    step: 2,
  },
};

const CAT_COLORS: Record<string, string> = {
  Logistics: "#ffbe3d",
  Finance: "#5b8fff",
  ITRO: "#2ee89a",
  BMO: "#ff6b6b",
  Library: "#c084fc",
};

const STATUS_FILTER_TABS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending_dh", label: "Pending" },
  { key: "review", label: "In Review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

function StatusPill({ status }: { status: ReqStatus }) {
  const m = STATUS_META[status] || {
    label: status,
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.12)",
    border: "rgba(148,163,184,0.3)",
  };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        color: m.color,
        background: m.bg,
        border: `1px solid ${m.border}`,
      }}
    >
      {m.label}
    </span>
  );
}

function MiniStepper({ status }: { status: ReqStatus }) {
  const steps = ["Submitted", "Dept Head", "Finance", "Complete"];
  const meta = STATUS_META[status] || { step: 1 };
  const activeStep = meta.step;
  const failed = status === "rejected";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {steps.map((s, i) => {
        const done = i < activeStep && !failed;
        const current = i === activeStep - 1;
        const isFail = failed && current;
        const isLast = i === steps.length - 1;
        const nodeColor = isFail
          ? "#ff6b6b"
          : done
          ? "#2ee89a"
          : current
          ? "#ffbe3d"
          : "rgba(91,143,255,0.15)";

        return (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: nodeColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                color: "#fff",
                fontWeight: 700,
              }}
            >
              {done && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {isFail && "✕"}
              {!done && !isFail && i + 1}
            </div>
            <span style={{ fontSize: 11, color: current ? "#fff" : "#64748b" }}>{s}</span>
            {!isLast && <div style={{ width: 16, height: 1, background: "rgba(255,255,255,0.1)" }} />}
          </div>
        );
      })}
    </div>
  );
}

export default function UserDashboard({
  user = { id: "demo-user", email: "student@apc.edu.ph", name: "Jose Mirador", role: "requestor" },
  onLogout = () => {},
}: {
  user?: AuthUser;
  onLogout?: () => void;
}) {
  const [showRequisition, setShowRequisition] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [requisitions, setRequisitions] = useState<SubmittedReq[]>([]);
  const [, setRawReqs] = useState<DbRequisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const isLogisticsOrAdmin = user.role === "logistics" || user.role === "admin";

  const fetchRequisitions = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    let query = supabase
      .from("requisitions")
      .select("*")
      .order("created_at", { ascending: false });

    if (!isLogisticsOrAdmin && user.id) {
      query = query.eq("requestor_id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Unable to load requisitions:", error);
      setFetchError(`${error.message}${error.code ? ` (${error.code})` : ""}`);
      setLoading(false);
      return;
    }

    const rows = (data || []) as DbRequisition[];
    setRawReqs(rows);
    setRequisitions(rows.map(dbRowToReq));
    setLoading(false);
  }, [user.id, isLogisticsOrAdmin]);

  useEffect(() => {
    fetchRequisitions();
  }, [fetchRequisitions]);

  useEffect(() => {
    const filterRule = isLogisticsOrAdmin ? undefined : `requestor_id=eq.${user.id}`;

    const channel = supabase
      .channel("requisitions-dashboard")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requisitions",
          filter: filterRule,
        },
        () => {
          fetchRequisitions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id, isLogisticsOrAdmin, fetchRequisitions]);

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
    : "JM";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requisitions.filter((r) => {
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchSearch =
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        new Date(r.submittedAt)
          .toLocaleDateString("en-PH", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
          .toLowerCase()
          .includes(q);
      return matchStatus && matchSearch;
    });
  }, [requisitions, search, statusFilter]);

  const stats = [
    {
      label: "Total Requisitions",
      value: requisitions.length,
      color: "#5b8fff",
      glow: "rgba(91,143,255,0.3)",
      grad: "linear-gradient(135deg,#5b8fff22,#5b8fff08)",
    },
    {
      label: "Pending Approval",
      value: requisitions.filter((r) => r.status === "pending_dh" || r.status === "Submitted").length,
      color: "#ffbe3d",
      glow: "rgba(255,190,61,0.3)",
      grad: "linear-gradient(135deg,#ffbe3d22,#ffbe3d08)",
    },
    {
      label: "Approved",
      value: requisitions.filter((r) => r.status === "approved" || r.status === "Approved").length,
      color: "#2ee89a",
      glow: "rgba(46,232,154,0.3)",
      grad: "linear-gradient(135deg,#2ee89a22,#2ee89a08)",
    },
    {
      label: "Rejected",
      value: requisitions.filter((r) => r.status === "rejected" || r.status === "Rejected").length,
      color: "#ff6b6b",
      glow: "rgba(255,107,107,0.3)",
      grad: "linear-gradient(135deg,#ff6b6b22,#ff6b6b08)",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0b0f19", color: "#fff", padding: "20px 40px" }}>
      {showRequisition && (
        <RequisitionForm user={user} onClose={() => setShowRequisition(false)} onSuccess={fetchRequisitions} />
      )}

      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: 20,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={docupulseLogo} alt="DocuPulse" style={{ height: 32 }} />
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "0.5px" }}>DocuPulse</span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 6,
              background: "rgba(91,143,255,0.15)",
              color: "#5b8fff",
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            {(user.role || "REQUESTOR").toUpperCase()}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <NotificationsFeed user={user} />

          <button
            onClick={() => setShowRequisition(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              border: "none",
              background: "linear-gradient(135deg,#4f46e5,#6366f1)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            + New Requisition
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</div>
              <button
                onClick={onLogout}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: 11,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main style={{ marginTop: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px 0" }}>Welcome Back, {user.name}</h1>
          <p style={{ color: "#94a3b8", margin: 0, fontSize: 14 }}>
            {isLogisticsOrAdmin
              ? "Viewing all system requisitions for department processing."
              : "Track your submitted requisitions and monitor their approval status in real time."}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                padding: 20,
                borderRadius: 14,
                background: s.grad,
                border: `1px solid ${s.color}33`,
                boxShadow: `0 4px 20px ${s.glow}`,
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            background: "rgba(15,23,42,0.6)",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.08)",
            padding: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Requisition History</h2>
              <span style={{ fontSize: 12, color: "#64748b" }}>
                {filtered.length} of {requisitions.length} record(s)
              </span>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID, title, category..."
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  fontSize: 12,
                  outline: "none",
                  background: "rgba(20,28,52,0.8)",
                  border: "1px solid rgba(91,143,255,0.15)",
                  color: "#fff",
                  width: 220,
                }}
              />

              <div
                style={{
                  display: "flex",
                  background: "rgba(20,28,52,0.8)",
                  padding: 3,
                  borderRadius: 9,
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                {STATUS_FILTER_TABS.map((t) => {
                  const active = statusFilter === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setStatusFilter(t.key)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 7,
                        fontSize: 11,
                        fontFamily: "monospace",
                        fontWeight: active ? 700 : 400,
                        background: active ? "rgba(91,143,255,0.18)" : "transparent",
                        color: active ? "#5b8fff" : "#94a3b8",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {fetchError && (
            <div style={{ padding: 12, borderRadius: 8, background: "rgba(255,107,107,0.1)", color: "#ff6b6b", fontSize: 12, marginBottom: 16 }}>
              {fetchError}
            </div>
          )}

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 13 }}>
              Syncing requisitions from Supabase...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 13 }}>
              No requisitions match your selection.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filtered.map((req) => {
                const isExpanded = expandedId === req.id;
                const catColor = CAT_COLORS[req.category] || "#5c729a";

                return (
                  <div
                    key={req.id}
                    style={{
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.05)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : req.id)}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "140px 1fr 110px 120px 140px 30px",
                        gap: 12,
                        padding: "14px 20px",
                        cursor: "pointer",
                        alignItems: "center",
                        background: isExpanded ? "rgba(91,143,255,0.04)" : "transparent",
                      }}
                    >
                      <span style={{ fontSize: 12, fontFamily: "monospace", color: "#5b8fff" }}>{req.id}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{req.title}</span>
                      <span
                        style={{
                          fontSize: 11,
                          color: catColor,
                          fontWeight: 600,
                        }}
                      >
                        {req.category}
                      </span>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>
                        {new Date(req.submittedAt).toLocaleDateString()}
                      </span>
                      <StatusPill status={req.status} />
                      <span style={{ color: "#64748b", fontSize: 12 }}>{isExpanded ? "▲" : "▼"}</span>
                    </div>

                    {isExpanded && (
                      <div
                        style={{
                          padding: "16px 20px",
                          borderTop: "1px solid rgba(255,255,255,0.05)",
                          background: "rgba(0,0,0,0.2)",
                        }}
                      >
                        <div style={{ marginBottom: 12 }}>
                          <span style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>
                            Approval Progress
                          </span>
                          <MiniStepper status={req.status} />
                        </div>
                        <div style={{ fontSize: 12, color: "#cbd5e1", marginBottom: 8 }}>
                          <strong>Description / Justification:</strong>
                          <p style={{ margin: "4px 0 0 0", color: "#94a3b8" }}>
                            {req.description || "No description provided."}
                          </p>
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>Submitted by: {req.submittedBy}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}