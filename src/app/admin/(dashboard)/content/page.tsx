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
  Briefcase,
  ShoppingBag,
  Package,
  Navigation,
  DollarSign,
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
  job_category?: string | null;
  job_timeline?: string | null;
  pay_rate_cents?: number | null;
  pay_type?: string | null;
  errand_category?: string | null;
  errand_fee_cents?: number | null;
  item_cost_cents?: number | null;
  pickup_style?: string | null;
  min_riders?: number | null;
  payment_method?: string | null;
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

const JOB_CATEGORY_LABELS: Record<string, string> = {
  skilled_trade: "Skilled Trade",
  cleaning: "Cleaning",
  delivery: "Delivery",
  childcare: "Childcare",
  agriculture: "Agriculture",
  construction: "Construction",
  hospitality: "Hospitality",
  admin: "Admin",
  handyman: "Handyman",
  landscaping: "Landscaping",
  moving: "Moving",
  tutoring: "Tutoring",
  tech: "Tech",
  other: "Other",
};

const JOB_TIMELINE_LABELS: Record<string, string> = {
  asap: "ASAP",
  today: "Today",
  this_week: "This Week",
  flexible: "Flexible",
};

const ERRAND_CATEGORY_LABELS: Record<string, string> = {
  grocery: "Grocery",
  bill: "Bill Payment",
  pharmacy: "Pharmacy",
  document: "Document Delivery",
  delivery: "Delivery",
  food: "Food & Dining",
  hardware: "Hardware",
  other: "Other",
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

function PostTypeBadge({ type }: { type: string }) {
  const norm = type.toLowerCase();
  if (norm === "route_offer") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
        <Car className="h-3 w-3 shrink-0" />
        <span>Route Offer</span>
      </span>
    );
  }
  if (norm === "route_request" || norm === "ride_request") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-400 border border-blue-500/20">
        <Navigation className="h-3 w-3 shrink-0" />
        <span>Ride Request</span>
      </span>
    );
  }
  if (norm === "job") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300 border border-amber-500/20">
        <Briefcase className="h-3 w-3 shrink-0" />
        <span>Job</span>
      </span>
    );
  }
  if (norm === "errand") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-semibold text-orange-800 dark:text-orange-300 border border-orange-500/20">
        <ShoppingBag className="h-3 w-3 shrink-0" />
        <span>Errand</span>
      </span>
    );
  }
  if (norm === "package") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300 border border-purple-500/20">
        <Package className="h-3 w-3 shrink-0" />
        <span>Package</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground capitalize">
      {type.replace(/_/g, " ")}
    </span>
  );
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
  const urlPostId = searchParams.get("id");
  const urlQuery = searchParams.get("q") ?? "";

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

  const formatCents = (cents: number | null | undefined) => {
    if (cents === null || cents === undefined) return "—";
    return `$${(cents / 100).toFixed(2)} BZD`;
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      open: "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20",
      filled: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20",
      completed: "bg-muted text-muted-foreground border border-border",
      cancelled: "bg-destructive/10 text-destructive border border-destructive/20",
      expired: "bg-destructive/10 text-destructive border border-destructive/20",
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

  /* ── Type Counts for Quick-Filters ── */
  const typeCounts = useMemo(() => {
    let routeOffer = 0;
    let routeRequest = 0;
    let job = 0;
    let errand = 0;
    let pkg = 0;
    for (const p of posts) {
      const norm = p.type.toLowerCase();
      if (norm === "route_offer") routeOffer++;
      else if (norm === "route_request" || norm === "ride_request") routeRequest++;
      else if (norm === "job") job++;
      else if (norm === "errand") errand++;
      else if (norm === "package") pkg++;
    }
    return {
      all: posts.length,
      route_offer: routeOffer,
      route_request: routeRequest,
      job,
      errand,
      package: pkg,
    };
  }, [posts]);

  /* ── Search & Filters ── */
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (typeFilter !== "all") {
        const norm = p.type.toLowerCase();
        if (typeFilter === "route_offer" && norm !== "route_offer") return false;
        if (typeFilter === "route_request" && norm !== "route_request" && norm !== "ride_request") return false;
        if (typeFilter === "job" && norm !== "job") return false;
        if (typeFilter === "errand" && norm !== "errand") return false;
        if (typeFilter === "package" && norm !== "package") return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const title = (p.title ?? "").toLowerCase();
      const origin = (p.origin_address ?? "").toLowerCase();
      const dest = (p.dest_address ?? "").toLowerCase();
      const profile = profilesMap.get(p.author_id);
      const author = getAuthorDisplayName(profile, p.author_id).toLowerCase();
      const authorId = (p.author_id ?? "").toLowerCase();
      const id = (p.id ?? "").toLowerCase();
      const pType = (p.type ?? "").toLowerCase();
      const jobCat = (JOB_CATEGORY_LABELS[p.job_category ?? ""] ?? "").toLowerCase();
      const errandCat = (ERRAND_CATEGORY_LABELS[p.errand_category ?? ""] ?? "").toLowerCase();

      return (
        title.includes(q) ||
        origin.includes(q) ||
        dest.includes(q) ||
        author.includes(q) ||
        authorId.includes(q) ||
        id.includes(q) ||
        pType.includes(q) ||
        jobCat.includes(q) ||
        errandCat.includes(q)
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

      {/* Search & Filter Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm font-semibold text-foreground">
          Marketplace Listings ({filteredPosts.length})
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search title, author, route, job, errand, ID..."
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

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-8 rounded-lg border border-border/80 bg-card px-3 text-xs font-semibold text-foreground shadow-xs transition-colors hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="all">All Service Types ({typeCounts.all})</option>
              <option value="route_offer">Route Offers ({typeCounts.route_offer})</option>
              <option value="route_request">Ride Requests ({typeCounts.route_request})</option>
              <option value="job">Jobs & Gigs ({typeCounts.job})</option>
              <option value="errand">Errands & Tasks ({typeCounts.errand})</option>
              <option value="package">Package Deliveries ({typeCounts.package})</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 rounded-lg border border-border/80 bg-card px-3 text-xs font-semibold text-foreground shadow-xs transition-colors hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
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
                <th className="px-3 py-2.5 text-left font-semibold">Service Type</th>
                <th className="px-3 py-2.5 text-left font-semibold">Status</th>
                <th className="px-3 py-2.5 text-left font-semibold">Route / Worksite</th>
                <th className="px-3 py-2.5 text-left font-semibold">Fare / Pay</th>
                <th className="px-3 py-2.5 text-left font-semibold">Specs / Details</th>
                <th className="px-3 py-2.5 text-left font-semibold">Schedule / Timeline</th>
                <th className="px-3 py-2.5 text-left font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPosts.map((p) => {
                const isSelected = selectedPost?.id === p.id;
                const authorProfile = profilesMap.get(p.author_id);
                const authorName = getAuthorDisplayName(authorProfile, p.author_id);
                const isRecurring = Boolean(p.repeat_days && p.repeat_days.length > 0);
                const normType = p.type.toLowerCase();

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
                    <td className="px-3 py-3 whitespace-nowrap">
                      <PostTypeBadge type={p.type} />
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

                    {/* Route / Worksite Column */}
                    <td className="px-3 py-3 max-w-[200px]">
                      {normType === "job" ? (
                        <div className="flex items-center gap-1 text-xs">
                          <MapPin className="h-3 w-3 shrink-0 text-amber-600" />
                          <span className="truncate font-medium text-foreground">
                            {p.origin_address ?? "Location in details"}
                          </span>
                        </div>
                      ) : p.origin_address || p.dest_address ? (
                        <>
                          <div className="truncate font-medium text-foreground text-xs" title={p.origin_address ?? ""}>
                            {p.origin_address ?? "Origin"}
                          </div>
                          <div
                            className="truncate text-[11px] text-muted-foreground flex items-center gap-1"
                            title={p.dest_address ?? ""}
                          >
                            <ArrowDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span className="truncate">{p.dest_address ?? "Destination"}</span>
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No location set</span>
                      )}
                    </td>

                    {/* Fare / Pay Column */}
                    <td className="px-3 py-3 tabular-nums text-xs">
                      {normType === "job" ? (
                        <div>
                          <span className="font-semibold text-foreground">
                            {p.pay_rate_cents != null
                              ? formatCents(p.pay_rate_cents)
                              : formatCents(p.price_cents)}
                          </span>
                          <span className="text-muted-foreground ml-1">
                            {p.pay_type === "hourly" ? "/hr" : "fixed"}
                          </span>
                        </div>
                      ) : normType === "errand" ? (
                        <div>
                          <span className="font-semibold text-foreground">
                            {formatCents(p.errand_fee_cents ?? p.price_cents)}
                          </span>
                          {p.item_cost_cents ? (
                            <div className="text-[10px] text-muted-foreground">
                              +~{formatCents(p.item_cost_cents)} items
                            </div>
                          ) : null}
                        </div>
                      ) : normType === "package" ? (
                        <span className="font-semibold text-foreground">
                          {formatCents(p.price_cents ?? p.errand_fee_cents)}
                        </span>
                      ) : normType === "route_offer" ? (
                        <div>
                          <span className="font-semibold text-foreground">
                            {formatCents(p.price_cents)}
                          </span>
                          <span className="text-muted-foreground text-[10px] ml-1">/seat</span>
                        </div>
                      ) : (
                        <div>
                          <span className="font-semibold text-foreground">
                            {formatCents(p.price_cents)}
                          </span>
                          <span className="text-muted-foreground text-[10px] ml-1">offered</span>
                        </div>
                      )}
                    </td>

                    {/* Specs / Details Column */}
                    <td className="px-3 py-3 text-xs">
                      {normType === "job" ? (
                        <div>
                          <span className="font-medium text-foreground">
                            {JOB_CATEGORY_LABELS[p.job_category ?? ""] ??
                              (p.job_category ? p.job_category.replace(/_/g, " ") : "Gig / Job")}
                          </span>
                          <div className="text-[10px] text-muted-foreground">
                            {JOB_TIMELINE_LABELS[p.job_timeline ?? ""] ?? p.job_timeline ?? "Flexible"}
                          </div>
                        </div>
                      ) : normType === "errand" ? (
                        <div>
                          <span className="font-medium text-foreground">
                            {ERRAND_CATEGORY_LABELS[p.errand_category ?? ""] ??
                              (p.errand_category ? p.errand_category.replace(/_/g, " ") : "Errand")}
                          </span>
                          <div className="text-[10px] text-muted-foreground">
                            {p.pickup_style === "multi_stop" ? "Multi-stop" : "Single stop"}
                          </div>
                        </div>
                      ) : normType === "package" ? (
                        <div className="text-muted-foreground font-medium">Package Delivery</div>
                      ) : normType === "route_offer" ? (
                        <div className="tabular-nums">
                          <span className="font-medium text-foreground">{p.seats_filled ?? 0}</span>
                          <span className="text-muted-foreground">/{p.seats_total ?? "—"} seats</span>
                        </div>
                      ) : (
                        <div className="tabular-nums">
                          <span className="font-medium text-foreground">{p.seats_total ?? 1}</span>
                          <span className="text-muted-foreground">
                            {" "}
                            seat{(p.seats_total ?? 1) > 1 ? "s" : ""} req.
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Schedule / Timeline Column */}
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {isRecurring && (
                        <div className="inline-flex items-center gap-1 font-medium text-accent-blue pb-0.5">
                          <Repeat className="h-3 w-3" />
                          <span>{formatRepeatDays(p.repeat_days)}</span>
                        </div>
                      )}
                      {p.departure_at ? (
                        <div>
                          {new Date(p.departure_at).toLocaleString([], {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </div>
                      ) : normType === "job" && p.job_timeline ? (
                        <span className="font-medium text-foreground">
                          {JOB_TIMELINE_LABELS[p.job_timeline] ?? p.job_timeline}
                        </span>
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
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    No marketplace listings match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Detail Modal Overlay ── */}
      {selectedPost && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6"
        >
          <div
            className="flex flex-col w-full max-w-4xl max-h-[92vh] rounded-xl border bg-card shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/20">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground">
                    {selectedPost.title}
                  </h3>
                  <PostTypeBadge type={selectedPost.type} />
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
                  <span className="text-muted-foreground font-sans">
                    Posted on {new Date(selectedPost.created_at).toLocaleString()}
                  </span>
                  <span className="text-border">&bull;</span>
                  <Link
                    href={`/admin/bookings?q=${selectedPost.id}`}
                    className="font-sans text-[11px] text-accent-blue hover:underline inline-flex items-center gap-1 font-medium"
                    title="View bookings and contracts for this listing"
                  >
                    View Bookings <ArrowRight className="h-2.5 w-2.5" />
                  </Link>
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
                      Author Profile & Contact Information
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

              {/* ── Dynamic Details: JOB SPECIFIC ── */}
              {selectedPost.type.toLowerCase() === "job" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border bg-card p-4 space-y-3">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <Briefcase className="h-4 w-4 text-amber-600 shrink-0" />
                      <div className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Job Overview & Worksite
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Worksite Location:</span>
                        <div className="font-medium text-foreground mt-0.5 flex items-start gap-1">
                          <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>{selectedPost.origin_address ?? "Worksite location in description"}</span>
                        </div>
                      </div>
                      <div className="flex justify-between border-t pt-1.5">
                        <span className="text-muted-foreground">Job Category:</span>
                        <span className="font-semibold text-foreground">
                          {JOB_CATEGORY_LABELS[selectedPost.job_category ?? ""] ??
                            (selectedPost.job_category ? selectedPost.job_category.replace(/_/g, " ") : "General")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Desired Timeline:</span>
                        <span className="font-semibold text-amber-700 dark:text-amber-400">
                          {JOB_TIMELINE_LABELS[selectedPost.job_timeline ?? ""] ??
                            selectedPost.job_timeline ??
                            "Flexible"}
                        </span>
                      </div>
                      {selectedPost.payment_method && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Payment Method:</span>
                          <span className="font-medium uppercase text-foreground">
                            {selectedPost.payment_method}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border bg-card p-4 space-y-3">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <DollarSign className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Compensation & Pay Terms
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-baseline">
                        <span className="text-muted-foreground">Pay Rate:</span>
                        <span className="text-base font-bold text-foreground">
                          {selectedPost.pay_rate_cents != null
                            ? formatCents(selectedPost.pay_rate_cents)
                            : formatCents(selectedPost.price_cents)}
                          <span className="text-xs font-normal text-muted-foreground ml-1">
                            {selectedPost.pay_type === "hourly" ? "/ hour" : "fixed"}
                          </span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Structure:</span>
                        <span className="font-medium capitalize text-foreground">
                          {selectedPost.pay_type === "hourly" ? "Hourly Rate" : "Fixed Project Fee"}
                        </span>
                      </div>
                      <div className="pt-2 border-t">
                        <Link
                          href={`/admin/bookings?q=${selectedPost.id}`}
                          className="text-xs text-accent-blue hover:underline inline-flex items-center gap-1 font-medium"
                        >
                          View Contracts / Bookings for this Job <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Dynamic Details: ERRAND SPECIFIC ── */}
              {selectedPost.type.toLowerCase() === "errand" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border bg-card p-4 space-y-3">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <ShoppingBag className="h-4 w-4 text-orange-600 shrink-0" />
                      <div className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Errand Scope & Route
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Store / Pickup Address:</span>
                        <div className="font-medium text-foreground mt-0.5 flex items-start gap-1">
                          <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{selectedPost.origin_address ?? "Not specified"}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Delivery / Destination Address:</span>
                        <div className="font-medium text-foreground mt-0.5 flex items-start gap-1">
                          <MapPin className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <span>{selectedPost.dest_address ?? "Not specified"}</span>
                        </div>
                      </div>
                      <div className="flex justify-between border-t pt-1.5">
                        <span className="text-muted-foreground">Errand Category:</span>
                        <span className="font-semibold text-foreground">
                          {ERRAND_CATEGORY_LABELS[selectedPost.errand_category ?? ""] ??
                            (selectedPost.errand_category ? selectedPost.errand_category.replace(/_/g, " ") : "Errand")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pickup Style:</span>
                        <span className="font-medium text-foreground">
                          {selectedPost.pickup_style === "multi_stop" ? "Multi-stop pickups" : "Single pickup point"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-card p-4 space-y-3">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <DollarSign className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Errand Fees & Expenses
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-baseline">
                        <span className="text-muted-foreground">Service Fee:</span>
                        <span className="text-base font-bold text-foreground">
                          {formatCents(selectedPost.errand_fee_cents ?? selectedPost.price_cents)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Est. Items Cost:</span>
                        <span className="font-semibold text-muted-foreground">
                          {selectedPost.item_cost_cents != null
                            ? `~${formatCents(selectedPost.item_cost_cents)} (reimbursed)`
                            : "None / Not specified"}
                        </span>
                      </div>
                      {selectedPost.payment_method && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Payment Method:</span>
                          <span className="font-medium uppercase text-foreground">
                            {selectedPost.payment_method}
                          </span>
                        </div>
                      )}
                      <div className="pt-2 border-t">
                        <Link
                          href={`/admin/bookings?q=${selectedPost.id}`}
                          className="text-xs text-accent-blue hover:underline inline-flex items-center gap-1 font-medium"
                        >
                          View Bookings for this Errand <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Dynamic Details: PACKAGE SPECIFIC ── */}
              {selectedPost.type.toLowerCase() === "package" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border bg-card p-4 space-y-3">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <Package className="h-4 w-4 text-purple-600 shrink-0" />
                      <div className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Package Pickup & Delivery
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Pickup Location:</span>
                        <div className="font-medium text-foreground mt-0.5 flex items-start gap-1">
                          <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{selectedPost.origin_address ?? "Not specified"}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Delivery Destination:</span>
                        <div className="font-medium text-foreground mt-0.5 flex items-start gap-1">
                          <MapPin className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <span>{selectedPost.dest_address ?? "Not specified"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-card p-4 space-y-3">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <DollarSign className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Delivery Pricing
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-baseline">
                        <span className="text-muted-foreground">Delivery Fee:</span>
                        <span className="text-base font-bold text-foreground">
                          {formatCents(selectedPost.price_cents ?? selectedPost.errand_fee_cents)}
                        </span>
                      </div>
                      {selectedPost.payment_method && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Payment Method:</span>
                          <span className="font-medium uppercase text-foreground">
                            {selectedPost.payment_method}
                          </span>
                        </div>
                      )}
                      <div className="pt-2 border-t">
                        <Link
                          href={`/admin/bookings?q=${selectedPost.id}`}
                          className="text-xs text-accent-blue hover:underline inline-flex items-center gap-1 font-medium"
                        >
                          View Bookings for this Package <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Dynamic Details: ROUTE SPECIFIC (Offers & Requests) ── */}
              {(selectedPost.type.toLowerCase() === "route_offer" ||
                selectedPost.type.toLowerCase() === "route_request" ||
                selectedPost.type.toLowerCase() === "ride_request") && (
                <>
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
                            {selectedPost.route_distance_km && (
                              <span>Distance: {selectedPost.route_distance_km} km </span>
                            )}
                            {selectedPost.route_duration_min && (
                              <span>&bull; Est. Duration: {selectedPost.route_duration_min} min</span>
                            )}
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
                            {selectedPost.seats_total ?? "Not specified"} seat
                            {selectedPost.seats_total && selectedPost.seats_total > 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Seats Booked:</span>
                          <span className="font-semibold text-foreground">
                            {selectedPost.seats_filled ?? 0} booked
                          </span>
                        </div>
                        {selectedPost.min_riders != null && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>Minimum to go:</span>
                            <span className="font-medium text-foreground">
                              {selectedPost.min_riders} riders
                            </span>
                          </div>
                        )}
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
                  </div>
                </>
              )}

              {/* Instructions / Pickup Notes */}
              {selectedPost.pickup_notes && (
                <div className="rounded-lg border bg-card p-4 space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Pickup Notes & Special Instructions
                  </div>
                  <p className="text-xs text-foreground whitespace-pre-wrap mt-1">
                    {selectedPost.pickup_notes}
                  </p>
                </div>
              )}

              {/* Description */}
              {selectedPost.description && (
                <div className="rounded-lg border bg-card p-4 space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Full Description
                  </div>
                  <p className="text-xs text-foreground whitespace-pre-wrap mt-1">
                    {selectedPost.description}
                  </p>
                </div>
              )}

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
