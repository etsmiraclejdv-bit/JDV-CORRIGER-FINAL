import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIp } from '@/lib/middleware/rateLimiter';

// Input sanitization: strip HTML/script tags and trim
function sanitizeString(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/["`;\\]/g, '') // strip SQL-dangerous chars (apostrophe kept — used in names like N'Diaye)
    .trim()
    .slice(0, 500); // max length
}

function sanitizeEmail(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim().toLowerCase().slice(0, 254);
  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return '';
  return trimmed;
}

function sanitizeUUID(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) return '';
  return trimmed;
}

function sanitizeNumber(value: unknown, min = 0, max = 100): number {
  const n = Number(value);
  if (isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export async function POST(req: NextRequest) {
  // ── Rate limiting: 10 requests per 15 minutes per IP ──────────────────────
  const ip = getClientIp(req);
  const rl = checkRateLimit(`create-prospecteur:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Veuillez réessayer dans quelques minutes.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  try {
    const body = await req.json();

    // ── Input sanitization ─────────────────────────────────────────────────
    const firstName = sanitizeString(body.firstName);
    const lastName = sanitizeString(body.lastName);
    const email = sanitizeEmail(body.email);
    const password = typeof body.password === 'string' ? body.password.trim().slice(0, 128) : '';
    const phone = sanitizeString(body.phone);
    const organizationId = sanitizeUUID(body.organizationId);
    const organizationName = sanitizeString(body.organizationName);
    const commissionRate = sanitizeNumber(body.commissionRate, 0, 100);

    if (!email || !password || !organizationId) {
      return NextResponse.json({ error: 'email, password et organizationId sont requis' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, { status: 400 });
    }
    if (!firstName) {
      return NextResponse.json({ error: 'Le prénom est requis' }, { status: 400 });
    }

    // ── Identité de l'appelant : jeton de session obligatoire ────────────────
    const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });
    }

    const supabaseUrl0 = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    // Client « au nom de l'utilisateur » : les règles de sécurité de la base s'appliquent.
    const supabaseUser = createClient(supabaseUrl0, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: caller, error: callerError } = await supabaseUser.auth.getUser(token);
    if (callerError || !caller.user) {
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
    }

    // Use service role key — never exposed to browser
    const supabaseAdmin = createClient(supabaseUrl0, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Seul l'admin de cette entreprise (ou le concepteur) peut créer un prospecteur.
    const [{ data: sa }, { data: member }] = await Promise.all([
      supabaseAdmin.from('super_admins').select('id, status, actif').eq('user_id', caller.user.id).maybeSingle(),
      supabaseAdmin
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', caller.user.id)
        .eq('status', 'active')
        .maybeSingle(),
    ]);
    const isSuper = !!sa && (sa as { status?: string }).status === 'active' && (sa as { actif?: boolean | null }).actif !== false;
    const isAdmin = !!member && ['business_admin', 'admin'].includes(String((member as { role: string }).role).toLowerCase());
    if (!isSuper && !isAdmin) {
      return NextResponse.json({ error: 'Accès refusé pour cette entreprise' }, { status: 403 });
    }

    // Limite du plan d'abonnement (calculée par la base, au nom de l'appelant).
    const { data: limit, error: limitError } = await supabaseUser.rpc('jdvcrm_check_subscription_limit_v1', {
      p_organization_id: organizationId,
      p_resource_code: 'prospecteurs',
    });
    if (limitError) {
      return NextResponse.json({ error: limitError.message }, { status: 400 });
    }
    const limitRow = Array.isArray(limit) ? limit[0] : limit;
    if (limitRow && limitRow.allowed === false) {
      return NextResponse.json(
        { error: 'Limite de prospecteurs atteinte pour votre abonnement. Passez à un plan supérieur.' },
        { status: 403 }
      );
    }

    // 1. Compte d'authentification (le profil est créé automatiquement par la base)
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName || null,
        display_name: `${firstName} ${lastName}`.trim(),
        phone: phone || null,
      },
    });
    if (createError) return NextResponse.json({ error: createError.message }, { status: 400 });
    const userId = authData.user.id;

    const rollback = async (message: string) => {
      await supabaseAdmin.from('organization_members').delete().eq('user_id', userId).eq('organization_id', organizationId);
      await supabaseAdmin.from('prospecteurs').delete().eq('user_id', userId).eq('organization_id', organizationId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: message }, { status: 400 });
    };

    // 2. Rattachement à l'entreprise (nécessaire pour passer le contrôle d'abonnement)
    const { error: memberError } = await supabaseAdmin.from('organization_members').insert({
      organization_id: organizationId,
      user_id: userId,
      role: 'prospecteur',
      status: 'active',
    });
    if (memberError) return rollback(memberError.message);

    // 3. Fiche prospecteur (le code est généré par la base)
    const { data: prosp, error: prospError } = await supabaseAdmin
      .from('prospecteurs')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        first_name: firstName,
        last_name: lastName || null,
        email,
        phone: phone || null,
        commission_rate: commissionRate,
        status: 'active',
      })
      .select('id, code')
      .single();
    if (prospError || !prosp) return rollback(prospError?.message ?? 'Création du prospecteur impossible');

    // 4. Portefeuille clients privé du prospecteur
    await supabaseAdmin.from('client_portfolios').insert({
      organization_id: organizationId,
      owner_user_id: userId,
      owner_type: 'prospecteur',
      name: 'Mon portefeuille clients',
    });
    const code = (prosp as { code: string }).code;

    // 4. Send credentials email via edge function (non-blocking)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        type: 'prospecteur_creation',
        to: email,
        prospecteurName: `${firstName} ${lastName}`.trim() || email,
        prospecteurEmail: email,
        prospecteurPassword: password,
        organizationName: organizationName || 'votre entreprise',
      }),
    }).catch(err => console.error('[create-prospecteur] email send error:', err));

    return NextResponse.json({
      success: true,
      userId,
      prospecteurId: (prosp as { id: string }).id,
      code,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur interne';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
