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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = await checkRateLimitShared('public-vitrine-review:' + ip, {
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Trop d’avis envoyés. Veuillez réessayer plus tard.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    const body = await req.json();
    if (typeof body?.website === 'string' && body.website.trim())
      return NextResponse.json({ success: true, message: 'Merci ! Votre avis a été envoyé.' }, { status: 201 });

    const organizationId = typeof body?.organizationId === 'string' ? body.organizationId.trim() : '';
    const customerName = cleanText(body?.customerName);
    const comment = cleanText(body?.comment);
    const rating = Number(body?.rating);

    if (!UUID.test(organizationId))
      return NextResponse.json({ error: 'Entreprise invalide.' }, { status: 400 });
    if (customerName.length < 2 || customerName.length > 160)
      return NextResponse.json({ error: 'Le nom doit contenir entre 2 et 160 caractères.' }, { status: 400 });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5)
      return NextResponse.json({ error: 'La note doit être comprise entre 1 et 5.' }, { status: 400 });
    if (comment.length < 10 || comment.length > 3000)
      return NextResponse.json({ error: 'Le commentaire doit contenir entre 10 et 3 000 caractères.' }, { status: 400 });

    const orgLimit = await checkRateLimitShared('public-vitrine-review-org:' + organizationId, {
      limit: 30,
      windowMs: 60 * 60 * 1000,
    });
    if (!orgLimit.allowed)
      return NextResponse.json({ error: 'Cette vitrine reçoit trop d’avis en ce moment. Réessayez plus tard.' }, { status: 429 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey)
      return NextResponse.json({ error: 'Le service d’avis est momentanément indisponible.' }, { status: 503 });

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: organization, error: organizationError } = await admin
      .from('organizations').select('id').eq('id', organizationId).eq('status', 'active').maybeSingle();
    if (organizationError) {
      console.error('[vitrine-reviews] vérification entreprise :', organizationError.message);
      return NextResponse.json({ error: 'Impossible de vérifier cette entreprise.' }, { status: 503 });
    }
    if (!organization)
      return NextResponse.json({ error: 'Cette vitrine est introuvable ou inactive.' }, { status: 404 });

    const { error } = await admin.from('client_reviews').insert({
      organization_id: organizationId,
      customer_name: customerName,
      rating,
      comment,
      source: 'online',
      status: 'pending',
      created_by: null,
    });
    if (error) {
      console.error('[vitrine-reviews] enregistrement impossible :', error.message);
      return NextResponse.json({ error: 'Avis non enregistré. Veuillez réessayer.' }, { status: 500 });
    }
    return NextResponse.json(
      { success: true, message: 'Merci ! Votre avis a été envoyé et attend la validation de l’entreprise.' },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }
}
