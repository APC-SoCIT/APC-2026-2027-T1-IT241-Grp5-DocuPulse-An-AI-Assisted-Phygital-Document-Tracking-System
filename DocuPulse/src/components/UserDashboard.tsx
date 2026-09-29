import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  ChevronDown,
  Paperclip,
  AlertTriangle,
  Inbox,
  Check,
  X,
} from "lucide-react";
import docupulseLogo from "../assets/docupulse-logo.png";
import RequisitionForm from "./RequisitionForm";
import NotificationBell from "./NotificationBell";
import { supabase, type DbRequisition } from "../lib/supabase";

/* ------------------------------------------------------------------ */
/* Types (exported: other files import these)                          */
/* ------------------------------------------------------------------ */

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
  priority?: string;
  department?: string;
  stage?: string;
  files?: { name: string; size: string; type: string }[];
}

export function dbRowToReq(row: DbRequisition): SubmittedReq {
  return {
    id: row.requisition_id || row.id,
    title: row.title || "Untitled requisition",
    category: row.category || "General",
    description: row.justification || row.description || "",
    submittedBy: row.requestor_name || row.requestor || "Unknown",
    submittedAt: row.created_at || new Date().toISOString(),
    status: row.status || "pending_dh",
    priority: row.priority,
    department: row.department,
    stage: row.workflow_stage,
    files: row.attachment_metadata || [],
  };
}

/* ------------------------------------------------------------------ */
/* Constants + helpers                                                 */
/* ------------------------------------------------------------------ */

type StatusKey = "pending_dh" | "review" | "approved" | "rejected";
type Filter = "all" | StatusKey;
type SortKey = "newest" | "oldest" | "title";

const STATUS_META: Record<StatusKey, { label: string; pill: string }> = {
  pending_dh: { label: "Pending dept head", pill: "bg-amber-400/10 text-amber-300 border-amber-400/30" },
  review: { label: "In review", pill: "bg-sky-400/10 text-sky-300 border-sky-400/30" },
  approved: { label: "Approved", pill: "bg-emerald-400/10 text-emerald-300 border-emerald-400/30" },
  rejected: { label: "Rejected", pill: "bg-red-400/10 text-red-300 border-red-400/30" },
};

// Tolerates legacy or capitalised values that may exist in the table.
const STATUS_ALIASES: Record<string, StatusKey> = {
  submitted: "pending_dh",
  pending: "pending_dh",
  pending_dh: "pending_dh",
  review: "review",
  in_review: "review",
  approved: "approved",
  rejected: "rejected",
};

const normalizeStatus = (raw: string): StatusKey =>
  STATUS_ALIASES[raw?.toLowerCase().trim().replace(/\s+/g, "_")] ?? "pending_dh";

const PRIORITY_STYLE: Record<string, string> = {
  Low: "bg-slate-800 text-slate-300",
  Medium: "bg-slate-800 text-slate-300",
  High: "bg-orange-400/10 text-orange-300",
  Urgent: "bg-red-400/10 text-red-300",
};

const FILTER_TABS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending_dh", label: "Pending" },
  { key: "review", label: "In review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const STAGES = ["Submitted", "Dept head", "Finance", "Complete"];

/** `current` = index of the stage the requisition is waiting on (4 = all done). */
function getProgress(status: StatusKey): { current: number; failed: boolean } {
  switch (status) {
    case "pending_dh":
      return { current: 1, failed: false };
    case "review":
      return { current: 2, failed: false };
    case "approved":
      return { current: STAGES.length, failed: false };
    case "rejected":
      return { current: 1, failed: true };
  }
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });

/* ------------------------------------------------------------------ */
/* Small components                                                    */
/* ------------------------------------------------------------------ */

function StatusPill({ status }: { status: StatusKey }) {
  const { label, pill } = STATUS_META[status];
  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${pill}`}>
      {label}
    </span>
  );
}

function ProgressSteps({ status }: { status: StatusKey }) {
  const { current, failed } = getProgress(status);

  return (
    <ol className="flex flex-wrap items-center gap-y-2" aria-label="Approval progress">
      {STAGES.map((stage, i) => {
        const state = failed && i === current ? "failed" : i < current ? "done" : i === current ? "active" : "todo";
        const dot = {
          done: "bg-emerald-400 text-emerald-950",
          active: "bg-amber-400 text-amber-950",
          failed: "bg-red-400 text-red-950",
          todo: "bg-slate-800 text-slate-400",
        }[state];
        const label = state === "todo" ? "text-slate-500" : state === "failed" ? "text-red-300" : "text-slate-100";

        return (
          <li key={stage} className="flex items-center">
            {i > 0 && (
              <span className={`mx-2 h-0.5 w-6 ${i <= current && !failed ? "bg-emerald-400/60" : "bg-slate-800"}`} />
            )}
            <span className={`flex items-center gap-2 text-xs ${label}`}>
              <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${dot}`}>
                {state === "done" ? <Check className="h-3 w-3" /> : state === "failed" ? <X className="h-3 w-3" /> : i + 1}
              </span>
              {stage}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-xs text-slate-200">{children}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

interface UserDashboardProps {
  user?: AuthUser;
  onLogout?: () => void;
}

export default function UserDashboard({
  user = { id: "demo-user", email: "student@apc.edu.ph", name: "Jose Mirador", role: "requestor" },
  onLogout = () => {},
}: UserDashboardProps) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [requisitions, setRequisitions] = useState<SubmittedReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const isStaff = user.role === "logistics" || user.role === "admin";
  const requestSeq = useRef(0);

  /* ---------- Data ---------- */

  const fetchRequisitions = useCallback(
    async (background = false) => {
      const seq = ++requestSeq.current; // ignore out-of-order responses
      if (background) setRefreshing(true);
      else setLoading(true);
      setFetchError(null);

      let query = supabase.from("requisitions").select("*").order("created_at", { ascending: false });
      if (!isStaff) query = query.eq("requestor_id", user.id);

      const { data, error } = await query;
      if (seq !== requestSeq.current) return;

      if (error) {
        console.error("Unable to load requisitions:", error);
        setFetchError(`${error.message}${error.code ? ` (${error.code})` : ""}`);
      } else {
        setRequisitions(((data || []) as DbRequisition[]).map(dbRowToReq));
      }
      setLoading(false);
      setRefreshing(false);
    },
    [user.id, isStaff]
  );

  useEffect(() => {
    fetchRequisitions();
  }, [fetchRequisitions]);

  // Realtime: quietly refresh when a relevant row changes.
  useEffect(() => {
    const channel = supabase
      .channel(`requisitions-dashboard-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requisitions",
          filter: isStaff ? undefined : `requestor_id=eq.${user.id}`,
        },
        () => fetchRequisitions(true)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id, isStaff, fetchRequisitions]);

  /* ---------- Derived ---------- */

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: requisitions.length, pending_dh: 0, review: 0, approved: 0, rejected: 0 };
    requisitions.forEach((r) => c[normalizeStatus(r.status)]++);
    return c;
  }, [requisitions]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();

    const list = requisitions.filter((r) => {
      if (statusFilter !== "all" && normalizeStatus(r.status) !== statusFilter) return false;
      if (!q) return true;
      return (
        r.id.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        formatDate(r.submittedAt).toLowerCase().includes(q) ||
        (isStaff && r.submittedBy.toLowerCase().includes(q))
      );
    });

    return [...list].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      const diff = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      return sort === "oldest" ? diff : -diff;
    });
  }, [requisitions, search, statusFilter, sort, isStaff]);

  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const stats: { label: string; value: number; filter: Filter; accent: string; text: string }[] = [
    { label: "Total", value: counts.all, filter: "all", accent: "border-l-indigo-400", text: "text-indigo-300" },
    { label: "Pending approval", value: counts.pending_dh + counts.review, filter: "pending_dh", accent: "border-l-amber-400", text: "text-amber-300" },
    { label: "Approved", value: counts.approved, filter: "approved", accent: "border-l-emerald-400", text: "text-emerald-300" },
    { label: "Rejected", value: counts.rejected, filter: "rejected", accent: "border-l-red-400", text: "text-red-300" },
  ];

  const hasFilters = search !== "" || statusFilter !== "all";
  const gridCols = "md:grid-cols-[150px_minmax(0,1fr)_170px_110px_160px_20px]";
  const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

  /* ---------- Render ---------- */

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
      {showForm && (
        <RequisitionForm user={user} onClose={() => setShowForm(false)} onSuccess={() => fetchRequisitions(true)} />
      )}

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <img src={docupulseLogo} alt="" className="h-8" />
            <span className="hidden text-lg font-bold sm:inline">DocuPulse</span>
            <span className="rounded-md bg-indigo-500/15 px-2 py-0.5 text-[11px] font-semibold capitalize text-indigo-300">
              {user.role || "requestor"}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <NotificationBell user={user} />

            <button
              onClick={() => setShowForm(true)}
              className={`flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 ${focusRing}`}
            >
              <Plus className="h-4 w-4" /> New requisition
            </button>

            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-xs font-bold">
                {initials}
              </div>
              <div className="hidden leading-tight sm:block">
                <div className="text-xs font-semibold">{user.name}</div>
                <button onClick={onLogout} className="text-[11px] text-slate-400 hover:text-white">
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <h1 className="text-2xl font-bold">Welcome back, {user.name.split(" ")[0]}</h1>
        <p className="mb-6 mt-1 text-sm text-slate-400">
          {isStaff
            ? "All requisitions in the system, ready for processing."
            : "Track your requisitions and see where each one is in the approval process."}
        </p>

        {/* Stats: click to filter */}
        <section aria-label="Summary" className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <button
              key={s.label}
              onClick={() => setStatusFilter(s.filter)}
              className={`rounded-xl border border-l-4 border-slate-800 bg-slate-900 p-4 text-left transition hover:bg-slate-800/70 ${s.accent} ${focusRing}`}
            >
              <span className={`block text-2xl font-bold tabular-nums ${s.text}`}>{loading ? "–" : s.value}</span>
              <span className="text-xs text-slate-400">{s.label}</span>
            </button>
          ))}
        </section>

        {!isStaff && counts.rejected > 0 && statusFilter !== "rejected" && (
          <div
            role="status"
            className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-3 text-xs text-red-200"
          >
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
              {counts.rejected} requisition{counts.rejected > 1 ? "s were" : " was"} rejected.
            </span>
            <button onClick={() => setStatusFilter("rejected")} className="font-semibold text-red-300 underline">
              Show rejected
            </button>
          </div>
        )}

        {fetchError && (
          <div
            role="alert"
            className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-3 text-xs text-red-200"
          >
            <span>Couldn't load requisitions: {fetchError}</span>
            <button
              onClick={() => fetchRequisitions()}
              className="rounded-lg border border-red-500/30 px-3 py-1 font-semibold hover:bg-red-500/10"
            >
              Try again
            </button>
          </div>
        )}

        {/* List */}
        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4">
            <div>
              <h2 className="text-sm font-semibold">Requisitions</h2>
              <span className="text-xs text-slate-500">
                Showing {visible.length} of {requisitions.length}
              </span>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={isStaff ? "Search ID, title, category, requestor" : "Search ID, title, category, date"}
                  aria-label="Search requisitions"
                  className={`w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-500 ${focusRing}`}
                />
              </div>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                aria-label="Sort requisitions"
                className={`rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 ${focusRing}`}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="title">Title A–Z</option>
              </select>

              <button
                onClick={() => fetchRequisitions(true)}
                disabled={refreshing || loading}
                aria-label="Refresh"
                className={`rounded-xl border border-slate-800 p-2 text-slate-400 transition hover:text-white disabled:opacity-50 ${focusRing}`}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          <div role="tablist" aria-label="Filter by status" className="flex gap-1 overflow-x-auto border-b border-slate-800 px-4 py-2">
            {FILTER_TABS.map((t) => {
              const active = statusFilter === t.key;
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStatusFilter(t.key)}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs transition ${focusRing} ${
                    active ? "bg-indigo-500/15 font-semibold text-indigo-200" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {t.label}
                  <span className="ml-1.5 tabular-nums text-slate-500">{counts[t.key]}</span>
                </button>
              );
            })}
          </div>

          {loading ? (
            <div aria-busy="true" className="space-y-2 p-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-800/60" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="px-4 py-14 text-center">
              <Inbox className="mx-auto mb-2 h-8 w-8 text-slate-600" />
              {requisitions.length === 0 ? (
                <>
                  <p className="text-sm font-semibold text-slate-200">No requisitions yet</p>
                  <p className="mt-1 text-xs text-slate-500">Create your first requisition to start tracking it here.</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className={`mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 ${focusRing}`}
                  >
                    <Plus className="h-4 w-4" /> New requisition
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-slate-200">No matches</p>
                  <p className="mt-1 text-xs text-slate-500">Try a different search or status filter.</p>
                  {hasFilters && (
                    <button
                      onClick={() => {
                        setSearch("");
                        setStatusFilter("all");
                      }}
                      className="mt-4 rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                    >
                      Clear filters
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <div>
              <div aria-hidden="true" className={`hidden gap-3 border-b border-slate-800 px-5 py-2.5 text-xs text-slate-500 md:grid ${gridCols}`}>
                <span>Requisition ID</span>
                <span>Title</span>
                <span>Category</span>
                <span>Submitted</span>
                <span>Status</span>
                <span />
              </div>

              <ul className="divide-y divide-slate-800/70">
                {visible.map((req) => {
                  const open = expandedId === req.id;
                  const status = normalizeStatus(req.status);
                  const urgent = req.priority === "High" || req.priority === "Urgent";

                  return (
                    <li key={req.id}>
                      <button
                        onClick={() => setExpandedId(open ? null : req.id)}
                        aria-expanded={open}
                        aria-controls={`detail-${req.id}`}
                        className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-5 py-3.5 text-left transition hover:bg-slate-800/40 md:gap-3 ${gridCols} ${
                          open ? "bg-slate-800/30" : ""
                        } ${focusRing}`}
                      >
                        <span className="truncate font-mono text-xs text-indigo-300 md:order-none">{req.id}</span>
                        <span className="order-first col-span-1 flex items-center gap-2 md:order-none">
                          <span className="truncate text-[13px] font-medium">{req.title}</span>
                          {urgent && req.priority && (
                            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${PRIORITY_STYLE[req.priority]}`}>
                              {req.priority}
                            </span>
                          )}
                        </span>
                        <span className="truncate text-xs text-slate-300">{req.category}</span>
                        <span className="text-xs text-slate-400">{formatDate(req.submittedAt)}</span>
                        <StatusPill status={status} />
                        <ChevronDown
                          aria-hidden="true"
                          className={`hidden h-4 w-4 text-slate-500 transition-transform md:block ${open ? "rotate-180" : ""}`}
                        />
                      </button>

                      {open && (
                        <div id={`detail-${req.id}`} className="border-t border-slate-800/70 bg-slate-950/40 px-5 py-5">
                          <div className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
                            <div>
                              <p className="mb-2 text-[11px] text-slate-500">Approval progress</p>
                              <ProgressSteps status={status} />

                              <p className="mb-1.5 mt-5 text-[11px] text-slate-500">Description</p>
                              <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-300">
                                {req.description || "No description provided."}
                              </p>
                            </div>

                            <dl className="grid grid-cols-2 content-start gap-x-4 gap-y-3">
                              <Detail label="Requestor">{req.submittedBy}</Detail>
                              <Detail label="Submitted">{formatDateTime(req.submittedAt)}</Detail>
                              {req.department && <Detail label="Department">{req.department}</Detail>}
                              {req.stage && <Detail label="Current stage">{req.stage}</Detail>}
                              {req.priority && (
                                <Detail label="Priority">
                                  <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${PRIORITY_STYLE[req.priority] ?? "bg-slate-800 text-slate-300"}`}>
                                    {req.priority}
                                  </span>
                                </Detail>
                              )}
                            </dl>
                          </div>

                          {req.files && req.files.length > 0 && (
                            <div className="mt-5">
                              <p className="mb-2 text-[11px] text-slate-500">Attachments ({req.files.length})</p>
                              <ul className="grid gap-1.5 sm:grid-cols-2">
                                {req.files.map((f) => (
                                  <li key={f.name} className="flex items-center justify-between gap-3 rounded-lg bg-slate-900 px-3 py-2 text-xs">
                                    <span className="flex min-w-0 items-center gap-2">
                                      <Paperclip className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                                      <span className="truncate">{f.name}</span>
                                    </span>
                                    <span className="shrink-0 text-slate-500">{f.size}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}