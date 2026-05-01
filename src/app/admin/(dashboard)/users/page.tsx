"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  getAdminActionErrorMessage,
  getAdminUserDetail,
  getAdminUsersData,
  isAdminBackendConfigured,
  resolveAdminDocumentUrl,
  reviewAdminDriverApplication,
  reviewAdminDriverDocument,
  reviewAdminRiderDocument,
  updateAdminAccountStatus,
} from "@/lib/admin-backend";

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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [documentLoading, setDocumentLoading] = useState<string | null>(null);
  const adminOpsEnabled = isAdminBackendConfigured();

  /* ── Detail-view state (loaded when viewUserId is set) ── */
  const [detailProfile, setDetailProfile] = useState<Profile | null>(null);
  const [detailDriver, setDetailDriver] = useState<DriverDetail | null>(null);
  const [detailDriverDocs, setDetailDriverDocs] = useState<DriverDocument[]>([]);
  const [detailRiderDocs, setDetailRiderDocs] = useState<RiderDocument[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
    setActionLoading("account");
    try {
      await updateAdminAccountStatus(userId, status);
      if (viewUserId) await loadDetail(viewUserId);
      else await load();
    } catch (error) {
      setActionError(getAdminActionErrorMessage(error));
    } finally {
      setActionLoading(null);
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
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to Users
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

    const fullName =
      [detailProfile.first_name, detailProfile.last_name].filter(Boolean).join(" ") ||
      "Unknown User";

    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/admin/users")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Users
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
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge value={detailProfile.role} />
              <StatusBadge value={detailProfile.account_status} />
            </div>
          </div>

          <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
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

          <div className="flex gap-2 pt-2 border-t flex-wrap">
            {detailProfile.account_status === "pending" && (
              <ActionButton
                variant="default"
                loading={actionLoading === "account"}
                disabled={!adminOpsEnabled}
                onClick={() => updateAccountStatus(detailProfile.id, "active")}
              >
                Approve Account
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
          </div>
        </div>

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
                  label="ID Document"
                  documentRef={
                    detailDriver.id_document_url ??
                    detailDriverDocs.find((d) => d.document_type === "vehicle_registration")?.document_url ?? null
                  }
                  disabled={!adminOpsEnabled}
                  loading={documentLoading === "driver-id"}
                  onPreview={(documentRef) => previewDocument(documentRef, "driver-id")}
                />
              </div>
            </div>

            {detailDriver.rejection_reason && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <span className="font-medium">Rejection Reason:</span> {detailDriver.rejection_reason}
              </div>
            )}

            {detailDriver.review_status === "pending" && (() => {
              const allDocsApproved =
                detailDriverDocs.length > 0 &&
                detailDriverDocs.every((d) => d.review_status === "approved");
              return (
                <div className="space-y-2 pt-2 border-t">
                  {!allDocsApproved && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      All driver documents must be approved before the driver can be approved.
                      ({detailDriverDocs.filter((d) => d.review_status === "approved").length}/{detailDriverDocs.length} approved)
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
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════
     LIST VIEW — default (no ?view param)
     ════════════════════════════════════════════════════════ */
  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "all", label: "All Users", count: profiles.length },
    { key: "drivers", label: "Drivers", count: driverDetails.length },
    {
      key: "pending-docs",
      label: "Pending Documents",
      count: driverDocs.length + riderDocs.length,
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
      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border p-1">
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
                  {profiles.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => navigateToUser(p.id)}
                      className="cursor-pointer border-b transition-colors hover:bg-muted/30"
                    >
                      <td className="px-3 py-2">
                        {p.first_name} {p.last_name}
                        <div className="text-xs text-muted-foreground">
                          {p.email ?? p.phone}
                        </div>
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
                  ))}
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
                  {driverDetails.map((dd) => {
                    const profile = profiles.find((p) => p.id === dd.id);
                    return (
                      <tr
                        key={dd.id}
                        onClick={() => navigateToUser(dd.id)}
                        className="cursor-pointer border-b transition-colors hover:bg-muted/30"
                      >
                        <td className="px-3 py-2">
                          {profile
                            ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`
                            : dd.id.slice(0, 8)}
                        </td>
                        <td className="px-3 py-2">
                          {dd.vehicle_year} {dd.vehicle_make} {dd.vehicle_model}
                          <div className="text-xs text-muted-foreground">
                            {dd.vehicle_plate}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <StatusBadge value={dd.review_status} />
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-xs text-accent-blue">View details →</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* PENDING DOCS TAB */}
          {tab === "pending-docs" && (
            <div className="space-y-6">
              {driverDocs.length > 0 && (
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
                        {driverDocs.map((doc) => {
                          const profile = profiles.find((p) => p.id === doc.profile_id);
                          return (
                            <tr
                              key={doc.id}
                              onClick={() => navigateToUser(doc.profile_id)}
                              className="cursor-pointer border-b transition-colors hover:bg-muted/30"
                            >
                              <td className="px-3 py-2">
                                {profile
                                  ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`
                                  : doc.profile_id.slice(0, 8)}
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
                                <span className="text-xs text-accent-blue">Review →</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {riderDocs.length > 0 && (
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
                        {riderDocs.map((doc) => {
                          const profile = profiles.find((p) => p.id === doc.user_id);
                          return (
                            <tr
                              key={doc.id}
                              onClick={() => navigateToUser(doc.user_id)}
                              className="cursor-pointer border-b transition-colors hover:bg-muted/30"
                            >
                              <td className="px-3 py-2">
                                {profile
                                  ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`
                                  : doc.user_id.slice(0, 8)}
                              </td>
                              <td className="px-3 py-2">
                                <span className="text-xs text-accent-blue">Review →</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {driverDocs.length === 0 && riderDocs.length === 0 && (
                <p className="text-sm text-muted-foreground">No pending document reviews.</p>
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

function StatusBadge({ value }: { value: string }) {
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
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        colors[value] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {value.replace(/_/g, " ")}
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
  variant: "default" | "destructive";
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
      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
        variant === "destructive"
          ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
          : "bg-accent-green/10 text-accent-green hover:bg-accent-green/20"
      }`}
    >
      {loading ? "…" : children}
    </button>
  );
}
