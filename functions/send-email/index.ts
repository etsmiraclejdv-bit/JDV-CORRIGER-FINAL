import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

declare const Deno: {
  env: { get(key: string): string | undefined };
};

/**
 * Edge Function `send-email` (sécurisée).
 *
 * - À déployer avec la vérification JWT activée (`supabase functions deploy send-email`, option par défaut).
 * - Un seul type d'email : `prospecteur_welcome`. Aucun mot de passe n'est jamais envoyé.
 * - L'appelant doit être connecté ET administrateur d'une entreprise ; le destinataire doit être
 *   l'un des prospecteurs de cette entreprise (vérifié via les règles RLS, avec le jeton de l'appelant).
 * - Les noms affichés viennent de la base, jamais du corps de la requête ; tout est échappé.
 * - Pas d'en-têtes CORS : la fonction n'est appelée que par le serveur de l'application.
 *
 * Secrets requis : RESEND_API_KEY, SITE_URL. Facultatif : EMAIL_FROM (adresse d'un domaine vérifié chez Resend).
 */

const ADMIN_ROLES = ["business_admin", "admin"];

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const siteUrl = (Deno.env.get("SITE_URL") ?? "").replace(/\/+$/, "");
  const from = Deno.env.get("EMAIL_FROM") ?? "JDV CRM <onboarding@resend.dev>";
  if (!supabaseUrl || !anonKey || !resendKey || !siteUrl) {
    console.error("[send-email] configuration incomplète");
    return json({ error: "Service email non configuré" }, 500);
  }

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "Authentification requise" }, 401);

  // Client « au nom de l'appelant » : les règles RLS s'appliquent à toutes les lectures ci-dessous.
  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: caller, error: callerError } = await supabase.auth.getUser(token);
  if (callerError || !caller?.user) return json({ error: "Session invalide" }, 401);

  let payload: { type?: unknown; to?: unknown };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Requête invalide" }, 400);
  }
  if (payload.type !== "prospecteur_welcome") return json({ error: "Type d'email non pris en charge" }, 400);

  const to = typeof payload.to === "string" ? payload.to.trim().toLowerCase().slice(0, 254) : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return json({ error: "Destinataire invalide" }, 400);

  // L'appelant est-il administrateur d'une entreprise ?
  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", caller.user.id)
    .eq("status", "active")
    .in("role", ADMIN_ROLES);
  const orgIds = (memberships ?? []).map((m: { organization_id: string }) => m.organization_id);
  if (orgIds.length === 0) return json({ error: "Accès refusé" }, 403);

  // Le destinataire est-il un prospecteur de l'une de ces entreprises ?
  const { data: prospecteur } = await supabase
    .from("prospecteurs")
    .select("first_name, last_name, organization_id")
    .eq("email", to)
    .in("organization_id", orgIds)
    .limit(1)
    .maybeSingle();
  if (!prospecteur) return json({ error: "Destinataire non autorisé" }, 403);

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", prospecteur.organization_id)
    .maybeSingle();

  const name = `${prospecteur.first_name ?? ""} ${prospecteur.last_name ?? ""}`.trim() || to;
  const orgName = org?.name ?? "votre entreprise";
  const loginUrl = `${siteUrl}/terrain/login`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A1628; color: #E2E8F0; padding: 40px; border-radius: 12px;">
      <h1 style="color: #D4AF37; font-size: 28px; margin: 0 0 8px 0; text-align: center;">JDV CRM</h1>
      <p style="color: #718096; font-size: 14px; text-align: center; margin: 0 0 32px 0;">Portail Prospecteur</p>
      <h2 style="color: #FFFFFF; font-size: 20px;">Bienvenue, ${escapeHtml(name)} !</h2>
      <p style="color: #A0AEC0; line-height: 1.6;">
        Un compte prospecteur a été créé pour vous sur JDV CRM par l'entreprise <strong style="color: #FFFFFF;">${escapeHtml(orgName)}</strong>.
      </p>
      <p style="color: #A0AEC0; line-height: 1.6;">
        Votre identifiant est cette adresse email : <strong style="color: #FFFFFF;">${escapeHtml(to)}</strong>.
        Votre administrateur vous communiquera votre mot de passe de façon sécurisée. Changez-le dès votre première connexion.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${escapeHtml(loginUrl)}" style="background: #D4AF37; color: #0A1628; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">Se connecter</a>
      </div>
      <p style="color: #718096; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} JDV CRM</p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Bienvenue sur JDV CRM — ${orgName}`.slice(0, 200),
      html,
    }),
  });
  if (!res.ok) {
    console.error("[send-email] Resend a refusé l'envoi", res.status);
    return json({ error: "Envoi impossible" }, 502);
  }
  return json({ success: true });
});
