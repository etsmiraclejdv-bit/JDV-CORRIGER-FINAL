'use client';
import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  ShoppingCart,
  Plus,
  Eye,
  EyeOff,
  FileText,
  UserX,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import Modal from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase/client';
import { getAuthContext } from '@/lib/auth/context';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TerrainKey } from '@/lib/i18n/terrain';
import { personName, saleTotal, toCents } from '@/lib/services/compat';

interface ProspecteurRow {
  id: string;
  full_name: string;
  phone: string | null;
  city: string | null;
  created_at: string;
  status: string;
  email: string | null;
  code: string | null;
  address: string | null;
  commission_rate: number | null;
  sales_count?: number;
  sales_amount?: number;
}

const STATUS_LABEL: Record<string, TerrainKey> = {
  active: 'bz.proStActive',
  suspended: 'bz.proStSusp',
  blocked: 'bz.proStBlocked',
  inactive: 'bz.proStInactive',
};
const ERRORS: [string, TerrainKey][] = [
  ['ACCESS_DENIED', 'bz.proEDenied'],
  ['PROTECTED_COLUMNS', 'bz.proEProt'],
];

export default function BusinessProspecteursPage() {
  const { t, locale } = useLanguage();
  const frError = (msg: string) => {
    const hit = ERRORS.find(([k]) => msg.includes(k));
    return hit ? t(hit[1]) : msg;
  };
  const statusLabel = (s: string) => (STATUS_LABEL[s] ? t(STATUS_LABEL[s]) : s);
  const [prospecteurs, setProspecteurs] = useState<ProspecteurRow[]>([]);
  const [warehouses, setWarehouses] = useState<
    { id: string; name: string; code: string; city: string | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selected, setSelected] = useState<ProspecteurRow | null>(null);
  const [fiche, setFiche] = useState({ phone: '', city: '', address: '', commission: '' });
  const [busyId, setBusyId] = useState<string | null>(null);
  const emptyForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    commissionRate: 10,
    warehouseId: '',
    department: '',
    workCity: '',
    workZone: '',
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const ctx = await getAuthContext();
      const resolvedOrgId = ctx?.organizationId ?? null;
      if (resolvedOrgId) {
        setOrgId(resolvedOrgId);
        loadProspecteurs(resolvedOrgId);
        supabase
          .rpc('jdvcrm_is_org_admin_v1', { p_organization_id: resolvedOrgId })
          .then(({ data: ok }) => setIsAdmin(ok === true));
        supabase
          .from('warehouses')
          .select('id,name,code,city')
          .eq('organization_id', resolvedOrgId)
          .eq('active', true)
          .order('name')
          .then(({ data }) =>
            setWarehouses(
              (data ?? []) as { id: string; name: string; code: string; city: string | null }[]
            )
          );
        supabase
          .from('organizations')
          .select('name')
          .eq('id', resolvedOrgId)
          .maybeSingle()
          .then(({ data: o }) => {
            setOrgName((o as { name?: string } | null)?.name ?? '');
          });
      } else {
        setLoading(false);
      }
    });
  }, []);

  async function loadProspecteurs(oid: string) {
    setLoading(true);
    const { data: rows } = await supabase
      .from('prospecteurs')
      .select(
        'id, first_name, last_name, phone, city, created_at, status, email, code, address, commission_rate'
      )
      .eq('organization_id', oid)
      .order('created_at', { ascending: false });

    if (!rows || rows.length === 0) {
      setProspecteurs([]);
      setLoading(false);
      return;
    }

    const profiles = (rows as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      full_name: personName(r as never) || '',
      phone: (r.phone as string) ?? null,
      city: (r.city as string) ?? null,
      created_at: r.created_at as string,
      status: (r.status as string) ?? 'active',
      email: (r.email as string) ?? null,
      code: (r.code as string) ?? null,
      address: (r.address as string) ?? null,
      commission_rate:
        r.commission_rate === null || r.commission_rate === undefined
          ? null
          : Number(r.commission_rate),
    }));
    const ids = profiles.map((p) => p.id);

    const { data: salesRows } = await supabase
      .from('sales')
      .select('prospecteur_id, sale_type, cash_price, credit_price, fixed_price, quantity')
      .eq('organization_id', oid)
      .in('prospecteur_id', ids);
    const salesRes = { data: salesRows };

    const salesCountMap: Record<string, number> = {};
    const salesAmountMap: Record<string, number> = {};
    ((salesRes.data ?? []) as Record<string, unknown>[]).forEach((s) => {
      const pid = s.prospecteur_id as string | null;
      if (pid) {
        salesCountMap[pid] = (salesCountMap[pid] ?? 0) + 1;
        salesAmountMap[pid] = (salesAmountMap[pid] ?? 0) + toCents(saleTotal(s as never));
      }
    });

    setProspecteurs(
      profiles.map((p) => ({
        ...p,
        sales_count: salesCountMap[p.id] ?? 0,
        sales_amount: salesAmountMap[p.id] ?? 0,
      }))
    );
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId) return;
    setSubmitting(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        toast.error(t('bz.proSession'));
        return;
      }
      const res = await fetch('/api/business/create-prospecteur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, organizationId: orgId, organizationName: orgName }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? t('bz.proCreateFail'));
        return;
      }
      toast.success(t('bz.proCreated').replace('{code}', json.code ?? t('bz.proCodeGen')), {
        duration: 9000,
      });
      setModalOpen(false);
      setForm(emptyForm);
      loadProspecteurs(orgId);
    } finally {
      setSubmitting(false);
    }
  }

  async function setStatus(p: ProspecteurRow, status: 'active' | 'suspended') {
    if (
      status === 'suspended' &&
      !window.confirm(t('bz.proSuspendQ').replace('{name}', p.full_name || t('bz.proNoName')))
    )
      return;
    setBusyId(p.id);
    const { error } = await supabase.rpc('jdvcrm_set_prospecteur_status_v1', {
      p_prospecteur_id: p.id,
      p_status: status,
    });
    setBusyId(null);
    if (error) {
      toast.error(frError(error.message));
      return;
    }
    toast.success(status === 'active' ? t('bz.proReact') : t('bz.proSuspended'));
    setSelected(null);
    if (orgId) loadProspecteurs(orgId);
  }

  function openFiche(p: ProspecteurRow) {
    setSelected(p);
    setFiche({
      phone: p.phone ?? '',
      city: p.city ?? '',
      address: p.address ?? '',
      commission: p.commission_rate === null ? '' : String(p.commission_rate),
    });
  }

  async function saveFiche() {
    if (!selected) return;
    const patch: {
      phone: string | null;
      city: string | null;
      address: string | null;
      commission_rate?: number;
    } = {
      phone: fiche.phone.trim() || null,
      city: fiche.city.trim() || null,
      address: fiche.address.trim() || null,
    };
    if (isAdmin && fiche.commission !== '')
      patch.commission_rate = Math.min(100, Math.max(0, Number(fiche.commission) || 0));
    setBusyId(selected.id);
    const { error } = await supabase.from('prospecteurs').update(patch).eq('id', selected.id);
    setBusyId(null);
    if (error) {
      toast.error(frError(error.message));
      return;
    }
    toast.success(t('bz.proFicheSaved'));
    setSelected(null);
    if (orgId) loadProspecteurs(orgId);
  }

  const filtered = prospecteurs.filter(
    (p) =>
      (statusFilter === 'all' ||
        (statusFilter === 'active' ? p.status === 'active' : p.status !== 'active')) &&
      (!search ||
        p.full_name.toLowerCase().includes(search.toLowerCase()) ||
        (p.phone ?? '').includes(search))
  );

  const fmt = (cents: number) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0,
    }).format(cents / 100);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('bz.proTitle')}</h1>
          <p className="text-sm text-[#A0AEC0] mt-1">
            {t('bz.proCount').replace('{n}', String(prospecteurs.length))}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => orgId && loadProspecteurs(orgId)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#D4AF37]/20 text-[#A0AEC0] hover:text-white text-sm transition-colors"
          >
            <RefreshCw size={14} />
            {t('bz.fnRefresh')}
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 btn-gold px-4 py-2 rounded-xl text-sm font-bold"
          >
            <Plus size={14} />
            {t('bz.proNew')}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718096]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('bz.proSearchPh')}
            className="w-full bg-[#0F2347] border border-[#D4AF37]/20 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder-[#718096] focus:outline-none focus:border-[#D4AF37]/60"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'suspended')}
          className="bg-[#0F2347] border border-[#D4AF37]/20 rounded-xl px-3 py-2.5 text-white text-sm"
        >
          <option value="all">{t('bz.proFAll')}</option>
          <option value="active">{t('bz.proFActive')}</option>
          <option value="suspended">{t('bz.proFOther')}</option>
        </select>
      </div>

      <div className="bg-[#0F2347] border border-[#D4AF37]/20 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[#A0AEC0] text-sm">{t('bz.proLoading')}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={32} className="mx-auto mb-3 text-[#718096] opacity-50" />
            <p className="text-[#A0AEC0] text-sm">{t('bz.proNone')}</p>
            <p className="text-xs text-[#718096] mt-1">{t('bz.proNoneHint')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#D4AF37]/10">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#718096] uppercase">
                    {t('bz.proColPros')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#718096] uppercase">
                    {t('bz.proColPhone')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#718096] uppercase">
                    {t('bz.proColStatus')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#718096] uppercase">
                    {t('bz.proColSales')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#718096] uppercase">
                    {t('bz.proColRev')}
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-[#D4AF37]/5 hover:bg-[#0A1628]/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] text-xs font-bold">
                          {(p.full_name || t('bz.proNoName')).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {p.full_name || t('bz.proNoName')}
                          </p>
                          {p.city && <p className="text-xs text-[#718096]">{p.city}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#A0AEC0]">{p.phone ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] ${p.status === 'active' ? 'badge-success' : 'badge-danger'}`}
                      >
                        {statusLabel(p.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <ShoppingCart size={12} className="text-[#D4AF37]" />
                        <span className="text-sm font-semibold text-white">
                          {p.sales_count ?? 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#D4AF37]">
                      {fmt(p.sales_amount ?? 0)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openFiche(p)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#D4AF37]/20 px-3 py-1.5 text-xs text-[#A0AEC0] hover:text-white"
                        >
                          <FileText size={12} />
                          {t('bz.proFiche')}
                        </button>
                        {p.status === 'active' ? (
                          <button
                            disabled={busyId === p.id}
                            onClick={() => setStatus(p, 'suspended')}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 disabled:opacity-50"
                          >
                            <UserX size={12} />
                            {t('bz.proSuspend')}
                          </button>
                        ) : (
                          <button
                            disabled={busyId === p.id}
                            onClick={() => setStatus(p, 'active')}
                            className="inline-flex items-center gap-1 rounded-lg border border-green-500/30 px-3 py-1.5 text-xs text-green-400 disabled:opacity-50"
                          >
                            <UserCheck size={12} />
                            {t('bz.proReactBtn')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={
          selected
            ? t('bz.proFicheTitle').replace('{name}', selected.full_name || t('bz.proNoName'))
            : ''
        }
        size="md"
      >
        {selected && (
          <div className="space-y-4 p-1">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-[#718096]">{t('bz.proCode')}</p>
                <p className="font-semibold text-white">{selected.code ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[#718096]">{t('bz.proColStatus')}</p>
                <p className="font-semibold text-white">{statusLabel(selected.status)}</p>
              </div>
              <div>
                <p className="text-xs text-[#718096]">{t('bz.proLoginEmail')}</p>
                <p className="break-all font-semibold text-white">{selected.email ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[#718096]">{t('bz.proCreatedOn')}</p>
                <p className="font-semibold text-white">
                  {new Date(selected.created_at).toLocaleDateString(locale)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#718096]">{t('bz.proColSales')}</p>
                <p className="font-semibold text-white">{selected.sales_count ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-[#718096]">{t('bz.proRevenue')}</p>
                <p className="font-semibold text-[#D4AF37]">{fmt(selected.sales_amount ?? 0)}</p>
              </div>
            </div>
            <div className="space-y-3 rounded-xl border border-[#D4AF37]/10 p-4">
              <p className="text-xs font-semibold text-[#D4AF37]">{t('bz.proEditFiche')}</p>
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder={t('bz.proColPhone')}
                  value={fiche.phone}
                  onChange={(e) => setFiche((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full bg-[#0A1628] border border-[#D4AF37]/20 rounded-xl px-3 py-2.5 text-white text-sm"
                />
                <input
                  placeholder={t('bz.proCity')}
                  value={fiche.city}
                  onChange={(e) => setFiche((f) => ({ ...f, city: e.target.value }))}
                  className="w-full bg-[#0A1628] border border-[#D4AF37]/20 rounded-xl px-3 py-2.5 text-white text-sm"
                />
              </div>
              <input
                placeholder={t('bz.proAddress')}
                value={fiche.address}
                onChange={(e) => setFiche((f) => ({ ...f, address: e.target.value }))}
                className="w-full bg-[#0A1628] border border-[#D4AF37]/20 rounded-xl px-3 py-2.5 text-white text-sm"
              />
              {isAdmin && (
                <div>
                  <label className="block text-xs font-medium text-[#A0AEC0] mb-1.5">
                    {t('bz.proCommission')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.5"
                    value={fiche.commission}
                    onChange={(e) => setFiche((f) => ({ ...f, commission: e.target.value }))}
                    className="w-full bg-[#0A1628] border border-[#D4AF37]/20 rounded-xl px-3 py-2.5 text-white text-sm"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#D4AF37]/20 text-[#A0AEC0] text-sm"
              >
                {t('bz.proClose')}
              </button>
              <button
                type="button"
                onClick={saveFiche}
                disabled={busyId === selected.id}
                className="flex-1 btn-gold py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60"
              >
                {t('bz.proSave')}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('bz.proNew')} size="md">
        <form onSubmit={handleCreate} className="space-y-4 p-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#A0AEC0] mb-1.5">
                {t('bz.proFirst')}
              </label>
              <input
                required
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className="w-full bg-[#0A1628] border border-[#D4AF37]/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]/60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#A0AEC0] mb-1.5">
                {t('bz.proLast')}
              </label>
              <input
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className="w-full bg-[#0A1628] border border-[#D4AF37]/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]/60"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#A0AEC0] mb-1.5">
              {t('bz.proEmailReq')}
            </label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full bg-[#0A1628] border border-[#D4AF37]/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]/60"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#A0AEC0] mb-1.5">
                {t('bz.proColPhone')}
              </label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full bg-[#0A1628] border border-[#D4AF37]/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]/60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#A0AEC0] mb-1.5">
                {t('bz.proCommission')}
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step="0.5"
                value={form.commissionRate}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    commissionRate: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                  }))
                }
                className="w-full bg-[#0A1628] border border-[#D4AF37]/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]/60"
              />
            </div>
          </div>
          <div className="space-y-3 rounded-xl border border-[#D4AF37]/10 p-4">
            <p className="text-xs font-semibold text-[#D4AF37]">{t('bz.proAssignH')}</p>
            <select
              value={form.warehouseId}
              onChange={(e) => setForm((f) => ({ ...f, warehouseId: e.target.value }))}
              className="w-full bg-[#0A1628] border border-[#D4AF37]/20 rounded-xl px-3 py-2.5 text-white text-sm"
            >
              <option value="">{t('bz.proNoWh')}</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} — {w.code}
                  {w.city ? ` — ${w.city}` : ''}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-3 gap-3">
              <input
                placeholder={t('bz.proDept')}
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                className="w-full bg-[#0A1628] border border-[#D4AF37]/20 rounded-xl px-3 py-2.5 text-white text-sm"
              />
              <input
                placeholder={t('bz.proWorkCity')}
                value={form.workCity}
                onChange={(e) => setForm((f) => ({ ...f, workCity: e.target.value }))}
                className="w-full bg-[#0A1628] border border-[#D4AF37]/20 rounded-xl px-3 py-2.5 text-white text-sm"
              />
              <input
                placeholder={t('bz.proZone')}
                value={form.workZone}
                onChange={(e) => setForm((f) => ({ ...f, workZone: e.target.value }))}
                className="w-full bg-[#0A1628] border border-[#D4AF37]/20 rounded-xl px-3 py-2.5 text-white text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#A0AEC0] mb-1.5">
              {t('bz.proPwd')}
            </label>
            <div className="relative">
              <input
                required
                minLength={8}
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full bg-[#0A1628] border border-[#D4AF37]/20 rounded-xl px-3 py-2.5 pr-10 text-white text-sm focus:outline-none focus:border-[#D4AF37]/60"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718096] hover:text-white"
              >
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <p className="text-xs text-[#718096] mt-1">{t('bz.proNoMail')}</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-[#D4AF37]/20 text-[#A0AEC0] text-sm hover:text-white transition-colors"
            >
              {t('bz.proCancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 btn-gold py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60"
            >
              {submitting ? t('bz.proCreating') : t('bz.proCreateBtn')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
