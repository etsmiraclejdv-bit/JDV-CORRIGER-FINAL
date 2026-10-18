import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

declare const Deno: { env: { get(key: string): string | undefined } };

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://crmjdvgestion.netlify.app",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-jdv-worker-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

/**
 * Safety-first scaffold. This function deliberately NEVER calls a social provider.
 * It is intended for local/staging dry-runs only until provider adapters, OAuth
 * verification, locking/claim RPC, and a security review have been implemented.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  const expectedSecret = Deno.env.get("JDV_SOCIAL_WORKER_SECRET");
  const suppliedSecret = req.headers.get("x-jdv-worker-secret") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!expectedSecret || !serviceRoleKey || !supabaseUrl) {
    return json({ error: "Worker non configuré; aucune action exécutée" }, 503);
  }
  if (suppliedSecret.length < 32 || suppliedSecret !== expectedSecret) {
    return json({ error: "Authentification worker refusée" }, 401);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Dry-run only: inspect a small batch; do not mutate queue rows or contact providers.
  const { data: rows, error } = await supabase
    .from("jdv_social_posts")
    .select("id,campaign_id,owner_user_id,connection_id,platform,scheduled_at,status,idempotency_key,attempt_count")
    .in("status", ["queued", "failed"])
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(25);

  if (error) {
    console.error("[social-automation-worker] queue inspection failed", error.code);
    return json({ error: "Inspection de file impossible", code: error.code ?? "QUERY_FAILED" }, 500);
  }

  const results: Array<{ id: string; result: string; reason?: string }> = [];
  for (const post of rows ?? []) {
    const { data: campaign, error: campaignError } = await supabase
      .from("jdv_marketing_campaigns")
      .select("id,created_by,channel,budget,automation_mode,approved_at,automation_starts_at,automation_ends_at,publication_paused_at")
      .eq("id", post.campaign_id)
      .maybeSingle();

    if (campaignError || !campaign) {
      results.push({ id: post.id, result: "blocked", reason: "CAMPAIGN_NOT_FOUND" });
      continue;
    }
    if (campaign.created_by !== post.owner_user_id) {
      results.push({ id: post.id, result: "blocked", reason: "OWNER_MISMATCH" });
      continue;
    }
    if (campaign.channel !== "organic" || Number(campaign.budget) !== 0) {
      results.push({ id: post.id, result: "blocked", reason: "ORGANIC_ZERO_BUDGET_REQUIRED" });
      continue;
    }
    if (campaign.automation_mode !== "auto_14_days" || !campaign.approved_at) {
      results.push({ id: post.id, result: "blocked", reason: "INITIAL_APPROVAL_REQUIRED" });
      continue;
    }
    if (campaign.publication_paused_at) {
      results.push({ id: post.id, result: "blocked", reason: "CAMPAIGN_PAUSED" });
      continue;
    }
    const now = Date.now();
    const starts = campaign.automation_starts_at ? Date.parse(campaign.automation_starts_at) : Number.NaN;
    const ends = campaign.automation_ends_at ? Date.parse(campaign.automation_ends_at) : Number.NaN;
    if (!Number.isFinite(starts) || !Number.isFinite(ends) || now < starts || now >= ends || ends - starts > 14 * 24 * 60 * 60 * 1000) {
      results.push({ id: post.id, result: "blocked", reason: "OUTSIDE_VALIDATED_14_DAY_WINDOW" });
      continue;
    }

    const { data: connection, error: connectionError } = await supabase
      .from("jdv_social_connections")
      .select("id,connection_status,last_verified_at,granted_scopes,capabilities")
      .eq("id", post.connection_id)
      .eq("owner_user_id", post.owner_user_id)
      .maybeSingle();

    if (connectionError || !connection || connection.connection_status !== "connected" || !connection.last_verified_at) {
      results.push({ id: post.id, result: "blocked", reason: "SOCIAL_CONNECTION_NOT_VERIFIED" });
      continue;
    }

    // There are intentionally no provider adapters in this scaffold.
    // Even a valid-looking row is never published by this worker.
    results.push({ id: post.id, result: "dry_run_only", reason: "PROVIDER_ADAPTERS_NOT_IMPLEMENTED" });
  }

  return json({
    mode: "dry_run_only",
    provider_calls: 0,
    queue_rows_inspected: (rows ?? []).length,
    results,
    note: "Aucune ligne modifiée; aucune publication envoyée. Implémenter les verrous atomiques et adaptateurs fournisseurs avant activation.",
  });
});
