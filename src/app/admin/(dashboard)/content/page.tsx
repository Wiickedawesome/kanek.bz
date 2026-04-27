"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  cancelAdminPost,
  getAdminContentData,
  getAdminActionErrorMessage,
  isAdminBackendConfigured,
} from "@/lib/admin-backend";
import { useResolveNames } from "@/lib/use-resolve-names";

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

type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
};

type Tab = "posts" | "notifications";

export default function ContentPage() {
  const [tab, setTab] = useState<Tab>("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const adminOpsEnabled = isAdminBackendConfigured();

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getAdminContentData<Post, Notification>();
      setPosts(data.posts);
      setNotifications(data.notifications);
    } catch (error) {
      setLoadError(getAdminActionErrorMessage(error));
      setPosts([]);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const allUserIds = useMemo(() => [
    ...posts.map((p) => p.author_id),
    ...notifications.map((n) => n.user_id),
  ], [posts, notifications]);
  const { userName } = useResolveNames(allUserIds);

  const removePost = async (postId: string) => {
    if (!confirm("Remove this post? This will mark it as cancelled.")) return;
    setActionError(null);
    setActionLoading(postId);
    try {
      await cancelAdminPost(postId);
      await load();
    } catch (error) {
      setActionError(getAdminActionErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  const formatCents = (cents: number | null) =>
    cents !== null ? `$${(cents / 100).toFixed(2)}` : "—";

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

  return (
    <div className="space-y-4">
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
      <div className="flex gap-1 rounded-lg border p-1">
        {(["posts", "notifications"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSelectedPost(null); setSelectedNotification(null); }}
            className={`rounded-md px-3 py-1.5 text-sm capitalize transition-colors ${
              tab === t
                ? "bg-accent-green text-white"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg border bg-muted/40" />
          ))}
        </div>
      ) : (
        <>
          {tab === "posts" && (
            <div className="space-y-4">
              {selectedPost && (
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{selectedPost.title}</h3>
                    <button onClick={() => setSelectedPost(null)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div><span className="text-muted-foreground">Post ID: </span><span className="font-mono text-xs">{selectedPost.id.slice(0, 8)}</span></div>
                    <div><span className="text-muted-foreground">Author: </span>{userName(selectedPost.author_id)}</div>
                    <div><span className="text-muted-foreground">Type: </span><span className="capitalize">{selectedPost.type.replace(/_/g, " ")}</span></div>
                    <div><span className="text-muted-foreground">Status: </span><span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(selectedPost.status)}`}>{selectedPost.status.replace(/_/g, " ")}</span></div>
                    <div><span className="text-muted-foreground">Route: </span>{selectedPost.origin_address ?? "?"} → {selectedPost.dest_address ?? "?"}</div>
                    <div><span className="text-muted-foreground">Price: </span>{formatCents(selectedPost.price_cents)}</div>
                    <div><span className="text-muted-foreground">Seats: </span>{selectedPost.seats_filled ?? 0}/{selectedPost.seats_total ?? "—"}</div>
                    <div><span className="text-muted-foreground">Departure: </span>{selectedPost.departure_at ? new Date(selectedPost.departure_at).toLocaleString() : "—"}</div>
                    <div><span className="text-muted-foreground">Created: </span>{new Date(selectedPost.created_at).toLocaleString()}</div>
                  </div>
                  {selectedPost.description && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="text-sm mt-1">{selectedPost.description}</p>
                    </div>
                  )}
                  {selectedPost.status !== "cancelled" && (
                    <div className="pt-2 border-t">
                      <button
                        onClick={(e) => { e.stopPropagation(); removePost(selectedPost.id); }}
                        disabled={!adminOpsEnabled || actionLoading === selectedPost.id}
                        className="rounded-md bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
                      >
                        {actionLoading === selectedPost.id ? "…" : "Remove Post"}
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-3 py-2 text-left font-medium">Title</th>
                    <th className="px-3 py-2 text-left font-medium">Type</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-left font-medium">Route</th>
                    <th className="px-3 py-2 text-left font-medium">Price</th>
                    <th className="px-3 py-2 text-left font-medium">Seats</th>
                    <th className="px-3 py-2 text-left font-medium">Created</th>
                    <th className="px-3 py-2 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedPost(selectedPost?.id === p.id ? null : p)}
                      className={`cursor-pointer border-b transition-colors hover:bg-muted/30 ${selectedPost?.id === p.id ? "bg-muted/40" : ""}`}
                    >
                      <td className="px-3 py-2 max-w-[180px] truncate font-medium">
                        {p.title}
                      </td>
                      <td className="px-3 py-2">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                          {p.type.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(p.status)}`}
                        >
                          {p.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-3 py-2 max-w-[150px] truncate text-muted-foreground">
                        {p.origin_address ?? "?"} → {p.dest_address ?? "?"}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {formatCents(p.price_cents)}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {p.seats_filled ?? 0}/{p.seats_total ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2">
                        {p.status !== "cancelled" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); removePost(p.id); }}
                            disabled={!adminOpsEnabled || actionLoading === p.id}
                            className="rounded-md bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
                          >
                            {actionLoading === p.id ? "…" : "Remove"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {posts.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                        No posts found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            </div>
          )}
          {tab === "notifications" && (
            <div className="space-y-4">
              {selectedNotification && (
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{selectedNotification.title}</h3>
                    <button onClick={() => setSelectedNotification(null)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div><span className="text-muted-foreground">Notification ID: </span><span className="font-mono text-xs">{selectedNotification.id.slice(0, 8)}</span></div>
                    <div><span className="text-muted-foreground">User: </span>{userName(selectedNotification.user_id)}</div>
                    <div><span className="text-muted-foreground">Type: </span>{selectedNotification.type}</div>
                    <div><span className="text-muted-foreground">Read: </span>{selectedNotification.read ? "Yes" : "No"}</div>
                    <div><span className="text-muted-foreground">Created: </span>{new Date(selectedNotification.created_at).toLocaleString()}</div>
                  </div>
                  {selectedNotification.body && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">Body</p>
                      <p className="text-sm mt-1">{selectedNotification.body}</p>
                    </div>
                  )}
                </div>
              )}
              <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-3 py-2 text-left font-medium">Title</th>
                    <th className="px-3 py-2 text-left font-medium">Type</th>
                    <th className="px-3 py-2 text-left font-medium">User</th>
                    <th className="px-3 py-2 text-left font-medium">Read</th>
                    <th className="px-3 py-2 text-left font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((n) => (
                    <tr
                      key={n.id}
                      onClick={() => setSelectedNotification(selectedNotification?.id === n.id ? null : n)}
                      className={`cursor-pointer border-b transition-colors hover:bg-muted/30 ${selectedNotification?.id === n.id ? "bg-muted/40" : ""}`}
                    >
                      <td className="px-3 py-2 max-w-[200px]">
                        <div className="font-medium truncate">{n.title}</div>
                        {n.body && (
                          <div className="text-xs text-muted-foreground truncate">
                            {n.body}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                          {n.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {userName(n.user_id)}
                      </td>
                      <td className="px-3 py-2">
                        {n.read ? (
                          <span className="text-muted-foreground">✓</span>
                        ) : (
                          <span className="text-accent-green font-medium">New</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(n.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {notifications.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                        No notifications found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
