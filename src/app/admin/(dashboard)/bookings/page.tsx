"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  X,
  ArrowRight,
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
} from "lucide-react";
import {
  getAdminActionErrorMessage,
  getAdminBookingsData,
  type BookingAuditItem,
} from "@/lib/admin-backend";

type Tab = "audit" | "raw-bookings" | "raw-contracts";

type RawBooking = {
  id: string;
  post_id: string;
  user_id: string;
  role: string;
  status: string;
  seats_booked: number;
  payment_method: string | null;
  created_at: string;
};

type RawContract = {
  id: string;
  booking_id: string | null;
  origin_address: string | null;
  dest_address: string | null;
  agreed_price_cents: number | null;
  status: string;
  created_at: string;
};

export default function BookingsPage() {
  const [tab, setTab] = useState<Tab>("audit");
  const [auditItems, setAuditItems] = useState<BookingAuditItem[]>([]);
  const [rawBookings, setRawBookings] = useState<RawBooking[]>([]);
  const [rawContracts, setRawContracts] = useState<RawContract[]>([]);
  const [selectedItem, setSelectedItem] = useState<BookingAuditItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getAdminBookingsData<RawBooking, RawContract>();
      setAuditItems(data.auditItems ?? []);
      setRawBookings(data.bookings ?? []);
      setRawContracts(data.contracts ?? []);
    } catch (error) {
      setLoadError(getAdminActionErrorMessage(error));
      setAuditItems([]);
      setRawBookings([]);
      setRawContracts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /* ── Filtered Audit Items ── */
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
        if (statusFilter === "disputed" && s !== "disputed" && item.flags.length === 0) return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const driverName = (item.driver?.name ?? "").toLowerCase();
      const driverPhone = (item.driver?.phone ?? "").toLowerCase();
      const driverPlate = (item.driver?.vehicle?.plate ?? "").toLowerCase();
      const riderName = (item.rider?.name ?? "").toLowerCase();
      const riderPhone = (item.rider?.phone ?? "").toLowerCase();
      const origin = (item.originAddress ?? "").toLowerCase();
      const dest = (item.destAddress ?? "").toLowerCase();
      const bookingId = (item.bookingId ?? "").toLowerCase();
      const contractId = (item.contractId ?? "").toLowerCase();

      return (
        driverName.includes(q) ||
        driverPhone.includes(q) ||
        driverPlate.includes(q) ||
        riderName.includes(q) ||
        riderPhone.includes(q) ||
        origin.includes(q) ||
        dest.includes(q) ||
        bookingId.includes(q) ||
        contractId.includes(q)
      );
    });
  }, [auditItems, searchQuery, statusFilter]);

  /* ── Summary Metrics ── */
  const metrics = useMemo(() => {
    const total = auditItems.length;
    let completed = 0;
    let inProgress = 0;
    let pending = 0;
    let cancelled = 0;
    let disputed = 0;

    for (const item of auditItems) {
      const s = item.status.toLowerCase();
      if (s === "completed") completed++;
      else if (s === "active" || s === "confirmed") inProgress++;
      else if (s === "pending") pending++;
      else if (s === "cancelled" || s === "no_show" || s === "rejected") cancelled++;
      if (s === "disputed" || item.flags.length > 0) disputed++;
    }

    return { total, completed, inProgress, pending, cancelled, disputed };
  }, [auditItems]);

  const formatCents = (cents: number | null) =>
    cents !== null ? `$${(cents / 100).toFixed(2)} BZD` : "—";

  const getStatusBadge = (status: string, hasFlags = false) => {
    const s = status.toLowerCase();
    let bg = "bg-muted text-muted-foreground";
    let label = status.replace(/_/g, " ");

    if (hasFlags || s === "disputed") {
      bg = "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      label = s === "disputed" ? "Disputed" : `${label} (Flagged)`;
    } else if (s === "completed") {
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

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-lg border bg-card p-3 shadow-xs">
          <div className="text-xs font-medium text-muted-foreground">Total Rides</div>
          <div className="mt-1 text-2xl font-bold tracking-tight">{metrics.total}</div>
        </div>
        <div className="rounded-lg border bg-card p-3 shadow-xs">
          <div className="text-xs font-medium text-blue-600 dark:text-blue-400">In Progress</div>
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
        <div className="rounded-lg border bg-card p-3 shadow-xs">
          <div className="text-xs font-medium text-orange-600 dark:text-orange-400">Disputed</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-orange-600 dark:text-orange-400">
            {metrics.disputed}
          </div>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg border p-1 self-start">
          <button
            onClick={() => setTab("audit")}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              tab === "audit"
                ? "bg-accent-green text-white font-medium"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Auditable Rides ({auditItems.length})
          </button>
          <button
            onClick={() => setTab("raw-bookings")}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              tab === "raw-bookings"
                ? "bg-accent-green text-white font-medium"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Raw Bookings ({rawBookings.length})
          </button>
          <button
            onClick={() => setTab("raw-contracts")}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              tab === "raw-contracts"
                ? "bg-accent-green text-white font-medium"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Raw Contracts ({rawContracts.length})
          </button>
        </div>

        {tab === "audit" && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search driver, rider, route, ID..."
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress / Active</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="disputed">Disputed / Flagged</option>
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg border bg-muted/40" />
          ))}
        </div>
      ) : (
        <>
          {/* AUDITABLE RIDES VIEW */}
          {tab === "audit" && (
            <div className="overflow-x-auto rounded-lg border bg-card shadow-xs">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2.5 text-left font-semibold">Ride ID</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Driver</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Rider</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Route</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Fare & Seats</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Status</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Date</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredAuditItems.map((item) => {
                    const isSelected = selectedItem?.id === item.id;
                    const hasFlags = item.flags.length > 0;
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
                          {item.contractId && item.bookingId && (
                            <div className="text-[10px] text-muted-foreground font-mono">
                              C: {item.contractId.slice(0, 8)}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {item.driver ? (
                            <div>
                              <div className="font-medium text-foreground">{item.driver.name}</div>
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
                            <span className="text-xs text-muted-foreground italic">Unassigned / None</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {item.rider ? (
                            <div>
                              <div className="font-medium text-foreground">{item.rider.name}</div>
                              {item.rider.phone && (
                                <div className="text-xs text-muted-foreground">{item.rider.phone}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Unknown</span>
                          )}
                        </td>
                        <td className="px-3 py-3 max-w-[220px]">
                          <div className="truncate font-medium text-foreground" title={item.originAddress ?? ""}>
                            {item.originAddress ?? "Origin"}
                          </div>
                          <div className="truncate text-xs text-muted-foreground" title={item.destAddress ?? ""}>
                            &darr; {item.destAddress ?? "Destination"}
                          </div>
                        </td>
                        <td className="px-3 py-3 tabular-nums">
                          <div className="font-semibold text-foreground">
                            {formatCents(item.agreedPriceCents)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.seatsBooked} seat{item.seatsBooked > 1 ? "s" : ""}{" "}
                            {item.paymentMethod && (
                              <span className="uppercase text-[10px] font-medium bg-muted px-1 py-0.2 rounded">
                                {item.paymentMethod}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          {getStatusBadge(item.status, hasFlags)}
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                          <div>{new Date(item.createdAt).toLocaleDateString()}</div>
                          <div>{new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-blue hover:underline">
                            Audit <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAuditItems.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                        {searchQuery
                          ? "No rides match your search criteria."
                          : "No ride audit records found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* RAW BOOKINGS TAB */}
          {tab === "raw-bookings" && (
            <div className="overflow-x-auto rounded-lg border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                    <th className="px-3 py-2 text-left font-medium">ID</th>
                    <th className="px-3 py-2 text-left font-medium">Post ID</th>
                    <th className="px-3 py-2 text-left font-medium">User ID</th>
                    <th className="px-3 py-2 text-left font-medium">Role</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-left font-medium">Seats</th>
                    <th className="px-3 py-2 text-left font-medium">Payment</th>
                    <th className="px-3 py-2 text-left font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rawBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-muted/30">
                      <td className="px-3 py-2 font-mono text-xs">{b.id.slice(0, 8)}</td>
                      <td className="px-3 py-2 font-mono text-xs">{b.post_id?.slice(0, 8)}</td>
                      <td className="px-3 py-2 font-mono text-xs">{b.user_id?.slice(0, 8)}</td>
                      <td className="px-3 py-2 capitalize">{b.role}</td>
                      <td className="px-3 py-2">{getStatusBadge(b.status)}</td>
                      <td className="px-3 py-2 tabular-nums">{b.seats_booked}</td>
                      <td className="px-3 py-2">{b.payment_method ?? "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {rawBookings.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                        No raw bookings found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* RAW CONTRACTS TAB */}
          {tab === "raw-contracts" && (
            <div className="overflow-x-auto rounded-lg border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                    <th className="px-3 py-2 text-left font-medium">ID</th>
                    <th className="px-3 py-2 text-left font-medium">Booking ID</th>
                    <th className="px-3 py-2 text-left font-medium">Route</th>
                    <th className="px-3 py-2 text-left font-medium">Price</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-left font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rawContracts.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30">
                      <td className="px-3 py-2 font-mono text-xs">{c.id.slice(0, 8)}</td>
                      <td className="px-3 py-2 font-mono text-xs">{c.booking_id ? c.booking_id.slice(0, 8) : "—"}</td>
                      <td className="px-3 py-2 max-w-[200px] truncate">{c.origin_address ?? "?"} &rarr; {c.dest_address ?? "?"}</td>
                      <td className="px-3 py-2 tabular-nums">{formatCents(c.agreed_price_cents)}</td>
                      <td className="px-3 py-2">{getStatusBadge(c.status)}</td>
                      <td className="px-3 py-2 text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {rawContracts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                        No raw contracts found.
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
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-foreground">
                      Ride Audit Record
                    </h3>
                    {getStatusBadge(selectedItem.status, selectedItem.flags.length > 0)}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 font-mono">
                    <span>Booking: {selectedItem.bookingId ?? "N/A"}</span>
                    {selectedItem.contractId && (
                      <span>&bull; Contract: {selectedItem.contractId}</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Close audit panel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Dispute / Flags Banner */}
              {selectedItem.flags.length > 0 && (
                <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-4 space-y-2 text-orange-950 dark:text-orange-200">
                  <div className="flex items-center gap-2 font-semibold">
                    <ShieldAlert className="h-5 w-5 text-orange-600" />
                    <span>Active Dispute / Flag Registered for this Ride</span>
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

                  {selectedItem.driver ? (
                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {selectedItem.driver.name}
                        </div>
                        <div className="text-muted-foreground">{selectedItem.driver.email ?? "No email"}</div>
                        <div className="text-muted-foreground">{selectedItem.driver.phone ?? "No phone"}</div>
                      </div>

                      {/* Vehicle specs */}
                      <div className="rounded border bg-card p-2.5 space-y-1 mt-2">
                        <div className="font-semibold text-foreground text-[11px] uppercase tracking-wider text-muted-foreground">
                          Vehicle Information
                        </div>
                        {selectedItem.driver.vehicle ? (
                          <div className="space-y-0.5">
                            <div>
                              <strong>Vehicle:</strong> {selectedItem.driver.vehicle.year ?? ""}{" "}
                              {selectedItem.driver.vehicle.make ?? ""}{" "}
                              {selectedItem.driver.vehicle.model ?? ""}
                            </div>
                            <div>
                              <strong>Color:</strong> {selectedItem.driver.vehicle.color ?? "—"}
                            </div>
                            <div>
                              <strong>Plate:</strong>{" "}
                              <span className="font-mono font-bold text-foreground">
                                {selectedItem.driver.vehicle.plate ?? "—"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-muted-foreground italic">No vehicle details registered.</p>
                        )}
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-3 pt-1 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          <span className="font-medium text-foreground">
                            {selectedItem.driver.ratingAvg?.toFixed(1) ?? "New"}
                          </span>
                        </div>
                        {selectedItem.driver.punctualityPct !== null && (
                          <div>Punctuality: {selectedItem.driver.punctualityPct}%</div>
                        )}
                      </div>
                    </div>
                  ) : (
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

                  {selectedItem.rider ? (
                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {selectedItem.rider.name}
                        </div>
                        <div className="text-muted-foreground">{selectedItem.rider.email ?? "No email"}</div>
                        <div className="text-muted-foreground">{selectedItem.rider.phone ?? "No phone"}</div>
                      </div>

                      <div className="rounded border bg-card p-2.5 space-y-1 mt-2">
                        <div className="font-semibold text-foreground text-[11px] uppercase tracking-wider text-muted-foreground">
                          Emergency Contact
                        </div>
                        <div>
                          {selectedItem.rider.emergencyContact ?? (
                            <span className="text-muted-foreground italic">None on file</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-1 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          <span className="font-medium text-foreground">
                            {selectedItem.rider.ratingAvg?.toFixed(1) ?? "New"}
                          </span>
                        </div>
                        {selectedItem.rider.accountStatus && (
                          <div className="capitalize">
                            Status: <strong>{selectedItem.rider.accountStatus}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
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
                  </div>
                </div>

                <div className="rounded-lg border bg-card p-4 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Financial & Payment Audit
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
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
