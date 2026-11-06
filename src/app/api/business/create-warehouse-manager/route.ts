import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimitShared, getClientIp } from '@/lib/middleware/rateLimiter';
import { sanitizeString, sanitizeEmail, sanitizeUUID } from '@/lib/security/sanitize';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await checkRateLimitShared('create-warehouse-manager:' + ip, {
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (!rl.allowed)
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez réessayer dans quelques minutes.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );

    let body: any;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: 'Requête invalide' }, { status: 400 }); }

    const firstName = sanitizeString(body?.firstName);
    const lastName = sanitizeString(body?.lastName);
    const email = sanitizeEmail(body?.email);
    const password = typeof body?.password === 'string' ? body.password.trim().slice(0, 128) : '';
    const phone = sanitizeString(body?.phone);
    const warehouseId = sanitizeUUID(body?.warehouseId);
    if (!email || !password || !warehouseId)
      return NextResponse.json({ error: 'email, mot de passe et entrepôt sont requis' }, { status: 400 });
    if (password.length < 8)
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, { status: 400 });
    if (!firstName) return NextResponse.json({ error: 'Le prénom est requis' }, { status: 400 });

    const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\\s+/i, '').trim();
    if (!token) return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const adminKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !anonKey || !adminKey) {
      console.error('[create-warehouse-manager] configuration Supabase serveur incomplète');
      return NextResponse.json({ error: 'Configuration serveur incomplète. Contactez l’administrateur.' }, { status: 500 });
    }

    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: 'Bearer ' + token } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: caller, error: callerError } = await userClient.auth.getUser(token);
    if (callerError || !caller.user)
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 });

    const admin = createClient(url, adminKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: warehouse } = await admin
      .from('warehouses')
      .select('id,organization_id,name,manager_user_id,active')
      .eq('id', warehouseId)
      .maybeSingle();

    const denied = () => NextResponse.json({ error: 'Entrepôt introuvable ou accès refusé' }, { status: 403 });
    if (!warehouse) return denied();

    const organizationId = warehouse.organization_id as string;
    const [{ data: saRows }, { data: member }, { data: organization }] = await Promise.all([
      admin.from('super_admins').select('id,status,actif').eq('user_id', caller.user.id).order('id', { ascending: true }).limit(1),
      admin.from('organization_members').select('role').eq('organization_id', organizationId).eq('user_id', caller.user.id).eq('status', 'active').limit(1).maybeSingle(),
      admin.from('organizations').select('owner_user_id,status').eq('id', organizationId).maybeSingle(),
    ]);
    const sa = (saRows ?? [])[0] as { status?: string; actif?: boolean | null } | undefined;
    const isSuper = !!sa && sa.status === 'active' && sa.actif !== false;
    const isAdmin = !!member && ['business_admin', 'admin'].includes(String((member as any).role).toLowerCase());
    const isOwner = !!organization && organization.owner_user_id === caller.user.id && organization.status !== 'suspended';
    if (!isSuper && !isAdmin && !isOwner) return denied();
    if (!warehouse.active) return NextResponse.json({ error: 'Cet entrepôt est inactif' }, { status: 400 });

    const { data: authData, error: createError } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: {
        first_name: firstName, last_name: lastName || null,
        display_name: (firstName + ' ' + lastName).trim(),
        phone: phone || null, role: 'warehouse_manager',
      },
    });
    if (createError) return NextResponse.json({ error: createError.message }, { status: 400 });
    const userId = authData.user.id;

    const { error: managerError } = await admin.from('warehouse_managers').insert({
      warehouse_id: warehouseId, user_id: userId,
      display_name: (firstName + ' ' + lastName).trim(),
      phone: phone || null, created_by: caller.user.id,
    });
    if (managerError) {
      console.error('[create-warehouse-manager] ajout du responsable impossible :', managerError.message);
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: 'Le responsable n’a pas pu être ajouté à l’entrepôt. Réessayez plus tard.' }, { status: 400 });
    }

    if (!warehouse.manager_user_id) {
      const { error: assignError } = await admin.from('warehouses').update({ manager_user_id: userId }).eq('id', warehouseId);
      if (assignError) console.error('[create-warehouse-manager] responsable principal non enregistré :', assignError.message);
    }

    return NextResponse.json({
      success: true, userId, warehouse: warehouse.name,
      message: 'Responsable créé pour l’entrepôt ' + warehouse.name + '.',
    });
  } catch (err) {
    console.error('[create-warehouse-manager]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
