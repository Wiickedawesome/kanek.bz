"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  User,
  FileText,
  CalendarCheck,
  ArrowRight,
  Copy,
  Check,
  Search,
  X,
  Plus,
  Clock,
  Loader2,
} from "lucide-react";
import {
  getAdminModerationData,
  getAdminActionErrorMessage,
  isAdminBackendConfigured,
  issueAdminStrike,
  reviewAdminFlag,
} from "@/lib/admin-backend";
import { useResolveNames } from "@/lib/use-resolve-names";

type Flag = {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  description?: string | null;
  status: string;
  reviewed_by: string | null;
  created_at: string;
};

type Strike = {
  id: string;
  user_id: string;
  contract_id: string | null;
  type: string;
  reason: string;
  auto_generated: boolean;
  created_at: string;
};

type AdminAction = {
  id: string;
  admin_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  reason: string | null;
  created_at: string;
};

type Tab = "flags" | "strikes" | "actions";

const STRIKE_REASON_OPTIONS = [
  { value: "report", label: "Safety / Community Violation (User Report)" },
  { value: "late_cancel", label: "Late Cancellation (Within Cutoff)" },
  { value: "no_show", label: "No Show / Abandoned Trip" },
  { value: "driver_no_show", label: "Driver Failed to Arrive" },
  { value: "early_leave", label: "Departed Before Scheduled Time" },
];

function getTargetDestination(
  targetType: string | null,
  targetId: string | null,
  postTitle?: (id: string | null) => string
) {
  if (!targetId) return null;
  const norm = (targetType ?? "").toLowerCase();
  if (norm === "user" || norm === "profile") {
    return {
      href: `/admin/users?view=${targetId}`,
      label: "User Profile",
      typeLabel: "User",
      icon: User,
    };
  }
  if (norm === "post") {
    const title = postTitle ? postTitle(targetId) : null;
    return {
      href: `/admin/content?id=${targetId}`,
      label: title && title !== targetId.slice(0, 8) ? `Listing: ${title}` : "Listing Details",
      typeLabel: "Listing",
      icon: FileText,
    };
  }
  if (norm === "booking" || norm === "contract" || norm === "ride") {
    return {
      href: `/admin/bookings?q=${targetId}`,
      label: "Booking Audit",
      typeLabel: "Booking",
      icon: CalendarCheck,
    };
  }
  return null;
}

export default function ModerationPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-10 w-64 animate-pulse rounded-lg bg-muted/40" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg border bg-muted/40" />
            ))}
          </div>
        </div>
      }
    >
      <ModerationPageInner />
    </Suspense>
  );
}

function ModerationPageInner() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "flags";

  const [tab, setTab] = useState<Tab>(
    ["flags", "strikes", "actions"].includes(initialTab) ? initialTab : "flags"
  );
  const [flags, setFlags] = useState<Flag[]>([]);
  const [strikes, setStrikes] = useState<Strike[]>([]);
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected item modals
  const [selectedFlag, setSelectedFlag] = useState<Flag | null>(null);
  const [selectedStrike, setSelectedStrike] = useState<Strike | null>(null);
  const [selectedAction, setSelectedAction] = useState<AdminAction | null>(null);

  // Issue strike modal state
  const [strikeModalOpen, setStrikeModalOpen] = useState(false);
  const [strikeUserId, setStrikeUserId] = useState("");
  const [strikeType, setStrikeType] = useState<"soft" | "hard">("soft");
  const [strikeReason, setStrikeReason] = useState("report");
  const [strikeNotes, setStrikeNotes] = useState("");
  const [strikeFormError, setStrikeFormError] = useState<string | null>(null);

  // Search and status filters
  const [searchQuery, setSearchQuery] = useState("");
  const [flagStatusFilter, setFlagStatusFilter] = useState("all");
  const [flagTargetFilter, setFlagTargetFilter] = useState("all");
  const [strikeTypeFilter, setStrikeTypeFilter] = useState("all");

  // Loading & error feedback
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const adminOpsEnabled = isAdminBackendConfigured();

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getAdminModerationData<Flag, Strike, AdminAction>();
      setFlags(data.flags ?? []);
      setStrikes(data.strikes ?? []);
      setActions(data.actions ?? []);
    } catch (error) {
      setLoadError(getAdminActionErrorMessage(error));
      setFlags([]);
      setStrikes([]);
      setActions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Name resolution for users and posts
  const allUserIds = useMemo(() => {
    const set = new Set<string>();
    flags.forEach((f) => {
      if (f.reporter_id) set.add(f.reporter_id);
      if (f.reviewed_by) set.add(f.reviewed_by);
      if (f.target_type === "user" || f.target_type === "profile") {
        set.add(f.target_id);
      }
    });
    strikes.forEach((s) => {
      if (s.user_id) set.add(s.user_id);
    });
    actions.forEach((a) => {
      if (a.admin_id) set.add(a.admin_id);
      if (a.target_type === "user" || a.target_type === "profile") {
        if (a.target_id) set.add(a.target_id);
      }
    });
    return Array.from(set);
  }, [flags, strikes, actions]);

  const allPostIds = useMemo(() => {
    const set = new Set<string>();
    flags.forEach((f) => {
      if (f.target_type === "post" && f.target_id) set.add(f.target_id);
    });
    actions.forEach((a) => {
      if (a.target_type === "post" && a.target_id) set.add(a.target_id);
    });
    return Array.from(set);
  }, [flags, actions]);

  const { userName, postTitle } = useResolveNames(allUserIds, allPostIds);

  const pendingFlagsCount = useMemo(
    () => flags.filter((f) => f.status === "pending").length,
    [flags]
  );

  // Filtered lists
  const filteredFlags = useMemo(() => {
    return flags.filter((f) => {
      if (flagStatusFilter !== "all" && f.status !== flagStatusFilter) return false;
      if (flagTargetFilter !== "all" && f.target_type !== flagTargetFilter) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const reporter = userName(f.reporter_id).toLowerCase();
      const reporterId = f.reporter_id.toLowerCase();
      const targetId = f.target_id.toLowerCase();
      const reason = f.reason.toLowerCase();
      const description = (f.description ?? "").toLowerCase();
      const flagId = f.id.toLowerCase();

      return (
        reporter.includes(q) ||
        reporterId.includes(q) ||
        targetId.includes(q) ||
        reason.includes(q) ||
        description.includes(q) ||
        flagId.includes(q)
      );
    });
  }, [flags, flagStatusFilter, flagTargetFilter, searchQuery, userName]);

  const filteredStrikes = useMemo(() => {
    return strikes.filter((s) => {
      if (strikeTypeFilter !== "all" && s.type !== strikeTypeFilter) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const uName = userName(s.user_id).toLowerCase();
      const uId = s.user_id.toLowerCase();
      const reason = s.reason.toLowerCase();
      const contractId = (s.contract_id ?? "").toLowerCase();
      const strikeId = s.id.toLowerCase();

      return (
        uName.includes(q) ||
        uId.includes(q) ||
        reason.includes(q) ||
        contractId.includes(q) ||
        strikeId.includes(q)
      );
    });
  }, [strikes, strikeTypeFilter, searchQuery, userName]);

  const filteredActions = useMemo(() => {
    return actions.filter((a) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const admin = userName(a.admin_id).toLowerCase();
      const actionName = a.action.toLowerCase();
      const targetId = (a.target_id ?? "").toLowerCase();
      const reason = (a.reason ?? "").toLowerCase();

      return (
        admin.includes(q) ||
        actionName.includes(q) ||
        targetId.includes(q) ||
        reason.includes(q)
      );
    });
  }, [actions, searchQuery, userName]);

  // Review Flag Handler
  const handleReviewFlag = async (flagId: string, status: "action_taken" | "dismissed") => {
    setActionError(null);
    setActionSuccess(null);
    setActionLoading(flagId);
    try {
      await reviewAdminFlag(flagId, status);
      setActionSuccess(
        `Flag marked as ${status === "action_taken" ? "Action Taken" : "Dismissed"}.`
      );
      await load();
      if (selectedFlag?.id === flagId) {
        setSelectedFlag((prev) => (prev ? { ...prev, status } : null));
      }
    } catch (error) {
      setActionError(getAdminActionErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  // Issue Strike Submit Handler
  const handleSubmitStrike = async (e: React.FormEvent) => {
    e.preventDefault();
    setStrikeFormError(null);

    const cleanUserId = strikeUserId.trim();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cleanUserId)) {
      setStrikeFormError("User ID must be a valid 36-character UUID (e.g. 550e8400-e29b-41d4-a716-446655440000).");
      return;
    }

    const finalReason = strikeNotes.trim()
      ? `${strikeReason}: ${strikeNotes.trim()}`
      : strikeReason;

    setActionError(null);
    setActionSuccess(null);
    setActionLoading("issue-strike");
    try {
      await issueAdminStrike(cleanUserId, strikeType, finalReason);
      setActionSuccess(`Successfully issued ${strikeType} strike to user.`);
      setStrikeModalOpen(false);
      setStrikeUserId("");
      setStrikeNotes("");
      await load();
    } catch (error) {
      setActionError(getAdminActionErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = (id: string) => {
    void navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const statusBadge = (status: string) => {
    if (status === "pending") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300 border border-amber-500/20">
          <Clock className="h-3 w-3 shrink-0" />
          <span>Pending Review</span>
        </span>
      );
    }
    if (status === "action_taken") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="h-3 w-3 shrink-0" />
          <span>Action Taken</span>
        </span>
      );
    }
    if (status === "dismissed") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground border border-border">
          <XCircle className="h-3 w-3 shrink-0" />
          <span>Dismissed</span>
        </span>
      );
    }
    return (
      <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground capitalize">
        {status.replace(/_/g, " ")}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Moderation</h2>
          <p className="text-xs text-muted-foreground">
            User incident reports, safety flags, penalty strikes, and administrative audit trail.
          </p>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {loadError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center justify-between">
          <span>{loadError}</span>
          <button onClick={() => void load()} className="text-xs font-semibold hover:underline">
            Retry
          </button>
        </div>
      )}
      {actionError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}
      {actionSuccess && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Primary Tabs Bar & Quick Filter Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-3">
        {/* Clean Tabs */}
        <div className="flex gap-1.5 rounded-lg border bg-muted/20 p-1">
          <button
            type="button"
            onClick={() => {
              setTab("flags");
              setSearchQuery("");
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-2 ${
              tab === "flags"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <span>User Reports & Flags</span>
            {pendingFlagsCount > 0 && (
              <span className="rounded-full bg-destructive px-1.5 py-0.2 text-[10px] font-bold text-destructive-foreground">
                {pendingFlagsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setTab("strikes");
              setSearchQuery("");
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-2 ${
              tab === "strikes"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <span>Penalty Strikes</span>
            <span className="text-[11px] opacity-70">({strikes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab("actions");
              setSearchQuery("");
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-2 ${
              tab === "actions"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <span>Admin Audit Log</span>
            <span className="text-[11px] opacity-70">({actions.length})</span>
          </button>
        </div>

        {/* Search & Single Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder={
                tab === "flags"
                  ? "Search reporter, target, reason..."
                  : tab === "strikes"
                  ? "Search user, reason, contract..."
                  : "Search admin, action, target..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-input bg-background pl-8 pr-7 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground rounded transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Contextual Single Dropdown per Tab */}
          {tab === "flags" && (
            <>
              <select
                value={flagStatusFilter}
                onChange={(e) => setFlagStatusFilter(e.target.value)}
                className="h-8 rounded-lg border border-border/80 bg-card px-3 text-xs font-semibold text-foreground shadow-xs transition-colors hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="all">All Statuses ({flags.length})</option>
                <option value="pending">Pending Review ({pendingFlagsCount})</option>
                <option value="action_taken">Action Taken</option>
                <option value="dismissed">Dismissed</option>
              </select>

              <select
                value={flagTargetFilter}
                onChange={(e) => setFlagTargetFilter(e.target.value)}
                className="h-8 rounded-lg border border-border/80 bg-card px-3 text-xs font-semibold text-foreground shadow-xs transition-colors hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="all">All Targets</option>
                <option value="user">User Profiles</option>
                <option value="post">Marketplace Listings</option>
                <option value="booking">Bookings / Rides</option>
              </select>
            </>
          )}

          {tab === "strikes" && (
            <>
              <select
                value={strikeTypeFilter}
                onChange={(e) => setStrikeTypeFilter(e.target.value)}
                className="h-8 rounded-lg border border-border/80 bg-card px-3 text-xs font-semibold text-foreground shadow-xs transition-colors hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="all">All Strike Types ({strikes.length})</option>
                <option value="soft">Soft Strikes</option>
                <option value="hard">Hard Strikes</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setStrikeFormError(null);
                  setStrikeModalOpen(true);
                }}
                disabled={!adminOpsEnabled}
                className="h-8 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Issue Strike</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg border bg-muted/40" />
          ))}
        </div>
      ) : (
        <>
          {/* ════════════════════════════════════════════════════════
              TAB 1: USER REPORTS & FLAGS TABLE
             ════════════════════════════════════════════════════════ */}
          {tab === "flags" && (
            <div className="overflow-x-auto rounded-lg border bg-card shadow-xs">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2.5 text-left font-semibold">Reporter</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Reported Target</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Reason & Details</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Status</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Reported At</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredFlags.map((f) => {
                    const reporterName = userName(f.reporter_id);
                    const targetDest = getTargetDestination(f.target_type, f.target_id, postTitle);
                    const isSelected = selectedFlag?.id === f.id;

                    return (
                      <tr
                        key={f.id}
                        onClick={() => setSelectedFlag(f)}
                        className={`cursor-pointer transition-colors hover:bg-muted/30 ${
                          isSelected ? "bg-muted/50" : ""
                        }`}
                      >
                        {/* Reporter */}
                        <td className="px-3 py-3">
                          <div className="font-medium text-foreground">{reporterName}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">
                            ID: {f.reporter_id.slice(0, 8)}
                          </div>
                        </td>

                        {/* Reported Target with Direct Deep Link */}
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          {targetDest ? (
                            <Link
                              href={targetDest.href}
                              className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-xs font-medium text-foreground hover:bg-muted hover:border-primary/50 transition-colors"
                              title={`Open ${targetDest.label}`}
                            >
                              <targetDest.icon className="h-3 w-3 text-muted-foreground" />
                              <span>{targetDest.label}</span>
                              <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                            </Link>
                          ) : (
                            <span className="font-mono text-xs text-muted-foreground">
                              {f.target_type}:{f.target_id.slice(0, 8)}
                            </span>
                          )}
                          <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                            ID: {f.target_id.slice(0, 8)}
                          </div>
                        </td>

                        {/* Reason & Snippet */}
                        <td className="px-3 py-3 max-w-[220px]">
                          <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-semibold capitalize text-foreground">
                            {f.reason.replace(/_/g, " ")}
                          </span>
                          {f.description ? (
                            <div className="text-xs text-muted-foreground truncate mt-0.5" title={f.description}>
                              {f.description}
                            </div>
                          ) : (
                            <div className="text-[11px] text-muted-foreground italic mt-0.5">
                              No additional notes
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          {statusBadge(f.status)}
                        </td>

                        {/* Date */}
                        <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          <div>{new Date(f.created_at).toLocaleDateString()}</div>
                          <div className="text-[10px]">
                            {new Date(f.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>

                        {/* Inline Actions for Pending Flags */}
                        <td className="px-3 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {f.status === "pending" ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleReviewFlag(f.id, "action_taken")}
                                disabled={!adminOpsEnabled || actionLoading === f.id}
                                className="rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2 py-1 text-xs font-semibold transition-colors disabled:opacity-50"
                              >
                                {actionLoading === f.id ? "…" : "Act"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReviewFlag(f.id, "dismissed")}
                                disabled={!adminOpsEnabled || actionLoading === f.id}
                                className="rounded-md bg-muted hover:bg-muted/80 text-muted-foreground px-2 py-1 text-xs font-medium transition-colors border border-input disabled:opacity-50"
                              >
                                Dismiss
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {f.reviewed_by ? `By ${userName(f.reviewed_by)}` : "Closed"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredFlags.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                        {searchQuery || flagStatusFilter !== "all" || flagTargetFilter !== "all"
                          ? "No user reports match your filter criteria."
                          : "No user reports found in the incident queue."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════
              TAB 2: PENALTY STRIKES TABLE
             ════════════════════════════════════════════════════════ */}
          {tab === "strikes" && (
            <div className="overflow-x-auto rounded-lg border bg-card shadow-xs">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2.5 text-left font-semibold">User</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Strike Type</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Reason</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Associated Booking</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Origin</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Issued Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredStrikes.map((s) => {
                    const uName = userName(s.user_id);
                    const isSelected = selectedStrike?.id === s.id;

                    return (
                      <tr
                        key={s.id}
                        onClick={() => setSelectedStrike(s)}
                        className={`cursor-pointer transition-colors hover:bg-muted/30 ${
                          isSelected ? "bg-muted/50" : ""
                        }`}
                      >
                        {/* User with link */}
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/admin/users?view=${s.user_id}`}
                            className="font-medium text-foreground hover:underline inline-flex items-center gap-1"
                          >
                            <span>{uName}</span>
                            <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                          </Link>
                          <div className="font-mono text-[10px] text-muted-foreground">
                            ID: {s.user_id.slice(0, 8)}
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-3 py-3">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                              s.type === "hard"
                                ? "bg-destructive/10 text-destructive border border-destructive/20"
                                : "bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20"
                            }`}
                          >
                            {s.type} strike
                          </span>
                        </td>

                        {/* Reason */}
                        <td className="px-3 py-3 text-xs">
                          <span className="font-medium text-foreground">
                            {s.reason.replace(/_/g, " ")}
                          </span>
                        </td>

                        {/* Contract */}
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          {s.contract_id ? (
                            <Link
                              href={`/admin/bookings?q=${s.contract_id}`}
                              className="text-xs text-accent-blue hover:underline font-mono inline-flex items-center gap-1"
                            >
                              <span>{s.contract_id.slice(0, 8)}</span>
                              <ArrowRight className="h-2.5 w-2.5" />
                            </Link>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Origin */}
                        <td className="px-3 py-3">
                          <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {s.auto_generated ? "Automated System" : "Manual Admin"}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(s.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStrikes.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                        {searchQuery || strikeTypeFilter !== "all"
                          ? "No strikes match your search criteria."
                          : "No penalty strikes recorded."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════
              TAB 3: ADMIN ACTION AUDIT LOG TABLE
             ════════════════════════════════════════════════════════ */}
          {tab === "actions" && (
            <div className="overflow-x-auto rounded-lg border bg-card shadow-xs">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2.5 text-left font-semibold">Admin</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Action Performed</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Target Entity</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Reason / Context</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredActions.map((a) => {
                    const adminName = userName(a.admin_id);
                    const isSelected = selectedAction?.id === a.id;
                    const targetDest = getTargetDestination(a.target_type, a.target_id, postTitle);

                    return (
                      <tr
                        key={a.id}
                        onClick={() => setSelectedAction(a)}
                        className={`cursor-pointer transition-colors hover:bg-muted/30 ${
                          isSelected ? "bg-muted/50" : ""
                        }`}
                      >
                        {/* Admin */}
                        <td className="px-3 py-3">
                          <div className="font-medium text-foreground">{adminName}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">
                            ID: {a.admin_id.slice(0, 8)}
                          </div>
                        </td>

                        {/* Action badge */}
                        <td className="px-3 py-3">
                          <span className="rounded-full bg-muted border border-border px-2.5 py-0.5 text-xs font-semibold text-foreground">
                            {a.action.replace(/_/g, " ")}
                          </span>
                        </td>

                        {/* Target with link */}
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          {targetDest ? (
                            <Link
                              href={targetDest.href}
                              className="text-xs text-accent-blue hover:underline inline-flex items-center gap-1 font-medium"
                            >
                              <span>{targetDest.label} ({a.target_id?.slice(0, 8)})</span>
                              <ArrowRight className="h-2.5 w-2.5" />
                            </Link>
                          ) : a.target_id ? (
                            <span className="font-mono text-xs text-muted-foreground">
                              {a.target_type ?? "entity"}:{a.target_id.slice(0, 8)}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Reason */}
                        <td className="px-3 py-3 max-w-[240px] truncate text-xs text-muted-foreground">
                          {a.reason ?? "—"}
                        </td>

                        {/* Date */}
                        <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(a.created_at).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredActions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                        No admin actions recorded yet in the audit log.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════
          MODAL 1: FLAG DETAIL DIALOG
         ════════════════════════════════════════════════════════ */}
      {selectedFlag && (() => {
        const reporterName = userName(selectedFlag.reporter_id);
        const targetDest = getTargetDestination(selectedFlag.target_type, selectedFlag.target_id, postTitle);

        return (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6"
          >
            <div
              className="flex flex-col w-full max-w-2xl max-h-[90vh] rounded-xl border bg-card shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg text-foreground">User Report Details</h3>
                    {statusBadge(selectedFlag.status)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                    <span>Flag ID: {selectedFlag.id}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedFlag.id)}
                      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-muted border border-border/60 text-[10px]"
                      title="Copy Flag ID"
                    >
                      {copiedId === selectedFlag.id ? <Check className="h-2.5 w-2.5 text-green-500" /> : <Copy className="h-2.5 w-2.5" />}
                      <span>{copiedId === selectedFlag.id ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFlag(null)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
                {/* Reporter & Target Cards */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Reporter Card */}
                  <div className="rounded-lg border bg-muted/10 p-4 space-y-2">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Reported By
                      </span>
                      <Link
                        href={`/admin/users?view=${selectedFlag.reporter_id}`}
                        className="text-xs text-accent-blue hover:underline inline-flex items-center gap-1 font-medium"
                      >
                        Profile <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                    <div className="font-semibold text-foreground">{reporterName}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      ID: {selectedFlag.reporter_id}
                    </div>
                  </div>

                  {/* Target Card */}
                  <div className="rounded-lg border bg-muted/10 p-4 space-y-2">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Reported Target ({selectedFlag.target_type})
                      </span>
                      {targetDest && (
                        <Link
                          href={targetDest.href}
                          className="text-xs text-accent-blue hover:underline inline-flex items-center gap-1 font-medium"
                        >
                          Inspect <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                    <div className="font-mono text-xs font-bold text-foreground">
                      {selectedFlag.target_id}
                    </div>
                    {targetDest ? (
                      <Link
                        href={targetDest.href}
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold"
                      >
                        <targetDest.icon className="h-3.5 w-3.5" />
                        <span>Open {targetDest.label} &rarr;</span>
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        Entity reference ID on record
                      </span>
                    )}
                  </div>
                </div>

                {/* Reason & Statement */}
                <div className="rounded-lg border bg-card p-4 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Reason & User Statement
                  </div>
                  <div>
                    <span className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground capitalize">
                      {selectedFlag.reason.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="rounded-md bg-muted/30 p-3 text-sm text-foreground">
                    {selectedFlag.description ? (
                      <p className="whitespace-pre-wrap">{selectedFlag.description}</p>
                    ) : (
                      <p className="text-muted-foreground italic">
                        No supplementary written description provided by the reporter.
                      </p>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Filed on {new Date(selectedFlag.created_at).toLocaleString()}
                  </div>
                </div>

                {/* Review Information */}
                {selectedFlag.reviewed_by && (
                  <div className="rounded-lg border bg-muted/10 p-3 text-xs text-muted-foreground">
                    Reviewed by <strong className="text-foreground">{userName(selectedFlag.reviewed_by)}</strong> ({selectedFlag.reviewed_by.slice(0, 8)})
                  </div>
                )}
              </div>

              {/* Modal Footer / Actions */}
              <div className="flex items-center justify-between border-t px-6 py-4 bg-muted/20">
                <button
                  type="button"
                  onClick={() => setSelectedFlag(null)}
                  className="rounded-lg border border-input bg-background px-4 py-2 text-xs font-medium hover:bg-muted transition-colors"
                >
                  Close
                </button>

                {selectedFlag.status === "pending" && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!adminOpsEnabled || actionLoading === selectedFlag.id}
                      onClick={() => handleReviewFlag(selectedFlag.id, "dismissed")}
                      className="rounded-lg border border-input bg-background px-3.5 py-2 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      Dismiss Report
                    </button>
                    <button
                      type="button"
                      disabled={!adminOpsEnabled || actionLoading === selectedFlag.id}
                      onClick={() => handleReviewFlag(selectedFlag.id, "action_taken")}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                    >
                      {actionLoading === selectedFlag.id ? "Saving..." : "Mark Action Taken"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ════════════════════════════════════════════════════════
          MODAL 2: ISSUE PENALTY STRIKE DIALOG
         ════════════════════════════════════════════════════════ */}
      {strikeModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6"
        >
          <div
            className="flex flex-col w-full max-w-lg rounded-xl border bg-card shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h3 className="font-semibold text-lg text-foreground">Issue Penalty Strike</h3>
              </div>
              <button
                onClick={() => setStrikeModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitStrike} className="p-6 space-y-4 text-sm">
              {strikeFormError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  {strikeFormError}
                </div>
              )}

              {/* User ID Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  User ID (36-character UUID) <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                  value={strikeUserId}
                  onChange={(e) => setStrikeUserId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-[11px] text-muted-foreground">
                  Copy the user UUID from the Users page, booking record, or flag report.
                </p>
              </div>

              {/* Strike Type Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Strike Severity Level <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-colors ${
                      strikeType === "soft"
                        ? "border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-300"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="strikeType"
                        value="soft"
                        checked={strikeType === "soft"}
                        onChange={() => setStrikeType("soft")}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span className="font-semibold text-xs">Soft Strike</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1">
                      Warning penalty (e.g. late cancellations, minor rule violations).
                    </span>
                  </label>

                  <label
                    className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-colors ${
                      strikeType === "hard"
                        ? "border-destructive/50 bg-destructive/10 text-destructive"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="strikeType"
                        value="hard"
                        checked={strikeType === "hard"}
                        onChange={() => setStrikeType("hard")}
                        className="text-destructive focus:ring-destructive"
                      />
                      <span className="font-semibold text-xs">Hard Strike</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1">
                      Severe infraction (e.g. safety risk, harassment, scam).
                    </span>
                  </label>
                </div>
              </div>

              {/* Reason Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Violation Category <span className="text-destructive">*</span>
                </label>
                <select
                  value={strikeReason}
                  onChange={(e) => setStrikeReason(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {STRIKE_REASON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Additional Context Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Administrative Notes / Specific Context
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the incident or rationale for issuing this strike..."
                  value={strikeNotes}
                  onChange={(e) => setStrikeNotes(e.target.value)}
                  className="w-full rounded-md border border-input bg-background p-2.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setStrikeModalOpen(false)}
                  className="rounded-lg border border-input bg-background px-4 py-2 text-xs font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === "issue-strike"}
                  className="rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {actionLoading === "issue-strike" ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Issuing...</span>
                    </>
                  ) : (
                    <span>Issue Penalty Strike</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          MODAL 3: STRIKE DETAIL DIALOG
         ════════════════════════════════════════════════════════ */}
      {selectedStrike && (() => {
        const uName = userName(selectedStrike.user_id);
        return (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6"
          >
            <div
              className="flex flex-col w-full max-w-md rounded-xl border bg-card shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <h3 className="font-semibold text-lg text-foreground">Penalty Strike Record</h3>
                </div>
                <button
                  onClick={() => setSelectedStrike(null)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-sm">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    User Account
                  </span>
                  <div className="font-semibold text-base text-foreground">{uName}</div>
                  <div className="font-mono text-xs text-muted-foreground flex items-center gap-2">
                    <span>ID: {selectedStrike.user_id}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedStrike.user_id)}
                      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-muted border border-border/60 text-[10px]"
                    >
                      {copiedId === selectedStrike.user_id ? <Check className="h-2.5 w-2.5 text-green-500" /> : <Copy className="h-2.5 w-2.5" />}
                      <span>{copiedId === selectedStrike.user_id ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <div className="pt-1">
                    <Link
                      href={`/admin/users?view=${selectedStrike.user_id}`}
                      className="text-xs text-accent-blue hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      View Profile <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Strike Severity:</span>
                    <span
                      className={`font-semibold uppercase tracking-wider ${
                        selectedStrike.type === "hard" ? "text-destructive" : "text-amber-600"
                      }`}
                    >
                      {selectedStrike.type} strike
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Origin:</span>
                    <span className="font-medium text-foreground">
                      {selectedStrike.auto_generated ? "Automated System" : "Manual Admin"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Issued Date:</span>
                    <span className="font-medium text-foreground">
                      {new Date(selectedStrike.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 border-t pt-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Reason & Notes
                  </span>
                  <p className="text-sm font-medium text-foreground">
                    {selectedStrike.reason.replace(/_/g, " ")}
                  </p>
                </div>

                {selectedStrike.contract_id && (
                  <div className="border-t pt-3 space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Associated Booking / Contract
                    </span>
                    <div>
                      <Link
                        href={`/admin/bookings?q=${selectedStrike.contract_id}`}
                        className="text-xs text-accent-blue hover:underline font-mono inline-flex items-center gap-1"
                      >
                        <span>Contract: {selectedStrike.contract_id}</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t px-6 py-3 bg-muted/20 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedStrike(null)}
                  className="rounded-lg border border-input bg-background px-4 py-2 text-xs font-medium hover:bg-muted transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ════════════════════════════════════════════════════════
          MODAL 4: ADMIN ACTION DETAIL DIALOG
         ════════════════════════════════════════════════════════ */}
      {selectedAction && (() => {
        const adminName = userName(selectedAction.admin_id);
        const targetDest = getTargetDestination(selectedAction.target_type, selectedAction.target_id, postTitle);

        return (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6"
          >
            <div
              className="flex flex-col w-full max-w-md rounded-xl border bg-card shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/20">
                <h3 className="font-semibold text-lg text-foreground">Admin Action Record</h3>
                <button
                  onClick={() => setSelectedAction(null)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-sm">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Admin Operator
                  </span>
                  <div className="font-semibold text-foreground">{adminName}</div>
                  <div className="font-mono text-xs text-muted-foreground">
                    ID: {selectedAction.admin_id}
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/20 p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Action:</span>
                    <span className="font-bold text-foreground capitalize">
                      {selectedAction.action.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Timestamp:</span>
                    <span className="font-medium text-foreground">
                      {new Date(selectedAction.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {selectedAction.target_id && (
                  <div className="border-t pt-3 space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Target Entity ({selectedAction.target_type ?? "entity"})
                    </span>
                    <div>
                      {targetDest ? (
                        <Link
                          href={targetDest.href}
                          className="text-xs text-accent-blue hover:underline inline-flex items-center gap-1 font-medium"
                        >
                          <span>Open {targetDest.label}</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      ) : (
                        <span className="font-mono text-xs text-muted-foreground">
                          {selectedAction.target_id}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {selectedAction.reason && (
                  <div className="border-t pt-3 space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Recorded Reason / Notes
                    </span>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {selectedAction.reason}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t px-6 py-3 bg-muted/20 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedAction(null)}
                  className="rounded-lg border border-input bg-background px-4 py-2 text-xs font-medium hover:bg-muted transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
