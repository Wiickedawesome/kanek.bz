"use client";

import { AdminShell } from "@/components/admin/admin-shell";
import type { ReactNode } from "react";

export default function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
