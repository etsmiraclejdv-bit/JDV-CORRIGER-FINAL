'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { KeyRound, Plus, RefreshCw, ShieldCheck, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { getCurrentOrgId } from '@/lib/auth/context';

type Member = {
  member_id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  email: string;
  display_name: string;
  phone: string | null;
  is_owner: boolean;
  is_me: boolean;
};
type MatrixRow = { role: string; module: string | null; code: string; name: string };

const ROLES: { id: string; label: string; hint: string }[] = [
  {
    id: 'business_admin',
    label: 'Administrateur',
    hint: 'Accès complet à l’entreprise, y compris l’équipe et les paramètres.',
  },
  {
    id: 'manager',
    label: 'Gestionnaire',
    hint: 'Pilote l’activité : prospecteurs, stock, ventes, rapports.',
  },
  {
    id: 'supervisor',
    label: 'Superviseur',
    hint: 'Suit les équipes et l’activité, sans modifier les réglages.',
  },
  { id: 'accountant', label: 'Comptable', hint: 'Finances, paiements et rapports.' },
  { id: 'commercial', label: 'Commercial', hint: 'Prospects, clients et ventes.' },
  { id: 'viewer', label: 'Lecteur', hint: 'Consultation seulement.' },
];
const ROLE_LABEL: Record<string, string> = {
  ...Object.fromEntries(ROLES.map((r) => [r.id, r.label])),
  prospecteur: 'Prospecteur',
};

const ERRORS: [string, string][] = [
  ['CANNOT_CHANGE_OWN_ROLE', 'Vous ne pouvez pas changer votre propre rôle.'],
  ['CANNOT_CHANGE_OWN_STATUS', 'Vous ne pouvez pas vous suspendre vous-même.'],
  ['OWNER_PROTECTED', 'Le propriétaire de l’entreprise ne peut pas être modifié.'],
  ['LAST_ADMIN', 'L’entreprise doit garder au moins un administrateur actif.'],
  ['ADMIN_LIMIT_REACHED', 'Le nombre maximal d’administrateurs de votre abonnement est atteint.'],
  ['USE_PROSPECTEURS_PAGE', 'Le rôle d’un prospecteur se gère depuis la page Prospecteurs.'],
  ['ACCESS_DENIED', 'Action réservée aux administrateurs.'],
  ['warehouse_managers_one_active_head', 'Cette agence a déjà un chef d’agence actif.'],
];
const frError = (msg: string) => ERRORS.find(([k]) => msg.includes(k))?.[1] ?? msg;

const EMPTY = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  role: 'commercial',
};

export default function TeamPage() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [matrix, setMatrix] = useState<MatrixRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'members' | 'rights'>('members');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [rightsRole, setRightsRole] = useState('business_admin');

  const load = useCallback(async () => {
    setLoading(true);
    const oid = await getCurrentOrgId();
    setOrgId(oid);
    if (!oid) {
      setLoading(false);
      return;
    }
    const [m, x] = await Promise.all([
      supabase.rpc('jdvcrm_list_org_members_v1', { p_organization_id: oid }),
      supabase.rpc('jdvcrm_role_permissions_matrix_v1'),
    ]);
    if (m.error) toast.error(frError(m.error.message));
    setMembers((m.data ?? []) as Member[]);
    setMatrix((x.data ?? []) as MatrixRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const me = members.find((m) => m.is_me);
  const canManage = me?.role === 'business_admin' || me?.is_owner === true;
  const active = members.filter((m) => m.status === 'active').length;

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!orgId) return;
    setCreating(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Session expirée. Reconnectez-vous.');
      const res = await fetch('/api/business/create-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ organizationId: orgId, ...form }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out?.error || 'Création impossible.');
      toast.success('Membre créé. Communiquez-lui son mot de passe de manière sécurisée.');
      setForm(EMPTY);
      setShowForm(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Création impossible.');
    } finally {
      setCreating(false);
    }
  }

  async function changeRole(m: Member, role: string) {
    if (role === m.role) return;
    setBusy(m.member_id);
    const { error } = await supabase.rpc('jdvcrm_update_member_role_v1', {
      p_member_id: m.member_id,
      p_role: role,
    });
    setBusy(null);
    if (error) {
      toast.error(frError(error.message));
      return;
    }
    toast.success('Rôle mis à jour.');
    load();
  }

  async function toggleStatus(m: Member) {
    const next = m.status === 'active' ? 'suspended' : 'active';
    if (
      next === 'suspended' &&
      !window.confirm(
        `Suspendre ${m.display_name} ? Cette personne ne pourra plus se connecter à l’entreprise.`
      )
    )
      return;
    setBusy(m.member_id);
    const { error } = await supabase.rpc('jdvcrm_set_member_status_v1', {
      p_member_id: m.member_id,
      p_status: next,
    });
    setBusy(null);
    if (error) {
      toast.error(frError(error.message));
      return;
    }
    toast.success(next === 'active' ? 'Membre réactivé.' : 'Membre suspendu.');
    load();
  }

  const rightsByModule = useMemo(() => {
    const out: Record<string, MatrixRow[]> = {};
    for (const r of matrix.filter((x) => x.role === rightsRole))
      (out[r.module ?? 'autres'] ??= []).push(r);
    return out;
  }, [matrix, rightsRole]);

  const card = 'rounded-2xl border border-border bg-card p-5';
  const input = 'input-navy w-full px-3 py-2.5 text-sm';
  const lab = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground';

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--brand-text)' }}
          >
            Équipe
          </p>
          <h1 className="text-2xl font-bold text-foreground">Équipe et droits</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Créez les comptes de vos collaborateurs, choisissez leur rôle et suspendez un accès en
            un clic. Les prospecteurs se gèrent depuis leur page, les chefs d’agence depuis les
            entrepôts.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="rounded-xl border border-border p-2.5 text-muted-foreground"
            aria-label="Actualiser"
          >
            <RefreshCw size={16} />
          </button>
          {canManage && (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="btn-gold inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold"
            >
              <Plus size={15} />
              Nouveau membre
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={card}>
          <p className={lab}>Membres</p>
          <p className="text-2xl font-bold text-foreground">{members.length}</p>
        </div>
        <div className={card}>
          <p className={lab}>Actifs</p>
          <p className="text-2xl font-bold text-foreground">{active}</p>
        </div>
        <div className={card}>
          <p className={lab}>Suspendus</p>
          <p className="text-2xl font-bold text-foreground">{members.length - active}</p>
        </div>
      </div>

      {showForm && canManage && (
        <form onSubmit={create} className={`${card} grid gap-4 md:grid-cols-3`}>
          <div>
            <label className={lab}>Prénom *</label>
            <input
              required
              className={input}
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </div>
          <div>
            <label className={lab}>Nom</label>
            <input
              className={input}
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>
          <div>
            <label className={lab}>Téléphone</label>
            <input
              className={input}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className={lab}>E-mail de connexion *</label>
            <input
              required
              type="email"
              className={input}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className={lab}>Mot de passe provisoire *</label>
            <input
              required
              minLength={8}
              type="text"
              className={input}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="8 caractères minimum"
            />
          </div>
          <div>
            <label className={lab}>Rôle *</label>
            <select
              className={input}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-muted-foreground md:col-span-2">
            {ROLES.find((r) => r.id === form.role)?.hint} Aucun e-mail n’est envoyé : transmettez
            vous-même le mot de passe, que la personne pourra changer ensuite.
          </p>
          <div className="flex items-end justify-end">
            <button
              disabled={creating}
              className="btn-gold rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-60"
            >
              {creating ? 'Création…' : 'Créer le membre'}
            </button>
          </div>
        </form>
      )}

      <div className="flex gap-1 rounded-xl border border-border bg-muted p-1 w-fit">
        {(
          [
            ['members', 'Membres', ShieldCheck],
            ['rights', 'Droits par rôle', KeyRound],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${tab === id ? 'btn-gold' : 'text-muted-foreground'}`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : tab === 'members' ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {members.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Aucun membre visible.</p>
          ) : (
            members.map((m) => (
              <div
                key={m.member_id}
                className="grid items-center gap-3 border-b border-border p-4 last:border-b-0 md:grid-cols-[1fr_190px_auto]"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">
                    {m.display_name}
                    {m.is_me ? ' (vous)' : ''}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.email}
                    {m.phone ? ` · ${m.phone}` : ''}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {m.is_owner && (
                      <span className="badge-gold rounded-full border px-2 py-0.5 text-[11px]">
                        Propriétaire
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] ${m.status === 'active' ? 'badge-success' : 'badge-danger'}`}
                    >
                      {m.status === 'active' ? 'Actif' : 'Suspendu'}
                    </span>
                  </div>
                </div>
                {canManage && !m.is_me && !m.is_owner && m.role !== 'prospecteur' ? (
                  <select
                    value={m.role}
                    disabled={busy === m.member_id}
                    onChange={(e) => changeRole(m, e.target.value)}
                    className="input-navy px-3 py-2 text-sm"
                  >
                    {ROLES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-sm font-medium text-foreground">
                    {ROLE_LABEL[m.role] ?? m.role}
                  </span>
                )}
                {canManage && !m.is_me && !m.is_owner ? (
                  <button
                    onClick={() => toggleStatus(m)}
                    disabled={busy === m.member_id}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-sm disabled:opacity-50"
                  >
                    {m.status === 'active' ? (
                      <>
                        <UserX size={14} />
                        Suspendre
                      </>
                    ) : (
                      <>
                        <UserCheck size={14} />
                        Réactiver
                      </>
                    )}
                  </button>
                ) : (
                  <span />
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[...ROLES, { id: 'prospecteur', label: 'Prospecteur', hint: '' }].map((r) => (
              <button
                key={r.id}
                onClick={() => setRightsRole(r.id)}
                className={`rounded-xl border px-4 py-2 text-sm ${rightsRole === r.id ? 'border-[var(--brand)] font-semibold' : 'border-border text-muted-foreground'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {ROLES.find((r) => r.id === rightsRole)?.hint ||
              'Travail terrain : prospects, visites, ventes, retours.'}
          </p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Object.entries(rightsByModule).map(([module, rows]) => (
              <div key={module} className={card}>
                <p
                  className="mb-2 text-xs font-bold uppercase tracking-widest"
                  style={{ color: 'var(--brand-text)' }}
                >
                  {module}
                </p>
                <ul className="space-y-1 text-sm text-foreground">
                  {rows.map((r) => (
                    <li key={r.code}>• {r.name}</li>
                  ))}
                </ul>
              </div>
            ))}
            {Object.keys(rightsByModule).length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun droit enregistré pour ce rôle.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
