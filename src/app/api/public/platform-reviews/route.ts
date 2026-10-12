import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimitShared, getClientIp } from '@/lib/middleware/rateLimiter';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = await checkRateLimitShared('public-platform-review:' + ip, {
    limit: 4,
    windowMs: 15 * 60 * 1000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Trop d’avis envoyés. Réessayez dans quelques minutes.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
    );
  }

  try {
    const body = await request.json();
    // Honeypot: accept silently without saving if a bot fills the hidden field.
    if (typeof body.website === 'string' && body.website.trim()) {
      return NextResponse.json({ success: true, message: 'Merci pour votre retour.' }, { status: 201 });
    }

    const authorName = typeof body.authorName === 'string' ? body.authorName.trim() : '';
    const authorRole = typeof body.authorRole === 'string' ? body.authorRole.trim() : '';
    const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : '';
    const quote = typeof body.quote === 'string' ? body.quote.trim() : '';
    const rating = Number(body.rating);

    if (authorName.length < 2 || authorName.length > 120) {
      return NextResponse.json({ error: 'Le nom doit contenir entre 2 et 120 caractères.' }, { status: 400 });
    }
    if (authorRole.length > 120 || companyName.length > 160) {
      return NextResponse.json({ error: 'Un champ dépasse la longueur autorisée.' }, { status: 400 });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'La note doit être comprise entre 1 et 5.' }, { status: 400 });
    }
    if (quote.length < 10 || quote.length > 600) {
      return NextResponse.json({ error: 'Le commentaire doit contenir entre 10 et 600 caractères.' }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json({ error: 'Le service d’avis est momentanément indisponible.' }, { status: 503 });
    }
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await admin.from('testimonials').insert({
      author_name: authorName,
      author_role: authorRole || null,
      company_name: companyName || null,
      quote,
      rating,
      status: 'pending',
      sort_order: 100,
    });
    if (error) {
      return NextResponse.json({ error: 'Avis non enregistré. Réessayez plus tard.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Merci ! Votre avis a été transmis au concepteur et sera publié après validation.',
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }
}
