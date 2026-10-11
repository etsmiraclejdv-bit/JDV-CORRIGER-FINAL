import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimitShared, getClientIp } from '@/lib/middleware/rateLimiter';
import { sanitizeString, sanitizeEmail } from '@/lib/security/sanitize';

// Formulaire de contact de la page d'accueil : l'écriture se fait ici, côté serveur, avec limitation de débit
// et champ piège anti-robots. La table contact_messages n'est lisible que par le super admin.
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await checkRateLimitShared(`contact:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Trop de messages envoyés. Réessayez dans quelques minutes.' },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Champ piège : un humain ne le voit pas. S'il est rempli, on répond « succès » sans rien enregistrer.
    if (typeof body?.website === 'string' && body.website.trim() !== '') {
      return NextResponse.json({ ok: true });
    }

    const fullName = sanitizeString(body?.fullName).slice(0, 120);
    const email = sanitizeEmail(body?.email);
    const phone = sanitizeString(body?.phone).slice(0, 40);
    const subject = sanitizeString(body?.subject).slice(0, 160);
    const message = sanitizeString(body?.message).slice(0, 2000);

    if (fullName.length < 2)
      return NextResponse.json({ error: 'Indiquez votre nom.' }, { status: 400 });
    if (message.length < 5)
      return NextResponse.json({ error: 'Votre message est trop court.' }, { status: 400 });
    if (!email && !phone)
      return NextResponse.json(
        {
          error:
            'Indiquez une adresse e-mail ou un numéro de téléphone pour que nous puissions vous répondre.',
        },
        { status: 400 }
      );

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      console.error('[contact] configuration Supabase serveur incomplète');
      return NextResponse.json({ error: 'Service momentanément indisponible.' }, { status: 500 });
    }
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await admin.from('contact_messages').insert({
      full_name: fullName,
      email: email || null,
      phone: phone || null,
      subject: subject || null,
      message,
      source: 'site',
    });
    if (error) {
      console.error('[contact] enregistrement impossible :', error.message);
      return NextResponse.json(
        { error: 'Votre message n’a pas pu être enregistré. Réessayez plus tard.' },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[contact]', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Erreur inattendue.' }, { status: 500 });
  }
}
