"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Stats = {
  totalUsers: number;
  totalDrivers: number;
  pendingDriverApprovals: number;
  activeBookings: number;
  openPosts: number;
  pendingFlags: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [users, drivers, pendingDrivers, bookings, posts, flags] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("role", "driver"),
          supabase
            .from("driver_details")
            .select("id", { count: "exact", head: true })
            .eq("review_status", "pending"),
          supabase
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .in("status", ["pending", "confirmed"]),
          supabase
            .from("posts")
            .select("id", { count: "exact", head: true })
            .eq("status", "open"),
          supabase
            .from("flags")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending"),
        ]);

      setStats({
        totalUsers: users.count ?? 0,
        totalDrivers: drivers.count ?? 0,
        pendingDriverApprovals: pendingDrivers.count ?? 0,
        activeBookings: bookings.count ?? 0,
        openPosts: posts.count ?? 0,
        pendingFlags: flags.count ?? 0,
      });
      setLoading(false);
    }
    load();
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
