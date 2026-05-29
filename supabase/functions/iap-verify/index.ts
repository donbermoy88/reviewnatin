import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APPLE_PRODUCTION = "https://buy.itunes.apple.com/verifyReceipt";
const APPLE_SANDBOX = "https://sandbox.itunes.apple.com/verifyReceipt";

/** Google Play product IDs → canonical App Store SKU in subscription_products */
const ANDROID_SKU_MAP: Record<string, string> = {
  plus_monthly: "com.reviewnatin.plus.monthly",
  plus_yearly: "com.reviewnatin.plus.yearly",
  exam_pass_cse_pro: "com.reviewnatin.exampass.cse_pro",
  exam_pass_cse_sub: "com.reviewnatin.exampass.cse_sub",
  exam_pass_let_elem: "com.reviewnatin.exampass.let_elem",
  exam_pass_let_sec: "com.reviewnatin.exampass.let_sec",
  exam_pass_pnle: "com.reviewnatin.exampass.pnle",
};

type VerifyPayload = {
  platform: "apple" | "google";
  product_id: string;
  transaction_id: string;
  receipt_data?: string;
  purchase_token?: string;
};

type AppleVerifyResponse = {
  status: number;
  receipt?: {
    in_app?: Array<{
      product_id: string;
      transaction_id: string;
      original_transaction_id?: string;
    }>;
  };
  latest_receipt_info?: Array<{
    product_id: string;
    transaction_id: string;
    original_transaction_id?: string;
  }>;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeSku(platform: "apple" | "google", productId: string): string {
  if (platform === "google") {
    return ANDROID_SKU_MAP[productId] ?? productId;
  }
  return productId;
}

async function verifyAppleReceipt(receiptData: string, sharedSecret: string): Promise<AppleVerifyResponse> {
  const post = async (url: string) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "receipt-data": receiptData,
        password: sharedSecret,
        "exclude-old-transactions": false,
      }),
    });
    return (await res.json()) as AppleVerifyResponse;
  };

  let result = await post(APPLE_PRODUCTION);
  if (result.status === 21007) {
    result = await post(APPLE_SANDBOX);
  }
  return result;
}

async function verifyGooglePurchase(
  packageName: string,
  productId: string,
  purchaseToken: string,
  accessToken: string,
  isSubscription: boolean
): Promise<{ ok: boolean; orderId?: string; raw?: unknown }> {
  const kind = isSubscription ? "subscriptions" : "products";
  const url =
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/${kind}/${productId}/tokens/${purchaseToken}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    return { ok: false, raw: await res.text() };
  }

  const data = (await res.json()) as { orderId?: string; purchaseState?: number; paymentState?: number };
  const purchased = isSubscription ? data.paymentState === 1 || data.paymentState === 2 : data.purchaseState === 0;
  return purchased ? { ok: true, orderId: data.orderId, raw: data } : { ok: false, raw: data };
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
    })
  );

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // Rate limit: 10 verify attempts per user per hour.
    // We rely on the rate_limit_checks table and helpers added in
    // 20260529000002_rate_limiting.sql.
    const RATE_LIMIT = 10;
    const { data: attemptCount } = await adminClient.rpc(
      "count_rate_limit_attempts",
      {
        p_actor_key: userData.user.id,
        p_action: "iap_verify",
        p_window: "1 hour",
      }
    );
    if (typeof attemptCount === "number" && attemptCount >= RATE_LIMIT) {
      return jsonResponse(
        { error: "Too many verification attempts. Please try again later." },
        429
      );
    }
    await adminClient.rpc("record_rate_limit_attempt", {
      p_actor_key: userData.user.id,
      p_action: "iap_verify",
      p_succeeded: true,
      p_metadata: null,
    });

    const body = (await req.json()) as VerifyPayload;
    const platform = body.platform;
    const transactionId = body.transaction_id?.trim();
    const productId = body.product_id?.trim();

    if (!platform || !transactionId || !productId) {
      return jsonResponse({ error: "platform, product_id, and transaction_id are required" }, 400);
    }

    const canonicalSku = normalizeSku(platform, productId);
    let verified = false;
    let rawReceipt: Record<string, unknown> = { platform, product_id: productId };

    if (platform === "apple") {
      const sharedSecret = Deno.env.get("APPLE_IAP_SHARED_SECRET");
      if (!sharedSecret) {
        return jsonResponse({ error: "Apple IAP not configured (APPLE_IAP_SHARED_SECRET)" }, 503);
      }
      if (!body.receipt_data) {
        return jsonResponse({ error: "receipt_data required for Apple" }, 400);
      }

      const apple = await verifyAppleReceipt(body.receipt_data, sharedSecret);
      if (apple.status !== 0) {
        return jsonResponse({ error: "Invalid Apple receipt", status: apple.status }, 400);
      }

      const items = [...(apple.latest_receipt_info ?? []), ...(apple.receipt?.in_app ?? [])];
      verified = items.some(
        (item) =>
          item.transaction_id === transactionId &&
          (item.product_id === productId || item.product_id === canonicalSku)
      );
      rawReceipt = { ...rawReceipt, apple_status: apple.status };
    } else if (platform === "google") {
      const serviceAccount = Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON");
      const packageName = Deno.env.get("ANDROID_PACKAGE") ?? "ph.reviewnatin.app";
      if (!serviceAccount) {
        return jsonResponse({ error: "Google Play IAP not configured" }, 503);
      }
      if (!body.purchase_token) {
        return jsonResponse({ error: "purchase_token required for Google" }, 400);
      }

      const accessToken = await getGoogleAccessToken(serviceAccount);
      const { data: isSubRow } = await adminClient.rpc("iap_product_is_subscription", {
        p_sku: canonicalSku,
      });
      const isSub = isSubRow === true || productId.includes("monthly") || productId.includes("yearly");
      const google = await verifyGooglePurchase(
        packageName,
        productId,
        body.purchase_token,
        accessToken,
        isSub
      );
      verified = google.ok;
      rawReceipt = { ...rawReceipt, google: google.raw };
    } else {
      return jsonResponse({ error: "Invalid platform" }, 400);
    }

    if (!verified) {
      return jsonResponse({ error: "Purchase could not be verified for this transaction" }, 400);
    }

    const { data: fulfillData, error: fulfillError } = await adminClient.rpc("fulfill_iap_purchase", {
      p_user_id: userData.user.id,
      p_sku: canonicalSku,
      p_transaction_id: transactionId,
      p_provider: platform,
      p_raw_receipt: rawReceipt,
    });

    if (fulfillError) {
      return jsonResponse({ error: fulfillError.message }, 500);
    }

    const { data: entitlements } = await userClient
      .from("user_entitlements")
      .select("id, expires_at, subscription_products ( sku, tier )")
      .eq("user_id", userData.user.id);

    return jsonResponse({
      success: true,
      fulfillment: fulfillData,
      entitlements: entitlements ?? [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed";
    return jsonResponse({ error: message }, 500);
  }
});
