"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/admin/auth-provider";
import { useEffect } from "react";

export default function AdminLoginPage() {
  const { sendOtp, verifyOtp, loading, isAdmin, user, profile } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAdmin) {
      router.replace("/admin");
    }
  }, [loading, isAdmin, router]);

  // Handle: authenticated but not admin
   
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- auth state sync, not a cascading render */
    if (!loading && user && profile && !isAdmin) {
      setError(
        `Signed in as ${profile.email ?? user.email}, but this account does not have admin access (role: ${profile.role}).`
      );
      setSubmitting(false);
    }
    // Authenticated but profile is null (RLS blocked or no profile row)
    if (!loading && user && profile === null && step === "code") {
      setError(
        "Signed in but could not load your profile. Check RLS policies on the profiles table."
      );
      setSubmitting(false);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [loading, user, profile, isAdmin, step]);

  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: err } = await sendOtp(email);
    if (err) {
      setError(err);
      setSubmitting(false);
      return;
    }
    setStep("code");
    setSubmitting(false);
  };

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: err } = await verifyOtp(email, otpCode);
    if (err) {
      setError(err);
      setSubmitting(false);
      return;
    }
    // Auth state change will trigger redirect via useEffect.
    // If not admin, the second useEffect above will catch it.
    // Safety timeout to unblock UI if nothing happens:
    setTimeout(() => setSubmitting(false), 5000);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-green border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Kanek Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === "email"
              ? "Enter your admin email to receive a login code"
              : `Code sent to ${email}`}
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {step === "email" ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-accent-green px-4 text-sm font-medium text-white transition-colors hover:bg-accent-green/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {submitting ? "Sending…" : "Send login code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="otp" className="text-sm font-medium">
                6-digit code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoComplete="one-time-code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-center text-lg font-mono tracking-[0.5em] ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="000000"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || otpCode.length !== 6}
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-accent-green px-4 text-sm font-medium text-white transition-colors hover:bg-accent-green/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {submitting ? "Verifying…" : "Verify & sign in"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("email");
                setOtpCode("");
                setError(null);
              }}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
