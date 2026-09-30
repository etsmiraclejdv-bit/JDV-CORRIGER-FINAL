import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

serve(async (req) => {
  // ✅ CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  try {
    const { type, to, organizationName, adminName, prospecteurName, prospecteurEmail, prospecteurPassword } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    let subject = "";
    let html = "";

    if (type === "company_registration") {
      subject = `Bienvenue sur JDV CRM — ${organizationName}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A1628; color: #E2E8F0; padding: 40px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #D4AF37; font-size: 28px; margin: 0;">JDV CRM</h1>
            <p style="color: #718096; font-size: 14px; margin-top: 4px;">Votre partenaire de gestion commerciale</p>
          </div>
          <h2 style="color: #FFFFFF; font-size: 20px;">Bienvenue, ${adminName || organizationName} !</h2>
          <p style="color: #A0AEC0; line-height: 1.6;">
            Votre espace entreprise <strong style="color: #D4AF37;">${organizationName}</strong> a été créé avec succès sur JDV CRM.
          </p>
          <p style="color: #A0AEC0; line-height: 1.6;">
            Vous bénéficiez d'un essai gratuit de <strong style="color: #FFFFFF;">14 jours</strong> avec accès à toutes les fonctionnalités :
          </p>
          <ul style="color: #A0AEC0; line-height: 2;">
            <li>Gestion de vos prospecteurs et prospects</li>
            <li>Suivi des ventes et paiements</li>
            <li>Gestion du stock</li>
            <li>Rapports et tableaux de bord</li>
          </ul>
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://jdvcrm6791.builtwithrocket.new/business/login"
               style="background: linear-gradient(135deg, #D4AF37, #B8962E); color: #0A1628; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Accéder à mon tableau de bord
            </a>
          </div>
          <p style="color: #718096; font-size: 12px; text-align: center; margin-top: 32px;">
            Si vous n'avez pas créé ce compte, ignorez cet email.<br/>
            © ${new Date().getFullYear()} JDV CRM — Tous droits réservés
          </p>
        </div>
      `;
    } else if (type === "prospecteur_creation") {
      subject = `Vos accès JDV CRM — Bienvenue ${prospecteurName}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A1628; color: #E2E8F0; padding: 40px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #D4AF37; font-size: 28px; margin: 0;">JDV CRM</h1>
            <p style="color: #718096; font-size: 14px; margin-top: 4px;">Portail Prospecteur</p>
          </div>
          <h2 style="color: #FFFFFF; font-size: 20px;">Bienvenue, ${prospecteurName} !</h2>
          <p style="color: #A0AEC0; line-height: 1.6;">
            Un compte prospecteur a été créé pour vous sur <strong style="color: #D4AF37;">JDV CRM</strong> par votre entreprise <strong style="color: #FFFFFF;">${organizationName}</strong>.
          </p>
          <div style="background: #0F2347; border: 1px solid rgba(212,175,55,0.3); border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="color: #D4AF37; font-weight: bold; margin: 0 0 12px 0;">Vos identifiants de connexion :</p>
            <p style="color: #A0AEC0; margin: 4px 0;"><strong style="color: #FFFFFF;">Email :</strong> ${prospecteurEmail}</p>
            <p style="color: #A0AEC0; margin: 4px 0;"><strong style="color: #FFFFFF;">Mot de passe :</strong> ${prospecteurPassword}</p>
          </div>
          <p style="color: #FC8181; font-size: 13px;">
            ⚠️ Pour votre sécurité, changez votre mot de passe dès votre première connexion.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://jdvcrm6791.builtwithrocket.new/terrain/login"
               style="background: linear-gradient(135deg, #D4AF37, #B8962E); color: #0A1628; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Se connecter maintenant
            </a>
          </div>
          <p style="color: #718096; font-size: 12px; text-align: center; margin-top: 32px;">
            © ${new Date().getFullYear()} JDV CRM — Tous droits réservés
          </p>
        </div>
      `;
    } else {
      throw new Error("Unknown email type: " + type);
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: [to],
        subject,
        html,
      }),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Resend API error");

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
