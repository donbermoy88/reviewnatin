import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ChatMessage = { role: "user" | "assistant"; content: string };

type TutorPayload = {
  messages?: ChatMessage[];
  exam_slug?: string;
  locale?: "en" | "fil";
};

// ── Config (env-overridable) ────────────────────────────────────────────────
// Provider is OpenAI only. Model is configurable so it can be tuned without a
// code change/redeploy, but defaults to the cheap gpt-4o-mini.
const OPENAI_MODEL = Deno.env.get("OPENAI_TUTOR_MODEL") ?? "gpt-4o-mini";
const MAX_OUTPUT_TOKENS = Number(Deno.env.get("AI_TUTOR_MAX_OUTPUT_TOKENS")) || 400;
const LIMIT_PREMIUM = Number(Deno.env.get("AI_TUTOR_DAILY_LIMIT_PREMIUM")) || 5;
const LIMIT_SIX_MONTH = Number(Deno.env.get("AI_TUTOR_DAILY_LIMIT_SIX_MONTH")) || 10;
const LIMIT_YEARLY = Number(Deno.env.get("AI_TUTOR_DAILY_LIMIT_YEARLY")) || 15;
const COOLDOWN_SECONDS = Number(Deno.env.get("AI_TUTOR_COOLDOWN_SECONDS")) || 6;
const MAX_INPUT_CHARS = Number(Deno.env.get("AI_TUTOR_MAX_INPUT_CHARS")) || 1000;
const HISTORY_LIMIT = 6; // only the most recent turns are sent (cost control)
const OPENAI_TIMEOUT_MS = 20_000;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Safe structured log — never includes keys, tokens, or message bodies.
function log(fields: Record<string, unknown>) {
  try {
    console.log(JSON.stringify({ fn: "ai-tutor", ...fields }));
  } catch {
    /* ignore logging failures */
  }
}

function buildFallbackReply(locale: "en" | "fil", examSlug: string): string {
  const exam = examSlug.replace(/-/g, " ");
  if (locale === "fil") {
    return `Nandito ako para tumulong sa ${exam} review mo!

Pwede mong itanong:
• Paano i-approach ang topic na hirap ka?
• Bakit tama ang sagot sa isang tanong?
• Ano ang dapat unahin sa araw-araw na review?

Sabihin mo lang kung anong tanong o topic ang gusto mong linawin.`;
  }
  return `I'm here to help with your ${exam} review!

You can ask about:
• How to approach a weak topic
• Why a correct answer is correct
• What to prioritize in your daily review

Tell me which question or topic you'd like to clarify.`;
}

function systemPrompt(examSlug: string, locale: "en" | "fil"): string {
  const exam = examSlug.replace(/-/g, " ");
  const lang = locale === "fil" ? "Filipino/Taglish (natural Taglish is fine)" : "English";
  return `You are ReviewNatin's study tutor for the ${exam} licensure review in the Philippines.
Your job: help the learner understand exam questions and concepts. When relevant, explain why the correct answer is correct, why common wrong choices are wrong, and give one short, practical study tip.
Reply in ${lang}. Be concise — at most ~4 short paragraphs or a short bullet list.
Stay strictly on exam-review topics. If the user asks something unrelated to reviewing for this exam, politely decline and steer them back to review.
Never guarantee that the user will pass. Never claim to be an official PRC, CSC, or government source, and never present yourself as providing official exam content. Remind users to verify schedules/requirements on official CSC/PRC sites when relevant.`;
}

/** Generate a reply with OpenAI (Chat Completions). Returns null on any failure
 *  so the caller can fall back to the canned reply instead of erroring. */
async function generateWithOpenAI(
  apiKey: string,
  messages: ChatMessage[],
  examSlug: string,
  locale: "en" | "fil",
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: OPENAI_MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: 0.5,
        messages: [
          { role: "system", content: systemPrompt(examSlug, locale) },
          // Only the most recent turns — never the whole conversation (cost control).
          ...messages.slice(-HISTORY_LIMIT).map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });
    if (!res.ok) {
      log({ event: "openai_http_error", status: res.status });
      return null;
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = data?.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch (e) {
    log({ event: "openai_exception", error: (e as Error)?.name ?? "unknown" });
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Per-plan daily message cap from the entitlement SKU. */
function dailyLimitForSku(sku: string): number {
  const s = (sku ?? "").toLowerCase();
  if (s.includes("yearly")) return LIMIT_YEARLY;
  if (s.includes("six_months")) return LIMIT_SIX_MONTH;
  // monthly Plus, exam passes, or any other active premium → base limit.
  return LIMIT_PREMIUM;
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
  if (!supabaseUrl || !serviceKey || !anonKey) {
    return jsonResponse({ success: false, error: "server_misconfigured" }, 500);
  }

  // ── Auth (server-side, never trust the client) ──────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ success: false, error: "not_authenticated" }, 401);
  }
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const admin = createClient(supabaseUrl, serviceKey);
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return jsonResponse({ success: false, error: "not_authenticated" }, 401);
  }
  const uid = userData.user.id;

  // ── Parse + validate input ──────────────────────────────────────────────────
  let payload: TutorPayload;
  try {
    payload = (await req.json()) as TutorPayload;
  } catch {
    return jsonResponse({ success: false, error: "invalid_json" }, 400);
  }
  const locale = payload.locale === "fil" ? "fil" : "en";
  const examSlug = payload.exam_slug ?? "cse-professional";
  const messages = (payload.messages ?? []).filter((m) => m?.role && m?.content?.trim()) as ChatMessage[];
  if (messages.length === 0 || messages[messages.length - 1]?.role !== "user") {
    return jsonResponse({ success: false, error: "missing_user_message" }, 400);
  }
  const lastUserMessage = messages[messages.length - 1].content;
  if (lastUserMessage.length > MAX_INPUT_CHARS) {
    return jsonResponse({ success: false, error: "input_too_long", max: MAX_INPUT_CHARS }, 400);
  }

  // ── Premium gate (server-side; uses the hardened user_has_content_access via RPC) ─
  const { data: limits } = await userClient.rpc("get_usage_limits", { p_exam_slug: examSlug });
  const isPremium = Boolean((limits as Record<string, unknown> | null)?.is_premium);
  if (!isPremium) {
    log({ user: uid, event: "blocked_premium_required" });
    return jsonResponse({ success: false, error: "premium_required" }, 403);
  }

  // ── Per-plan daily limit from active entitlements ───────────────────────────
  const now = Date.now();
  const { data: ents } = await admin
    .from("user_entitlements")
    .select(
      "expires_at, current_period_end, grace_period_expires_at, revoked_at, status, source, subscription_products ( sku )",
    )
    .eq("user_id", uid);
  let dailyLimit = LIMIT_PREMIUM;
  for (const e of ents ?? []) {
    if (e.revoked_at) continue;
    if (["refunded", "revoked", "expired"].includes((e.status as string) ?? "active")) continue;
    const end = (e.grace_period_expires_at ?? e.current_period_end ?? e.expires_at) as string | null;
    if (end && new Date(end).getTime() <= now) continue;
    const sku = (e.subscription_products as unknown as { sku?: string } | null)?.sku ?? "";
    dailyLimit = Math.max(dailyLimit, dailyLimitForSku(sku));
  }

  // ── Usage row (count + last request time) ───────────────────────────────────
  // The cooldown uses last_message_at, which an additive migration adds. To avoid
  // a hard schema dependency (so this deploys safely before that migration is
  // applied), detect the column: if the richer select fails, fall back to the
  // count-only select and disable the cooldown until the column exists.
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  let cooldownSupported = true;
  let usageRes = await admin
    .from("ai_tutor_usage")
    .select("message_count, last_message_at")
    .eq("user_id", uid)
    .eq("usage_date", today)
    .maybeSingle();
  if (usageRes.error) {
    cooldownSupported = false;
    usageRes = await admin
      .from("ai_tutor_usage")
      .select("message_count")
      .eq("user_id", uid)
      .eq("usage_date", today)
      .maybeSingle();
  }
  const usageRow = usageRes.data as { message_count?: number; last_message_at?: string } | null;
  const used = usageRow?.message_count ?? 0;
  const lastAt = cooldownSupported && usageRow?.last_message_at
    ? new Date(usageRow.last_message_at).getTime()
    : 0;

  // ── Per-user cooldown (anti-burst) — checked before the daily cap ───────────
  if (lastAt && now - lastAt < COOLDOWN_SECONDS * 1000) {
    const retryAfter = Math.ceil((COOLDOWN_SECONDS * 1000 - (now - lastAt)) / 1000);
    log({ user: uid, event: "blocked_cooldown", retry_after: retryAfter });
    return jsonResponse({ success: false, error: "cooldown", retry_after: retryAfter }, 429);
  }

  // ── Hard daily cap — block BEFORE any OpenAI call ───────────────────────────
  if (used >= dailyLimit) {
    log({ user: uid, event: "blocked_daily_limit", limit: dailyLimit });
    return jsonResponse({ success: false, error: "daily_limit_reached", limit: dailyLimit }, 429);
  }

  // ── Generate (OpenAI only; canned fallback if key/API unavailable) ──────────
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  const aiReply = apiKey ? await generateWithOpenAI(apiKey, messages, examSlug, locale) : null;
  const reply = aiReply ?? buildFallbackReply(locale, examSlug);
  const source = aiReply ? "ai" : "fallback";

  // Count the message (and stamp the cooldown clock only where the column exists).
  const usageUpsert: Record<string, unknown> = {
    user_id: uid,
    usage_date: today,
    message_count: used + 1,
  };
  if (cooldownSupported) usageUpsert.last_message_at = new Date(now).toISOString();
  await admin.from("ai_tutor_usage").upsert(usageUpsert, { onConflict: "user_id,usage_date" });

  log({ user: uid, provider: "openai", model: OPENAI_MODEL, limit: dailyLimit, used: used + 1, source });

  return jsonResponse({
    success: true,
    reply,
    remaining: dailyLimit - (used + 1),
    limit: dailyLimit,
    source,
  });
});
