"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  cancelAdminPost,
  getAdminContentData,
  getAdminActionErrorMessage,
  isAdminBackendConfigured,
} from "@/lib/admin-backend";
import { useResolveNames } from "@/lib/use-resolve-names";
import {
  Search,
  X,
  MapPin,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ArrowDown,
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
  created_at: string;
};

export default function ContentPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const adminOpsEnabled = isAdminBackendConfigured();

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getAdminContentData<Post, unknown>();
      setPosts(data.posts ?? []);
    } catch (error) {
      setLoadError(getAdminActionErrorMessage(error));
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const authorIds = useMemo(() => posts.map((p) => p.author_id), [posts]);
  const { userName } = useResolveNames(authorIds);

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
      const author = (userName(p.author_id) ?? "").toLowerCase();
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
  }, [posts, statusFilter, typeFilter, searchQuery, userName]);

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

      {/* Selected Post Detail Drawer / Card */}
      {selectedPost && (
        <div className="rounded-lg border bg-card p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-foreground">{selectedPost.title}</h3>
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor(
                    selectedPost.status
                  )}`}
                >
                  {selectedPost.status.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                <span>Post ID: {selectedPost.id}</span>
                <span>&bull;</span>
                <Link
                  href={`/admin/users?view=${selectedPost.author_id}`}
                  className="text-accent-blue hover:underline inline-flex items-center gap-1 font-sans"
                >
                  Author: {userName(selectedPost.author_id)}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
            <button
              onClick={() => setSelectedPost(null)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded border bg-muted/20 p-3 space-y-1">
              <span className="text-muted-foreground font-medium uppercase text-[10px]">Route</span>
              <div className="font-medium text-foreground flex items-center gap-1.5 pt-0.5">
                <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{selectedPost.origin_address ?? "Origin"}</span>
              </div>
              <div className="font-medium text-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                <span className="truncate">{selectedPost.dest_address ?? "Destination"}</span>
              </div>
            </div>

            <div className="rounded border bg-muted/20 p-3 space-y-1">
              <span className="text-muted-foreground font-medium uppercase text-[10px]">Pricing & Seats</span>
              <div className="font-bold text-foreground text-sm pt-0.5">
                {formatCents(selectedPost.price_cents)}
              </div>
              <div className="text-muted-foreground">
                Seats booked: <strong>{selectedPost.seats_filled ?? 0}</strong> / {selectedPost.seats_total ?? "—"}
              </div>
            </div>

            <div className="rounded border bg-muted/20 p-3 space-y-1">
              <span className="text-muted-foreground font-medium uppercase text-[10px]">Schedule</span>
              <div className="flex items-center gap-1.5 pt-0.5 text-foreground">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span>
                  {selectedPost.departure_at
                    ? new Date(selectedPost.departure_at).toLocaleString()
                    : "No departure time"}
                </span>
              </div>
              <div className="text-muted-foreground">
                Published: {new Date(selectedPost.created_at).toLocaleDateString()}
              </div>
            </div>

            <div className="rounded border bg-muted/20 p-3 space-y-1">
              <span className="text-muted-foreground font-medium uppercase text-[10px]">Post Type</span>
              <div className="font-medium capitalize text-foreground pt-0.5">
                {selectedPost.type.replace(/_/g, " ")}
              </div>
              <div className="pt-1">
                <Link
                  href={`/admin/bookings?q=${selectedPost.id}`}
                  className="text-xs text-accent-blue hover:underline inline-flex items-center gap-1"
                >
                  View Bookings for Post <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          {selectedPost.description && (
            <div className="pt-2 border-t text-xs">
              <span className="text-muted-foreground font-medium">Description:</span>
              <p className="mt-1 text-foreground whitespace-pre-wrap">{selectedPost.description}</p>
            </div>
          )}

          {selectedPost.status !== "cancelled" && (
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <span>Moderation: cancelling will close this listing from the public feed.</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  void removePost(selectedPost.id);
                }}
                disabled={!adminOpsEnabled || actionLoading === selectedPost.id}
                className="rounded-md bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
              >
                {actionLoading === selectedPost.id ? "Removing..." : "Remove Post"}
              </button>
            </div>
          )}
        </div>
      )}

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
                <th className="px-3 py-2.5 text-left font-semibold">Departure</th>
                <th className="px-3 py-2.5 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPosts.map((p) => {
                const isSelected = selectedPost?.id === p.id;
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedPost(isSelected ? null : p)}
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
                      <div className="font-medium text-foreground">{userName(p.author_id)}</div>
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
                    <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                      {p.departure_at ? (
                        <div>
                          <div>{new Date(p.departure_at).toLocaleDateString()}</div>
                          <div>
                            {new Date(p.departure_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      ) : (
                        <span className="italic">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {p.status !== "cancelled" ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void removePost(p.id);
                          }}
                          disabled={!adminOpsEnabled || actionLoading === p.id}
                          className="rounded-md bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
                        >
                          {actionLoading === p.id ? "…" : "Remove"}
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Cancelled</span>
                      )}
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
    </div>
  );
}
