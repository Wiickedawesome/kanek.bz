"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getAdminActionErrorMessage,
  getAdminDashboardStats,
  type AdminDashboardStats,
} from "@/lib/admin-backend";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoadError(null);
      try {
        setStats(await getAdminDashboardStats());
      } catch (error) {
        setLoadError(getAdminActionErrorMessage(error));
        setStats(null);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-lg border bg-muted/40"
          />
        ))}
      </div>
    );
  }

  if (!stats) return <p className="text-muted-foreground">Failed to load stats.</p>;

  const cards: { label: string; value: number; href?: string }[] = [
    { label: "Total Users", value: stats.totalUsers, href: "/admin/users" },
    { label: "Drivers", value: stats.totalDrivers, href: "/admin/users" },
    {
      label: "Pending Driver Approvals",
      value: stats.pendingDriverApprovals,
      href: "/admin/users?tab=drivers",
    },
    {
      label: "Active Bookings",
      value: stats.activeBookings,
      href: "/admin/bookings",
    },
    { label: "Open Posts", value: stats.openPosts, href: "/admin/content" },
    {
      label: "Pending Flags",
      value: stats.pendingFlags,
      href: "/admin/moderation",
    },
  ];

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      )}
      <h2 className="text-lg font-semibold">Overview</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href ?? "#"}
            className="rounded-lg border bg-card p-5 transition-colors hover:bg-accent/40"
          >
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className="mt-1 text-3xl font-bold tabular-nums">{c.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
