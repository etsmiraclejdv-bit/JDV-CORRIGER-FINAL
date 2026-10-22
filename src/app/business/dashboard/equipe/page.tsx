'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { KeyRound, Plus, RefreshCw, ShieldCheck, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { getCurrentOrgId } from '@/lib/auth/context';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TerrainKey } from '@/lib/i18n/terrain';

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

const ROLES: { id: string; label: TerrainKey; hint: TerrainKey }[] = [
  { id: 'business_admin', label: 'bz.eqRAdmin', hint: 'bz.eqRAdminH' },
  { id: 'manager', label: 'bz.eqRManager', hint: 'bz.eqRManagerH' },
  { id: 'supervisor', label: 'bz.eqRSup', hint: 'bz.eqRSupH' },
  { id: 'accountant', label: 'bz.eqRAcc', hint: 'bz.eqRAccH' },
  { id: 'commercial', label: 'bz.eqRCom', hint: 'bz.eqRComH' },
  { id: 'viewer', label: 'bz.eqRView', hint: 'bz.eqRViewH' },
];
const ROLE_LABEL: Record<string, TerrainKey> = {
  ...Object.fromEntries(ROLES.map((r) => [r.id, r.label])),
  prospecteur: 'bz.eqRPros',
};

const ERRORS: [string, TerrainKey][] = [
  ['CANNOT_CHANGE_OWN_ROLE', 'bz.eqEOwnRole'],
  ['CANNOT_CHANGE_OWN_STATUS', 'bz.eqEOwnStatus'],
  ['OWNER_PROTECTED', 'bz.eqEOwner'],
  ['LAST_ADMIN', 'bz.eqELast'],
  ['ADMIN_LIMIT_REACHED', 'bz.eqELimit'],
  ['USE_PROSPECTEURS_PAGE', 'bz.eqEPros'],
  ['ACCESS_DENIED', 'bz.eqEDenied'],
  ['warehouse_managers_one_active_head', 'bz.eqEHead'],
];

const EMPTY = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  role: 'commercial',
};

export default function TeamPage() {
  const { t } = useLanguage();
  const frError = (msg: string) => {
    const hit = ERRORS.find(([k]) => msg.includes(k));
    return hit ? t(hit[1]) : msg;
  };
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
  }, [t]);

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
      if (!token) throw new Error(t('bz.eqSession'));
      const res = await fetch('/api/business/create-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ organizationId: orgId, ...form }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out?.error || t('bz.eqCreateFail'));
      toast.success(t('bz.eqCreated'));
      setForm(EMPTY);
      setShowForm(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('bz.eqCreateFail'));
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
    toast.success(t('bz.eqRoleUpd'));
    load();
  }

  async function toggleStatus(m: Member) {
    const next = m.status === 'active' ? 'suspended' : 'active';
    if (
      next === 'suspended' &&
      !window.confirm(t('bz.eqSuspendQ').replace('{name}', m.display_name))
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
    toast.success(next === 'active' ? t('bz.eqReact') : t('bz.eqSuspended'));
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
            {t('bz.eqKicker')}
          </p>
          <h1 className="text-2xl font-bold text-foreground">{t('bz.eqTitle')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t('bz.eqIntro')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="rounded-xl border border-border p-2.5 text-muted-foreground"
            aria-label={t('bz.fnRefresh')}
          >
            <RefreshCw size={16} />
          </button>
          {canManage && (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="btn-gold inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold"
            >
              <Plus size={15} />
              {t('bz.eqNewMember')}
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={card}>
          <p className={lab}>{t('bz.eqMembers')}</p>
          <p className="text-2xl font-bold text-foreground">{members.length}</p>
        </div>
        <div className={card}>
          <p className={lab}>{t('bz.eqActive')}</p>
          <p className="text-2xl font-bold text-foreground">{active}</p>
        </div>
        <div className={card}>
          <p className={lab}>{t('bz.eqSuspendedC')}</p>
          <p className="text-2xl font-bold text-foreground">{members.length - active}</p>
        </div>
      </div>

      {showForm && canManage && (
        <form onSubmit={create} className={`${card} grid gap-4 md:grid-cols-3`}>
          <div>
            <label className={lab}>{t('bz.eqFirst')}</label>
            <input
              required
              className={input}
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </div>
          <div>
            <label className={lab}>{t('bz.eqLast')}</label>
            <input
              className={input}
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>
          <div>
            <label className={lab}>{t('bz.eqPhone')}</label>
            <input
              className={input}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className={lab}>{t('bz.eqEmail')}</label>
            <input
              required
              type="email"
              className={input}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className={lab}>{t('bz.eqPass')}</label>
            <input
              required
              minLength={8}
              type="text"
              className={input}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={t('bz.eqPassPh')}
            />
          </div>
          <div>
            <label className={lab}>{t('bz.eqRoleL')}</label>
            <select
              className={input}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {t(r.label)}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-muted-foreground md:col-span-2">
            {t(ROLES.find((r) => r.id === form.role)?.hint ?? 'bz.eqRViewH')} {t('bz.eqNoMail')}
          </p>
          <div className="flex items-end justify-end">
            <button
              disabled={creating}
              className="btn-gold rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-60"
            >
              {creating ? t('bz.eqCreating') : t('bz.eqCreateBtn')}
            </button>
          </div>
        </form>
      )}

      <div className="flex gap-1 rounded-xl border border-border bg-muted p-1 w-fit">
        {(
          [
            ['members', t('bz.eqMembers'), ShieldCheck],
            ['rights', t('bz.eqTabRights'), KeyRound],
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
        <p className="text-sm text-muted-foreground">{t('bz.eqLoading')}</p>
      ) : tab === 'members' ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {members.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">{t('bz.eqNoMember')}</p>
          ) : (
            members.map((m) => (
              <div
                key={m.member_id}
                className="grid items-center gap-3 border-b border-border p-4 last:border-b-0 md:grid-cols-[1fr_190px_auto]"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">
                    {m.display_name}
                    {m.is_me ? t('bz.eqYou') : ''}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.email}
                    {m.phone ? ` · ${m.phone}` : ''}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {m.is_owner && (
                      <span className="badge-gold rounded-full border px-2 py-0.5 text-[11px]">
                        {t('bz.eqOwner')}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] ${m.status === 'active' ? 'badge-success' : 'badge-danger'}`}
                    >
                      {m.status === 'active' ? t('bz.eqStActive') : t('bz.eqStSusp')}
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
                        {t(r.label)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-sm font-medium text-foreground">
                    {ROLE_LABEL[m.role] ? t(ROLE_LABEL[m.role]) : m.role}
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
                        {t('bz.eqSuspendBtn')}
                      </>
                    ) : (
                      <>
                        <UserCheck size={14} />
                        {t('bz.eqReactBtn')}
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
            {[
              ...ROLES,
              {
                id: 'prospecteur',
                label: 'bz.eqRPros' as TerrainKey,
                hint: 'bz.eqRProsH' as TerrainKey,
              },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setRightsRole(r.id)}
                className={`rounded-xl border px-4 py-2 text-sm ${rightsRole === r.id ? 'border-[var(--brand)] font-semibold' : 'border-border text-muted-foreground'}`}
              >
                {t(r.label)}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {t(ROLES.find((r) => r.id === rightsRole)?.hint ?? 'bz.eqRProsH')}
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
              <p className="text-sm text-muted-foreground">{t('bz.eqNoRights')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
