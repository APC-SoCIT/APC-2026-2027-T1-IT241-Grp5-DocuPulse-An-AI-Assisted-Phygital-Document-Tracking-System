import { useEffect, useMemo, useState } from "react"
import type { SubmittedReq } from "./App"
import {
  STATUS_TO_STAGE,
  type DbApprovalStep,
  type DbLocationScan,
  type DbRequisition,
} from "./lib/supabase"

interface Props {
  requisition: SubmittedReq
  record?: DbRequisition
}

type TimelineEntry = {
  id: string
  title: string
  detail: string
  time: string
  tone: "active" | "approved" | "progress"
}

type ApprovalStatus = "Pending" | "Approved" | "Rejected"

const WORKFLOW = [
  "Submitted",
  "Under Review",
  "Approved",
  "Processing",
  "Completed",
]

const APPROVAL_CHAIN = [
  {
    stage: "Department Head",
    label: "Department Head",
    description: "Validates the request and confirms departmental need.",
  },
  {
    stage: "Finance",
    label: "Finance Officer",
    description: "Reviews budget availability and provides financial clearance.",
  },
  {
    stage: "Logistics",
    label: "Logistics",
    description: "Coordinates procurement, fulfillment, and physical handoff.",
  },
]

function relativeTime(timestamp: string, now: number) {
  const seconds = Math.max(
    0,
    Math.floor((now - new Date(timestamp).getTime()) / 1000),
  )
  if (seconds < 10) return "just now"
  if (seconds < 60) return `${seconds} seconds ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}

function absoluteTime(timestamp: string) {
  return new Date(timestamp).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

function activeWorkflowIndex(status: string) {
  const normalized = status.toLowerCase()
  if (normalized === "approved" || normalized.includes("complete")) return 4
  if (normalized.includes("logistics") || normalized.includes("processing")) return 3
  if (normalized.includes("approved")) return 2
  if (normalized.includes("finance")) return 1
  if (normalized.includes("submitted")) return 0
  return 1
}

function currentDepartment(record: DbRequisition | undefined, status: string) {
  if (status.toLowerCase().includes("reject")) return "Requestor"
  const mapped = STATUS_TO_STAGE[status]
  if (mapped === "Finance") return "Finance Office"
  if (mapped === "Logistics") return "Logistics Office"
  if (mapped === "Department Head") return "Department Head"
  if (mapped === "Complete") return "Records & Release"
  return record?.department || "Review Office"
}

function buildTimeline(
  requisition: SubmittedReq,
  approvalSteps: DbApprovalStep[],
  scans: DbLocationScan[],
): TimelineEntry[] {
  const approvals: TimelineEntry[] = approvalSteps.map((step) => ({
    id: `approval-${step.id}`,
    title:
      step.status === "Pending"
        ? `${step.stage} review started`
        : `${step.stage} ${step.status.toLowerCase()}`,
    detail:
      step.status === "Pending"
        ? `Your requisition is currently in the ${step.stage} queue.`
        : `${step.action_by_name || "An authorized reviewer"} marked this stage as ${step.status.toLowerCase()}.`,
    time: step.updated_at,
    tone: step.status === "Approved" ? "approved" : "progress",
  }))

  const locations: TimelineEntry[] = scans.map((scan) => ({
    id: `scan-${scan.id}`,
    title: `Checked in at ${scan.location_tag}`,
    detail: scan.scanned_by_name
      ? `Custody confirmed by ${scan.scanned_by_name}.`
      : "Physical custody and location were synchronized.",
    time: scan.scanned_at,
    tone: "active",
  }))

  return [
    ...approvals,
    ...locations,
    {
      id: `submitted-${requisition.id}`,
      title: "Requisition submitted",
      detail: "Form and supporting documents were received by DocuPulse.",
      time: requisition.submittedAt,
      tone: "active",
    } as TimelineEntry,
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
}

function DepartmentIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-7h6v7M8 10h.01M12 10h.01M16 10h.01"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TimelineIcon({ tone }: { tone: TimelineEntry["tone"] }) {
  if (tone === "approved") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 16 16" fill="none">
        <path
          d="m3 8 3 3 7-7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (tone === "progress") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 3v5l3 2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 16 16" fill="none">
      <rect x="2.5" y="2.5" width="4" height="4" rx="0.7" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9.5" y="2.5" width="4" height="4" rx="0.7" stroke="currentColor" strokeWidth="1.3" />
      <rect x="2.5" y="9.5" width="4" height="4" rx="0.7" stroke="currentColor" strokeWidth="1.3" />
      <path d="M9.5 9.5h1.5V11h2.5M9.5 13.5H11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function ApprovalStatusIcon({ status }: { status: ApprovalStatus }) {
  if (status === "Approved") {
    return (
      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 20 20" fill="none">
        <path
          d="m4 10 4 4 8-9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (status === "Rejected") {
    return (
      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 20 20" fill="none">
        <path
          d="m5 5 10 10M15 5 5 15"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M10 6v4l3 2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function RequisitionTracker({ requisition, record }: Props) {
  const [now, setNow] = useState(Date.now())
  const currentStatus = record?.status || requisition.status
  const workflowIndex = activeWorkflowIndex(currentStatus)
  const isRejected = currentStatus.toLowerCase().includes("reject")
  const isComplete =
    currentStatus.toLowerCase() === "approved" ||
    currentStatus.toLowerCase().includes("complete")
  const mappedStage = STATUS_TO_STAGE[currentStatus]
  const mappedApprovalIndex = APPROVAL_CHAIN.findIndex(
    (item) => item.stage === mappedStage,
  )
  const approvals = record?.approval_steps || []
  const scans = record?.location_scans || []
  const timeline = useMemo(
    () => buildTimeline(requisition, approvals, scans),
    [requisition, approvals, scans],
  )
  const approvalChain = useMemo(
    () =>
      APPROVAL_CHAIN.map((approver, index) => {
        const step = approvals.find((item) =>
          item.stage.toLowerCase().includes(approver.stage.toLowerCase()),
        )
        const inferredStatus =
          isComplete || (mappedApprovalIndex >= 0 && index < mappedApprovalIndex)
            ? "Approved"
            : "Pending"
        return {
          ...approver,
          status: (step?.status || inferredStatus) as ApprovalStatus,
          timestamp: step?.updated_at,
          actor: step?.action_by_name,
        }
      }),
    [approvals, isComplete, mappedApprovalIndex],
  )
  const mappedPendingIndex = approvalChain.findIndex(
    (item) => item.stage === mappedStage && item.status === "Pending",
  )
  const currentApprovalIndex = isComplete
    ? -1
    : isRejected
      ? approvalChain.findIndex((item) => item.status === "Rejected")
      : mappedPendingIndex >= 0
        ? mappedPendingIndex
        : approvalChain.findIndex((item) => item.status === "Pending")
  const lastUpdated = timeline[0]?.time || requisition.submittedAt
  const department = currentDepartment(
    record,
    record?.status || requisition.status,
  )

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
      <div className="relative overflow-hidden border-b border-border bg-linear-to-br from-accent/15 via-purple/10 to-cyan/5 p-6">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-purple/10 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-cyan/5 blur-3xl" />
        <div className="relative flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <span className="bg-linear-to-r from-accent via-purple to-cyan bg-clip-text font-mono text-xs font-medium tracking-widest text-transparent">
                  {requisition.id}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-green/25 bg-green/10 px-3 py-1 font-mono text-xs font-medium uppercase tracking-wider text-green">
                  <span className="pulse h-2 w-2 rounded-full bg-green shadow-lg shadow-green/50" />
                  Live
                </span>
              </div>
              <p className="font-display text-3xl leading-tight text-text">
                {requisition.title}
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                Track every approval and handoff as it happens.
              </p>
            </div>
            <div className="rounded-xl bg-linear-to-br from-accent/45 via-purple/40 to-cyan/30 p-px shadow-lg shadow-purple/10">
              <div className="rounded-xl bg-bg/90 px-4 py-3 text-right">
                <p className="bg-linear-to-r from-accent via-purple to-cyan bg-clip-text font-mono text-xs font-medium uppercase tracking-widest text-transparent">
                  Current status
                </p>
                <p className="mt-1 text-base font-semibold text-text">
                  {isRejected ? "Returned for revision" : WORKFLOW[workflowIndex]}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-bg/40 p-4">
            <div className="grid min-w-2xl grid-cols-5">
              {WORKFLOW.map((stage, index) => {
                const complete = index < workflowIndex
                const active = index === workflowIndex
                return (
                  <div
                    key={stage}
                    className="relative flex flex-col items-center text-center"
                  >
                    {index < WORKFLOW.length - 1 && (
                      <div
                        className={`absolute left-1/2 top-3 h-px w-full ${
                          index < workflowIndex ? "bg-green/50" : "bg-border"
                        }`}
                      />
                    )}
                    <div
                      className={`relative z-1 flex h-7 w-7 items-center justify-center rounded-full ${
                        isRejected && active
                          ? "border-2 border-red bg-red/15 text-red shadow-lg shadow-red/30"
                          : complete
                          ? "border-2 border-green bg-green/15 text-green"
                          : active
                            ? "bg-linear-to-br from-accent via-purple to-cyan p-0.5 text-purple shadow-lg shadow-purple/40"
                            : "border-2 border-muted/30 bg-bg text-muted"
                      }`}
                    >
                      {complete ? (
                        <svg
                          aria-hidden="true"
                          className="h-3 w-3"
                          viewBox="0 0 12 12"
                          fill="none"
                        >
                          <path
                            d="m2 6 2.5 2.5L10 3"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : active && !isRejected ? (
                        <span className="flex h-full w-full items-center justify-center rounded-full bg-bg">
                          <span className="h-2 w-2 rounded-full bg-linear-to-br from-accent via-purple to-cyan" />
                        </span>
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-current" />
                      )}
                    </div>
                    <span
                      className={`mt-2 font-mono text-xs ${
                        active
                          ? isRejected
                            ? "font-medium text-red"
                            : "bg-linear-to-r from-accent via-purple to-cyan bg-clip-text font-medium text-transparent"
                          : complete
                            ? "text-green"
                            : "text-muted"
                      }`}
                    >
                      {stage}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-bg/35 p-5 lg:col-span-2">
          <div className="mb-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-text">Approval chain</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Follow each decision and see exactly where your request is waiting.
                </p>
              </div>
              <span className="rounded-full border border-border bg-accent-dim px-3 py-1 font-mono text-xs text-blue">
                3 checkpoints
              </span>
            </div>

            <div>
              {approvalChain.map((approver, index) => {
                const isCurrent =
                  index === currentApprovalIndex && approver.status === "Pending"
                const statusClass =
                  approver.status === "Approved"
                    ? "border-green/35 bg-green/10 text-green"
                    : approver.status === "Rejected"
                      ? "border-red/35 bg-red/10 text-red"
                      : "border-amber/35 bg-amber/10 text-amber"

                return (
                  <div
                    key={approver.stage}
                    className="relative flex gap-4 pb-5 last:pb-0"
                  >
                    {index < approvalChain.length - 1 && (
                      <div
                        className={`absolute left-5 top-10 h-full w-px ${
                          approver.status === "Approved"
                            ? "bg-linear-to-b from-green/50 to-green/15"
                            : "bg-linear-to-b from-border to-border-subtle"
                        }`}
                      />
                    )}
                    <div
                      className={`relative z-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${statusClass} ${
                        isCurrent ? "pulse shadow-lg shadow-purple/30" : ""
                      }`}
                    >
                      <ApprovalStatusIcon status={approver.status} />
                    </div>

                    <div
                      className={`min-w-0 flex-1 rounded-xl ${
                        isCurrent
                          ? "bg-linear-to-br from-accent/55 via-purple/50 to-cyan/35 p-px shadow-lg shadow-purple/15"
                          : "border border-border bg-surface-raised"
                      }`}
                    >
                      <div
                        className={`rounded-xl p-4 ${
                          isCurrent
                            ? "bg-linear-to-br from-purple/15 via-bg to-accent/10"
                            : ""
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-text">
                                {approver.label}
                              </p>
                              {isCurrent && (
                                <span className="pulse rounded-full border border-purple/30 bg-purple/10 px-2 py-1 font-mono text-xs font-medium uppercase tracking-wider text-purple">
                                  Awaiting action
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-muted">
                              {approver.description}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs font-medium ${statusClass}`}
                          >
                            <ApprovalStatusIcon status={approver.status} />
                            {approver.status}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 border-t border-border-subtle pt-3 sm:grid-cols-2">
                          <div>
                            <p className="font-mono text-xs uppercase tracking-widest text-muted">
                              {approver.status === "Pending"
                                ? "Queue timestamp"
                                : "Action timestamp"}
                            </p>
                            <p className="mt-1 font-mono text-xs text-text">
                              {approver.timestamp
                                ? absoluteTime(approver.timestamp)
                                : "No action recorded"}
                            </p>
                          </div>
                          <div>
                            <p className="font-mono text-xs uppercase tracking-widest text-muted">
                              Action by
                            </p>
                            <p className="mt-1 text-xs text-text">
                              {approver.actor ||
                                (approver.status === "Pending"
                                  ? "Awaiting assigned approver"
                                  : "Authorized approver")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mb-6 h-px bg-border" />

          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-base font-semibold text-text">Status timeline</p>
              <p className="mt-1 text-xs text-muted">
                Approval and custody activity, newest first
              </p>
            </div>
            <span className="font-mono text-xs text-muted">
              {timeline.length} updates
            </span>
          </div>

          <div className="relative">
            {timeline.map((entry, index) => (
              <div key={entry.id} className="relative flex gap-4 pb-7 last:pb-0">
                {index < timeline.length - 1 && (
                  <div className="absolute left-4 top-9 h-full w-px bg-linear-to-b from-purple/30 to-border-subtle" />
                )}
                <div
                  className={`relative z-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                    entry.tone === "approved"
                      ? "border-green/40 bg-green/10 text-green shadow-md shadow-green/20"
                      : entry.tone === "progress"
                        ? "border-amber/40 bg-amber/10 text-amber shadow-md shadow-amber/20"
                        : "border-purple/40 bg-linear-to-br from-purple/20 to-accent/10 text-purple shadow-md shadow-purple/20"
                  }`}
                >
                  <TimelineIcon tone={entry.tone} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p
                        className={`font-mono text-xs font-medium uppercase tracking-wider ${
                          entry.tone === "approved"
                            ? "text-green"
                            : entry.tone === "progress"
                              ? "text-amber"
                              : "text-purple"
                        }`}
                      >
                        {entry.tone === "approved"
                          ? "Approved"
                          : entry.tone === "progress"
                            ? "In progress"
                            : "Phygital sync"}
                      </p>
                      <p className="mt-1 text-sm font-medium text-text">{entry.title}</p>
                    </div>
                    <span className="font-mono text-xs text-muted">
                      {relativeTime(entry.time, now)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    {entry.detail}
                  </p>
                  <p className="mt-2 font-mono text-xs text-muted/70">
                    {absoluteTime(entry.time)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl bg-linear-to-br from-accent/40 via-purple/35 to-cyan/25 p-px shadow-lg shadow-purple/10">
            <div className="rounded-2xl bg-linear-to-br from-purple/15 via-bg to-accent/10 p-5">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-accent via-purple to-cyan p-px shadow-lg shadow-purple/20">
                <span className="flex h-full w-full items-center justify-center rounded-xl bg-bg text-purple">
                  <DepartmentIcon />
                </span>
              </div>
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                Currently with
              </p>
              <p className="mt-2 font-display text-2xl text-text">{department}</p>
              <div
                className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
                  isRejected
                    ? "border-red/25 bg-red/10 text-red"
                    : "border-amber/25 bg-amber/10 text-amber"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${isRejected ? "bg-red" : "bg-amber"}`}
                />
                {isRejected ? "Action needed" : "In progress"}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-bg/35 p-5">
            <div className="flex items-center gap-3">
              <span className="pulse h-3 w-3 rounded-full bg-green shadow-lg shadow-green/50" />
              <div>
                <p className="text-sm font-medium text-text">
                  Real-time monitoring
                </p>
                <p className="mt-1 text-xs text-muted">
                  Updates sync automatically within one minute.
                </p>
              </div>
            </div>
            <div className="my-4 h-px bg-border" />
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Last updated
            </p>
            <p className="mt-2 font-mono text-sm text-green">
              {relativeTime(lastUpdated, now)}
            </p>
            <p className="mt-1 font-mono text-xs text-muted">
              {absoluteTime(lastUpdated)}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-bg/35 p-5">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Request details
            </p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-xs text-muted">Category</span>
              <span className="rounded-full border border-blue/20 bg-blue/10 px-3 py-1 font-mono text-xs text-blue">
                {requisition.category}
              </span>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted">
              {requisition.description}
            </p>
            {requisition.files.length > 0 && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="mb-3 font-mono text-xs text-muted">
                  {requisition.files.length} supporting document
                  {requisition.files.length === 1 ? "" : "s"}
                </p>
                <div className="flex flex-col gap-2">
                  {requisition.files.map((file) => (
                    <div
                      key={`${file.name}-${file.size}`}
                      className="flex items-center gap-3 rounded-lg border border-border bg-accent-dim p-3"
                    >
                      <span className="rounded-md border border-purple/25 bg-purple/10 px-2 py-1 font-mono text-xs text-purple">
                        {file.type}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs text-text">{file.name}</p>
                        <p className="mt-1 font-mono text-xs text-muted">
                          {file.size}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {record?.current_location && (
            <div className="rounded-2xl border border-cyan/20 bg-cyan/5 p-5">
              <p className="font-mono text-xs uppercase tracking-widest text-cyan">
                Physical location
              </p>
              <p className="mt-2 text-sm font-medium text-text">
                {record.current_location}
              </p>
              <p className="mt-1 text-xs text-muted">
                Confirmed through QR custody scan
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
