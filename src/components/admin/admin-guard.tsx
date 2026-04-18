"use client";

import { useAuth } from "@/components/admin/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { loading, isAdmin, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace("/admin/login");
    }
  }, [loading, user, isAdmin, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-green border-t-transparent" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return <>{children}</>;
}
