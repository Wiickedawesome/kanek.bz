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
      .select("id, first_name, last_name, email, phone, role, account_status, rating_avg, punctuality_pct, strikes_soft, strikes_hard, created_at, last_active_at, district, address_line, emergency_contact, avatar_url")
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildDeclineEmailHtml(params: {
  userName: string;
  reasons: string[];
  customNotes?: string | null;
  role: string;
}): string {
  const safeName = escapeHtml(params.userName);
  const reasonsList = params.reasons
    .map(
      (r) =>
        `<li style="margin-bottom:8px;color:#142800;font-size:15px;line-height:1.5;">${escapeHtml(r)}</li>`
    )
    .join("");
  const safeNotes = params.customNotes ? escapeHtml(params.customNotes) : null;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f6f6f4;font-family:Manrope,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);border:1px solid #e7e8e3;">
    <div style="background:#142800;padding:28px 24px;text-align:center;">
      <h1 style="color:#ffffff;font-family:'Work Sans',Arial,sans-serif;margin:0;font-size:26px;letter-spacing:0.5px;">kanek</h1>
      <p style="color:#a7c882;font-size:13px;margin:6px 0 0;font-weight:500;">Community Mobility for Belize</p>
    </div>
    <div style="padding:32px 28px;">
      <h2 style="color:#142800;font-family:'Work Sans',Arial,sans-serif;margin:0 0 12px;font-size:20px;">Account Verification Update</h2>
      <p style="color:#4b5545;margin:0 0 16px;font-size:15px;line-height:1.6;">Hello ${safeName},</p>
      <p style="color:#4b5545;margin:0 0 24px;font-size:15px;line-height:1.6;">
        Thank you for submitting your account verification documents to Kanek. Our compliance and safety review team has reviewed your application. Unfortunately, your verification could not be approved at this time for the following reason(s):
      </p>

      <div style="background:#fef5f4;border:1px solid #fed7d2;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
        <h3 style="color:#b91c1c;margin:0 0 12px;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Reasons For Decline</h3>
        <ul style="margin:0;padding-left:20px;">
          ${reasonsList}
        </ul>
        ${
          safeNotes
            ? `<div style="margin-top:16px;padding-top:14px;border-top:1px dashed #fca5a5;">
                 <span style="display:block;font-size:13px;font-weight:600;color:#991b1b;margin-bottom:4px;">Additional Reviewer Notes:</span>
                 <p style="margin:0;font-size:14px;color:#4b5545;line-height:1.5;">${safeNotes}</p>
               </div>`
            : ""
        }
      </div>

      <div style="background:#f6f8f5;border-radius:10px;padding:20px;margin-bottom:28px;">
        <h4 style="margin:0 0 8px;font-size:15px;color:#142800;font-weight:600;">How to Resolve and Re-submit</h4>
        <p style="margin:0 0 12px;font-size:14px;color:#555e50;line-height:1.6;">
          Please open the <strong>Kanek app</strong> on your mobile device, navigate to your Profile &gt; Verification section, and upload clear, updated, and legible copies of the requested documents.
        </p>
        <p style="margin:0;font-size:13px;color:#70796a;line-height:1.5;">
          Make sure that:
        </p>
        <ul style="margin:6px 0 0;padding-left:20px;font-size:13px;color:#70796a;line-height:1.5;">
          <li>All four corners of each document are clearly visible without glare or shadow.</li>
          <li>Text, dates, and official government stamps are sharp and legible.</li>
          <li>Documents (such as insurance and driver's licenses) are currently valid and not expired.</li>
        </ul>
      </div>

      <p style="color:#555e50;margin:0 0 8px;font-size:14px;line-height:1.6;">
        If you have questions or believe this is an error, feel free to reply directly to this email or reach us at <a href="mailto:support@belizechain.org" style="color:#2f6e1e;text-decoration:none;font-weight:600;">support@belizechain.org</a>.
      </p>
    </div>
    <div style="background:#f6f6f4;padding:24px;text-align:center;border-top:1px solid #e7e8e3;">
      <p style="color:#656e5e;font-size:13px;margin:0 0 4px;font-weight:500;">Thank you for moving Belize forward safely.</p>
      <p style="color:#9aa092;font-size:11px;margin:0;">kanek — Community Mobility Board &bull; Belize</p>
    </div>
  </div>
</body>
</html>`;
}

async function handleDeclineAccount({ service, adminUserId }: AdminContext, payload: JsonRecord) {
  const userId = requireString(payload, "userId");
  const reasons = requireStringArray(payload, "reasons");
  const customNotes = optionalString(payload, "customNotes");

  if (reasons.length === 0 && !customNotes) {
    throw new HttpError(400, "At least one decline reason or custom note must be provided.");
  }

  // 1. Fetch user profile
  const { data: profile, error: profileError } = await service
    .from("profiles")
    .select("id, first_name, last_name, email, role, account_status")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    throw new HttpError(404, "User profile not found.");
  }

  // 2. Update profile account_status to 'restricted'
  const { error: updateProfileError } = await service
    .from("profiles")
    .update({ account_status: "restricted" })
    .eq("id", userId);

  if (updateProfileError) {
    throw new HttpError(500, updateProfileError.message);
  }

  // 3. If user has a driver_details record, update review_status to 'rejected'
  const combinedReason = [
    ...reasons,
    ...(customNotes ? [`Notes: ${customNotes}`] : []),
  ].join("; ");

  const { data: driverDetail } = await service
    .from("driver_details")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (driverDetail) {
    await service
      .from("driver_details")
      .update({
        review_status: "rejected",
        verified: false,
        rejection_reason: combinedReason,
      })
      .eq("id", userId);
  }

  // 4. Record action in admin_actions
  await insertAdminAction(service, {
    admin_id: adminUserId,
    action: profile.role === "driver" ? "reject_driver" : "reject_rider_doc",
    target_type: "user",
    target_id: userId,
    reason: combinedReason,
    metadata: {
      action_detail: "decline_account",
      reasons,
      custom_notes: customNotes,
      previous_status: profile.account_status,
      role: profile.role,
    },
  });

  // 5. Send decline notification email via Resend
  let emailSent = false;
  let emailError: string | null = null;

  if (profile.email) {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resendFrom = Deno.env.get("RESEND_FROM_EMAIL") ?? "Kanek Support <support@belizechain.org>";

    if (resendApiKey) {
      try {
        const userName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "Kanek User";
        const emailHtml = buildDeclineEmailHtml({
          userName,
          reasons: reasons.length > 0 ? reasons : ["Documentation requirements not met"],
          customNotes,
          role: profile.role ?? "user",
        });

        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: resendFrom,
            to: [profile.email],
            subject: "Kanek Account Verification Update — Action Required",
            html: emailHtml,
          }),
        });

        if (resendRes.ok) {
          emailSent = true;
        } else {
          const errText = await resendRes.text();
          console.error("Failed to send decline email via Resend:", errText);
          emailError = "Resend API returned non-200 status.";
        }
      } catch (err) {
        console.error("Error sending decline email:", err);
        emailError = err instanceof Error ? err.message : "Failed to send email.";
      }
    } else {
      console.warn("RESEND_API_KEY not configured in environment. Skipping email dispatch.");
      emailError = "Email service not configured.";
    }
  } else {
    emailError = "User has no email address on file.";
  }

  return {
    ok: true,
    accountStatus: "restricted",
    emailSent,
    emailError,
  };
}

function buildReminderEmailHtml(params: {
  userName: string;
  role: string;
  missingDocs: string[];
  reminderType: "3day" | "15day" | "manual";
}): string {
  const safeName = escapeHtml(params.userName);
  const docsList = params.missingDocs
    .map(
      (doc) =>
        `<li style="margin-bottom:8px;color:#142800;font-size:15px;line-height:1.5;"><strong>${escapeHtml(doc)}</strong></li>`
    )
    .join("");

  const headerTitle =
    params.reminderType === "15day"
      ? "Action Required: Final Verification Notice"
      : params.reminderType === "3day"
      ? "Friendly Reminder: Complete Your Kanek Setup"
      : "Action Required: Complete Your Kanek Verification";

  const bannerColor = params.reminderType === "15day" ? "#b91c1c" : "#142800";
  const introText =
    params.reminderType === "15day"
      ? "It has been 15 days since your Kanek account was registered. To activate your account and start booking or offering rides, your verification documents must be submitted."
      : params.reminderType === "3day"
      ? "We noticed you recently started signing up for Kanek. You're just one quick step away from being ready to ride or drive in Belize!"
      : "This is an official verification reminder from the Kanek team regarding your pending account application.";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f6f6f4;font-family:Manrope,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);border:1px solid #e7e8e3;">
    <div style="background:#142800;padding:28px 24px;text-align:center;">
      <h1 style="color:#ffffff;font-family:'Work Sans',Arial,sans-serif;margin:0;font-size:26px;letter-spacing:0.5px;">kanek</h1>
      <p style="color:#a7c882;font-size:13px;margin:6px 0 0;font-weight:500;">Community Mobility for Belize</p>
    </div>
    <div style="padding:32px 28px;">
      <h2 style="color:${bannerColor};font-family:'Work Sans',Arial,sans-serif;margin:0 0 12px;font-size:20px;">${headerTitle}</h2>
      <p style="color:#4b5545;margin:0 0 16px;font-size:15px;line-height:1.6;">Hello ${safeName},</p>
      <p style="color:#4b5545;margin:0 0 24px;font-size:15px;line-height:1.6;">
        ${introText}
      </p>

      <div style="background:#f6f8f5;border:1px solid #dce4d6;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
        <h3 style="color:#142800;margin:0 0 12px;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Required Document(s)</h3>
        <ul style="margin:0;padding-left:20px;">
          ${docsList}
        </ul>
      </div>

      <div style="background:#ffffff;border:1px solid #e7e8e3;border-radius:10px;padding:20px;margin-bottom:28px;">
        <h4 style="margin:0 0 8px;font-size:15px;color:#142800;font-weight:600;">How to Complete Your Verification</h4>
        <ol style="margin:0;padding-left:20px;font-size:14px;color:#555e50;line-height:1.6;">
          <li style="margin-bottom:6px;">Open the <strong>Kanek app</strong> on your mobile device.</li>
          <li style="margin-bottom:6px;">Sign in with your registered account.</li>
          <li style="margin-bottom:6px;">Follow the on-screen prompts to take a clear, readable photo of your document(s).</li>
        </ol>
      </div>

      <p style="color:#555e50;margin:0 0 8px;font-size:14px;line-height:1.6;">
        Need assistance or having trouble uploading? Reply directly to this email or reach us at <a href="mailto:support@belizechain.org" style="color:#2f6e1e;text-decoration:none;font-weight:600;">support@belizechain.org</a>.
      </p>
    </div>
    <div style="background:#f6f6f4;padding:24px;text-align:center;border-top:1px solid #e7e8e3;">
      <p style="color:#656e5e;font-size:13px;margin:0 0 4px;font-weight:500;">Thank you for moving Belize forward safely.</p>
      <p style="color:#9aa092;font-size:11px;margin:0;">kanek — Community Mobility Board &bull; Belize</p>
    </div>
  </div>
</body>
</html>`;
}

async function sendExpoPush(token: string, title: string, body: string, data?: Record<string, unknown>) {
  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: token,
        title,
        body,
        sound: "default",
        data: data ?? {},
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("Expo push notification failed:", err);
    return false;
  }
}

async function getMissingDocumentsForUser(
  service: SupabaseClient,
  userId: string,
  role: string
): Promise<string[]> {
  const missing: string[] = [];

  if (role === "driver") {
    const [docs, detail] = await Promise.all([
      service
        .from("driver_documents")
        .select("document_type, review_status")
        .eq("profile_id", userId),
      service
        .from("driver_details")
        .select(
          "vehicle_make, vehicle_model, vehicle_plate, license_url, insurance_url, id_document_url"
        )
        .eq("id", userId)
        .maybeSingle(),
    ]);

    const approvedOrPendingTypes = new Set(
      (docs.data ?? [])
        .filter((d) => d.review_status === "approved" || d.review_status === "pending")
        .map((d) => d.document_type)
    );

    const hasLicense =
      approvedOrPendingTypes.has("drivers_license") || Boolean(detail.data?.license_url);
    const hasInsurance =
      approvedOrPendingTypes.has("vehicle_insurance") || Boolean(detail.data?.insurance_url);
    const hasReg =
      approvedOrPendingTypes.has("vehicle_registration") || Boolean(detail.data?.id_document_url);
    const hasVehicle = Boolean(detail.data?.vehicle_make && detail.data?.vehicle_plate);

    if (!hasLicense) missing.push("Driver's License (valid class, front & back)");
    if (!hasInsurance) missing.push("Vehicle Insurance Policy (current)");
    if (!hasReg) missing.push("Vehicle Registration / Certificate");
    if (!hasVehicle) missing.push("Vehicle Details (make, model, license plate)");
  } else {
    const { data: riderDocs } = await service
      .from("rider_documents")
      .select("id, review_status")
      .eq("user_id", userId);

    const hasApprovedOrPending = (riderDocs ?? []).some(
      (d) => d.review_status === "approved" || d.review_status === "pending"
    );

    if (!hasApprovedOrPending) {
      missing.push("Government-Issued Photo ID (Passport, Social Security Card, or Voter ID)");
    }
  }

  return missing;
}

async function handleSendReminder({ service, adminUserId }: AdminContext, payload: JsonRecord) {
  const userId = requireString(payload, "userId");

  const { data: profile, error: profileError } = await service
    .from("profiles")
    .select("id, first_name, last_name, email, role, push_token, account_status")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    throw new HttpError(404, "User profile not found.");
  }

  const missingDocs = await getMissingDocumentsForUser(service, userId, profile.role);
  if (missingDocs.length === 0) {
    throw new HttpError(400, "User has already submitted all required documents.");
  }

  const userName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "Kanek User";
  let emailSent = false;
  let pushSent = false;

  // 1. Email via Resend
  if (profile.email) {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resendFrom = Deno.env.get("RESEND_FROM_EMAIL") ?? "Kanek Support <support@belizechain.org>";

    if (resendApiKey) {
      try {
        const html = buildReminderEmailHtml({
          userName,
          role: profile.role,
          missingDocs,
          reminderType: "manual",
        });

        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: resendFrom,
            to: [profile.email],
            subject: "Reminder: Complete Your Kanek Account Verification",
            html,
          }),
        });
        emailSent = resendRes.ok;
      } catch (e) {
        console.error("Failed to send manual reminder email:", e);
      }
    }
  }

  // 2. Push notification via Expo
  if (profile.push_token) {
    pushSent = await sendExpoPush(
      profile.push_token,
      "Action Required: Complete Kanek Verification",
      "Please upload your required verification document(s) to activate your account."
    );
  }

  // 3. In-App Notification table entry
  await service.from("notifications").insert({
    user_id: userId,
    type: "onboarding_reminder_manual",
    title: "Complete Your Account Verification",
    body: `Please upload your missing document(s): ${missingDocs.join(", ")}`,
    data: { missingDocs, sent_by: adminUserId },
  });

  return {
    ok: true,
    emailSent,
    pushSent,
    missingDocs,
  };
}

async function handleProcessOnboardingReminders({ service }: AdminContext) {
  const { data: pendingUsers, error } = await service
    .from("profiles")
    .select("id, first_name, last_name, email, role, push_token, created_at, account_status")
    .eq("account_status", "pending")
    .neq("role", "admin");

  if (error || !pendingUsers) {
    throw new HttpError(500, error?.message ?? "Failed to query pending users.");
  }

  const { data: pastReminders } = await service
    .from("notifications")
    .select("user_id, type")
    .in("type", ["onboarding_reminder_3day", "onboarding_reminder_15day"]);

  const sentMap = new Set(
    (pastReminders ?? []).map((r) => `${r.user_id}:${r.type}`)
  );

  let day3Sent = 0;
  let day15Sent = 0;
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const resendFrom = Deno.env.get("RESEND_FROM_EMAIL") ?? "Kanek Support <support@belizechain.org>";

  for (const user of pendingUsers) {
    const ageMs = Date.now() - new Date(user.created_at).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    let reminderType: "3day" | "15day" | null = null;
    if (ageDays >= 15 && !sentMap.has(`${user.id}:onboarding_reminder_15day`)) {
      reminderType = "15day";
    } else if (ageDays >= 3 && !sentMap.has(`${user.id}:onboarding_reminder_3day`)) {
      reminderType = "3day";
    }

    if (!reminderType) continue;

    const missingDocs = await getMissingDocumentsForUser(service, user.id, user.role);
    if (missingDocs.length === 0) continue;

    const userName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "Kanek User";

    // Send email
    if (user.email && resendApiKey) {
      try {
        const html = buildReminderEmailHtml({
          userName,
          role: user.role,
          missingDocs,
          reminderType,
        });

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: resendFrom,
            to: [user.email],
            subject:
              reminderType === "15day"
                ? "Final Notice: Action Required to Verify Your Kanek Account"
                : "Reminder: Complete Your Kanek Account Verification",
            html,
          }),
        });
      } catch (e) {
        console.error(`Failed to send ${reminderType} email to ${user.email}:`, e);
      }
    }

    // Send push
    if (user.push_token) {
      await sendExpoPush(
        user.push_token,
        reminderType === "15day"
          ? "Final Reminder: Complete Verification"
          : "Reminder: Complete Kanek Verification",
        `Please submit your verification document(s) to activate your account: ${missingDocs.join(", ")}`
      );
    }

    // Record in notifications
    const notifType = `onboarding_reminder_${reminderType}`;
    await service.from("notifications").insert({
      user_id: user.id,
      type: notifType,
      title:
        reminderType === "15day"
          ? "Final Notice: Verification Documents Required"
          : "Reminder: Verification Documents Required",
      body: `Please upload your missing document(s): ${missingDocs.join(", ")}`,
      data: { missingDocs, reminderType },
    });

    sentMap.add(`${user.id}:${notifType}`);
    if (reminderType === "15day") day15Sent++;
    else day3Sent++;
  }

  return {
    scannedCount: pendingUsers.length,
    day3Sent,
    day15Sent,
  };
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
      case "/users/decline-account":
        responseBody = await handleDeclineAccount(context, payload);
        break;
      case "/users/send-reminder":
        responseBody = await handleSendReminder(context, payload);
        break;
      case "/users/process-onboarding-reminders":
        responseBody = await handleProcessOnboardingReminders(context);
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