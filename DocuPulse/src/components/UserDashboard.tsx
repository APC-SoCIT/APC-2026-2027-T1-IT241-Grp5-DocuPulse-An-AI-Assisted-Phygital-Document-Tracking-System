import { useState, useMemo, useEffect, useCallback } from "react";
import apcLogo from "../assets/docupulse-logo.png";
import docupulseLogo from "../assets/docupulse-logo.png";
import RequisitionForm from "./RequisitionForm";
import NotificationBell from "./NotificationBell";
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

const STATUS_META: Record = {
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

const CAT_COLORS: Record = {
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
    
      
      {m.label}
    
  );
}

function MiniStepper({ status }: { status: ReqStatus }) {
  const steps = ["Submitted", "Dept Head", "Finance", "Complete"];
  const meta = STATUS_META[status] || { step: 1 };
  const activeStep = meta.step;
  const failed = status === "rejected";

  return (
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

{done && (

SVG

)}
{isFail && (

SVG

)}
{!done && !isFail && (

)}

{s}

{!isLast && (

)}

);
})}

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
const [expandedId, setExpandedId] = useState(null);

const [requisitions, setRequisitions] = useState([]);
const [, setRawReqs] = useState([]);
const [loading, setLoading] = useState(true);
const [fetchError, setFetchError] = useState(null);

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
  setFetchError(`\({error.message}\){error.code ? ` (${error.code})` : ""}`);
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
const filterRule = isLogisticsOrAdmin
? undefined
: requestor_id=eq.${user.id};

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

{showRequisition && (

)}

{/* Header Bar */}

DocuPulse

{(user.role || "REQUESTOR").toUpperCase()}

setShowRequisition(true)}
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

New Requisition

{initials}

{user.name}

Sign out

{/* Main Body */}

{/* Welcome Banner */}

Welcome Back

{user.name}
{isLogisticsOrAdmin
? "Viewing all system requisitions for department processing."
: "Track your submitted requisitions and monitor their approval status in real time."}

{/* Stats Grid */}

{stats.map((s) => (

{s.value}

{s.label}

))}

{/* Requisitions List Table */}

{/* Controls Bar */}

Requisition History
{filtered.length} of {requisitions.length} record(s)

setSearch(e.target.value)}
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

{STATUS_FILTER_TABS.map((t) => {
const active = statusFilter === t.key;
return (
setStatusFilter(t.key)}
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

);
})}

{fetchError && (

{fetchError}

)}

{/* Table Rows */}
{loading ? (

Syncing requisitions from Supabase...

) : filtered.length === 0 ? (

No requisitions match your selection.

) : (

{filtered.map((req) => {
const isExpanded = expandedId === req.id;
const catColor = CAT_COLORS[req.category] || "#5c729a";

return (

setExpandedId(isExpanded ? null : req.id)}
style={{
display: "grid",
gridTemplateColumns: "140px 1fr 110px 120px 110px 30px",
gap: 12,
padding: "14px 20px",
cursor: "pointer",
alignItems: "center",
background: isExpanded ? "rgba(91,143,255,0.04)" : "transparent",
}}
>
{req.id}

{req.title}

{req.category}

{new Date(req.submittedAt).toLocaleDateString()}

{isExpanded ? "▲" : "▼"}

{isExpanded && (

Description / Justification:

{req.description || "No description provided."}

Submitted by: {req.submittedBy}

)}

);
})}

)}

);
}