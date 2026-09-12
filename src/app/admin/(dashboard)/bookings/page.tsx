"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  X,
  ArrowRight,
  ArrowDown,
  Clock,
  User,
  Car,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Star,
  ShieldAlert,
  Calendar,
  MapPin,
  Navigation,
  Compass,
  CalendarCheck,
  Copy,
  Check,
  Bell,
  Briefcase,
  ShoppingBag,
  Package,
} from "lucide-react";
import {
  getAdminActionErrorMessage,
  getAdminBookingsData,
  getAdminContentData,
  getAdminUsersData,
  type BookingAuditItem,
} from "@/lib/admin-backend";

type RawBooking = {
  id: string;
  post_id: string;
  user_id: string;
  role: string;
  status: string;
  seats_booked: number;
  payment_method: string | null;
  cancel_reason?: string | null;
  cancelled_at?: string | null;
  created_at: string;
};

type RawContract = {
  id: string;
  post_id?: string | null;
  booking_id: string | null;
  origin_address: string | null;
  dest_address: string | null;
  agreed_price_cents: number | null;
  status: string;
  parties?: string[] | null;
  departure_at?: string | null;
  completed_at?: string | null;
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
  emergency_contact: string | null;
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

type Post = {
  id: string;
  author_id: string;
  type: string;
  status: string;
  title: string | null;
  description: string | null;
  origin_address: string | null;
  dest_address: string | null;
  price_cents: number | null;
  seats_total: number | null;
  seats_remaining: number | null;
  departure_at: string | null;
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

function getPersonDisplayName(
  profile?: Profile | null,
  fallbackId?: string | null,
  role?: string
): string {
  if (profile) {
    const full = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();
    if (full) return full;
    if (profile.email) return profile.email;
    if (profile.phone) return profile.phone;
  }
  if (fallbackId) {
    return `${role ?? "User"} (${fallbackId.slice(0, 8)})`;
  }
  return "Unassigned";
}

function synthesizeAuditItemsFromRaw(
  bookings: RawBooking[],
  contracts: RawContract[],
  apiAuditItems: BookingAuditItem[] = [],
  profiles: Profile[] = [],
  driverDetails: DriverDetail[] = [],
  posts: Post[] = [],
  notifications: Notification[] = []
): BookingAuditItem[] {
  if (apiAuditItems.length > 0) {
    return apiAuditItems;
  }

  const profilesMap = new Map(profiles.map((p) => [p.id, p]));
  const driversMap = new Map(driverDetails.map((d) => [d.id, d]));
  const postsMap = new Map(posts.map((p) => [p.id, p]));

  // Graceful fallback for existing mock/test data or while backend deployment is pending
  return bookings.map((b) => {
    const contract =
      contracts.find((c) => c.booking_id === b.id) ||
      contracts.find((c) => c.post_id === b.post_id);

    const post = postsMap.get(b.post_id);

    const isDriver = b.role === "driver";
    const isRider = b.role === "rider";

    let driverId: string | null = null;
    let riderId: string | null = null;

    if (isDriver) {
      driverId = b.user_id;
      riderId = post?.author_id ?? contract?.parties?.find((p) => p !== b.user_id) ?? null;
    } else if (isRider) {
      riderId = b.user_id;
      driverId = post?.author_id ?? contract?.parties?.find((p) => p !== b.user_id) ?? null;
    } else {
      driverId = post?.type === "route_offer" ? post.author_id : b.user_id;
      riderId = post?.type === "route_offer" ? b.user_id : post?.author_id ?? null;
    }

    const driverProfile = driverId ? profilesMap.get(driverId) : null;
    const riderProfile = riderId ? profilesMap.get(riderId) : null;
    const driverDetail = driverId ? driversMap.get(driverId) : null;

    const driverName = getPersonDisplayName(driverProfile, driverId, "Driver");
    const riderName = getPersonDisplayName(riderProfile, riderId, "Rider");

    const origin = contract?.origin_address ?? post?.origin_address ?? null;
    const dest = contract?.dest_address ?? post?.dest_address ?? null;
    const departure = contract?.departure_at ?? post?.departure_at ?? null;

    const agreedPrice =
      contract?.agreed_price_cents ??
      (post?.price_cents ? post.price_cents * (b.seats_booked ?? 1) : null);

    const bookingNotifications = notifications
      .filter((n) => {
        const data = n.data as Record<string, unknown> | undefined;
        if (data) {
          if (data.bookingId === b.id || data.booking_id === b.id) return true;
          if (
            (data.postId === b.post_id || data.post_id === b.post_id) &&
            (n.user_id === driverId || n.user_id === riderId)
          ) {
            return true;
          }
        }
        if (
          (n.user_id === driverId || n.user_id === riderId) &&
          post?.title &&
          (n.body?.toLowerCase().includes(post.title.toLowerCase()) ||
            n.title?.toLowerCase().includes(post.title.toLowerCase()))
        ) {
          return true;
        }
        return false;
      })
      .map((n) => {
        const recipient = profilesMap.get(n.user_id);
        const recipientName = recipient
          ? getPersonDisplayName(recipient, n.user_id)
          : n.user_id === driverId
          ? driverName
          : n.user_id === riderId
          ? riderName
          : `User (${n.user_id.slice(0, 8)})`;
        return {
          id: n.id,
          userId: n.user_id,
          recipientName,
          type: n.type,
          title: n.title,
          body: n.body,
          createdAt: n.created_at,
        };
      });

    return {
      id: b.id,
      bookingId: b.id,
      contractId: contract?.id ?? null,
      postId: b.post_id,
      status: contract?.status ?? b.status,
      bookingStatus: b.status,
      contractStatus: contract?.status ?? null,
      createdAt: b.created_at,
      departureAt: departure,
      completedAt: contract?.completed_at ?? null,
      cancelledAt: b.cancelled_at ?? null,
      cancelReason: b.cancel_reason ?? null,
      seatsBooked: b.seats_booked ?? 1,
      paymentMethod: b.payment_method ?? null,
      agreedPriceCents: agreedPrice,
      originAddress: origin,
      destAddress: dest,
      postTitle: post?.title ?? null,
      postType: post?.type ?? null,
      driver: driverId
        ? {
            id: driverId,
            name: driverName,
            email: driverProfile?.email ?? null,
            phone: driverProfile?.phone ?? null,
            avatarUrl: driverProfile?.avatar_url ?? null,
            ratingAvg: driverProfile?.rating_avg ?? null,
            punctualityPct: driverProfile?.punctuality_pct ?? null,
            accountStatus: driverProfile?.account_status ?? null,
            vehicle: driverDetail
              ? {
                  make: driverDetail.vehicle_make,
                  model: driverDetail.vehicle_model,
                  year: driverDetail.vehicle_year,
                  color: driverDetail.vehicle_color,
                  plate: driverDetail.vehicle_plate,
                  verified: driverDetail.verified,
                }
              : null,
          }
        : null,
      rider: riderId
        ? {
            id: riderId,
            name: riderName,
            email: riderProfile?.email ?? null,
            phone: riderProfile?.phone ?? null,
            avatarUrl: riderProfile?.avatar_url ?? null,
            ratingAvg: riderProfile?.rating_avg ?? null,
            emergencyContact: riderProfile?.emergency_contact ?? null,
            accountStatus: riderProfile?.account_status ?? null,
          }
        : null,
      timeline: [
        {
          id: `booking-${b.id}`,
          type: "booking_requested",
          label: "Booking Created",
          timestamp: b.created_at,
          actorId: b.user_id,
          actorName: isDriver ? driverName : riderName,
          actorRole: (isDriver ? "driver" : isRider ? "rider" : "system") as "driver" | "rider" | "system" | "admin",
          note: `${b.seats_booked ?? 1} seat(s) booked (${b.status})`,
        },
        ...(contract
          ? [
              {
                id: `contract-${contract.id}`,
                type: "contract_formed",
                label: "Contract Recorded",
                timestamp: contract.created_at,
                actorId: null,
                actorName: null,
                actorRole: "system" as const,
                note: agreedPrice ? `Agreed fare: $${(agreedPrice / 100).toFixed(2)} BZD` : null,
              },
            ]
          : []),
        ...(b.status === "completed" || contract?.status === "completed"
          ? [
              {
                id: `complete-${b.id}`,
                type: "completed",
                label: "Trip Completed",
                timestamp: contract?.completed_at || b.created_at,
                actorId: driverId,
                actorName: driverName,
                actorRole: "driver" as const,
                note: null,
              },
            ]
          : []),
        ...(b.status === "cancelled"
          ? [
              {
                id: `cancel-${b.id}`,
                type: "cancelled",
                label: "Booking Cancelled",
                timestamp: b.cancelled_at || b.created_at,
                actorId: null,
                actorName: null,
                actorRole: "system" as const,
                note: b.cancel_reason ? `Reason: ${b.cancel_reason}` : "Cancelled",
              },
            ]
          : []),
      ],
      ratings: [] as BookingAuditItem["ratings"],
      flags: [] as BookingAuditItem["flags"],
      notifications: bookingNotifications,
    };
  });
}

function PostTypeBadge({ type }: { type?: string | null }) {
  if (!type) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        Booking
      </span>
    );
  }
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

export default function BookingsPage() {
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
      <BookingsPageInner />
    </Suspense>
  );
}

function BookingsPageInner() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? searchParams.get("search") ?? "";
  const urlBookingId = searchParams.get("id") ?? "";

  const [auditItems, setAuditItems] = useState<BookingAuditItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<BookingAuditItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [copiedBookingId, setCopiedBookingId] = useState(false);
  const [copiedDriverId, setCopiedDriverId] = useState(false);
  const [copiedRiderId, setCopiedRiderId] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [bookingsData, usersData, contentData] = await Promise.all([
        getAdminBookingsData<RawBooking, RawContract>(),
        getAdminUsersData<Profile, DriverDetail, unknown, unknown>().catch(() => null),
        getAdminContentData<Post, Notification>().catch(() => null),
      ]);

      const items = synthesizeAuditItemsFromRaw(
        bookingsData.bookings ?? [],
        bookingsData.contracts ?? [],
        bookingsData.auditItems ?? [],
        usersData?.profiles ?? [],
        usersData?.driverDetails ?? [],
        contentData?.posts ?? [],
        contentData?.notifications ?? []
      );
      setAuditItems(items);
    } catch (error) {
      setLoadError(getAdminActionErrorMessage(error));
      setAuditItems([]);
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
    if (urlBookingId && auditItems.length > 0) {
      const target = auditItems.find(
        (it) =>
          it.id === urlBookingId ||
          it.bookingId === urlBookingId ||
          it.contractId === urlBookingId
      );
      if (target) {
        setSelectedItem(target);
      }
    }
  }, [urlBookingId, auditItems]);

  /* ── Filtered Rides / Bookings ── */
  const filteredAuditItems = useMemo(() => {
    return auditItems.filter((item) => {
      // Status filter
      if (statusFilter !== "all") {
        const s = item.status.toLowerCase();
        if (statusFilter === "completed" && s !== "completed") return false;
        if (statusFilter === "in_progress" && s !== "active" && s !== "confirmed") return false;
        if (statusFilter === "pending" && s !== "pending") return false;
        if (
          statusFilter === "cancelled" &&
          s !== "cancelled" &&
          s !== "no_show" &&
          s !== "rejected"
        )
          return false;
      }

      // Service type filter
      if (typeFilter !== "all") {
        const norm = (item.postType ?? "").toLowerCase();
        if (typeFilter === "route_offer" && norm !== "route_offer") return false;
        if (typeFilter === "route_request" && norm !== "route_request" && norm !== "ride_request") return false;
        if (typeFilter === "job" && norm !== "job") return false;
        if (typeFilter === "errand" && norm !== "errand") return false;
        if (typeFilter === "package" && norm !== "package") return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const driverName = (item.driver?.name ?? "").toLowerCase();
      const driverPhone = (item.driver?.phone ?? "").toLowerCase();
      const driverPlate = (item.driver?.vehicle?.plate ?? "").toLowerCase();
      const driverId = (item.driver?.id ?? "").toLowerCase();
      const riderName = (item.rider?.name ?? "").toLowerCase();
      const riderPhone = (item.rider?.phone ?? "").toLowerCase();
      const riderId = (item.rider?.id ?? "").toLowerCase();
      const origin = (item.originAddress ?? "").toLowerCase();
      const dest = (item.destAddress ?? "").toLowerCase();
      const bookingId = (item.bookingId ?? "").toLowerCase();
      const contractId = (item.contractId ?? "").toLowerCase();
      const postId = (item.postId ?? "").toLowerCase();
      const paymentMethod = (item.paymentMethod ?? "").toLowerCase();

      return (
        driverName.includes(q) ||
        driverPhone.includes(q) ||
        driverPlate.includes(q) ||
        driverId.includes(q) ||
        riderName.includes(q) ||
        riderPhone.includes(q) ||
        riderId.includes(q) ||
        origin.includes(q) ||
        dest.includes(q) ||
        bookingId.includes(q) ||
        contractId.includes(q) ||
        postId.includes(q) ||
        paymentMethod.includes(q)
      );
    });
  }, [auditItems, searchQuery, statusFilter, typeFilter]);

  /* ── Service Type Counts for Quick-Filters ── */
  const typeCounts = useMemo(() => {
    let routeOffer = 0;
    let routeRequest = 0;
    let job = 0;
    let errand = 0;
    let pkg = 0;
    for (const item of auditItems) {
      const norm = (item.postType ?? "").toLowerCase();
      if (norm === "route_offer") routeOffer++;
      else if (norm === "route_request" || norm === "ride_request") routeRequest++;
      else if (norm === "job") job++;
      else if (norm === "errand") errand++;
      else if (norm === "package") pkg++;
    }
    return {
      all: auditItems.length,
      route_offer: routeOffer,
      route_request: routeRequest,
      job,
      errand,
      package: pkg,
    };
  }, [auditItems]);

  /* ── Summary Metrics (Matching Exact App Lifecycle) ── */
  const metrics = useMemo(() => {
    const total = auditItems.length;
    let completed = 0;
    let inProgress = 0;
    let pending = 0;
    let cancelled = 0;

    for (const item of auditItems) {
      const s = item.status.toLowerCase();
      if (s === "completed") completed++;
      else if (s === "active" || s === "confirmed") inProgress++;
      else if (s === "pending") pending++;
      else if (s === "cancelled" || s === "no_show" || s === "rejected") cancelled++;
    }

    return { total, completed, inProgress, pending, cancelled };
  }, [auditItems]);

  const formatCents = (cents: number | null) =>
    cents !== null ? `$${(cents / 100).toFixed(2)} BZD` : "—";

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    let bg = "bg-muted text-muted-foreground";
    const label = status.replace(/_/g, " ");

    if (s === "completed") {
      bg = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    } else if (s === "active" || s === "confirmed") {
      bg = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    } else if (s === "pending") {
      bg = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    } else if (s === "cancelled" || s === "rejected" || s === "no_show") {
      bg = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${bg}`}>
        {label}
      </span>
    );
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case "booking_requested":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "contract_formed":
        return <CalendarCheck className="h-4 w-4 text-blue-500" />;
      case "en_route":
        return <Navigation className="h-4 w-4 text-indigo-500" />;
      case "arrived_pickup":
      case "arrived_location":
        return <MapPin className="h-4 w-4 text-emerald-500" />;
      case "departed":
        return <Compass className="h-4 w-4 text-cyan-500" />;
      case "arrived_destination":
        return <MapPin className="h-4 w-4 text-blue-600" />;
      case "completed":
      case "delivered":
      case "completed_work":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      )}

      {/* Top Metrics Cards (Strictly App-Accurate: Total, In Progress, Completed, Pending, Cancelled) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-lg border bg-card p-3 shadow-xs">
          <div className="text-xs font-medium text-muted-foreground">Total Bookings</div>
          <div className="mt-1 text-2xl font-bold tracking-tight">{metrics.total}</div>
        </div>
        <div className="rounded-lg border bg-card p-3 shadow-xs">
          <div className="text-xs font-medium text-blue-600 dark:text-blue-400">In Progress / Confirmed</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
            {metrics.inProgress}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-3 shadow-xs">
          <div className="text-xs font-medium text-green-600 dark:text-green-400">Completed</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
            {metrics.completed}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-3 shadow-xs">
          <div className="text-xs font-medium text-amber-600 dark:text-amber-400">Pending</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
            {metrics.pending}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-3 shadow-xs">
          <div className="text-xs font-medium text-destructive">Cancelled</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-destructive">
            {metrics.cancelled}
          </div>
        </div>
      </div>

      {/* Search & Filter Header (No Separate Tabs) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm font-semibold text-foreground">
          All Bookings ({filteredAuditItems.length})
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search ID, driver, rider, route, payment..."
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
              <option value="in_progress">In Progress / Confirmed</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Unified Auditable Bookings Table */}
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
                <th className="px-3 py-2.5 text-left font-semibold">Booking ID</th>
                <th className="px-3 py-2.5 text-left font-semibold">Type</th>
                <th className="px-3 py-2.5 text-left font-semibold">Driver / Provider</th>
                <th className="px-3 py-2.5 text-left font-semibold">Rider / Requester</th>
                <th className="px-3 py-2.5 text-left font-semibold">Route / Location</th>
                <th className="px-3 py-2.5 text-left font-semibold">Fare & Specs</th>
                <th className="px-3 py-2.5 text-left font-semibold">Payment</th>
                <th className="px-3 py-2.5 text-left font-semibold">Status</th>
                <th className="px-3 py-2.5 text-left font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredAuditItems.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`cursor-pointer transition-colors hover:bg-muted/30 ${
                      isSelected ? "bg-muted/50" : ""
                    }`}
                  >
                    <td className="px-3 py-3">
                      <div className="font-mono text-xs font-medium text-foreground">
                        {item.bookingId ? item.bookingId.slice(0, 8) : item.contractId?.slice(0, 8)}
                      </div>
                      {item.postId && (
                        <div className="text-[10px] text-muted-foreground font-mono">
                          Post: {item.postId.slice(0, 8)}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <PostTypeBadge type={item.postType} />
                    </td>
                    <td className="px-3 py-3">
                      {item.driver ? (
                        <div>
                          <div className="font-medium text-foreground">{item.driver.name}</div>
                          <div className="font-mono text-[11px] text-muted-foreground">
                            ID: {item.driver.id.slice(0, 8)}
                          </div>
                          {item.driver.phone && (
                            <div className="text-xs text-muted-foreground">{item.driver.phone}</div>
                          )}
                          {item.driver.vehicle?.plate && (
                            <span className="inline-block mt-0.5 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium">
                              {item.driver.vehicle.plate}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {item.rider ? (
                        <div>
                          <div className="font-medium text-foreground">{item.rider.name}</div>
                          <div className="font-mono text-[11px] text-muted-foreground">
                            ID: {item.rider.id.slice(0, 8)}
                          </div>
                          {item.rider.phone && (
                            <div className="text-xs text-muted-foreground">{item.rider.phone}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Unknown</span>
                      )}
                    </td>
                    <td className="px-3 py-3 max-w-[200px]">
                      {item.originAddress || item.destAddress ? (
                        <>
                          <div className="truncate font-medium text-foreground" title={item.originAddress ?? ""}>
                            {item.originAddress ?? "Origin"}
                          </div>
                          <div className="truncate text-xs text-muted-foreground flex items-center gap-1" title={item.destAddress ?? ""}>
                            <ArrowDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span className="truncate">{item.destAddress ?? "Destination"}</span>
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">Route Details in Contract</span>
                      )}
                    </td>
                    <td className="px-3 py-3 tabular-nums">
                      <div className="font-semibold text-foreground">
                        {formatCents(item.agreedPriceCents)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.postType === "job"
                          ? "Job Assignment"
                          : item.postType === "errand"
                          ? "Errand Task"
                          : item.postType === "package"
                          ? "Package Delivery"
                          : `${item.seatsBooked} seat${item.seatsBooked > 1 ? "s" : ""}`}
                      </div>
                    </td>
                    <td className="px-3 py-3 capitalize">
                      <span className="text-xs rounded bg-muted px-1.5 py-0.5 font-medium">
                        {item.paymentMethod ?? "cash"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                      <div>{new Date(item.createdAt).toLocaleDateString()}</div>
                      <div>
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredAuditItems.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">
                    {searchQuery
                      ? "No bookings match your search criteria."
                      : "No bookings found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          AUDIT DETAIL MODAL / DRAWER
          ════════════════════════════════════════════════════════ */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6 backdrop-blur-xs"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="relative flex flex-col w-full max-w-4xl max-h-[92vh] rounded-xl border bg-card shadow-2xl overflow-hidden text-card-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/20">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-foreground">
                      {selectedItem.postType === "job"
                        ? "Job Contract Details"
                        : selectedItem.postType === "errand"
                        ? "Errand Contract Details"
                        : selectedItem.postType === "package"
                        ? "Package Contract Details"
                        : "Ride Details"}
                    </h3>
                    <PostTypeBadge type={selectedItem.postType} />
                    {getStatusBadge(selectedItem.status)}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5 font-mono">
                    <span>Booking: {selectedItem.bookingId ?? "N/A"}</span>
                    {selectedItem.bookingId && (
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedItem.bookingId) {
                            void navigator.clipboard.writeText(selectedItem.bookingId);
                            setCopiedBookingId(true);
                            setTimeout(() => setCopiedBookingId(false), 2000);
                          }
                        }}
                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-muted border border-border/60 text-[10px]"
                        title="Copy Booking ID"
                      >
                        {copiedBookingId ? <Check className="h-2.5 w-2.5 text-green-500" /> : <Copy className="h-2.5 w-2.5" />}
                        <span>{copiedBookingId ? "Copied" : "Copy"}</span>
                      </button>
                    )}
                    {selectedItem.contractId && (
                      <>
                        <span className="text-border">&bull;</span>
                        <span>Contract: {selectedItem.contractId.slice(0, 8)}</span>
                        <Link
                          href={`/admin/finance?tab=transactions&q=${selectedItem.contractId}`}
                          className="font-sans text-[11px] text-accent-blue hover:underline inline-flex items-center gap-1 font-medium ml-1"
                          title="View payments for this contract"
                        >
                          Payments <ArrowRight className="h-2.5 w-2.5" />
                        </Link>
                        {selectedItem.rider?.id && (
                          <Link
                            href={`/admin/users?view=${selectedItem.rider.id}`}
                            className="font-sans text-[11px] text-accent-blue hover:underline inline-flex items-center gap-1 font-medium ml-1"
                            title="Open rider profile in users"
                          >
                            Rider <ArrowRight className="h-2.5 w-2.5" />
                          </Link>
                        )}
                        {selectedItem.driver?.id && (
                          <Link
                            href={`/admin/users?view=${selectedItem.driver.id}`}
                            className="font-sans text-[11px] text-accent-blue hover:underline inline-flex items-center gap-1 font-medium ml-1"
                            title="Open driver profile in users"
                          >
                            Driver <ArrowRight className="h-2.5 w-2.5" />
                          </Link>
                        )}
                      </>
                    )}
                    {selectedItem.postId && (
                      <>
                        <span className="text-border">&bull;</span>
                        <span>Post: {selectedItem.postId.slice(0, 8)}</span>
                        <Link
                          href={`/admin/content?id=${selectedItem.postId}`}
                          className="font-sans text-[11px] text-accent-blue hover:underline inline-flex items-center gap-1 font-medium ml-1"
                          title="Open original listing in marketplace"
                        >
                          View Listing <ArrowRight className="h-2.5 w-2.5" />
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Cancellation Alert */}
              {(selectedItem.status === "cancelled" || selectedItem.cancelledAt) && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 space-y-1 text-destructive">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Booking Was Cancelled</span>
                  </div>
                  <div className="text-xs space-y-0.5">
                    {selectedItem.cancelledAt && (
                      <div>
                        <strong>Cancelled At:</strong> {new Date(selectedItem.cancelledAt).toLocaleString()}
                      </div>
                    )}
                    <div>
                      <strong>Stated Reason:</strong>{" "}
                      {selectedItem.cancelReason || "No cancellation reason provided."}
                    </div>
                  </div>
                </div>
              )}

              {/* Side-by-Side Driver & Rider Identity Cards */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Driver Identity Card */}
                <div className="rounded-lg border bg-muted/10 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600">
                        <Car className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Driver Details
                      </span>
                    </div>
                    {selectedItem.driver && (
                      <Link
                        href={`/admin/users?view=${selectedItem.driver.id}`}
                        className="text-xs text-accent-blue hover:underline inline-flex items-center gap-1 font-medium"
                      >
                        Profile <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>

                  {selectedItem.driver ? (() => {
                    const driver = selectedItem.driver;
                    return (
                      <div className="space-y-2 text-xs">
                        <div>
                          <div className="text-sm font-semibold text-foreground">
                            {driver.name}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[11px] text-muted-foreground">
                              ID: <span className="text-foreground select-all">{driver.id}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                void navigator.clipboard.writeText(driver.id);
                                setCopiedDriverId(true);
                                setTimeout(() => setCopiedDriverId(false), 2000);
                              }}
                              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-muted border border-border/60 text-[10px]"
                              title="Copy Driver ID"
                            >
                              {copiedDriverId ? <Check className="h-2.5 w-2.5 text-green-500" /> : <Copy className="h-2.5 w-2.5" />}
                              <span>{copiedDriverId ? "Copied" : "Copy"}</span>
                            </button>
                          </div>
                          {driver.email && (
                            <div className="text-muted-foreground">{driver.email}</div>
                          )}
                          {driver.phone && (
                            <div className="text-muted-foreground">{driver.phone}</div>
                          )}
                        </div>

                        {/* Vehicle specs */}
                        <div className="rounded border bg-card p-2.5 space-y-1 mt-2">
                          <div className="font-semibold text-foreground text-[11px] uppercase tracking-wider text-muted-foreground">
                            Vehicle Information
                          </div>
                          {driver.vehicle ? (
                            <div className="space-y-0.5">
                              <div>
                                <strong>Vehicle:</strong> {driver.vehicle.year ?? ""}{" "}
                                {driver.vehicle.make ?? ""}{" "}
                                {driver.vehicle.model ?? ""}
                              </div>
                              <div>
                                <strong>Color:</strong> {driver.vehicle.color ?? "—"}
                              </div>
                              <div>
                                <strong>Plate:</strong>{" "}
                                <span className="font-mono font-bold text-foreground">
                                  {driver.vehicle.plate ?? "—"}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-muted-foreground italic">No registered vehicle info on this record.</p>
                          )}
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-3 pt-1 text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                            <span className="font-medium text-foreground">
                              {driver.ratingAvg !== null && driver.ratingAvg !== undefined
                                ? driver.ratingAvg.toFixed(1)
                                : "New"}
                            </span>
                          </div>
                          {driver.punctualityPct !== null &&
                            driver.punctualityPct !== undefined && (
                              <div>Punctuality: {driver.punctualityPct}%</div>
                            )}
                        </div>
                      </div>
                    );
                  })() : (
                    <p className="text-xs text-muted-foreground italic">No driver assigned to this record.</p>
                  )}
                </div>

                {/* Rider Identity Card */}
                <div className="rounded-lg border bg-muted/10 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600">
                        <User className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Rider Details
                      </span>
                    </div>
                    {selectedItem.rider && (
                      <Link
                        href={`/admin/users?view=${selectedItem.rider.id}`}
                        className="text-xs text-accent-blue hover:underline inline-flex items-center gap-1 font-medium"
                      >
                        Profile <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>

                  {selectedItem.rider ? (() => {
                    const rider = selectedItem.rider;
                    return (
                      <div className="space-y-2 text-xs">
                        <div>
                          <div className="text-sm font-semibold text-foreground">
                            {rider.name}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[11px] text-muted-foreground">
                              ID: <span className="text-foreground select-all">{rider.id}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                void navigator.clipboard.writeText(rider.id);
                                setCopiedRiderId(true);
                                setTimeout(() => setCopiedRiderId(false), 2000);
                              }}
                              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-muted border border-border/60 text-[10px]"
                              title="Copy Rider ID"
                            >
                              {copiedRiderId ? <Check className="h-2.5 w-2.5 text-green-500" /> : <Copy className="h-2.5 w-2.5" />}
                              <span>{copiedRiderId ? "Copied" : "Copy"}</span>
                            </button>
                          </div>
                          {rider.email && (
                            <div className="text-muted-foreground">{rider.email}</div>
                          )}
                          {rider.phone && (
                            <div className="text-muted-foreground">{rider.phone}</div>
                          )}
                        </div>

                        <div className="rounded border bg-card p-2.5 space-y-1 mt-2">
                          <div className="font-semibold text-foreground text-[11px] uppercase tracking-wider text-muted-foreground">
                            Emergency Contact
                          </div>
                          <div>
                            {rider.emergencyContact ?? (
                              <span className="text-muted-foreground italic">None on file</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pt-1 text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                            <span className="font-medium text-foreground">
                              {rider.ratingAvg !== null && rider.ratingAvg !== undefined
                                ? rider.ratingAvg.toFixed(1)
                                : "New"}
                            </span>
                          </div>
                          {rider.accountStatus && (
                            <div className="capitalize">
                              Status: <strong>{rider.accountStatus}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })() : (
                    <p className="text-xs text-muted-foreground italic">No rider assigned to this record.</p>
                  )}
                </div>
              </div>

              {/* Route & Financial Summary Card */}
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
                          {selectedItem.originAddress ?? "—"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-muted-foreground">Destination:</span>
                        <div className="font-medium text-foreground">
                          {selectedItem.destAddress ?? "—"}
                        </div>
                      </div>
                    </div>
                    {selectedItem.departureAt && (
                      <div className="flex items-center gap-2 pt-1">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">
                          Scheduled: {new Date(selectedItem.departureAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {selectedItem.postTitle && (
                      <div className="text-xs text-muted-foreground pt-1 border-t border-border/40">
                        Post: <span className="text-foreground font-medium">{selectedItem.postTitle}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border bg-card p-4 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Financial & Payment Details
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Seats Booked:</span>
                      <span className="font-medium text-foreground">{selectedItem.seatsBooked}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Agreed Fare:</span>
                      <span className="font-bold text-foreground text-sm">
                        {formatCents(selectedItem.agreedPriceCents)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Method:</span>
                      <span className="font-medium capitalize text-foreground">
                        {selectedItem.paymentMethod ?? "Cash"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Booking Created:</span>
                      <span className="text-muted-foreground">
                        {new Date(selectedItem.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Chronological Event Timeline */}
              <div className="rounded-lg border bg-card p-4 space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="text-sm font-bold text-foreground">
                    Chronological Trip Action Timeline
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    {selectedItem.timeline.length} milestone{selectedItem.timeline.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                  {selectedItem.timeline.map((event) => (
                    <div key={event.id} className="relative group">
                      <div className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-background border ring-4 ring-card">
                        {getTimelineIcon(event.type)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">
                            {event.label}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.2 text-[10px] font-medium capitalize ${
                              event.actorRole === "driver"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                : event.actorRole === "rider"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {event.actorRole}
                          </span>
                          <span className="text-xs text-muted-foreground tabular-nums ml-auto">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {event.actorName && (
                            <span>
                              By: <strong>{event.actorName}</strong>
                            </span>
                          )}
                          {event.note && (
                            <div className="mt-1 rounded bg-muted/30 p-2 text-foreground font-mono text-[11px]">
                              {event.note}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {selectedItem.timeline.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No lifecycle events recorded.</p>
                  )}
                </div>
              </div>

              {/* Dispatched User Alerts & Push Notifications for this Trip */}
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600">
                      <Bell className="h-4 w-4" />
                    </div>
                    <h4 className="text-sm font-bold text-foreground">
                      Dispatched User Alerts & Push Notifications
                    </h4>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {selectedItem.notifications?.length ?? 0} alert
                    {(selectedItem.notifications?.length ?? 0) === 1 ? "" : "s"}
                  </span>
                </div>

                {selectedItem.notifications && selectedItem.notifications.length > 0 ? (
                  <div className="space-y-2">
                    {selectedItem.notifications.map((notif) => (
                      <div key={notif.id} className="rounded-md border bg-muted/10 p-3 text-xs space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{notif.title}</span>
                            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                              {notif.type}
                            </span>
                          </div>
                          <span className="text-[11px] text-muted-foreground tabular-nums">
                            {new Date(notif.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {notif.body && <p className="text-muted-foreground">{notif.body}</p>}
                        <div className="text-[10px] text-muted-foreground pt-0.5">
                          Recipient: <span className="font-medium text-foreground">{notif.recipientName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    No automated notifications recorded for this ride.
                  </p>
                )}
              </div>

              {/* Two-Way Ratings & Feedback */}
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <h4 className="text-sm font-bold text-foreground">Ratings & Feedback</h4>
                {selectedItem.ratings.length > 0 ? (
                  <div className="space-y-2">
                    {selectedItem.ratings.map((r) => (
                      <div key={r.id} className="rounded border bg-muted/10 p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <strong>{r.raterName}</strong> rated <strong>{r.ratedName}</strong>
                          </div>
                          <div className="flex items-center gap-1 text-amber-500">
                            {Array.from({ length: r.stars }).map((_, idx) => (
                              <Star key={idx} className="h-3 w-3 fill-amber-500" />
                            ))}
                            <span className="font-semibold text-foreground ml-1">({r.stars}/5)</span>
                          </div>
                        </div>
                        {r.wasOnTime !== null && (
                          <div className="text-[11px] text-muted-foreground">
                            Punctual: {r.wasOnTime ? "Yes" : "No"}
                          </div>
                        )}
                        {r.comment && (
                          <p className="text-foreground italic mt-1">&ldquo;{r.comment}&rdquo;</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    No ratings or reviews submitted for this ride yet.
                  </p>
                )}
              </div>

              {/* Safety Flags Section (Only if flags exist) */}
              {selectedItem.flags.length > 0 && (
                <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-4 space-y-2 text-orange-950 dark:text-orange-200">
                  <div className="flex items-center gap-2 font-semibold">
                    <ShieldAlert className="h-5 w-5 text-orange-600" />
                    <span>Safety Report / Flag Associated with this Ride</span>
                  </div>
                  {selectedItem.flags.map((f) => (
                    <div key={f.id} className="text-xs space-y-1 bg-background/60 p-2.5 rounded border">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground capitalize">Reason: {f.reason.replace(/_/g, " ")}</span>
                        <span className="text-muted-foreground">{new Date(f.createdAt).toLocaleString()}</span>
                      </div>
                      {f.description && <p className="text-muted-foreground italic">&ldquo;{f.description}&rdquo;</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Privacy Notice */}
              <div className="rounded border border-border/40 bg-muted/20 p-3 text-[11px] text-muted-foreground text-center">
                In-app chat transcripts between passenger and driver are private and excluded from audit records in compliance with user privacy standards.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end border-t px-6 py-3 bg-muted/10">
              <button
                onClick={() => setSelectedItem(null)}
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

