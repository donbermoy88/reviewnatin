import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { compactVerify, decodeProtectedHeader, importX509 } from "npm:jose@5.9.6";
import * as x509 from "npm:@peculiar/x509";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANDROID_SKU_MAP: Record<string, string> = {
  plus_monthly: "com.reviewnatin.plus.monthly",
  plus_six_months: "com.reviewnatin.plus.six_months",
  plus_yearly: "com.reviewnatin.plus.yearly",
  exam_pass_cse_pro: "com.reviewnatin.exampass.cse_pro",
  exam_pass_cse_sub: "com.reviewnatin.exampass.cse_sub",
  exam_pass_let_elem: "com.reviewnatin.exampass.let_elem",
  exam_pass_let_sec: "com.reviewnatin.exampass.let_sec",
  exam_pass_pnle: "com.reviewnatin.exampass.pnle",
};

const APPLE_ROOT_CA_G3_SHA256 = "63343abfb89a6a03ebb57e9b3f5fa7be7c4f5c756f3017b3a8c488c3653e9179";

type EntitlementStatus =
  | "active"
  | "cancelled"
  | "expired"
  | "billing_retry"
  | "grace_period"
  | "refunded"
  | "revoked";

type AppleWebhookBody = {
  signedPayload?: string;
};

type AppleDecodedPayload = {
  notificationType?: string;
  subtype?: string;
  notificationUUID?: string;
  signedDate?: number;
  data?: {
    bundleId?: string;
    environment?: string;
    signedTransactionInfo?: string;
    signedRenewalInfo?: string;
  };
};

type AppleTransactionInfo = {
  transactionId?: string;
  originalTransactionId?: string;
  productId?: string;
  purchaseDate?: number;
  expiresDate?: number;
  revocationDate?: number;
  revocationReason?: number;
};

type AppleRenewalInfo = {
  autoRenewProductId?: string;
  autoRenewStatus?: number | boolean;
  gracePeriodExpiresDate?: number;
  expirationIntent?: number;
};

type GooglePubSubBody = {
  message?: {
    messageId?: string;
    data?: string;
  };
  subscription?: string;
};

type GoogleDeveloperNotification = {
  version?: string;
  packageName?: string;
  eventTimeMillis?: string;
  subscriptionNotification?: {
    version?: string;
    notificationType?: number;
    purchaseToken?: string;
    subscriptionId?: string;
  };
  oneTimeProductNotification?: {
    version?: string;
    notificationType?: number;
    purchaseToken?: string;
    sku?: string;
  };
  voidedPurchaseNotification?: {
    purchaseToken?: string;
    orderId?: string;
    productType?: number;
    refundType?: number;
  };
  testNotification?: Record<string, unknown>;
};

type GoogleSubscriptionV2 = {
  startTime?: string;
  subscriptionState?: string;
  latestOrderId?: string;
  linkedPurchaseToken?: string;
  canceledStateContext?: Record<string, unknown>;
  lineItems?: Array<{
    productId?: string;
    expiryTime?: string;
    autoRenewingPlan?: { autoRenewEnabled?: boolean };
    prepaidPlan?: Record<string, unknown>;
    latestSuccessfulOrderId?: string;
  }>;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeSku(platform: "apple" | "google", productId?: string): string | null {
  if (!productId) return null;
  return platform === "google" ? ANDROID_SKU_MAP[productId] ?? productId : productId;
}

function base64ToArrayBuffer(input: string): ArrayBuffer {
  const raw = atob(input);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes.buffer;
}

async function sha256Hex(data: BufferSource): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function trustedAppleLeafCertPem(x5cHeader: unknown): Promise<string | null> {
  const chain = Array.isArray(x5cHeader) && x5cHeader.every((cert) => typeof cert === "string")
    ? (x5cHeader as string[])
    : [];
  if (chain.length < 2) return null;

  const certificates = chain.map((cert) => new x509.X509Certificate(base64ToArrayBuffer(cert)));
  const root = certificates[certificates.length - 1];
  if ((await sha256Hex(root.rawData)) !== APPLE_ROOT_CA_G3_SHA256) return null;

  const now = new Date();
  for (const cert of certificates) {
    if (cert.notBefore > now || cert.notAfter < now) return null;
  }

  for (let i = 0; i < certificates.length - 1; i++) {
    const validSignature = await certificates[i].verify({
      signatureOnly: true,
      publicKey: certificates[i + 1],
    });
    if (!validSignature) return null;
  }

  return [
    "-----BEGIN CERTIFICATE-----",
    chain[0].match(/.{1,64}/g)?.join("\n") ?? chain[0],
    "-----END CERTIFICATE-----",
  ].join("\n");
}

async function verifyAppleJwsPayload<T>(signedPayload?: string): Promise<T | null> {
  if (!signedPayload) return null;

  try {
    const header = decodeProtectedHeader(signedPayload);
    const pem = await trustedAppleLeafCertPem(header.x5c);
    if (header.alg !== "ES256" || !pem) {
      return null;
    }

    const key = await importX509(pem, "ES256");
    const { payload } = await compactVerify(signedPayload, key);
    return JSON.parse(new TextDecoder().decode(payload)) as T;
  } catch {
    return null;
  }
}

function dateFromMillis(ms?: number): string | null {
  return typeof ms === "number" && Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

function dateFromMillisString(ms?: string): string | null {
  const parsed = ms ? Number(ms) : NaN;
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

function eventSecret(req: Request): string | null {
  const url = new URL(req.url);
  return req.headers.get("x-reviewnatin-webhook-secret") ?? url.searchParams.get("token");
}

function assertWebhookSecret(req: Request): Response | null {
  const expected = Deno.env.get("STORE_WEBHOOK_SECRET");
  // Fail closed: an unset secret previously let any caller POST fake store
  // lifecycle events (fraudulent entitlement grants/revocations). Require the
  // secret to be configured and to match before processing.
  if (!expected) {
    return jsonResponse({ error: "Webhook secret not configured" }, 503);
  }
  if (eventSecret(req) === expected) return null;
  return jsonResponse({ error: "Unauthorized" }, 401);
}

function appleStatus(notificationType?: string, subtype?: string): EntitlementStatus | null {
  switch (notificationType) {
    case "SUBSCRIBED":
    case "DID_RENEW":
    case "DID_RECOVER":
    case "REFUND_REVERSED":
      return "active";
    case "DID_CHANGE_RENEWAL_STATUS":
      return subtype === "AUTO_RENEW_DISABLED" ? "cancelled" : "active";
    case "DID_FAIL_TO_RENEW":
      return subtype === "GRACE_PERIOD" ? "grace_period" : "billing_retry";
    case "GRACE_PERIOD_EXPIRED":
    case "EXPIRED":
      return "expired";
    case "REFUND":
      return "refunded";
    case "REVOKE":
      return "revoked";
    default:
      return null;
  }
}

function googleStatus(state?: string, notificationType?: number): EntitlementStatus | null {
  if (notificationType === 12) return "revoked";
  if (notificationType === 13) return "expired";
  if (notificationType === 3) return "cancelled";
  if (notificationType === 5) return "billing_retry";
  if (notificationType === 6) return "grace_period";

  switch (state) {
    case "SUBSCRIPTION_STATE_ACTIVE":
      return "active";
    case "SUBSCRIPTION_STATE_CANCELED":
      return "cancelled";
    case "SUBSCRIPTION_STATE_IN_GRACE_PERIOD":
      return "grace_period";
    case "SUBSCRIPTION_STATE_ON_HOLD":
    case "SUBSCRIPTION_STATE_PAUSED":
      return "billing_retry";
    case "SUBSCRIPTION_STATE_EXPIRED":
    case "SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED":
      return "expired";
    default:
      return null;
  }
}

function appleAutoRenewStatus(status: AppleRenewalInfo["autoRenewStatus"]): boolean | null {
  if (typeof status === "boolean") return status;
  if (typeof status === "number") return status === 1;
  return null;
}

async function getGoogleAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson) as {
    client_email: string;
    private_key: string;
    token_uri: string;
  };

  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = btoa(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/androidpublisher",
      aud: sa.token_uri,
      iat: now,
      exp: now + 3600,
    }),
  );

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const unsigned = `${header}.${claim}`;
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, encoder.encode(unsigned));
  const jwt = `${unsigned}.${arrayBufferToBase64Url(signature)}`;

  const tokenRes = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const tokenJson = (await tokenRes.json()) as { access_token?: string; error?: string };
  if (!tokenJson.access_token) {
    throw new Error(tokenJson.error ?? "Failed to obtain Google access token");
  }
  return tokenJson.access_token;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const raw = atob(b64);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf.buffer;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function fetchGoogleSubscription(
  packageName: string,
  purchaseToken: string,
  accessToken: string,
): Promise<GoogleSubscriptionV2> {
  const url =
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptionsv2/tokens/${purchaseToken}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Google subscription lookup failed: ${await res.text()}`);
  return (await res.json()) as GoogleSubscriptionV2;
}

async function handleApple(req: Request, adminClient: ReturnType<typeof createClient>) {
  const body = (await req.json()) as AppleWebhookBody;
  const payload = await verifyAppleJwsPayload<AppleDecodedPayload>(body.signedPayload);
  if (!payload) return jsonResponse({ error: "Invalid signedPayload" }, 400);

  const expectedBundleId = Deno.env.get("APPLE_BUNDLE_ID");
  if (expectedBundleId && payload.data?.bundleId && payload.data.bundleId !== expectedBundleId) {
    return jsonResponse({ error: "Invalid bundleId" }, 400);
  }

  const transaction = await verifyAppleJwsPayload<AppleTransactionInfo>(payload.data?.signedTransactionInfo);
  const renewal = await verifyAppleJwsPayload<AppleRenewalInfo>(payload.data?.signedRenewalInfo);
  const notificationType = payload.notificationType ?? "UNKNOWN";
  const subtype = payload.subtype ?? null;
  const status = appleStatus(notificationType, subtype ?? undefined);
  const sku = normalizeSku("apple", transaction?.productId ?? renewal?.autoRenewProductId);
  const originalTransactionId = transaction?.originalTransactionId;
  const eventId = payload.notificationUUID ??
    `${notificationType}:${subtype ?? "none"}:${originalTransactionId ?? transaction?.transactionId ?? payload.signedDate ?? Date.now()}`;

  const { data, error } = await adminClient.rpc("apply_store_subscription_lifecycle", {
    p_provider: "apple",
    p_event_id: eventId,
    p_notification_type: notificationType,
    p_subtype: subtype,
    p_original_transaction_id: originalTransactionId ?? null,
    p_transaction_id: transaction?.transactionId ?? null,
    p_purchase_token: null,
    p_sku: sku,
    p_status: status,
    p_auto_renew_status: appleAutoRenewStatus(renewal?.autoRenewStatus),
    p_current_period_start: dateFromMillis(transaction?.purchaseDate),
    p_current_period_end: dateFromMillis(transaction?.expiresDate),
    p_grace_period_expires_at: dateFromMillis(renewal?.gracePeriodExpiresDate),
    p_cancellation_reason: renewal?.expirationIntent != null ? `expiration_intent_${renewal.expirationIntent}` : null,
    p_revoked_at: dateFromMillis(transaction?.revocationDate),
    p_event_time: dateFromMillis(payload.signedDate) ?? new Date().toISOString(),
    p_raw_payload: {
      apple: payload,
      transaction,
      renewal,
    },
  });

  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ success: true, result: data });
}

async function handleGoogle(req: Request, adminClient: ReturnType<typeof createClient>) {
  const body = (await req.json()) as GooglePubSubBody;
  const encoded = body.message?.data;
  if (!encoded) return jsonResponse({ error: "Missing Pub/Sub message.data" }, 400);

  const notification = JSON.parse(atob(encoded)) as GoogleDeveloperNotification;
  const packageName = notification.packageName ?? Deno.env.get("ANDROID_PACKAGE") ?? "ph.reviewnatin.app";
  const eventTime = dateFromMillisString(notification.eventTimeMillis) ?? new Date().toISOString();

  if (notification.testNotification) {
    const { data, error } = await adminClient.rpc("apply_store_subscription_lifecycle", {
      p_provider: "google",
      p_event_id: body.message?.messageId ?? `google-test:${eventTime}`,
      p_notification_type: "TEST_NOTIFICATION",
      p_subtype: null,
      p_original_transaction_id: null,
      p_transaction_id: null,
      p_purchase_token: null,
      p_sku: null,
      p_status: null,
      p_auto_renew_status: null,
      p_current_period_start: null,
      p_current_period_end: null,
      p_grace_period_expires_at: null,
      p_cancellation_reason: null,
      p_revoked_at: null,
      p_event_time: eventTime,
      p_raw_payload: { google: notification },
    });
    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ success: true, test: true, result: data });
  }

  const sub = notification.subscriptionNotification;
  const oneTime = notification.oneTimeProductNotification;
  const voided = notification.voidedPurchaseNotification;
  const serviceAccount = Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON");

  if (sub) {
    if (!serviceAccount) return jsonResponse({ error: "Google Play service account not configured" }, 503);
    const accessToken = await getGoogleAccessToken(serviceAccount);
    const purchase = await fetchGoogleSubscription(packageName, sub.purchaseToken, accessToken);
    const lineItem = purchase.lineItems?.find((item) => item.productId === sub.subscriptionId) ?? purchase.lineItems?.[0];
    const sku = normalizeSku("google", lineItem?.productId ?? sub.subscriptionId);
    const status = googleStatus(purchase.subscriptionState, sub.notificationType);
    const autoRenew = lineItem?.autoRenewingPlan?.autoRenewEnabled ?? null;
    const orderId = lineItem?.latestSuccessfulOrderId ?? purchase.latestOrderId ?? null;

    const { data, error } = await adminClient.rpc("apply_store_subscription_lifecycle", {
      p_provider: "google",
      p_event_id: body.message?.messageId ??
        `google-sub:${sub.notificationType}:${sub.purchaseToken}:${notification.eventTimeMillis ?? Date.now()}`,
      p_notification_type: `SUBSCRIPTION_${sub.notificationType ?? "UNKNOWN"}`,
      p_subtype: purchase.subscriptionState ?? null,
      p_original_transaction_id: sub.purchaseToken,
      p_transaction_id: orderId,
      p_purchase_token: sub.purchaseToken,
      p_sku: sku,
      p_status: status,
      p_auto_renew_status: autoRenew,
      p_current_period_start: purchase.startTime ?? null,
      p_current_period_end: lineItem?.expiryTime ?? null,
      p_grace_period_expires_at: purchase.subscriptionState === "SUBSCRIPTION_STATE_IN_GRACE_PERIOD" ? lineItem?.expiryTime ?? null : null,
      p_cancellation_reason: purchase.canceledStateContext ? JSON.stringify(purchase.canceledStateContext) : null,
      p_revoked_at: sub.notificationType === 12 ? eventTime : null,
      p_event_time: eventTime,
      p_raw_payload: { google: notification, subscription: purchase },
    });

    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ success: true, result: data });
  }

  if (oneTime) {
    const status: EntitlementStatus | null = oneTime.notificationType === 2 ? "revoked" : "active";
    const { data, error } = await adminClient.rpc("apply_store_subscription_lifecycle", {
      p_provider: "google",
      p_event_id: body.message?.messageId ??
        `google-onetime:${oneTime.notificationType}:${oneTime.purchaseToken}:${notification.eventTimeMillis ?? Date.now()}`,
      p_notification_type: `ONE_TIME_${oneTime.notificationType ?? "UNKNOWN"}`,
      p_subtype: null,
      p_original_transaction_id: oneTime.purchaseToken,
      p_transaction_id: null,
      p_purchase_token: oneTime.purchaseToken,
      p_sku: normalizeSku("google", oneTime.sku),
      p_status: status,
      p_auto_renew_status: false,
      p_current_period_start: null,
      p_current_period_end: null,
      p_grace_period_expires_at: null,
      p_cancellation_reason: oneTime.notificationType === 2 ? "one_time_product_canceled" : null,
      p_revoked_at: oneTime.notificationType === 2 ? eventTime : null,
      p_event_time: eventTime,
      p_raw_payload: { google: notification },
    });
    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ success: true, result: data });
  }

  if (voided) {
    const { data, error } = await adminClient.rpc("apply_store_subscription_lifecycle", {
      p_provider: "google",
      p_event_id: body.message?.messageId ??
        `google-voided:${voided.orderId ?? voided.purchaseToken}:${notification.eventTimeMillis ?? Date.now()}`,
      p_notification_type: "VOIDED_PURCHASE",
      p_subtype: voided.productType != null ? `product_type_${voided.productType}` : null,
      p_original_transaction_id: voided.purchaseToken ?? null,
      p_transaction_id: voided.orderId ?? null,
      p_purchase_token: voided.purchaseToken ?? null,
      p_sku: null,
      p_status: "revoked",
      p_auto_renew_status: false,
      p_current_period_start: null,
      p_current_period_end: null,
      p_grace_period_expires_at: null,
      p_cancellation_reason: voided.refundType != null ? `refund_type_${voided.refundType}` : "voided_purchase",
      p_revoked_at: eventTime,
      p_event_time: eventTime,
      p_raw_payload: { google: notification },
    });
    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ success: true, result: data });
  }

  return jsonResponse({ error: "Unsupported Google notification" }, 400);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const secretError = assertWebhookSecret(req);
  if (secretError) return secretError;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const path = new URL(req.url).pathname;
    if (path.endsWith("/apple")) {
      return await handleApple(req, adminClient);
    }
    if (path.endsWith("/google")) {
      return await handleGoogle(req, adminClient);
    }

    return jsonResponse({ error: "Use /store-webhook/apple or /store-webhook/google" }, 404);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook processing failed";
    return jsonResponse({ error: message }, 500);
  }
});
