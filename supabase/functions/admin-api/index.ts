import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type JsonRecord = Record<string, unknown>;

type AdminContext = {
  adminUserId: string;
  service: SupabaseClient;
  supabaseUrl: string;
};

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function normalizePath(pathname: string) {
  const normalized = pathname
    .replace(/^\/functions\/v1\/admin-api/, "")
    .replace(/^\/admin-api/, "");

  return normalized || "/";
}

async function readPayload(request: Request) {
  const bodyText = await request.text();

  if (!bodyText.trim()) {
    return {} as JsonRecord;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new HttpError(400, "Request body must be a JSON object.");
  }

  return parsed as JsonRecord;
}

function requireString(payload: JsonRecord, key: string) {
  const value = payload[key];

  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError(400, `Missing or invalid \`${key}\`.`);
  }

  return value.trim();
}

function optionalString(payload: JsonRecord, key: string) {
  const value = payload[key];

  if (value == null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new HttpError(400, `Invalid \`${key}\`.`);
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function requireStringArray(payload: JsonRecord, key: string) {
  const value = payload[key];

  if (!Array.isArray(value)) {
    throw new HttpError(400, `Missing or invalid \`${key}\`.`);
  }

  const filtered = value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return [...new Set(filtered)];
}

async function requireAdmin(request: Request): Promise<AdminContext> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    throw new HttpError(500, "Supabase function environment is missing required credentials.");
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new HttpError(401, "Missing bearer token.");
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: authorization,
      },
    },
  });

  const service = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    throw new HttpError(401, "Invalid or expired admin session.");
  }

  const { data: profile, error: profileError } = await service
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new HttpError(403, "Admin profile lookup failed.");
  }

  if (profile.role !== "admin") {
    throw new HttpError(403, "This account does not have admin access.");
  }

  return {
    adminUserId: user.id,
    service,
    supabaseUrl,
  };
}

async function insertAdminAction(
  service: SupabaseClient,
  action: {
    admin_id: string;
    action: string;
    target_type: string;
    target_id: string;
    reason?: string | null;
    metadata?: Record<string, unknown> | null;
  }
) {
  const { error } = await service.from("admin_actions").insert(action);

  if (error) {
    throw new HttpError(500, error.message);
  }
}

async function handleDashboardOverview({ service }: AdminContext) {
  const [users, drivers, pendingDrivers, bookings, posts, flags] = await Promise.all([
    service.from("profiles").select("id", { count: "exact", head: true }),
    service
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "driver"),
    service
      .from("driver_details")
      .select("id", { count: "exact", head: true })
      .eq("review_status", "pending"),
    service
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "confirmed"]),
    service
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    service
      .from("flags")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const firstError = [users, drivers, pendingDrivers, bookings, posts, flags].find(
    (result) => result.error
  )?.error;

  if (firstError) {
    throw new HttpError(500, firstError.message);
  }

  return {
    totalUsers: users.count ?? 0,
    totalDrivers: drivers.count ?? 0,
    pendingDriverApprovals: pendingDrivers.count ?? 0,
    activeBookings: bookings.count ?? 0,
    openPosts: posts.count ?? 0,
    pendingFlags: flags.count ?? 0,
  };
}

async function handleBookingsList({ service }: AdminContext) {
  const [bookings, contracts] = await Promise.all([
    service
      .from("bookings")
      .select("id, post_id, user_id, role, status, seats_booked, payment_method, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    service
      .from("contracts")
      .select("id, post_id, booking_id, origin_address, dest_address, agreed_price_cents, status, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  if (bookings.error || contracts.error) {
    throw new HttpError(500, bookings.error?.message ?? contracts.error?.message ?? "Failed to load bookings.");
  }

  return {
    bookings: bookings.data ?? [],
    contracts: contracts.data ?? [],
  };
}

async function handleContractEvents({ service }: AdminContext, payload: JsonRecord) {
  const contractId = requireString(payload, "contractId");
  const { data, error } = await service
    .from("contract_events")
    .select("id, contract_id, actor_id, event_type, note, created_at")
    .eq("contract_id", contractId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new HttpError(500, error.message);
  }

  return {
    events: data ?? [],
  };
}

async function handleContentList({ service }: AdminContext) {
  const [posts, notifications] = await Promise.all([
    service
      .from("posts")
      .select(
        "id, author_id, type, status, title, description, origin_address, dest_address, departure_at, price_cents, seats_total, seats_filled, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(200),
    service
      .from("notifications")
      .select("id, user_id, type, title, body, read, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (posts.error || notifications.error) {
    throw new HttpError(500, posts.error?.message ?? notifications.error?.message ?? "Failed to load content.");
  }

  return {
    posts: posts.data ?? [],
    notifications: notifications.data ?? [],
  };
}

async function handleCancelPost({ service, adminUserId }: AdminContext, payload: JsonRecord) {
  const postId = requireString(payload, "postId");
  const { error } = await service.from("posts").update({ status: "cancelled" }).eq("id", postId);

  if (error) {
    throw new HttpError(500, error.message);
  }

  await insertAdminAction(service, {
    admin_id: adminUserId,
    action: "remove_post",
    target_type: "post",
    target_id: postId,
    reason: "Removed by admin",
  });

  return { ok: true };
}

async function handleModerationList({ service }: AdminContext) {
  const [flags, strikes, actions] = await Promise.all([
    service
      .from("flags")
      .select("id, reporter_id, target_type, target_id, reason, status, reviewed_by, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    service
      .from("strikes")
      .select("id, user_id, contract_id, type, reason, auto_generated, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    service
      .from("admin_actions")
      .select("id, admin_id, action, target_type, target_id, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (flags.error || strikes.error || actions.error) {
    throw new HttpError(
      500,
      flags.error?.message ?? strikes.error?.message ?? actions.error?.message ?? "Failed to load moderation data."
    );
  }

  return {
    flags: flags.data ?? [],
    strikes: strikes.data ?? [],
    actions: actions.data ?? [],
  };
}

async function handleReviewFlag({ service, adminUserId }: AdminContext, payload: JsonRecord) {
  const flagId = requireString(payload, "flagId");
  const status = requireString(payload, "status");

  if (status !== "action_taken" && status !== "dismissed") {
    throw new HttpError(400, "Invalid flag review status.");
  }

  const { error } = await service
    .from("flags")
    .update({ status, reviewed_by: adminUserId })
    .eq("id", flagId);

  if (error) {
    throw new HttpError(500, error.message);
  }

  await insertAdminAction(service, {
    admin_id: adminUserId,
    action: status === "dismissed" ? "dismiss_flag" : "mark_flag_action_taken",
    target_type: "flag",
    target_id: flagId,
    reason: status === "dismissed" ? "Dismissed" : "Action taken",
  });

  return { ok: true };
}

async function handleIssueStrike({ service, adminUserId }: AdminContext, payload: JsonRecord) {
  const userId = requireString(payload, "userId");
  const type = requireString(payload, "type");
  const reason = requireString(payload, "reason");

  if (type !== "soft" && type !== "hard") {
    throw new HttpError(400, "Strike type must be \`soft\` or \`hard\`.");
  }

  const { error: insertError } = await service.from("strikes").insert({
    user_id: userId,
    type,
    reason,
    auto_generated: false,
  });

  if (insertError) {
    throw new HttpError(500, insertError.message);
  }

  const [softCount, hardCount] = await Promise.all([
    service.from("strikes").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("type", "soft"),
    service.from("strikes").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("type", "hard"),
  ]);

  if (softCount.error || hardCount.error) {
    throw new HttpError(500, softCount.error?.message ?? hardCount.error?.message ?? "Failed to refresh strike counts.");
  }

  const { error: profileError } = await service
    .from("profiles")
    .update({
      strikes_soft: softCount.count ?? 0,
      strikes_hard: hardCount.count ?? 0,
    })
    .eq("id", userId);

  if (profileError) {
    throw new HttpError(500, profileError.message);
  }

  await insertAdminAction(service, {
    admin_id: adminUserId,
    action: "issue_strike",
    target_type: "user",
    target_id: userId,
    reason,
    metadata: { strike_type: type },
  });

  return { ok: true };
}

async function handleUsersList({ service }: AdminContext) {
  const [profiles, driverDetails, driverDocs, riderDocs] = await Promise.all([
    service
      .from("profiles")
      .select("id, first_name, last_name, email, phone, role, account_status, rating_avg, strikes_soft, strikes_hard, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    service
      .from("driver_details")
      .select("id, vehicle_make, vehicle_model, vehicle_year, vehicle_plate, verified, review_status, rejection_reason, license_url, insurance_url, id_document_url"),
    service
      .from("driver_documents")
      .select("id, profile_id, document_type, document_url, document_number, expiration_date, review_status, rejection_reason")
      .eq("review_status", "pending"),
    service
      .from("rider_documents")
      .select("id, user_id, document_url, verified, review_status, rejection_reason")
      .eq("review_status", "pending"),
  ]);

  if (profiles.error || driverDetails.error || driverDocs.error || riderDocs.error) {
    throw new HttpError(
      500,
      profiles.error?.message ??
        driverDetails.error?.message ??
        driverDocs.error?.message ??
        riderDocs.error?.message ??
        "Failed to load users."
    );
  }

  return {
    profiles: profiles.data ?? [],
    driverDetails: driverDetails.data ?? [],
    driverDocs: driverDocs.data ?? [],
    riderDocs: riderDocs.data ?? [],
  };
}

async function handleUserDetail({ service }: AdminContext, payload: JsonRecord) {
  const userId = requireString(payload, "userId");
  const [profile, driver, driverDocs, riderDocs] = await Promise.all([
    service
      .from("profiles")
      .select("id, first_name, last_name, email, phone, role, account_status, rating_avg, strikes_soft, strikes_hard, created_at")
      .eq("id", userId)
      .single(),
    service
      .from("driver_details")
      .select("id, vehicle_make, vehicle_model, vehicle_year, vehicle_plate, verified, review_status, rejection_reason, license_url, insurance_url, id_document_url")
      .eq("id", userId)
      .maybeSingle(),
    service
      .from("driver_documents")
      .select("id, profile_id, document_type, document_url, document_number, expiration_date, review_status, rejection_reason")
      .eq("profile_id", userId),
    service
      .from("rider_documents")
      .select("id, user_id, document_url, verified, review_status, rejection_reason")
      .eq("user_id", userId),
  ]);

  if (profile.error || driver.error || driverDocs.error || riderDocs.error) {
    throw new HttpError(
      500,
      profile.error?.message ??
        driver.error?.message ??
        driverDocs.error?.message ??
        riderDocs.error?.message ??
        "Failed to load user detail."
    );
  }

  return {
    profile: profile.data ?? null,
    driver: driver.data ?? null,
    driverDocs: driverDocs.data ?? [],
    riderDocs: riderDocs.data ?? [],
  };
}

async function handleAccountStatus({ service, adminUserId }: AdminContext, payload: JsonRecord) {
  const userId = requireString(payload, "userId");
  const status = requireString(payload, "status");

  const { error } = await service.from("profiles").update({ account_status: status }).eq("id", userId);
  if (error) {
    throw new HttpError(500, error.message);
  }

  await insertAdminAction(service, {
    admin_id: adminUserId,
    action: status === "suspended" ? "suspend_user" : "unsuspend_user",
    target_type: "user",
    target_id: userId,
    reason: null,
  });

  return { ok: true };
}

async function handleReviewDriver({ service, adminUserId }: AdminContext, payload: JsonRecord) {
  const driverId = requireString(payload, "driverId");
  const status = requireString(payload, "status");
  const reason = optionalString(payload, "reason");

  if (status !== "approved" && status !== "rejected") {
    throw new HttpError(400, "Invalid driver review status.");
  }

  const { error } = await service
    .from("driver_details")
    .update({
      review_status: status,
      verified: status === "approved",
      rejection_reason: status === "rejected" ? (reason ?? "Rejected by admin") : null,
    })
    .eq("id", driverId);

  if (error) {
    throw new HttpError(500, error.message);
  }

  await insertAdminAction(service, {
    admin_id: adminUserId,
    action: status === "approved" ? "approve_driver" : "reject_driver",
    target_type: "driver",
    target_id: driverId,
    reason,
  });

  return { ok: true };
}

async function handleReviewDriverDocument(
  { service, adminUserId }: AdminContext,
  payload: JsonRecord
) {
  const documentId = requireString(payload, "documentId");
  const profileId = requireString(payload, "profileId");
  const status = requireString(payload, "status");
  const reason = optionalString(payload, "reason");

  if (status !== "approved" && status !== "rejected") {
    throw new HttpError(400, "Invalid driver document review status.");
  }

  const { error } = await service
    .from("driver_documents")
    .update({
      review_status: status,
      rejection_reason: status === "rejected" ? (reason ?? "Rejected by admin") : null,
      reviewed_by: adminUserId,
    })
    .eq("id", documentId)
    .eq("profile_id", profileId);

  if (error) {
    throw new HttpError(500, error.message);
  }

  await insertAdminAction(service, {
    admin_id: adminUserId,
    action: status === "approved" ? "approve_driver_doc" : "reject_driver_doc",
    target_type: "driver_document",
    target_id: documentId,
    reason,
  });

  return { ok: true };
}

async function handleReviewRiderDocument(
  { service, adminUserId }: AdminContext,
  payload: JsonRecord
) {
  const documentId = requireString(payload, "documentId");
  const userId = requireString(payload, "userId");
  const status = requireString(payload, "status");
  const reason = optionalString(payload, "reason");

  if (status !== "approved" && status !== "rejected") {
    throw new HttpError(400, "Invalid rider document review status.");
  }

  const { error } = await service
    .from("rider_documents")
    .update({
      review_status: status,
      verified: status === "approved",
      rejection_reason: status === "rejected" ? (reason ?? "Rejected by admin") : null,
      reviewed_by: adminUserId,
    })
    .eq("id", documentId)
    .eq("user_id", userId);

  if (error) {
    throw new HttpError(500, error.message);
  }

  await insertAdminAction(service, {
    admin_id: adminUserId,
    action: status === "approved" ? "approve_rider_doc" : "reject_rider_doc",
    target_type: "rider_document",
    target_id: documentId,
    reason,
  });

  return { ok: true };
}

async function handleCommunityList({ service }: AdminContext) {
  const [reports, gas, waitlist] = await Promise.all([
    service
      .from("road_reports")
      .select("id, reporter_id, type, lat, lng, description, upvotes, expires_at, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    service
      .from("gas_prices")
      .select("id, reporter_id, station_name, station_lat, station_lng, regular_cents, premium_cents, diesel_cents, verified_count, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    service
      .from("waitlist")
      .select("id, post_id, user_id, notified, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  if (reports.error || gas.error || waitlist.error) {
    throw new HttpError(
      500,
      reports.error?.message ?? gas.error?.message ?? waitlist.error?.message ?? "Failed to load community data."
    );
  }

  return {
    reports: reports.data ?? [],
    gas: gas.data ?? [],
    waitlist: waitlist.data ?? [],
  };
}

async function handleFinanceList({ service }: AdminContext) {
  const [transactions, receipts, donationTotals] = await Promise.all([
    service
      .from("ekyash_transactions")
      .select("id, contract_id, payer_id, payee_id, order_id, amount_cents, platform_fee_cents, donation_cents, currency, status, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    service
      .from("email_receipts")
      .select("id, user_id, contract_id, email_to, type, status, error, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    service
      .from("donation_totals")
      .select("total_cents, updated_at")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  if (transactions.error || receipts.error || donationTotals.error) {
    throw new HttpError(
      500,
      transactions.error?.message ?? receipts.error?.message ?? donationTotals.error?.message ?? "Failed to load finance data."
    );
  }

  return {
    transactions: transactions.data ?? [],
    receipts: receipts.data ?? [],
    donationTotals: donationTotals.data ?? null,
  };
}

function buildDisplayName(profile: {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}) {
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  return fullName || profile.email || profile.id.slice(0, 8);
}

async function handleLookupNames({ service }: AdminContext, payload: JsonRecord) {
  const userIds = requireStringArray(payload, "userIds");
  const postIds = requireStringArray(payload, "postIds");
  const users: Record<string, string> = {};
  const posts: Record<string, string> = {};

  for (let index = 0; index < userIds.length; index += 50) {
    const batch = userIds.slice(index, index + 50);
    const { data, error } = await service
      .from("profiles")
      .select("id, first_name, last_name, email")
      .in("id", batch);

    if (error) {
      throw new HttpError(500, error.message);
    }

    for (const profile of data ?? []) {
      users[profile.id] = buildDisplayName(profile);
    }
  }

  for (let index = 0; index < postIds.length; index += 50) {
    const batch = postIds.slice(index, index + 50);
    const { data, error } = await service.from("posts").select("id, title").in("id", batch);

    if (error) {
      throw new HttpError(500, error.message);
    }

    for (const post of data ?? []) {
      posts[post.id] = post.title || post.id.slice(0, 8);
    }
  }

  return { users, posts };
}

function extractStoragePath(documentRef: string, bucket: string, supabaseUrl: string) {
  if (!documentRef.startsWith("http")) {
    return documentRef
      .replace(/:(https?):\/\/.*$/i, "")
      .replace(/^\/+/, "");
  }

  try {
    const documentUrl = new URL(documentRef);
    const supabaseHost = new URL(supabaseUrl).host;

    if (documentUrl.host !== supabaseHost) {
      return null;
    }

    const markers = [
      `/storage/v1/object/public/${bucket}/`,
      `/storage/v1/object/authenticated/${bucket}/`,
      `/storage/v1/object/sign/${bucket}/`,
    ];

    for (const marker of markers) {
      const markerIndex = documentUrl.pathname.indexOf(marker);
      if (markerIndex >= 0) {
        return decodeURIComponent(documentUrl.pathname.slice(markerIndex + marker.length));
      }
    }
  } catch {
    return null;
  }

  return null;
}

async function handleResolveDocument(
  { service, supabaseUrl }: AdminContext,
  payload: JsonRecord
) {
  const documentRef = requireString(payload, "documentRef");
  const bucket = requireString(payload, "bucket");
  const storagePath = extractStoragePath(documentRef, bucket, supabaseUrl);

  if (!storagePath) {
    if (documentRef.startsWith("http://") || documentRef.startsWith("https://")) {
      return { url: documentRef };
    }

    throw new HttpError(400, "Document reference could not be resolved.");
  }

  const { data, error } = await service.storage.from(bucket).createSignedUrl(storagePath, 600);

  if (error || !data?.signedUrl) {
    throw new HttpError(500, error?.message ?? "Signed URL generation failed.");
  }

  return { url: data.signedUrl };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  try {
    const context = await requireAdmin(request);
    const payload = await readPayload(request);
    const path = normalizePath(new URL(request.url).pathname);

    let responseBody: unknown;

    switch (path) {
      case "/dashboard/overview":
        responseBody = await handleDashboardOverview(context);
        break;
      case "/bookings/list":
        responseBody = await handleBookingsList(context);
        break;
      case "/bookings/contract-events":
        responseBody = await handleContractEvents(context, payload);
        break;
      case "/community/list":
        responseBody = await handleCommunityList(context);
        break;
      case "/content/list":
        responseBody = await handleContentList(context);
        break;
      case "/content/cancel-post":
        responseBody = await handleCancelPost(context, payload);
        break;
      case "/documents/resolve":
        responseBody = await handleResolveDocument(context, payload);
        break;
      case "/finance/list":
        responseBody = await handleFinanceList(context);
        break;
      case "/lookup/names":
        responseBody = await handleLookupNames(context, payload);
        break;
      case "/moderation/issue-strike":
        responseBody = await handleIssueStrike(context, payload);
        break;
      case "/moderation/list":
        responseBody = await handleModerationList(context);
        break;
      case "/moderation/review-flag":
        responseBody = await handleReviewFlag(context, payload);
        break;
      case "/users/account-status":
        responseBody = await handleAccountStatus(context, payload);
        break;
      case "/users/detail":
        responseBody = await handleUserDetail(context, payload);
        break;
      case "/users/list":
        responseBody = await handleUsersList(context);
        break;
      case "/users/review-driver":
        responseBody = await handleReviewDriver(context, payload);
        break;
      case "/users/review-driver-document":
        responseBody = await handleReviewDriverDocument(context, payload);
        break;
      case "/users/review-rider-document":
        responseBody = await handleReviewRiderDocument(context, payload);
        break;
      default:
        throw new HttpError(404, `Unknown admin endpoint: ${path}`);
    }

    return json(responseBody);
  } catch (error) {
    if (error instanceof HttpError) {
      return json({ error: error.message }, error.status);
    }

    console.error(error);
    return json({ error: "Internal admin API error." }, 500);
  }
});