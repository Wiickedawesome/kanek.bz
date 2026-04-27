"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminGuard } from "@/components/admin/admin-guard";
import { useAuth } from "@/components/admin/auth-provider";
import {
  getAdminBackendStatusMessage,
  isAdminBackendConfigured,
} from "@/lib/admin-backend";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  FileText,
  Shield,
  DollarSign,
  MapPin,
  LogOut,
  Menu,
} from "lucide-react";
import { useState, type ReactNode } from "react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/moderation", label: "Moderation", icon: Shield },
  { href: "/admin/finance", label: "Finance", icon: DollarSign },
  { href: "/admin/community", label: "Community", icon: MapPin },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { signOut, profile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const adminBackendConfigured = isAdminBackendConfigured();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const sidebar = (
    <nav className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center border-b border-sidebar-border px-4 font-bold tracking-tight">
        Kanek Admin
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
              isActive(href)
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </div>

      <div className="border-t border-sidebar-border p-4">
        <div className="mb-2 truncate text-xs text-sidebar-foreground/60">
          {profile?.email ?? "Admin"}
        </div>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <AdminGuard>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden w-56 shrink-0 border-r border-sidebar-border md:block">
          {sidebar}
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="relative z-10 h-full w-56">{sidebar}</aside>
          </div>
        )}

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top bar */}
          <header className="flex h-14 items-center gap-3 border-b px-4 md:px-6">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-sm font-medium">
              {NAV.find((n) => isActive(n.href))?.label ?? "Admin"}
            </h1>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {!adminBackendConfigured && (
              <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-900 dark:text-yellow-200">
                {getAdminBackendStatusMessage()}
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
