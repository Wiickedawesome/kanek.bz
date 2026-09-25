import type { Metadata } from "next";
import { AuthProvider } from "@/components/admin/auth-provider";
import type { ReactNode } from "react";

// The admin frontend is static files served publicly. Keep it out of search
// indexes entirely — robots.txt alone is only advisory.
export const metadata: Metadata = {
  title: "Kanek Admin",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
