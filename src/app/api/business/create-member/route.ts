import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimitShared, getClientIp } from '@/lib/middleware/rateLimiter';
import { sanitizeString, sanitizeEmail, sanitizeUUID } from '@/lib/security/sanitize';

// Création d'un membre de l'équipe (administrateur, gestionnaire, superviseur, comptable, commercial, lecteur).
// Les prospecteurs se créent depuis leur page, les chefs d'agence depuis l'espace entrepôts.
const ASSIGNABLE_ROLES = ['business_admin', 'manager', 'supervisor', 'accountant', 'commercial', 'viewer'];

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await checkRateLimitShared(`create-member:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
    if (!rl.allowed) return NextResponse.json({ error: 'Trop de requêtes. Réessayez dans quelques minutes.' }, { status: 429 });

    let body: any;
    try { body = await req.json(); } catch { return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 }); }
    const organizationId = sanitizeUUID(body?.organizationId);
    const email = sanitizeEmail(body?.email);
    const password = typeof body?.password === 'string' ? body.password.trim().slice(0, 128) : '';
    const firstName = sanitizeString(body?.firstName);
    const lastName = sanitizeString(body?.lastName);
    const phone = sanitizeString(body?.phone);
    const role = String(body?.role ?? '');

    if (!organizationId || !email || !password) return NextResponse.json({ error: 'E-mail, mot de passe et entreprise sont requis.' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' }, { status: 400 });
    if (!firstName) return NextResponse.json({ error: 'Le prénom est requis.' }, { status: 400 });
    if (!ASSIGNABLE_ROLES.includes(role)) return NextResponse.json({ error: 'Rôle invalide.' }, { status: 400 });

    const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\\s+/i, '').trim();
    if (!token) return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const adminKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !anon || !adminKey) return NextResponse.json({ error: 'Configuration serveur incomplète. Contactez l’administrateur.' }, { status: 500 });

    const supabaseUser = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { autoRefreshToken: false, persistSession: false } });
    const { data: caller, error: callerError } = await supabaseUser.auth.getUser(token);
    if (callerError || !caller.user) return NextResponse.json({ error: 'Session invalide' }, { status: 401 });

    const admin = createClient(url, adminKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const [{ data: saRows, error: saError }, { data: memberRow, error: memberError }, { data: org, error: orgError }] = await Promise.all([
      admin.from('super_admins').select('status, actif').eq('user_id', caller.user.id).limit(1),
      admin.from('organization_members').select('role').eq('organization_id', organizationId).eq('user_id', caller.user.id).eq('status', 'active').limit(1).maybeSingle(),
      admin.from('organizations').select('id, owner_user_id, status').eq('id', organizationId).maybeSingle(),
    ]);
    if (saError || memberError || orgError) return NextResponse.json({ error: 'Vérification des droits impossible. Réessayez.' }, { status: 503 });
    if (!org) return NextResponse.json({ error: 'Entreprise introuvable.' }, { status: 404 });
    const sa = (saRows ?? [])[0] as { status?: string; actif?: boolean | null } | undefined;
    const isSuper = !!sa && sa.status === 'active' && sa.actif !== false;
    const memberRole = String((memberRow as { role?: string } | null)?.role ?? '').toLowerCase();
    const isAdmin = ['business_admin', 'admin'].includes(memberRole);
    const isOwner = org.owner_user_id === caller.user.id && org.status !== 'suspended';
    if (!isSuper && !isAdmin && !isOwner) return NextResponse.json({ error: 'Action réservée aux administrateurs de cette entreprise.' }, { status: 403 });

    if (role === 'business_admin' && !isSuper) {
      const { data: limit, error: limitError } = await supabaseUser.rpc('jdvcrm_check_subscription_limit_v1', { p_organization_id: organizationId, p_resource_code: 'admins' });
      if (limitError) return NextResponse.json({ error: 'Impossible de vérifier la limite de votre abonnement.' }, { status: 503 });
      const row = Array.isArray(limit) ? limit[0] : limit;
      if (row && row.allowed === false) return NextResponse.json({ error: 'Le nombre maximal d’administrateurs de votre abonnement est atteint.' }, { status: 403 });
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name: firstName, last_name: lastName || null, display_name: `${firstName} ${lastName}`.trim(), phone: phone || null } });
    if (createError || !created?.user) return NextResponse.json({ error: 'Création du compte impossible.' }, { status: 400 });
    const userId = created.user.id;
    const { error: insertError } = await admin.from('organization_members').insert({ organization_id: organizationId, user_id: userId, role, status: 'active' });
    if (insertError) {
      console.error('[create-member] rattachement entreprise impossible :', insertError.message);
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: 'Le membre n’a pas pu être ajouté à cette entreprise.' }, { status: 400 });
    }
    return NextResponse.json({ success: true, userId });
  } catch (err) {
    console.error('[create-member]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
