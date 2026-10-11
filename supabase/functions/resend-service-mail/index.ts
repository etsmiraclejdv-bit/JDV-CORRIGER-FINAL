import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

// Diagnostic réservé au SUPER ADMIN. Le destinataire reste le bac de test Resend.
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: CORS });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("EMAIL_FROM") ?? "JDV CRM <onboarding@resend.dev>";
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !resendKey) {
    console.error("[resend-service-mail] configuration incomplète");
    return json({ error: "Service de diagnostic non configuré" }, 500);
  }

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "Authentification requise" }, 401);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser(token);
  if (authError || !authData.user) return json({ error: "Session invalide" }, 401);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: superAdmin, error: adminError } = await admin
    .from("super_admins")
    .select("id,status,actif")
    .eq("user_id", authData.user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (adminError || !superAdmin || superAdmin.actif === false) {
    return json({ error: "Accès refusé" }, 403);
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: ["delivered@resend.dev"],
      subject: "JDV CRM — Test Resend",
      html: "<h1>Test JDV CRM</h1><p>Diagnostic Resend.</p>",
    }),
  });
  if (!response.ok) {
    console.error("[resend-service-mail] Resend a refusé le test", response.status);
    return json({ error: "Le test d'envoi a échoué", provider_status: response.status }, 502);
  }
  return json({ success: true, message: "Message de test envoyé à la boîte de test Resend." });
});
