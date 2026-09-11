"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Bell,
  X,
  ArrowLeft,
  ArrowRight,
  Search,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import {
  declineAdminAccount,
  getAdminActionErrorMessage,
  getAdminUserDetail,
  getAdminUsersData,
  isAdminBackendConfigured,
  processAdminOnboardingReminders,
  resolveAdminDocumentUrl,
  reviewAdminDriverApplication,
  reviewAdminDriverDocument,
  reviewAdminRiderDocument,
  sendAdminUserReminder,
  updateAdminAccountStatus,
} from "@/lib/admin-backend";

const DRIVER_DECLINE_REASONS = [
  "Driver's License not approved (expired, unreadable, or invalid class)",
  "Vehicle Insurance not approved (expired, invalid policy, or name mismatch)",
  "Vehicle Registration / Certificate not approved (expired, plate mismatch, or unreadable)",
  "Government-Issued Photo ID not approved (blurry photo, expired, or invalid document)",
  "Vehicle details or photos not compliant with safety standards",
  "Documentation incomplete or illegible",
];

const RIDER_DECLINE_REASONS = [
  "Government-Issued Photo ID not approved (blurry photo, expired, or invalid document)",
  "Identification details mismatch with profile information",
  "Documentation incomplete, altered, or illegible",
  "Identity verification requirements not met",
];

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  account_status: string;
  rating_avg: number | null;
  punctuality_pct: number | null;
  strikes_soft: number;
  strikes_hard: number;
  created_at: string;
  last_active_at: string | null;
  district: string | null;
  address_line: string | null;
  emergency_contact: string | null;
  avatar_url: string | null;
};

type DriverDetail = {
  id: string;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  vehicle_plate: string | null;
  verified: boolean;
  review_status: string;
  rejection_reason: string | null;
  license_url: string | null;
  insurance_url: string | null;
  id_document_url: string | null;
};

type DriverDocument = {
  id: string;
  profile_id: string;
  document_type: string;
  document_url: string;
  document_number: string | null;
  expiration_date: string | null;
  review_status: string;
  rejection_reason: string | null;
};

type RiderDocument = {
  id: string;
  user_id: string;
  document_url: string;
  verified: boolean;
  review_status: string;
  rejection_reason: string | null;
};

type Tab = "all" | "drivers" | "pending-docs";

function getUserDisplayName(profile?: {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  id?: string;
} | null) {
  if (!profile) return "Unknown User";
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  if (name) return name;
  if (profile.email) return profile.email;
  if (profile.phone) return profile.phone;
  if (profile.id) return `User ${profile.id.slice(0, 8)}`;
  return "Unnamed User";
}

export default function UsersPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg border bg-muted/40" />
          ))}
        </div>
      }
    >
      <UsersPageInner />
    </Suspense>
  );
}

function UsersPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const viewUserId = searchParams.get("view");
  const initialTab = (searchParams.get("tab") as Tab) || "all";

  const [tab, setTab] = useState<Tab>(
    ["all", "drivers", "pending-docs"].includes(initialTab) ? initialTab : "all"
  );
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [driverDetails, setDriverDetails] = useState<DriverDetail[]>([]);
  const [driverDocs, setDriverDocs] = useState<DriverDocument[]>([]);
  const [riderDocs, setRiderDocs] = useState<RiderDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [documentLoading, setDocumentLoading] = useState<string | null>(null);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [selectedDeclineReasons, setSelectedDeclineReasons] = useState<string[]>([]);
  const [declineCustomNotes, setDeclineCustomNotes] = useState("");
  const [declineSubmitting, setDeclineSubmitting] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [sweepLoading, setSweepLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const adminOpsEnabled = isAdminBackendConfigured();

  /* ── Detail-view state (loaded when viewUserId is set) ── */
  const [detailProfile, setDetailProfile] = useState<Profile | null>(null);
  const [detailDriver, setDetailDriver] = useState<DriverDetail | null>(null);
  const [detailDriverDocs, setDetailDriverDocs] = useState<DriverDocument[]>([]);
  const [detailRiderDocs, setDetailRiderDocs] = useState<RiderDocument[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  /* ── List data loader ── */
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getAdminUsersData<
        Profile,
        DriverDetail,
        DriverDocument,
        RiderDocument
      >();
      setProfiles(data.profiles);
      setDriverDetails(data.driverDetails);
      setDriverDocs(data.driverDocs);
      setRiderDocs(data.riderDocs);
    } catch (error) {
      setLoadError(getAdminActionErrorMessage(error));
      setProfiles([]);
      setDriverDetails([]);
      setDriverDocs([]);
      setRiderDocs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Detail data loader ── */
  const loadDetail = useCallback(async (uid: string) => {
    setDetailLoading(true);
    setLoadError(null);
    try {
      const data = await getAdminUserDetail<
        Profile,
        DriverDetail,
        DriverDocument,
        RiderDocument
      >(uid);
      setDetailProfile(data.profile);
      setDetailDriver(data.driver);
      setDetailDriverDocs(data.driverDocs);
      setDetailRiderDocs(data.riderDocs);
    } catch (error) {
      setLoadError(getAdminActionErrorMessage(error));
      setDetailProfile(null);
      setDetailDriver(null);
      setDetailDriverDocs([]);
      setDetailRiderDocs([]);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewUserId) {
      loadDetail(viewUserId);
    } else {
      load();
    }
  }, [viewUserId, load, loadDetail]);

  /* ── Actions ── */
  const updateAccountStatus = async (userId: string, status: string) => {
    const label = status === "suspended" ? "suspend" : "reactivate";
    if (!confirm(`Are you sure you want to ${label} this user?`)) return;
    setActionError(null);
    setActionSuccess(null);
    setActionLoading("account");
    try {
      await updateAdminAccountStatus(userId, status);
      setActionSuccess(`User account status updated to ${status}.`);
      if (viewUserId) await loadDetail(viewUserId);
      else await load();
    } catch (error) {
      setActionError(getAdminActionErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenDeclineDialog = () => {
    setSelectedDeclineReasons([]);
    setDeclineCustomNotes("");
    setActionError(null);
    setActionSuccess(null);
    setDeclineDialogOpen(true);
  };

  const handleToggleDeclineReason = (reason: string) => {
    setSelectedDeclineReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const handleConfirmDecline = async () => {
    if (!detailProfile) return;
    if (selectedDeclineReasons.length === 0 && !declineCustomNotes.trim()) {
      setActionError("Please select at least one decline reason or provide reviewer notes.");
      return;
    }

    setActionError(null);
    setActionSuccess(null);
    setDeclineSubmitting(true);

    try {
      const result = await declineAdminAccount(
        detailProfile.id,
        selectedDeclineReasons,
        declineCustomNotes.trim() || undefined
      );

      setDeclineDialogOpen(false);

      if (result.emailSent) {
        setActionSuccess(
          `Account declined (status restricted). Notification email sent to ${detailProfile.email}.`
        );
      } else {
        setActionSuccess(
          `Account declined (status restricted). Note: ${
            result.emailError || "Notification email was not sent."
          }`
        );
      }

      if (viewUserId) {
        await loadDetail(viewUserId);
      } else {
        await load();
      }
    } catch (error) {
      setActionError(getAdminActionErrorMessage(error));
    } finally {
      setDeclineSubmitting(false);
    }
  };

  const handleSendReminder = async (userId: string) => {
    setActionError(null);
    setActionSuccess(null);
    setReminderLoading(true);
    try {
      const res = await sendAdminUserReminder(userId);
      const channels = [];
      if (res.emailSent) channels.push("Email");
      if (res.pushSent) channels.push("Push Notification");
      channels.push("In-App Notification");
      setActionSuccess(
        `Reminder sent successfully via ${channels.join(", ")} for missing document(s): ${res.missingDocs.join(", ")}.`
      );
    } catch (error) {
      setActionError(getAdminActionErrorMessage(error));
    } finally {
      setReminderLoading(false);
    }
  };

  const handleRunSweep = async () => {
    if (
      !confirm(
        "Run automated reminder sweep now? This will scan all pending accounts and dispatch 3-day and 15-day reminders to users with missing documents."
      )
    )
      return;
    setSweepLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await processAdminOnboardingReminders();
      setActionSuccess(
        `Reminder sweep complete: scanned ${res.scannedCount} pending user(s), sent ${res.day3Sent} 3-day reminder(s), and ${res.day15Sent} 15-day reminder(s).`
      );
    } catch (err) {
      setActionError(getAdminActionErrorMessage(err));
    } finally {
      setSweepLoading(false);
    }
  };

  const reviewDriverDetail = async (
    driverId: string,
    status: "approved" | "rejected",
    reason?: string
  ) => {
    if (!confirm(`${status === "approved" ? "Approve" : "Reject"} this driver application?`)) return;
    setActionError(null);
    setActionLoading("driver");
    try {
      await reviewAdminDriverApplication(driverId, status, reason);
      if (viewUserId) await loadDetail(viewUserId);
      else await load();
    } catch (error) {
      setActionError(getAdminActionErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  const reviewDriverDoc = async (
    docId: string,
    profileId: string,
    status: "approved" | "rejected",
    reason?: string
  ) => {
    if (!confirm(`${status === "approved" ? "Approve" : "Reject"} this driver document?`)) return;
    setActionError(null);
    setActionLoading(docId);
    try {
      await reviewAdminDriverDocument(docId, profileId, status, reason);
      if (viewUserId) await loadDetail(viewUserId);
      else await load();
    } catch (error) {
      setActionError(getAdminActionErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  const reviewRiderDoc = async (
    docId: string,
    userId: string,
    status: "approved" | "rejected",
    reason?: string
  ) => {
    if (!confirm(`${status === "approved" ? "Approve" : "Reject"} this rider document?`)) return;
    setActionError(null);
    setActionLoading(docId);
    try {
      await reviewAdminRiderDocument(docId, userId, status, reason);
      if (viewUserId) await loadDetail(viewUserId);
      else await load();
    } catch (error) {
      setActionError(getAdminActionErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  const previewDocument = async (documentRef: string | null, key: string) => {
    if (!documentRef) return;

    setActionError(null);
    setDocumentLoading(key);

    try {
      const secureUrl = await resolveAdminDocumentUrl(documentRef);
      if (!secureUrl) {
        throw new Error("Document URL could not be resolved.");
      }
      setPreviewUrl(secureUrl);
    } catch (error) {
      setActionError(getAdminActionErrorMessage(error));
    } finally {
      setDocumentLoading(null);
    }
  };

  const openDocument = async (documentRef: string | null, key: string) => {
    if (!documentRef) return;

    setActionError(null);
    setDocumentLoading(key);

    try {
      const secureUrl = await resolveAdminDocumentUrl(documentRef);
      if (!secureUrl) {
        throw new Error("Document URL could not be resolved.");
      }
      window.open(secureUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      setActionError(getAdminActionErrorMessage(error));
    } finally {
      setDocumentLoading(null);
    }
  };

  /* ════════════════════════════════════════════════════════
     DETAIL VIEW — when ?view=<userId> is in the URL
     ════════════════════════════════════════════════════════ */
  if (viewUserId) {
    if (detailLoading) {
      return (
        <div className="space-y-4">
          <div className="h-8 w-32 animate-pulse rounded bg-muted/40" />
          <div className="h-48 animate-pulse rounded-lg border bg-muted/40" />
          <div className="h-48 animate-pulse rounded-lg border bg-muted/40" />
        </div>
      );
    }

    if (!detailProfile) {
      return (
        <div className="space-y-4">
          <button
            onClick={() => router.push("/admin/users")}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Users</span>
          </button>
          {actionError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {actionError}
            </div>
          )}
          <p className="text-muted-foreground">User not found.</p>
        </div>
      );
    }

    const fullName = getUserDisplayName(detailProfile);

    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/admin/users")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Users</span>
        </button>

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

        {/* Profile header */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {detailProfile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={detailProfile.avatar_url}
                  alt={fullName}
                  className="h-14 w-14 rounded-full object-cover border"
                />
              ) : (
                <div className="h-14 w-14 rounded-full border bg-muted/60 flex items-center justify-center text-xl font-semibold text-muted-foreground select-none">
                  {(detailProfile.first_name?.[0] ?? detailProfile.email?.[0] ?? "?").toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold">{fullName}</h2>
                <p className="text-sm text-muted-foreground">{detailProfile.email}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs font-mono bg-muted/60 text-muted-foreground px-2 py-0.5 rounded border inline-flex items-center gap-1.5">
                    <span className="text-muted-foreground">User ID:</span>
                    <span className="text-foreground font-semibold select-all">{detailProfile.id}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(detailProfile.id);
                      setCopiedId(true);
                      setTimeout(() => setCopiedId(false), 2000);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-muted border border-border/60"
                    title="Copy User ID to clipboard"
                  >
                    {copiedId ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    <span className="text-[11px]">{copiedId ? "Copied" : "Copy ID"}</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge value={detailProfile.role} />
              <StatusBadge value={detailProfile.account_status} />
            </div>
          </div>

          <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <InfoField label="User ID (UUID)" value={detailProfile.id} />
            <InfoField label="Email" value={detailProfile.email ?? "—"} />
            <InfoField label="Phone" value={detailProfile.phone ?? "—"} />
            <InfoField label="Role" value={detailProfile.role} />
            <InfoField label="Status" value={detailProfile.account_status} />
            <InfoField label="Rating" value={detailProfile.rating_avg?.toFixed(1) ?? "—"} />
            <InfoField
              label="Punctuality"
              value={detailProfile.punctuality_pct != null ? `${detailProfile.punctuality_pct}%` : "—"}
            />
            <InfoField
              label="Strikes"
              value={`${detailProfile.strikes_soft} soft / ${detailProfile.strikes_hard} hard`}
            />
            <InfoField label="District" value={detailProfile.district ?? "—"} />
            <InfoField label="Address" value={detailProfile.address_line ?? "—"} />
            <InfoField label="Emergency Contact" value={detailProfile.emergency_contact ?? "—"} />
            <InfoField
              label="Last Active"
              value={
                detailProfile.last_active_at
                  ? new Date(detailProfile.last_active_at).toLocaleString()
                  : "—"
              }
            />
            <InfoField
              label="Joined"
              value={new Date(detailProfile.created_at).toLocaleDateString()}
            />
          </div>

          <div className="flex gap-2 pt-2 border-t flex-wrap items-center">
            {(detailProfile.account_status === "pending" || detailProfile.account_status === "restricted") && (
              <ActionButton
                variant="default"
                loading={actionLoading === "account"}
                disabled={!adminOpsEnabled}
                onClick={() => updateAccountStatus(detailProfile.id, "active")}
              >
                {detailProfile.account_status === "restricted" ? "Re-Approve Account" : "Approve Account"}
              </ActionButton>
            )}
            {detailProfile.account_status === "pending" && (
              <ActionButton
                variant="warning"
                loading={declineSubmitting}
                disabled={!adminOpsEnabled}
                onClick={handleOpenDeclineDialog}
              >
                Decline Account
              </ActionButton>
            )}
            {(detailProfile.account_status === "pending" ||
              (detailProfile.role === "driver" && !detailDriver)) && (
              <ActionButton
                variant="info"
                loading={reminderLoading}
                disabled={!adminOpsEnabled}
                onClick={() => handleSendReminder(detailProfile.id)}
              >
                Send Reminder
              </ActionButton>
            )}
            {detailProfile.account_status !== "suspended" ? (
              <ActionButton
                variant="destructive"
                loading={actionLoading === "account"}
                disabled={!adminOpsEnabled}
                onClick={() => updateAccountStatus(detailProfile.id, "suspended")}
              >
                Suspend User
              </ActionButton>
            ) : (
              <ActionButton
                variant="default"
                loading={actionLoading === "account"}
                disabled={!adminOpsEnabled}
                onClick={() => updateAccountStatus(detailProfile.id, "active")}
              >
                Unsuspend User
              </ActionButton>
            )}
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push(`/admin/content?q=${detailProfile.id}`)}
                className="rounded-md px-2.5 py-1 text-xs font-medium transition-colors inline-flex items-center justify-center gap-1.5 min-h-[26px] bg-muted hover:bg-muted/80 text-foreground border border-input"
                title="View marketplace listings authored by this user"
              >
                <span>View Listings</span>
                <ArrowRight className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => router.push(`/admin/bookings?q=${detailProfile.id}`)}
                className="rounded-md px-2.5 py-1 text-xs font-medium transition-colors inline-flex items-center justify-center gap-1.5 min-h-[26px] bg-muted hover:bg-muted/80 text-foreground border border-input"
                title="View bookings and contracts involving this user"
              >
                <span>View Bookings</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Driver details prompt when driver hasn't submitted application */}
        {detailProfile.role === "driver" && !detailDriver && (
          <div className="rounded-lg border bg-card p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Driver Details</h3>
              <StatusBadge value="pending_setup" />
            </div>
            <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
              <p className="font-semibold">No vehicle details or driver documents submitted yet.</p>
              <p className="text-xs mt-1 text-amber-700 dark:text-amber-400">
                This user has the &quot;driver&quot; role, but has not completed vehicle registration and document upload in the mobile app.
              </p>
            </div>
          </div>
        )}

        {/* Driver details */}
        {detailDriver && (
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Driver Details</h3>
              <StatusBadge value={detailDriver.review_status} />
            </div>

            <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <InfoField
                label="Vehicle"
                value={
                  [detailDriver.vehicle_year, detailDriver.vehicle_make, detailDriver.vehicle_model]
                    .filter(Boolean)
                    .join(" ") || "—"
                }
              />
              <InfoField label="License Plate" value={detailDriver.vehicle_plate ?? "—"} />
              <InfoField label="Verified" value={detailDriver.verified ? "Yes" : "No"} />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Documents on File</h4>
              <div className="grid gap-3 sm:grid-cols-3">
                <DocCard
                  label="Driver License"
                  documentRef={
                    detailDriver.license_url ??
                    detailDriverDocs.find((d) => d.document_type === "drivers_license")?.document_url ?? null
                  }
                  disabled={!adminOpsEnabled}
                  loading={documentLoading === "driver-license"}
                  onPreview={(documentRef) => previewDocument(documentRef, "driver-license")}
                />
                <DocCard
                  label="Insurance"
                  documentRef={
                    detailDriver.insurance_url ??
                    detailDriverDocs.find((d) => d.document_type === "vehicle_insurance")?.document_url ?? null
                  }
                  disabled={!adminOpsEnabled}
                  loading={documentLoading === "driver-insurance"}
                  onPreview={(documentRef) => previewDocument(documentRef, "driver-insurance")}
                />
                <DocCard
                  label="Vehicle Registration"
                  documentRef={
                    detailDriver.id_document_url ??
                    detailDriverDocs.find((d) => d.document_type === "vehicle_registration")?.document_url ?? null
                  }
                  disabled={!adminOpsEnabled}
                  loading={documentLoading === "driver-reg"}
                  onPreview={(documentRef) => previewDocument(documentRef, "driver-reg")}
                />
              </div>
            </div>

            {detailDriver.rejection_reason && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <span className="font-medium">Rejection Reason:</span> {detailDriver.rejection_reason}
              </div>
            )}

            {detailDriver.review_status === "pending" && (() => {
              const hasDocs = detailDriverDocs.length > 0;
              const allDocsApproved = hasDocs
                ? detailDriverDocs.every((d) => d.review_status === "approved")
                : Boolean(detailDriver.license_url && detailDriver.insurance_url);
              const approvedCount = detailDriverDocs.filter((d) => d.review_status === "approved").length;

              return (
                <div className="space-y-2 pt-2 border-t">
                  {!allDocsApproved && hasDocs && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      All driver documents must be approved before the driver can be approved.
                      ({approvedCount}/{detailDriverDocs.length} approved)
                    </p>
                  )}
                  <div className="flex gap-2">
                    <ActionButton
                      variant="default"
                      loading={actionLoading === "driver"}
                      disabled={!adminOpsEnabled || !allDocsApproved}
                      onClick={() => reviewDriverDetail(detailDriver.id, "approved")}
                    >
                      Approve Driver
                    </ActionButton>
                    <ActionButton
                      variant="destructive"
                      loading={actionLoading === "driver"}
                      disabled={!adminOpsEnabled}
                      onClick={() => {
                        const reason = prompt("Rejection reason:");
                        if (reason !== null) reviewDriverDetail(detailDriver.id, "rejected", reason);
                      }}
                    >
                      Reject Driver
                    </ActionButton>
                  </div>
                </div>
              );
            })()}
            {detailDriver.review_status === "rejected" && (
              <div className="flex gap-2 pt-2 border-t">
                <ActionButton
                  variant="default"
                  loading={actionLoading === "driver"}
                  disabled={!adminOpsEnabled}
                  onClick={() => reviewDriverDetail(detailDriver.id, "approved")}
                >
                  Re-approve Driver
                </ActionButton>
              </div>
            )}
          </div>
        )}

        {/* Driver documents */}
        {detailDriverDocs.length > 0 && (
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <h3 className="text-lg font-semibold">Driver Documents</h3>
            <div className="space-y-3">
              {detailDriverDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm capitalize">
                        {doc.document_type.replace(/_/g, " ")}
                      </span>
                      <StatusBadge value={doc.review_status} />
                    </div>
                    <div className="text-xs text-muted-foreground space-x-3">
                      {doc.document_number && <span>#{doc.document_number}</span>}
                      {doc.expiration_date && (
                        <span>Exp: {new Date(doc.expiration_date).toLocaleDateString()}</span>
                      )}
                    </div>
                    {doc.rejection_reason && (
                      <p className="text-xs text-destructive">Rejected: {doc.rejection_reason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => previewDocument(doc.document_url, `driver-doc-${doc.id}`)}
                      disabled={!adminOpsEnabled || documentLoading === `driver-doc-${doc.id}`}
                      className="rounded-md bg-muted px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted/80 disabled:opacity-50"
                    >
                      {documentLoading === `driver-doc-${doc.id}` ? "Opening…" : "Preview"}
                    </button>
                    <button
                      onClick={() => openDocument(doc.document_url, `driver-doc-open-${doc.id}`)}
                      disabled={!adminOpsEnabled || documentLoading === `driver-doc-open-${doc.id}`}
                      className="rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-accent-blue transition-colors hover:bg-muted/80 disabled:opacity-50"
                    >
                      {documentLoading === `driver-doc-open-${doc.id}` ? "Opening…" : "Open"}
                    </button>
                    {doc.review_status === "pending" && (
                      <>
                        <ActionButton
                          variant="default"
                          loading={actionLoading === doc.id}
                          disabled={!adminOpsEnabled}
                          onClick={() => reviewDriverDoc(doc.id, doc.profile_id, "approved")}
                        >
                          Approve
                        </ActionButton>
                        <ActionButton
                          variant="destructive"
                          loading={actionLoading === doc.id}
                          disabled={!adminOpsEnabled}
                          onClick={() => {
                            const reason = prompt("Rejection reason:");
                            if (reason !== null)
                              reviewDriverDoc(doc.id, doc.profile_id, "rejected", reason);
                          }}
                        >
                          Reject
                        </ActionButton>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rider documents */}
        {detailRiderDocs.length > 0 && (
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <h3 className="text-lg font-semibold">Rider Documents</h3>
            <div className="space-y-3">
              {detailRiderDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">ID Document</span>
                    <StatusBadge value={doc.review_status} />
                    {doc.rejection_reason && (
                      <span className="text-xs text-destructive">— {doc.rejection_reason}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => previewDocument(doc.document_url, `rider-doc-${doc.id}`)}
                      disabled={!adminOpsEnabled || documentLoading === `rider-doc-${doc.id}`}
                      className="rounded-md bg-muted px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted/80 disabled:opacity-50"
                    >
                      {documentLoading === `rider-doc-${doc.id}` ? "Opening…" : "Preview"}
                    </button>
                    <button
                      onClick={() => openDocument(doc.document_url, `rider-doc-open-${doc.id}`)}
                      disabled={!adminOpsEnabled || documentLoading === `rider-doc-open-${doc.id}`}
                      className="rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-accent-blue transition-colors hover:bg-muted/80 disabled:opacity-50"
                    >
                      {documentLoading === `rider-doc-open-${doc.id}` ? "Opening…" : "Open"}
                    </button>
                    {doc.review_status === "pending" && (
                      <>
                        <ActionButton
                          variant="default"
                          loading={actionLoading === doc.id}
                          disabled={!adminOpsEnabled}
                          onClick={() => reviewRiderDoc(doc.id, doc.user_id, "approved")}
                        >
                          Approve
                        </ActionButton>
                        <ActionButton
                          variant="destructive"
                          loading={actionLoading === doc.id}
                          disabled={!adminOpsEnabled}
                          onClick={() => {
                            const reason = prompt("Rejection reason:");
                            if (reason !== null)
                              reviewRiderDoc(doc.id, doc.user_id, "rejected", reason);
                          }}
                        >
                          Reject
                        </ActionButton>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Document preview modal */}
        {previewUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setPreviewUrl(null)}
          >
            <div
              className="relative max-h-[90vh] max-w-4xl overflow-auto rounded-lg bg-card p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-2 px-2">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent-blue hover:underline"
                >
                  Open in new tab
                </a>
                <button
                  onClick={() => setPreviewUrl(null)}
                  className="rounded-md bg-muted px-3 py-1 text-sm hover:bg-muted/80"
                >
                  Close
                </button>
              </div>
              {previewUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Document preview"
                  className="max-h-[80vh] rounded object-contain"
                />
              ) : previewUrl.match(/\.pdf(\?|$)/i) ? (
                <iframe
                  src={previewUrl}
                  className="h-[80vh] w-full min-w-[600px] rounded"
                  title="Document preview"
                />
              ) : (
                <div className="flex h-48 items-center justify-center text-muted-foreground">
                  <p>
                    Preview not available.{" "}
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-blue hover:underline"
                    >
                      Download file
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Decline Dialog Modal */}
        {declineDialogOpen && detailProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="decline-dialog-title"
              className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto text-card-foreground"
            >
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <h3 id="decline-dialog-title" className="text-lg font-semibold text-foreground">
                    Decline Account Verification
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Applicant:{" "}
                    <span className="font-medium text-foreground">
                      {getUserDisplayName(detailProfile)}
                    </span>{" "}
                    ({detailProfile.email ?? "No email on file"}) &bull; Role:{" "}
                    <span className="capitalize">{detailProfile.role}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !declineSubmitting && setDeclineDialogOpen(false)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Select Reason(s) for Decline
                  </label>
                  <div className="space-y-2">
                    {(detailProfile.role === "driver"
                      ? DRIVER_DECLINE_REASONS
                      : RIDER_DECLINE_REASONS
                    ).map((reason) => {
                      const isChecked = selectedDeclineReasons.includes(reason);
                      return (
                        <label
                          key={reason}
                          className={`flex items-start gap-3 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isChecked
                              ? "border-amber-500/50 bg-amber-500/10 text-foreground font-medium"
                              : "border-border hover:bg-muted/40 text-muted-foreground"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleDeclineReason(reason)}
                            className="mt-0.5 rounded border-muted-foreground text-amber-600 focus:ring-amber-500"
                          />
                          <span className="leading-snug">{reason}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="decline-notes"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
                  >
                    Additional Reviewer Notes / Instructions (Optional)
                  </label>
                  <textarea
                    id="decline-notes"
                    rows={3}
                    value={declineCustomNotes}
                    onChange={(e) => setDeclineCustomNotes(e.target.value)}
                    placeholder="Provide specific notes or instructions for the user..."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  <p className="font-semibold">What happens next:</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-amber-700 dark:text-amber-400">
                    <li>User account status will be set to <strong>Restricted</strong>.</li>
                    {detailProfile.email ? (
                      <li>
                        An official branded email detailing the selected reason(s) will be dispatched to{" "}
                        <strong>{detailProfile.email}</strong> via Resend.
                      </li>
                    ) : (
                      <li className="text-destructive font-medium">
                        No email on file. Account will be restricted without email delivery.
                      </li>
                    )}
                    <li>The user will see instructions to re-upload documents in the mobile app.</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  disabled={declineSubmitting}
                  onClick={() => setDeclineDialogOpen(false)}
                  className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={
                    declineSubmitting ||
                    (!selectedDeclineReasons.length && !declineCustomNotes.trim())
                  }
                  onClick={handleConfirmDecline}
                  className="rounded-md bg-amber-600 text-white hover:bg-amber-700 px-4 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {declineSubmitting ? "Declining…" : "Confirm Decline & Send Notification"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════
     LIST VIEW — default (no ?view param)
     ════════════════════════════════════════════════════════ */
  const driverProfiles = profiles.filter(
    (p) => p.role === "driver" || driverDetails.some((dd) => dd.id === p.id)
  );

  const filteredProfiles = profiles.filter((p) => {
    if (statusFilter !== "all" && p.account_status !== statusFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = `${p.first_name ?? ""} ${p.last_name ?? ""}`.toLowerCase();
    const email = (p.email ?? "").toLowerCase();
    const phone = (p.phone ?? "").toLowerCase();
    const id = p.id.toLowerCase();
    return name.includes(q) || email.includes(q) || phone.includes(q) || id.includes(q);
  });

  const filteredDrivers = driverProfiles.filter((p) => {
    if (statusFilter !== "all" && p.account_status !== statusFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = `${p.first_name ?? ""} ${p.last_name ?? ""}`.toLowerCase();
    const email = (p.email ?? "").toLowerCase();
    const phone = (p.phone ?? "").toLowerCase();
    const id = p.id.toLowerCase();
    const dd = driverDetails.find((d) => d.id === p.id);
    const vehicle = `${dd?.vehicle_make ?? ""} ${dd?.vehicle_model ?? ""} ${dd?.vehicle_plate ?? ""}`.toLowerCase();
    return name.includes(q) || email.includes(q) || phone.includes(q) || vehicle.includes(q) || id.includes(q);
  });

  const filteredDriverDocs = driverDocs.filter((doc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const profile = profiles.find((p) => p.id === doc.profile_id);
    const name = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.toLowerCase();
    const email = (profile?.email ?? "").toLowerCase();
    const docType = (doc.document_type ?? "").toLowerCase();
    const docNum = (doc.document_number ?? "").toLowerCase();
    const id = doc.profile_id.toLowerCase();
    return name.includes(q) || email.includes(q) || docType.includes(q) || docNum.includes(q) || id.includes(q);
  });

  const filteredRiderDocs = riderDocs.filter((doc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const profile = profiles.find((p) => p.id === doc.user_id);
    const name = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.toLowerCase();
    const email = (profile?.email ?? "").toLowerCase();
    const id = doc.user_id.toLowerCase();
    return name.includes(q) || email.includes(q) || id.includes(q);
  });

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "all", label: "All Users", count: filteredProfiles.length },
    { key: "drivers", label: "Drivers", count: filteredDrivers.length },
    {
      key: "pending-docs",
      label: "Pending Documents",
      count: filteredDriverDocs.length + filteredRiderDocs.length,
    },
  ];

  const navigateToUser = (userId: string) => {
    router.push(`/admin/users?view=${userId}`);
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
      {actionSuccess && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-300">
          {actionSuccess}
        </div>
      )}

      {/* Tabs & Search controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg border p-1 self-start">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                tab === t.key
                  ? "bg-accent-green text-white"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t.label}
              {t.count !== undefined && (
                <span className="ml-1.5 text-xs opacity-70">({t.count})</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search name, email, phone, ID..."
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
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="restricted">Restricted</option>
            <option value="suspended">Suspended</option>
          </select>
          <button
            onClick={handleRunSweep}
            disabled={sweepLoading || !adminOpsEnabled}
            className="rounded-md border border-input bg-background hover:bg-muted px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors disabled:opacity-50 flex items-center gap-1.5"
            title="Scan pending accounts and send 3-day / 15-day reminders for missing docs"
          >
            {sweepLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Bell className="h-3.5 w-3.5 text-foreground" />
            )}
            <span>{sweepLoading ? "Running Sweep..." : "Run Reminder Sweep"}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg border bg-muted/40" />
          ))}
        </div>
      ) : (
        <>
          {/* ALL USERS TAB */}
          {tab === "all" && (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-3 py-2 text-left font-medium">Name</th>
                    <th className="px-3 py-2 text-left font-medium">Role</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-left font-medium">Strikes</th>
                    <th className="px-3 py-2 text-left font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-xs text-muted-foreground">
                        No users match the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredProfiles.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => navigateToUser(p.id)}
                        className="cursor-pointer border-b transition-colors hover:bg-muted/30"
                      >
                        <td className="px-3 py-2">
                          <div className="font-medium text-foreground">{getUserDisplayName(p)}</div>
                          {(p.first_name || p.last_name) && (p.email || p.phone) ? (
                            <div className="text-xs text-muted-foreground">{p.email ?? p.phone}</div>
                          ) : null}
                          <div className="font-mono text-[11px] text-muted-foreground">ID: {p.id.slice(0, 8)}</div>
                        </td>
                        <td className="px-3 py-2">
                          <StatusBadge value={p.role} />
                        </td>
                        <td className="px-3 py-2">
                          <StatusBadge value={p.account_status} />
                        </td>
                        <td className="px-3 py-2 tabular-nums">
                          {p.strikes_soft}s / {p.strikes_hard}h
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {new Date(p.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* DRIVERS TAB */}
          {tab === "drivers" && (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-3 py-2 text-left font-medium">Driver</th>
                    <th className="px-3 py-2 text-left font-medium">Vehicle</th>
                    <th className="px-3 py-2 text-left font-medium">Review</th>
                    <th className="px-3 py-2 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrivers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-xs text-muted-foreground">
                        No drivers match the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredDrivers.map((p) => {
                      const dd = driverDetails.find((d) => d.id === p.id);
                      const vehicleText = dd
                        ? [dd.vehicle_year, dd.vehicle_make, dd.vehicle_model].filter(Boolean).join(" ") || "Vehicle on file"
                        : "Not submitted";
                      const plateText = dd?.vehicle_plate ?? "No plate";
                      const reviewStatus = dd ? dd.review_status : "pending_setup";

                      return (
                        <tr
                          key={p.id}
                          onClick={() => navigateToUser(p.id)}
                          className="cursor-pointer border-b transition-colors hover:bg-muted/30"
                        >
                          <td className="px-3 py-2">
                            <div className="font-medium text-foreground">{getUserDisplayName(p)}</div>
                            {(p.first_name || p.last_name) && (p.email || p.phone) ? (
                              <div className="text-xs text-muted-foreground">{p.email ?? p.phone}</div>
                            ) : null}
                            <div className="font-mono text-[11px] text-muted-foreground">ID: {p.id.slice(0, 8)}</div>
                          </td>
                          <td className="px-3 py-2">
                            <div>{vehicleText}</div>
                            <div className="text-xs text-muted-foreground">{plateText}</div>
                          </td>
                          <td className="px-3 py-2">
                            <StatusBadge value={reviewStatus} />
                          </td>
                          <td className="px-3 py-2">
                            <span className="inline-flex items-center gap-1 text-xs text-accent-blue font-medium">
                              View details <ArrowRight className="h-3 w-3" />
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* PENDING DOCS TAB */}
          {tab === "pending-docs" && (
            <div className="space-y-6">
              {filteredDriverDocs.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-medium">Driver Documents</h3>
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/40">
                          <th className="px-3 py-2 text-left font-medium">Driver</th>
                          <th className="px-3 py-2 text-left font-medium">Type</th>
                          <th className="px-3 py-2 text-left font-medium">Doc #</th>
                          <th className="px-3 py-2 text-left font-medium">Expires</th>
                          <th className="px-3 py-2 text-left font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDriverDocs.map((doc) => {
                          const profile = profiles.find((p) => p.id === doc.profile_id);
                          return (
                            <tr
                              key={doc.id}
                              onClick={() => navigateToUser(doc.profile_id)}
                              className="cursor-pointer border-b transition-colors hover:bg-muted/30"
                            >
                              <td className="px-3 py-2">
                                <div className="font-medium text-foreground">{getUserDisplayName(profile)}</div>
                                {profile?.email && <div className="text-xs text-muted-foreground">{profile.email}</div>}
                                <div className="font-mono text-[11px] text-muted-foreground">ID: {doc.profile_id.slice(0, 8)}</div>
                              </td>
                              <td className="px-3 py-2">
                                <StatusBadge value={doc.document_type} />
                              </td>
                              <td className="px-3 py-2">{doc.document_number ?? "—"}</td>
                              <td className="px-3 py-2">
                                {doc.expiration_date
                                  ? new Date(doc.expiration_date).toLocaleDateString()
                                  : "—"}
                              </td>
                              <td className="px-3 py-2">
                                <span className="inline-flex items-center gap-1 text-xs text-accent-blue font-medium">
                                  Review <ArrowRight className="h-3 w-3" />
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {filteredRiderDocs.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-medium">Rider Documents</h3>
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/40">
                          <th className="px-3 py-2 text-left font-medium">User</th>
                          <th className="px-3 py-2 text-left font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRiderDocs.map((doc) => {
                          const profile = profiles.find((p) => p.id === doc.user_id);
                          return (
                            <tr
                              key={doc.id}
                              onClick={() => navigateToUser(doc.user_id)}
                              className="cursor-pointer border-b transition-colors hover:bg-muted/30"
                            >
                              <td className="px-3 py-2">
                                <div className="font-medium text-foreground">{getUserDisplayName(profile)}</div>
                                {profile?.email && <div className="text-xs text-muted-foreground">{profile.email}</div>}
                                <div className="font-mono text-[11px] text-muted-foreground">ID: {doc.user_id.slice(0, 8)}</div>
                              </td>
                              <td className="px-3 py-2">
                                <span className="inline-flex items-center gap-1 text-xs text-accent-blue font-medium">
                                  Review <ArrowRight className="h-3 w-3" />
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {filteredDriverDocs.length === 0 && filteredRiderDocs.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "No pending documents match your search." : "No pending document reviews."}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Helper Components ─── */

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}</span>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function DocCard({
  label,
  documentRef,
  disabled,
  loading,
  onPreview,
}: {
  label: string;
  documentRef: string | null;
  disabled?: boolean;
  loading?: boolean;
  onPreview: (documentRef: string) => void;
}) {
  if (!documentRef) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        <span className="text-xs">{label}</span>
        <span className="mt-1 text-xs italic">Not uploaded</span>
      </div>
    );
  }
  return (
    <button
      onClick={() => onPreview(documentRef)}
      disabled={disabled || loading}
      className="flex cursor-pointer flex-col items-center justify-center rounded-md border p-4 text-sm transition-colors hover:bg-muted/40 disabled:opacity-50"
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="mt-1 text-xs text-accent-blue">
        {loading ? "Opening…" : "Click to view"}
      </span>
    </button>
  );
}

function StatusBadge({ value }: { value?: string | null }) {
  const safeValue = value || "unknown";
  const colors: Record<string, string> = {
    admin: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    driver: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    rider: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    suspended: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    restricted: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    dormant: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
    approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    pending_setup: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    drivers_license: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    vehicle_insurance: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    vehicle_registration: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        colors[safeValue] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {safeValue.replace(/_/g, " ")}
    </span>
  );
}

function ActionButton({
  children,
  variant,
  loading,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  variant: "default" | "destructive" | "warning" | "info";
  loading: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={loading || disabled}
      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5 min-h-[26px] ${
        variant === "destructive"
          ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
          : variant === "warning"
          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
          : variant === "info"
          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20"
          : "bg-accent-green/10 text-accent-green hover:bg-accent-green/20"
      }`}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : children}
    </button>
  );
}
