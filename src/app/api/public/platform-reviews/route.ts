import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimitShared, getClientIp } from '@/lib/middleware/rateLimiter';

const cleanText = (value: unknown): string =>
  typeof value === 'string'
    ? value
        .replace(/<[^>]*>/g, '')
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
        .trim()
    : '';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = await checkRateLimitShared('public-platform-review:' + ip, {
    limit: 4,
    windowMs: 15 * 60 * 1000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Trop d’avis envoyés. Réessayez dans quelques minutes.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((limit.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  try {
    const body = await request.json();
    if (typeof body?.website === 'string' && body.website.trim()) {
      return NextResponse.json({ success: true, message: 'Merci pour votre retour.' }, { status: 201 });
    }

    const authorName = cleanText(body?.authorName);
    const authorRole = cleanText(body?.authorRole);
    const companyName = cleanText(body?.companyName);
    const quote = cleanText(body?.quote);
    const rating = Number(body?.rating);

    if (authorName.length < 2 || authorName.length > 120)
      return NextResponse.json({ error: 'Le nom doit contenir entre 2 et 120 caractères.' }, { status: 400 });
    if (authorRole.length > 120 || companyName.length > 160)
      return NextResponse.json({ error: 'Un champ dépasse la longueur autorisée.' }, { status: 400 });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5)
      return NextResponse.json({ error: 'La note doit être comprise entre 1 et 5.' }, { status: 400 });
    if (quote.length < 10 || quote.length > 600)
      return NextResponse.json({ error: 'Le commentaire doit contenir entre 10 et 600 caractères.' }, { status: 400 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey)
      return NextResponse.json({ error: 'Le service d’avis est momentanément indisponible.' }, { status: 503 });

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
      console.error('[platform-reviews] enregistrement impossible :', error.message);
      return NextResponse.json({ error: 'Avis non enregistré. Réessayez plus tard.' }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, message: 'Merci ! Votre avis a été transmis au concepteur et sera publié après validation.' },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }
}
