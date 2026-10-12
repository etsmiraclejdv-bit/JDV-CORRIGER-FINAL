import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  const { organizationId } = await params;
  if (!UUID.test(organizationId)) {
    return NextResponse.json({ error: 'Identifiant d’entreprise invalide.' }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Service de vitrine momentanément indisponible.' }, { status: 503 });
  }

  try {
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: organization, error } = await admin
      .from('organizations')
      .select('id,name,legal_name,country,language,city,logo_url,website')
      .eq('id', organizationId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'Impossible de charger cette vitrine.' }, { status: 500 });
    }
    if (!organization) {
      return NextResponse.json({ error: 'Cette vitrine est introuvable ou indisponible.' }, { status: 404 });
    }

    const { data: reviews, error: reviewsError } = await admin
      .from('client_reviews')
      .select('id,customer_name,rating,comment,created_at')
      .eq('organization_id', organizationId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(100);

    return NextResponse.json({
      organization,
      reviews: reviewsError ? [] : reviews ?? [],
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Erreur inattendue lors du chargement de la vitrine.' }, { status: 500 });
  }
}
