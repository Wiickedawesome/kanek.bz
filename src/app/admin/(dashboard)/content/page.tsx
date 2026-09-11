"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  cancelAdminPost,
  getAdminContentData,
  getAdminUsersData,
  getAdminActionErrorMessage,
  isAdminBackendConfigured,
} from "@/lib/admin-backend";
import {
  Search,
  X,
  MapPin,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ArrowDown,
  Repeat,
  Car,
  User,
  Star,
  Copy,
  Check,
  Bell,
} from "lucide-react";

type Post = {
  id: string;
  author_id: string;
  type: string;
  status: string;
  title: string;
  description: string | null;
  origin_address: string | null;
  dest_address: string | null;
  departure_at: string | null;
  price_cents: number | null;
  seats_total: number | null;
  seats_filled: number | null;
  is_round_trip?: boolean;
  return_time?: string | null;
  repeat_days?: number[] | null;
  repeat_until?: string | null;
  expires_at?: string | null;
  pickup_notes?: string | null;
  vehicle_description?: string | null;
  route_distance_km?: number | null;
  route_duration_min?: number | null;
  created_at: string;
};

type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  data?: Record<string, unknown> | null;
  created_at: string;
};

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  rating_avg: number | null;
  punctuality_pct: number | null;
  account_status: string | null;
};

type DriverDetail = {
  id: string;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  vehicle_color: string | null;
  vehicle_plate: string | null;
  verified: boolean;
};

function getAuthorDisplayName(
  profile?: Profile | null,
  fallbackId?: string | null
): string {
  if (profile) {
    const full = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();
    if (full) return full;
    if (profile.email) return profile.email;
    if (profile.phone) return profile.phone;
  }
  if (fallbackId) {
    return `User (${fallbackId.slice(0, 8)})`;
  }
  return "Unknown Author";
}

function formatRepeatDays(days?: number[] | null): string {
  if (!days || days.length === 0) return "One-time";
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const isWeekdays =
    days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d));
  if (isWeekdays) return "Weekdays (Mon – Fri)";
  if (days.length === 7) return "Daily";
  return days.map((d) => dayNames[d % 7] ?? `Day ${d}`).join(", ");
}

export default function ContentPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg border bg-muted/40" />
            ))}
          </div>
          <div className="h-14 animate-pulse rounded-lg border bg-muted/40" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg border bg-muted/40" />
            ))}
          </div>
        </div>
      }
    >
      <ContentPageInner />
    </Suspense>
  );
}

function ContentPageInner() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? searchParams.get("search") ?? "";
  const urlPostId = searchParams.get("id") ?? "";

  const [posts, setPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [driverDetails, setDriverDetails] = useState<DriverDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [copiedPostId, setCopiedPostId] = useState(false);
  const [copiedAuthorId, setCopiedAuthorId] = useState(false);
  const adminOpsEnabled = isAdminBackendConfigured();

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [contentData, usersData] = await Promise.all([
        getAdminContentData<Post, Notification>(),
        getAdminUsersData<Profile, DriverDetail, unknown, unknown>().catch(() => null),
      ]);
      setPosts(contentData.posts ?? []);
      setNotifications(contentData.notifications ?? []);
      setProfiles(usersData?.profiles ?? []);
      setDriverDetails(usersData?.driverDetails ?? []);
    } catch (error) {
      setLoadError(getAdminActionErrorMessage(error));
      setPosts([]);
      setNotifications([]);
      setProfiles([]);
      setDriverDetails([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (urlQuery) {
      setSearchQuery(urlQuery);
    }
  }, [urlQuery]);

  useEffect(() => {
    if (urlPostId && posts.length > 0) {
      const target = posts.find((p) => p.id === urlPostId);
      if (target) {
        setSelectedPost(target);
      }
    }
  }, [urlPostId, posts]);

  const profilesMap = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);
  const driversMap = useMemo(() => new Map(driverDetails.map((d) => [d.id, d])), [driverDetails]);

  const removePost = async (postId: string) => {
    if (!confirm("Are you sure you want to remove this post? It will be marked as cancelled.")) {
      return;
    }
    setActionError(null);
    setActionSuccess(null);
    setActionLoading(postId);
    try {
      await cancelAdminPost(postId);
      setActionSuccess("Post was successfully removed and marked as cancelled.");
      await load();
      if (selectedPost?.id === postId) {
        setSelectedPost((prev) => (prev ? { ...prev, status: "cancelled" } : null));
      }
    } catch (error) {
      setActionError(getAdminActionErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  const formatCents = (cents: number | null) =>
    cents !== null ? `$${(cents / 100).toFixed(2)} BZD` : "—";

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      open: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      activated: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      completed: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      expired: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
      filled: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    };
    return map[status] ?? "bg-muted text-muted-foreground";
  };

  /* ── Metric Summaries ── */
  const metrics = useMemo(() => {
    let open = 0;
    let filled = 0;
    let completed = 0;
    let cancelled = 0;
    for (const p of posts) {
      if (p.status === "open") open++;
      else if (p.status === "filled") filled++;
      else if (p.status === "completed") completed++;
      else if (p.status === "cancelled" || p.status === "expired") cancelled++;
    }
    return { total: posts.length, open, filled, completed, cancelled };
  }, [posts]);

  /* ── Search & Filters ── */
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const title = (p.title ?? "").toLowerCase();
      const origin = (p.origin_address ?? "").toLowerCase();
      const dest = (p.dest_address ?? "").toLowerCase();
      const profile = profilesMap.get(p.author_id);
      const author = getAuthorDisplayName(profile, p.author_id).toLowerCase();
      const authorId = (p.author_id ?? "").toLowerCase();
      const id = (p.id ?? "").toLowerCase();
      return (
        title.includes(q) ||
        origin.includes(q) ||
        dest.includes(q) ||
        author.includes(q) ||
        authorId.includes(q) ||
        id.includes(q)
      );
    });
  }, [posts, statusFilter, typeFilter, searchQuery, profilesMap]);

  /* ── Notifications for Selected Post ── */
  const postNotifications = useMemo(() => {
    if (!selectedPost) return [];
    return notifications.filter((n) => {
      const data = n.data as Record<string, unknown> | undefined;
      if (data) {
        if (data.postId === selectedPost.id || data.post_id === selectedPost.id) return true;
      }
      if (
        n.user_id === selectedPost.author_id &&
        selectedPost.title &&
        (n.title.toLowerCase().includes(selectedPost.title.toLowerCase()) ||
          n.body?.toLowerCase().includes(selectedPost.title.toLowerCase()))
      ) {
        return true;
      }
      return false;
    });
  }, [selectedPost, notifications]);

  const selectedAuthorProfile = selectedPost ? profilesMap.get(selectedPost.author_id) : null;
  const selectedAuthorDriver = selectedPost ? driversMap.get(selectedPost.author_id) : null;
  const selectedAuthorName = selectedPost
    ? getAuthorDisplayName(selectedAuthorProfile, selectedPost.author_id)
    : "";

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      )}
      {actionError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-300">
          {actionSuccess}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-lg border bg-card p-3 shadow-xs">
          <div className="text-xs font-medium text-muted-foreground">Total Listings</div>
          <div className="mt-1 text-2xl font-bold tracking-tight">{metrics.total}</div>
        </div>
        <div className="rounded-lg border bg-card p-3 shadow-xs">
          <div className="text-xs font-medium text-green-600 dark:text-green-400">Open / Active</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
            {metrics.open}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-3 shadow-xs">
          <div className="text-xs font-medium text-yellow-600 dark:text-yellow-400">Fully Booked</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-yellow-600 dark:text-yellow-400">
            {metrics.filled}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-3 shadow-xs">
          <div className="text-xs font-medium text-blue-600 dark:text-blue-400">Completed</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
            {metrics.completed}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-3 shadow-xs">
          <div className="text-xs font-medium text-destructive">Cancelled / Expired</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-destructive">
            {metrics.cancelled}
          </div>
        </div>
      </div>

      {/* Search & Filter Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm font-semibold text-foreground">
          Marketplace Listings ({filteredPosts.length})
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search title, author, route, ID..."
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

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Types</option>
            <option value="route_offer">Route Offers</option>
            <option value="ride_request">Ride Requests</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="filled">Filled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Main Listings Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg border bg-muted/40" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card shadow-xs">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2.5 text-left font-semibold">Title & Post ID</th>
                <th className="px-3 py-2.5 text-left font-semibold">Author</th>
                <th className="px-3 py-2.5 text-left font-semibold">Type</th>
                <th className="px-3 py-2.5 text-left font-semibold">Status</th>
                <th className="px-3 py-2.5 text-left font-semibold">Route</th>
                <th className="px-3 py-2.5 text-left font-semibold">Fare</th>
                <th className="px-3 py-2.5 text-left font-semibold">Seats</th>
                <th className="px-3 py-2.5 text-left font-semibold">Schedule</th>
                <th className="px-3 py-2.5 text-left font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPosts.map((p) => {
                const isSelected = selectedPost?.id === p.id;
                const authorProfile = profilesMap.get(p.author_id);
                const authorName = getAuthorDisplayName(authorProfile, p.author_id);
                const isRecurring = Boolean(p.repeat_days && p.repeat_days.length > 0);

                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedPost(p)}
                    className={`cursor-pointer transition-colors hover:bg-muted/30 ${
                      isSelected ? "bg-muted/50" : ""
                    }`}
                  >
                    <td className="px-3 py-3 max-w-[200px]">
                      <div className="font-medium text-foreground truncate">{p.title}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        ID: {p.id.slice(0, 8)}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-foreground">{authorName}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        ID: {p.author_id.slice(0, 8)}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground font-medium">
                        {p.type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColor(
                          p.status
                        )}`}
                      >
                        {p.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-3 py-3 max-w-[180px]">
                      {p.origin_address || p.dest_address ? (
                        <>
                          <div className="truncate font-medium text-foreground" title={p.origin_address ?? ""}>
                            {p.origin_address ?? "Origin"}
                          </div>
                          <div
                            className="truncate text-xs text-muted-foreground flex items-center gap-1"
                            title={p.dest_address ?? ""}
                          >
                            <ArrowDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span className="truncate">{p.dest_address ?? "Destination"}</span>
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No route specified</span>
                      )}
                    </td>
                    <td className="px-3 py-3 tabular-nums font-semibold text-foreground">
                      {formatCents(p.price_cents)}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-xs">
                      <span className="font-medium text-foreground">{p.seats_filled ?? 0}</span>
                      <span className="text-muted-foreground">/{p.seats_total ?? "—"}</span>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {isRecurring && (
                        <div className="inline-flex items-center gap-1 font-medium text-accent-blue pb-0.5">
                          <Repeat className="h-3 w-3" />
                          <span>{formatRepeatDays(p.repeat_days)}</span>
                        </div>
                      )}
                      {p.departure_at ? (
                        <div>{new Date(p.departure_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</div>
                      ) : (
                        <span className="italic">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
              {filteredPosts.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">
                    {searchQuery ? "No listings match your search criteria." : "No listings found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          MODAL DETAIL VIEW — Matching Bookings Overlay Format
          ════════════════════════════════════════════════════════ */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6 backdrop-blur-xs"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="relative flex flex-col w-full max-w-4xl max-h-[92vh] rounded-xl border bg-card shadow-2xl overflow-hidden text-card-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/20">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground">
                    {selectedPost.title}
                  </h3>
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor(
                      selectedPost.status
                    )}`}
                  >
                    {selectedPost.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5 font-mono">
                  <span>Post ID: {selectedPost.id}</span>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(selectedPost.id);
                      setCopiedPostId(true);
                      setTimeout(() => setCopiedPostId(false), 2000);
                    }}
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-muted border border-border/60 text-[10px]"
                    title="Copy Post ID"
                  >
                    {copiedPostId ? <Check className="h-2.5 w-2.5 text-green-500" /> : <Copy className="h-2.5 w-2.5" />}
                    <span>{copiedPostId ? "Copied" : "Copy"}</span>
                  </button>
                  <span className="text-border">&bull;</span>
                  <span className="capitalize font-sans font-medium text-foreground">
                    {selectedPost.type.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Cancellation Alert */}
              {selectedPost.status === "cancelled" && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 space-y-1 text-destructive">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Listing Was Cancelled</span>
                  </div>
                  <p className="text-xs">
                    This post was removed from the marketplace feed and will not accept new bookings.
                  </p>
                </div>
              )}

              {/* Author Identity Card */}
              <div className="rounded-lg border bg-muted/10 p-4 space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600">
                      {selectedAuthorProfile?.role === "driver" ? (
                        <Car className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Author Profile & Information
                    </span>
                  </div>
                  <Link
                    href={`/admin/users?view=${selectedPost.author_id}`}
                    className="text-xs text-accent-blue hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    View User Profile <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {selectedAuthorName}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[11px] text-muted-foreground">
                        User ID: <span className="text-foreground select-all">{selectedPost.author_id}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          void navigator.clipboard.writeText(selectedPost.author_id);
                          setCopiedAuthorId(true);
                          setTimeout(() => setCopiedAuthorId(false), 2000);
                        }}
                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-muted border border-border/60 text-[10px]"
                        title="Copy Author ID"
                      >
                        {copiedAuthorId ? <Check className="h-2.5 w-2.5 text-green-500" /> : <Copy className="h-2.5 w-2.5" />}
                        <span>{copiedAuthorId ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    {selectedAuthorProfile?.email && (
                      <div className="text-muted-foreground">{selectedAuthorProfile.email}</div>
                    )}
                    {selectedAuthorProfile?.phone && (
                      <div className="text-muted-foreground">{selectedAuthorProfile.phone}</div>
                    )}
                  </div>

                  {/* Vehicle specs if driver */}
                  {selectedAuthorDriver ? (
                    <div className="rounded border bg-card p-2.5 space-y-1 mt-2">
                      <div className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                        Registered Vehicle
                      </div>
                      <div className="space-y-0.5">
                        <div>
                          <strong>Vehicle:</strong> {selectedAuthorDriver.vehicle_year ?? ""}{" "}
                          {selectedAuthorDriver.vehicle_make ?? ""}{" "}
                          {selectedAuthorDriver.vehicle_model ?? ""}
                        </div>
                        <div>
                          <strong>Color:</strong> {selectedAuthorDriver.vehicle_color ?? "—"}
                        </div>
                        <div>
                          <strong>Plate:</strong>{" "}
                          <span className="font-mono font-bold text-foreground">
                            {selectedAuthorDriver.vehicle_plate ?? "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : selectedPost.vehicle_description ? (
                    <div className="rounded border bg-card p-2.5 space-y-1 mt-2">
                      <div className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                        Vehicle Description on Listing
                      </div>
                      <p className="text-muted-foreground">{selectedPost.vehicle_description}</p>
                    </div>
                  ) : null}

                  {/* Rating */}
                  {selectedAuthorProfile && (
                    <div className="flex items-center gap-3 pt-1 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        <span className="font-medium text-foreground">
                          {selectedAuthorProfile.rating_avg !== null && selectedAuthorProfile.rating_avg !== undefined
                            ? selectedAuthorProfile.rating_avg.toFixed(1)
                            : "New"}
                        </span>
                      </div>
                      {selectedAuthorProfile.punctuality_pct !== null && (
                        <div>Punctuality: {selectedAuthorProfile.punctuality_pct}%</div>
                      )}
                      {selectedAuthorProfile.account_status && (
                        <div className="capitalize">
                          Status: <strong>{selectedAuthorProfile.account_status}</strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Route & Pricing Summary Card */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border bg-card p-4 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Route Information
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-muted-foreground">Origin:</span>
                        <div className="font-medium text-foreground">
                          {selectedPost.origin_address ?? "Origin not specified"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-muted-foreground">Destination:</span>
                        <div className="font-medium text-foreground">
                          {selectedPost.dest_address ?? "Destination not specified"}
                        </div>
                      </div>
                    </div>
                    {(selectedPost.route_distance_km || selectedPost.route_duration_min) && (
                      <div className="text-muted-foreground text-[11px] pt-1 border-t border-border/40">
                        {selectedPost.route_distance_km && <span>Distance: {selectedPost.route_distance_km} km </span>}
                        {selectedPost.route_duration_min && <span>&bull; Est. Duration: {selectedPost.route_duration_min} min</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border bg-card p-4 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Pricing & Seat Capacity
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price per Seat:</span>
                      <span className="font-bold text-foreground text-sm">
                        {formatCents(selectedPost.price_cents)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Capacity:</span>
                      <span className="font-medium text-foreground">
                        {selectedPost.seats_total ?? "Not specified"} seat{selectedPost.seats_total && selectedPost.seats_total > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Seats Booked:</span>
                      <span className="font-semibold text-foreground">
                        {selectedPost.seats_filled ?? 0} booked
                      </span>
                    </div>
                    <div className="pt-2 border-t border-border/40">
                      <Link
                        href={`/admin/bookings?q=${selectedPost.id}`}
                        className="text-xs text-accent-blue hover:underline inline-flex items-center gap-1 font-medium"
                      >
                        View Bookings for this Listing <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Schedule, Recurrence & Round-Trip Card */}
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Schedule & Recurrence Details
                </div>
                <div className="grid gap-3 text-xs sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <span className="text-muted-foreground">Departure Time:</span>
                        <div className="font-medium text-foreground">
                          {selectedPost.departure_at
                            ? new Date(selectedPost.departure_at).toLocaleString()
                            : "Flexible / Not set"}
                        </div>
                      </div>
                    </div>
                    {selectedPost.expires_at && (
                      <div className="text-muted-foreground text-[11px]">
                        Listing expires: {new Date(selectedPost.expires_at).toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Repeat className="h-4 w-4 text-accent-blue shrink-0" />
                      <div>
                        <span className="text-muted-foreground">Recurrence:</span>
                        <div className="font-semibold text-foreground">
                          {formatRepeatDays(selectedPost.repeat_days)}
                        </div>
                      </div>
                    </div>
                    {selectedPost.repeat_until && (
                      <div className="text-muted-foreground text-[11px]">
                        Repeats until: {new Date(selectedPost.repeat_until).toLocaleDateString()}
                      </div>
                    )}
                    {selectedPost.is_round_trip && (
                      <div className="font-medium text-emerald-600 dark:text-emerald-400">
                        Round Trip {selectedPost.return_time ? `(Return at ${selectedPost.return_time})` : ""}
                      </div>
                    )}
                  </div>
                </div>

                {selectedPost.pickup_notes && (
                  <div className="pt-2 border-t text-xs">
                    <span className="text-muted-foreground font-medium">Pickup Notes:</span>
                    <p className="mt-0.5 text-foreground">{selectedPost.pickup_notes}</p>
                  </div>
                )}

                {selectedPost.description && (
                  <div className="pt-2 border-t text-xs">
                    <span className="text-muted-foreground font-medium">Description:</span>
                    <p className="mt-0.5 text-foreground whitespace-pre-wrap">{selectedPost.description}</p>
                  </div>
                )}
              </div>

              {/* Dispatched User Alerts & Push Notifications for this Listing */}
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600">
                      <Bell className="h-4 w-4" />
                    </div>
                    <h4 className="text-sm font-bold text-foreground">
                      Dispatched Alerts & Notifications for this Listing
                    </h4>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {postNotifications.length} alert{postNotifications.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {postNotifications.length > 0 ? (
                  <div className="space-y-2">
                    {postNotifications.map((notif) => {
                      const recipientProfile = profilesMap.get(notif.user_id);
                      const recipientName = getAuthorDisplayName(recipientProfile, notif.user_id);
                      return (
                        <div key={notif.id} className="rounded-md border bg-muted/10 p-3 text-xs space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">{notif.title}</span>
                              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                                {notif.type}
                              </span>
                            </div>
                            <span className="text-[11px] text-muted-foreground tabular-nums">
                              {new Date(notif.created_at).toLocaleString()}
                            </span>
                          </div>
                          {notif.body && <p className="text-muted-foreground">{notif.body}</p>}
                          <div className="text-[10px] text-muted-foreground pt-0.5">
                            Recipient: <span className="font-medium text-foreground">{recipientName}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    No automated notifications recorded for this listing.
                  </p>
                )}
              </div>

              {/* Moderation Actions */}
              {selectedPost.status !== "cancelled" && (
                <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>
                      Moderation: Removing this post will immediately cancel it and remove it from the mobile app feed.
                    </span>
                  </div>
                  <button
                    onClick={() => void removePost(selectedPost.id)}
                    disabled={!adminOpsEnabled || actionLoading === selectedPost.id}
                    className="rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ml-4 shrink-0"
                  >
                    {actionLoading === selectedPost.id ? "Removing..." : "Remove Post"}
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end border-t px-6 py-3 bg-muted/10">
              <button
                onClick={() => setSelectedPost(null)}
                className="rounded-md border bg-background hover:bg-muted px-4 py-1.5 text-xs font-medium text-foreground transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
