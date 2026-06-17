import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ExplainPayload = {
  question_id: string;
  exam_slug?: string;
  locale?: "en" | "fil";
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildFallbackExplanation(
  stem: string,
  choices: Array<{ id: string; text: string; is_correct?: boolean }>,
  correctId: string,
  locale: "en" | "fil"
): string {
  const correct = choices.find((c) => c.id === correctId);
  const correctText = correct?.text ?? "the marked correct choice";

  if (locale === "fil") {
    return `Tamang sagot: ${correctText}

Paano i-analyze:
1. Basahin muna ang tanong at hanapin ang keyword.
2. I-eliminate ang malinaw na mali.
3. Piliin ang opsyon na pinaka-tugma sa concept sa tanong.

Sa item na ito, ang tamang sagot ay sumusuporta sa main idea ng tanong: "${stem.slice(0, 120)}${stem.length > 120 ? "…" : ""}"`;
  }

  return `Correct answer: ${correctText}

How to think through this:
1. Identify what the question is really asking.
2. Eliminate choices that contradict the stem or key facts.
3. Pick the option that best matches the tested concept.

For this item, the correct choice aligns with the core idea in: "${stem.slice(0, 120)}${stem.length > 120 ? "…" : ""}"`;
}

async function generateWithClaude(
  apiKey: string,
  stem: string,
  choices: Array<{ id: string; text: string }>,
  correctId: string,
  locale: "en" | "fil"
): Promise<string | null> {
  const choiceLines = choices.map((c, i) => `${String.fromCharCode(65 + i)}. ${c.text}`).join("\n");
  const correct = choices.find((c) => c.id === correctId);
  const lang = locale === "fil" ? "Filipino (Taglish OK)" : "English";

  // Degrade to the canned fallback on any upstream network failure instead of
  // letting a thrown fetch 500 the whole function.
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        // Haiku: ~5x cheaper than Sonnet, ample for question explanations (cost control).
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content: `You are a friendly Philippine licensure exam tutor. Explain in ${lang} (2–4 short paragraphs, bullet points OK).

Question: ${stem}

Choices:
${choiceLines}

Correct answer: ${correct?.text ?? "unknown"}

Explain WHY the correct answer is right and briefly why common wrong choices fail. Be concise and exam-focused.`,
          },
        ],
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

  let payload: ExplainPayload;
  try {
    payload = (await req.json()) as ExplainPayload;
  } catch {
    return jsonResponse({ success: false, error: "invalid_json" }, 400);
  }

  if (!payload.question_id) {
    return jsonResponse({ success: false, error: "missing_question_id" }, 400);
  }

  const locale = payload.locale === "fil" ? "fil" : "en";
  const examSlug = payload.exam_slug ?? "cse-professional";
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });

  const { data: limits } = await userClient.rpc("get_usage_limits", {
    p_exam_slug: examSlug,
  });

  const limitsRow = limits as Record<string, unknown> | null;
  const isPremium = Boolean(limitsRow?.is_premium);
  const remaining = limitsRow?.ai_explanations_remaining as number | null | undefined;

  if (!isPremium && remaining != null && remaining <= 0) {
    return jsonResponse({ success: false, error: "daily_limit_reached" }, 429);
  }

  const { data: question, error: qError } = await admin
    .from("questions")
    .select("id, stem, choices, explanation_en, explanation_fil")
    .eq("id", payload.question_id)
    .single();

  if (qError || !question) {
    return jsonResponse({ success: false, error: "question_not_found" }, 404);
  }

  const choices = (question.choices ?? []) as Array<{ id: string; text: string; is_correct?: boolean }>;
  const correctId = choices.find((c) => c.is_correct)?.id ?? "";

  const existing =
    locale === "fil"
      ? (question.explanation_fil as string | null)
      : (question.explanation_en as string | null);

  let explanation = existing?.trim() || null;
  let source: "human" | "ai" | "fallback" = existing ? "human" : "fallback";

  if (!explanation) {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (apiKey) {
      explanation = await generateWithClaude(apiKey, question.stem, choices, correctId, locale);
      if (explanation) source = "ai";
    }
  }

  if (!explanation) {
    explanation = buildFallbackExplanation(question.stem, choices, correctId, locale);
    source = "fallback";
  }

  if (!isPremium) {
    const { data: usageRow } = await admin
      .from("ai_explanation_usage")
      .select("count")
      .eq("user_id", userData.user.id)
      .eq("usage_date", today)
      .maybeSingle();

    const nextCount = ((usageRow?.count as number | undefined) ?? 0) + 1;

    await admin.from("ai_explanation_usage").upsert(
      {
        user_id: userData.user.id,
        usage_date: today,
        count: nextCount,
      },
      { onConflict: "user_id,usage_date" }
    );
  }

  return jsonResponse({
    success: true,
    explanation,
    source,
    remaining: isPremium ? null : Math.max(0, (remaining ?? 5) - 1),
  });
});
