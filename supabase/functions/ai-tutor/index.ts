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

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildFallbackReply(locale: "en" | "fil", examSlug: string): string {
  if (locale === "fil") {
    return `Nandito ako para tumulong sa ${examSlug.replace(/-/g, " ")} review mo!

Pwede mong itanong:
• Paano i-approach ang topic na hirap ka?
• Ano ang dapat unahin sa araw-araw na review?
• Paano mag-prepare bago mock exam?

Sabihin mo lang kung anong subject o topic ang gusto mong pag-usapan.`;
  }

  return `I'm here to help with your ${examSlug.replace(/-/g, " ")} prep!

You can ask about:
• How to approach a weak topic
• What to prioritize in daily review
• How to prepare before a mock exam

Tell me which subject or topic you'd like to focus on.`;
}

async function generateWithClaude(
  apiKey: string,
  messages: ChatMessage[],
  examSlug: string,
  locale: "en" | "fil"
): Promise<string | null> {
  const lang = locale === "fil" ? "Filipino (Taglish OK)" : "English";
  const system = `You are ReviewNatin, a friendly Philippine licensure exam tutor for ${examSlug.replace(/-/g, " ")}.
Respond in ${lang}. Keep answers concise (2–4 short paragraphs), exam-focused, and encouraging.
Do not invent official exam dates or passing scores. Remind users to verify schedules on CSC/PRC sites when relevant.`;

  // A network/DNS failure on the upstream call must NOT crash the handler — it
  // should degrade to the canned fallback reply. Without this, a thrown fetch
  // bubbles up and the whole function returns a 500 ("non-2xx status code").
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        // Haiku: ~5x cheaper than Sonnet, ample for exam Q&A tutoring (cost control).
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        system,
        messages: messages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = data.content?.find((b) => b.type === "text")?.text?.trim();
    return text || null;
  } catch {
    return null;
  }
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

  let payload: TutorPayload;
  try {
    payload = (await req.json()) as TutorPayload;
  } catch {
    return jsonResponse({ success: false, error: "invalid_json" }, 400);
  }

  const locale = payload.locale === "fil" ? "fil" : "en";
  const examSlug = payload.exam_slug ?? "cse-professional";
  const messages = (payload.messages ?? []).filter(
    (m) => m?.role && m?.content?.trim()
  ) as ChatMessage[];

  if (messages.length === 0 || messages[messages.length - 1]?.role !== "user") {
    return jsonResponse({ success: false, error: "missing_user_message" }, 400);
  }

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });

  const { data: limits } = await userClient.rpc("get_usage_limits", {
    p_exam_slug: examSlug,
  });

  const limitsRow = limits as Record<string, unknown> | null;
  const isPremium = Boolean(limitsRow?.is_premium);

  if (!isPremium) {
    return jsonResponse({ success: false, error: "premium_required" }, 403);
  }

  // Daily message cap — applies even to premium so one user can't run up
  // unbounded Anthropic spend. Checked BEFORE the model call. Tune as revenue
  // allows; 5/day keeps worst-case cost low (~$50/mo at 100 premium on Haiku).
  const DAILY_TUTOR_MESSAGE_LIMIT = 5;
  const { data: usageRow } = await admin
    .from("ai_tutor_usage")
    .select("message_count")
    .eq("user_id", userData.user.id)
    .eq("usage_date", today)
    .maybeSingle();

  const used = (usageRow?.message_count as number | undefined) ?? 0;
  if (used >= DAILY_TUTOR_MESSAGE_LIMIT) {
    return jsonResponse(
      { success: false, error: "daily_limit_reached", limit: DAILY_TUTOR_MESSAGE_LIMIT },
      429,
    );
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  const reply =
    (apiKey ? await generateWithClaude(apiKey, messages, examSlug, locale) : null) ??
    buildFallbackReply(locale, examSlug);

  await admin.from("ai_tutor_usage").upsert(
    {
      user_id: userData.user.id,
      usage_date: today,
      message_count: used + 1,
    },
    { onConflict: "user_id,usage_date" }
  );

  return jsonResponse({
    success: true,
    reply,
    remaining: DAILY_TUTOR_MESSAGE_LIMIT - (used + 1),
    source: apiKey ? "ai" : "fallback",
  });
});
