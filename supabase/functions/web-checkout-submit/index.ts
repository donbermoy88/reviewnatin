import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type SubmitPayload = {
  reference_code: string;
  confirm_demo?: boolean;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "method_not_allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const demoMode = Deno.env.get("CHECKOUT_DEMO_MODE") === "true";

  if (!supabaseUrl || !serviceKey || !anonKey) {
    return jsonResponse({ success: false, error: "server_misconfigured" }, 500);
  }

  let payload: SubmitPayload;
  try {
    payload = (await req.json()) as SubmitPayload;
  } catch {
    return jsonResponse({ success: false, error: "invalid_json" }, 400);
  }

  if (!payload.reference_code) {
    return jsonResponse({ success: false, error: "missing_reference_code" }, 400);
  }

  const admin = createClient(supabaseUrl, serviceKey);

  const authHeader = req.headers.get("Authorization");
  let userId: string | null = null;

  if (authHeader) {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data } = await userClient.auth.getUser();
    userId = data.user?.id ?? null;
  }

  const { data: sessionRow, error: sessionError } = await admin
    .from("web_checkout_sessions")
    .select("id, user_id, status, expires_at")
    .eq("reference_code", payload.reference_code)
    .maybeSingle();

  if (sessionError || !sessionRow) {
    return jsonResponse({ success: false, error: "checkout_not_found" }, 404);
  }

  if (userId && sessionRow.user_id !== userId) {
    return jsonResponse({ success: false, error: "forbidden" }, 403);
  }

  if (sessionRow.status === "paid") {
    return jsonResponse({ success: true, status: "paid", duplicate: true });
  }

  if (sessionRow.status === "expired" || new Date(sessionRow.expires_at) < new Date()) {
    await admin
      .from("web_checkout_sessions")
      .update({ status: "expired" })
      .eq("id", sessionRow.id);
    return jsonResponse({ success: false, error: "checkout_expired" }, 410);
  }

  await admin
    .from("web_checkout_sessions")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("id", sessionRow.id);

  if (demoMode && payload.confirm_demo) {
    const { data: fulfillData, error: fulfillError } = await admin.rpc("fulfill_web_checkout", {
      p_reference_code: payload.reference_code,
      p_auto_demo: true,
    });

    if (fulfillError) {
      return jsonResponse({ success: false, error: fulfillError.message, status: "submitted" }, 500);
    }

    return jsonResponse({
      success: true,
      status: "paid",
      demo: true,
      fulfillment: fulfillData,
    });
  }

  return jsonResponse({
    success: true,
    status: "submitted",
    message: "Payment submitted for verification. Access unlocks within 24 hours after confirmation.",
  });
});
