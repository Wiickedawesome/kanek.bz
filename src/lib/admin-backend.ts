import { supabase } from "@/lib/supabase";

const adminBackendBaseUrl =
  process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL?.replace(/\/$/, "") ?? "";

const adminBackendMessage =
  "Secure admin backend not configured. Set NEXT_PUBLIC_ADMIN_API_BASE_URL to your deployed admin API to enable admin data, document access, and admin mutations.";

type StringMap = Record<string, string>;

export type AdminDashboardStats = {
  totalUsers: number;
  totalDrivers: number;
  pendingDriverApprovals: number;
  activeBookings: number;
  openPosts: number;
  pendingFlags: number;
};

export type AdminNameLookup = {
  users: StringMap;
  posts: StringMap;
};

export class AdminBackendConfigurationError extends Error {
  constructor(message = adminBackendMessage) {
    super(message);
    this.name = "AdminBackendConfigurationError";
  }
}

export function isAdminBackendConfigured() {
  return adminBackendBaseUrl.length > 0;
}

export function getAdminBackendStatusMessage() {
  return adminBackendMessage;
}

export function getAdminActionErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "The secure admin request failed. Try again after confirming the backend is configured.";
}

async function getAdminAccessToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Your admin session expired. Sign in again.");
  }

  return session.access_token;
}

async function callAdminBackend<T>(path: string, payload: Record<string, unknown>) {
  if (!isAdminBackendConfigured()) {
    throw new AdminBackendConfigurationError();
  }

  const accessToken = await getAdminAccessToken();
  const response = await fetch(`${adminBackendBaseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();

    if (body) {
      try {
        const parsed = JSON.parse(body) as { error?: string; message?: string };
        throw new Error(parsed.error ?? parsed.message ?? body);
      } catch {
        throw new Error(body);
      }
    }

    throw new Error(`Secure admin backend returned ${response.status}.`);
  }

  if (response.status === 204) {
    return null as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null as T;
  }

  return (await response.json()) as T;
}

export async function cancelAdminPost(postId: string) {
  await callAdminBackend("/content/cancel-post", { postId });
}

export async function getAdminDashboardStats() {
  return callAdminBackend<AdminDashboardStats>("/dashboard/overview", {});
}

export type BookingAuditItem = {
  id: string;
  bookingId: string | null;
  contractId: string | null;
  postId: string;
  status: string;
  bookingStatus: string | null;
  contractStatus: string | null;
  createdAt: string;
  departureAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  seatsBooked: number;
  paymentMethod: string | null;
  agreedPriceCents: number | null;
  originAddress: string | null;
  destAddress: string | null;
  postTitle: string | null;
  postType: string | null;
  driver: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    avatarUrl: string | null;
    ratingAvg: number | null;
    punctualityPct: number | null;
    accountStatus: string | null;
    vehicle: {
      make: string | null;
      model: string | null;
      year: number | null;
      color: string | null;
      plate: string | null;
      verified: boolean;
    } | null;
  } | null;
  rider: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    avatarUrl: string | null;
    ratingAvg: number | null;
    emergencyContact: string | null;
    accountStatus: string | null;
  } | null;
  timeline: {
    id: string;
    type: string;
    label: string;
    timestamp: string;
    actorId: string | null;
    actorName: string | null;
    actorRole: "driver" | "rider" | "system" | "admin";
    note: string | null;
  }[];
  ratings: {
    id: string;
    raterId: string;
    raterName: string;
    ratedId: string;
    ratedName: string;
    stars: number;
    comment: string | null;
    wasOnTime: boolean | null;
    createdAt: string;
  }[];
  flags: {
    id: string;
    reason: string;
    description: string | null;
    status: string;
    createdAt: string;
  }[];
  notifications?: {
    id: string;
    userId: string;
    recipientName?: string | null;
    type: string;
    title: string;
    body: string | null;
    createdAt: string;
  }[];
};

export async function getAdminBookingsData<TBookings = unknown, TContracts = unknown>() {
  return callAdminBackend<{
    auditItems: BookingAuditItem[];
    bookings: TBookings[];
    contracts: TContracts[];
  }>("/bookings/list", {});
}

export async function getAdminContractEvents<TEvent>(contractId: string) {
  return callAdminBackend<{ events: TEvent[] }>("/bookings/contract-events", {
    contractId,
  });
}

export async function getAdminContentData<TPost, TNotification>() {
  return callAdminBackend<{ posts: TPost[]; notifications: TNotification[] }>(
    "/content/list",
    {}
  );
}

export async function getAdminModerationData<TFlag, TStrike, TAction>() {
  return callAdminBackend<{
    flags: TFlag[];
    strikes: TStrike[];
    actions: TAction[];
  }>("/moderation/list", {});
}

export async function getAdminUsersData<TProfile, TDriverDetail, TDriverDocument, TRiderDocument>() {
  return callAdminBackend<{
    profiles: TProfile[];
    driverDetails: TDriverDetail[];
    driverDocs: TDriverDocument[];
    riderDocs: TRiderDocument[];
  }>("/users/list", {});
}

export async function getAdminUserDetail<TProfile, TDriverDetail, TDriverDocument, TRiderDocument>(
  userId: string
) {
  return callAdminBackend<{
    profile: TProfile | null;
    driver: TDriverDetail | null;
    driverDocs: TDriverDocument[];
    riderDocs: TRiderDocument[];
  }>("/users/detail", { userId });
}

export async function getAdminCommunityData<TRoadReport, TGasPrice, TWaitlistEntry>() {
  return callAdminBackend<{
    reports: TRoadReport[];
    gas: TGasPrice[];
    waitlist: TWaitlistEntry[];
  }>("/community/list", {});
}

export async function getAdminFinanceData<TTransaction, TReceipt, TDonationTotal>() {
  return callAdminBackend<{
    transactions: TTransaction[];
    receipts: TReceipt[];
    donationTotals: TDonationTotal | null;
  }>("/finance/list", {});
}

export async function resolveAdminNames(userIds: string[], postIds: string[] = []) {
  return callAdminBackend<AdminNameLookup>("/lookup/names", { userIds, postIds });
}

export async function reviewAdminFlag(
  flagId: string,
  status: "action_taken" | "dismissed"
) {
  await callAdminBackend("/moderation/review-flag", { flagId, status });
}

export async function issueAdminStrike(
  userId: string,
  type: "soft" | "hard",
  reason: string
) {
  await callAdminBackend("/moderation/issue-strike", { userId, type, reason });
}

export async function updateAdminAccountStatus(userId: string, status: string) {
  await callAdminBackend("/users/account-status", { userId, status });
}

export async function declineAdminAccount(
  userId: string,
  reasons: string[],
  customNotes?: string
) {
  return callAdminBackend<{
    ok: boolean;
    accountStatus: string;
    emailSent: boolean;
    emailError: string | null;
  }>("/users/decline-account", {
    userId,
    reasons,
    customNotes: customNotes ?? null,
  });
}

export async function reviewAdminDriverApplication(
  driverId: string,
  status: "approved" | "rejected",
  reason?: string
) {
  await callAdminBackend("/users/review-driver", {
    driverId,
    status,
    reason: reason ?? null,
  });
}

export async function reviewAdminDriverDocument(
  documentId: string,
  profileId: string,
  status: "approved" | "rejected",
  reason?: string
) {
  await callAdminBackend("/users/review-driver-document", {
    documentId,
    profileId,
    status,
    reason: reason ?? null,
  });
}

export async function reviewAdminRiderDocument(
  documentId: string,
  userId: string,
  status: "approved" | "rejected",
  reason?: string
) {
  await callAdminBackend("/users/review-rider-document", {
    documentId,
    userId,
    status,
    reason: reason ?? null,
  });
}

export async function resolveAdminDocumentUrl(documentRef: string | null) {
  if (!documentRef) {
    return null;
  }

  const response = await callAdminBackend<{ url?: string }>("/documents/resolve", {
    documentRef,
    bucket: "documents",
  });

  return response?.url ?? null;
}

export async function sendAdminUserReminder(userId: string) {
  return callAdminBackend<{
    ok: boolean;
    emailSent: boolean;
    pushSent: boolean;
    missingDocs: string[];
  }>("/users/send-reminder", { userId });
}

export async function processAdminOnboardingReminders() {
  return callAdminBackend<{
    scannedCount: number;
    day3Sent: number;
    day15Sent: number;
  }>("/users/process-onboarding-reminders", {});
}