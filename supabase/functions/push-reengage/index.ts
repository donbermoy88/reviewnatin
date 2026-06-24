import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const cronSecret = Deno.env.get("PUSH_CRON_SECRET");

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "server_misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fail closed: without an enforced secret this cron endpoint could be invoked
  // by anyone (verify_jwt = false), spamming push notifications to all users.
  if (!cronSecret) {
    return new Response(JSON.stringify({ error: "cron_secret_not_configured" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });

  const { data: users, error } = await admin
    .from("users")
    .select("id, streak_count, streak_last_date")
    .gt("streak_count", 0)
    .lt("streak_last_date", today);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let sent = 0;
  let skipped = 0;

  for (const user of users ?? []) {
    const { data: prefs } = await admin
      .from("user_preferences")
      .select("notifications_enabled")
      .eq("user_id", user.id)
      .maybeSingle();

    if (prefs && prefs.notifications_enabled === false) {
      skipped += 1;
      continue;
    }

    const { data: tokens } = await admin
      .from("user_push_tokens")
      .select("token")
      .eq("user_id", user.id);

    if (!tokens?.length) {
      skipped += 1;
      continue;
    }

    for (const row of tokens) {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: row.token,
          title: "ReviewNatin 📚",
          body: `🔥 ${user.streak_count}-day streak at risk — quick review lang before midnight!`,
          sound: "default",
          data: {
            url: "reviewnatin://home",
            screen: "home",
          },
        }),
      });
      if (res.ok) sent += 1;
    }
  }

  return new Response(
    JSON.stringify({ ok: true, candidates: users?.length ?? 0, sent, skipped }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
