'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { getAuthContext, type AuthContextData } from '@/lib/auth/context';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TerrainKey } from '@/lib/i18n/terrain';

type Warehouse = {
  id: string;
  name: string;
  code: string;
  city: string | null;
};

type Manager = {
  user_id: string;
  display_name: string | null;
  phone: string | null;
};

type Subwarehouse = {
  id: string;
  organization_id: string;
  parent_warehouse_id: string;
  code: string;
  name: string;
  address: string | null;
  city: string | null;
  zone: string | null;
  manager_user_id: string | null;
  active: boolean;
  created_at: string;
};

export default function SousEntrepotsPage() {
  const { t } = useLanguage();
  // Les messages « bz.… » sont des clés de traduction ; le reste vient du serveur.
  const tr = (s: string) => (s.startsWith('bz.') ? t(s as TerrainKey) : s);
  const [ctx, setCtx] = useState<AuthContextData | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [subwarehouses, setSubwarehouses] = useState<Subwarehouse[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [managerDirectory, setManagerDirectory] = useState<Manager[]>([]);
  const [selectedParent, setSelectedParent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    zone: '',
    manager_user_id: '',
  });

  const isAdmin = !!ctx?.isSuperAdmin || !!ctx?.isOrgAdmin;

  const parentName = useMemo(
    () => warehouses.find((warehouse) => warehouse.id === selectedParent)?.name ?? '',
    [warehouses, selectedParent]
  );

  async function loadData(orgId: string) {
    setError('');

    const [warehouseRes, subwarehouseRes] = await Promise.all([
      supabase
        .from('warehouses')
        .select('id,name,code,city')
        .eq('organization_id', orgId)
        .eq('active', true)
        .order('name'),
      supabase
        .from('warehouse_subwarehouses')
        .select(
          'id,organization_id,parent_warehouse_id,code,name,address,city,zone,manager_user_id,active,created_at'
        )
        .eq('organization_id', orgId)
        .order('name'),
    ]);

    if (warehouseRes.error) throw warehouseRes.error;
    if (subwarehouseRes.error) throw subwarehouseRes.error;

    const nextWarehouses = (warehouseRes.data ?? []) as Warehouse[];
    setWarehouses(nextWarehouses);
    setSubwarehouses((subwarehouseRes.data ?? []) as Subwarehouse[]);

    const { data: directoryData } = await supabase
      .from('warehouse_managers')
      .select('user_id,display_name,phone')
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .order('display_name');
    setManagerDirectory((directoryData ?? []) as Manager[]);

    if (!selectedParent && nextWarehouses.length) {
      setSelectedParent(nextWarehouses[0].id);
    }
  }

  async function loadManagers(parentId: string) {
    if (!parentId) {
      setManagers([]);
      return;
    }

    const { data, error: managerError } = await supabase
      .from('warehouse_managers')
      .select('user_id,display_name,phone')
      .eq('warehouse_id', parentId)
      .eq('status', 'active')
      .order('display_name');

    if (managerError) {
      setManagers([]);
      setError(managerError.message);
      return;
    }

    setManagers((data ?? []) as Manager[]);
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const auth = await getAuthContext();
        if (!mounted) return;

        setCtx(auth);

        if (!auth?.organizationId) {
          setLoading(false);
          return;
        }

        await loadData(auth.organizationId);
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : 'bz.swLoadErr');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (selectedParent) {
      void loadManagers(selectedParent);
    }
  }, [selectedParent]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!ctx?.organizationId || !isAdmin) {
      setError('bz.swAdminOnly');
      return;
    }

    if (!selectedParent || !form.name.trim() || !form.code.trim()) {
      setError('bz.swRequired');
      return;
    }

    setSaving(true);

    const { error: insertError } = await supabase.from('warehouse_subwarehouses').insert({
      organization_id: ctx.organizationId,
      parent_warehouse_id: selectedParent,
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      zone: form.zone.trim() || null,
      manager_user_id:
        form.manager_user_id === '__me__' ? ctx.userId : form.manager_user_id || null,
      created_by: ctx.userId,
      active: true,
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setForm({
      name: '',
      code: '',
      address: '',
      city: '',
      zone: '',
      manager_user_id: '',
    });

    await loadData(ctx.organizationId);
    setSuccess('bz.swCreated');
    setSaving(false);
  }

  async function toggleActive(item: Subwarehouse) {
    if (!ctx?.organizationId || !isAdmin) return;

    setError('');
    setSuccess('');

    const { error: updateError } = await supabase
      .from('warehouse_subwarehouses')
      .update({ active: !item.active })
      .eq('id', item.id)
      .eq('organization_id', ctx.organizationId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadData(ctx.organizationId);
    setSuccess(item.active ? 'bz.swDisabled' : 'bz.swEnabled');
  }

  if (loading) {
    return <div className="p-6 text-slate-300">{t('bz.swLoading')}</div>;
  }

  if (!ctx?.organizationId) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-2xl font-bold">{t('bz.swTitle')}</h1>
        <p className="mt-2 text-slate-400">{t('bz.swNoOrg')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-full space-y-6 p-6 text-white">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
            {t('bz.swKicker')}
          </p>
          <h1 className="mt-1 text-3xl font-bold">{t('bz.swTitle')}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">{t('bz.swIntro')}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#08152f] px-4 py-3 text-sm">
          <span className="text-slate-400">{t('bz.swOrg')}</span>
          <div className="font-semibold">{ctx.displayName}</div>
          <Link
            href="/business/dashboard/sous-entrepots/stock"
            className="mt-2 inline-block text-[#D4AF37]"
          >
            {t('bz.swSeeStock')}
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-400/30 bg-red-950/30 p-4 text-sm text-red-200">
          {tr(error)}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-950/30 p-4 text-sm text-emerald-200">
          {tr(success)}
        </div>
      )}

      {isAdmin ? (
        <section className="rounded-2xl border border-[#D4AF37]/20 bg-[#08152f] p-5 shadow-xl">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-[#D4AF37]">{t('bz.swCreateH')}</h2>
            <p className="mt-1 text-sm text-slate-400">{t('bz.swAdminNote')}</p>
          </div>

          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-slate-300">{t('bz.swParent')}</span>
              <select
                value={selectedParent}
                onChange={(e) => {
                  setSelectedParent(e.target.value);
                  setForm((current) => ({ ...current, manager_user_id: '' }));
                }}
                className="w-full rounded-xl border border-white/10 bg-[#0F2347] px-3 py-3 text-white outline-none"
              >
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} ({warehouse.code})
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm text-slate-300">{t('bz.swName')}</span>
              <input
                value={form.name}
                onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                placeholder="AKASSATO-NORD"
                className="w-full rounded-xl border border-white/10 bg-[#0F2347] px-3 py-3 text-white placeholder:text-slate-500 outline-none"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-slate-300">{t('bz.swCode')}</span>
              <input
                value={form.code}
                onChange={(e) =>
                  setForm((current) => ({ ...current, code: e.target.value.toUpperCase() }))
                }
                placeholder="AK-NORD"
                className="w-full rounded-xl border border-white/10 bg-[#0F2347] px-3 py-3 text-white placeholder:text-slate-500 outline-none"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-slate-300">{t('bz.swManager')}</span>
              <select
                value={form.manager_user_id}
                onChange={(e) =>
                  setForm((current) => ({ ...current, manager_user_id: e.target.value }))
                }
                className="w-full rounded-xl border border-white/10 bg-[#0F2347] px-3 py-3 text-white outline-none"
              >
                <option value="">{t('bz.swNoManager')}</option>
                <option value="__me__">
                  {t('bz.swMe').replace('{name}', ctx.displayName ?? '')}
                </option>
                {managers.map((manager) => (
                  <option key={manager.user_id} value={manager.user_id}>
                    {manager.display_name || manager.user_id}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm text-slate-300">{t('bz.swCity')}</span>
              <input
                value={form.city}
                onChange={(e) => setForm((current) => ({ ...current, city: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-[#0F2347] px-3 py-3 text-white outline-none"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-slate-300">{t('bz.swZone')}</span>
              <input
                value={form.zone}
                onChange={(e) => setForm((current) => ({ ...current, zone: e.target.value }))}
                placeholder="Nord"
                className="w-full rounded-xl border border-white/10 bg-[#0F2347] px-3 py-3 text-white outline-none"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm text-slate-300">{t('bz.swAddress')}</span>
              <input
                value={form.address}
                onChange={(e) => setForm((current) => ({ ...current, address: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-[#0F2347] px-3 py-3 text-white outline-none"
              />
            </label>

            <div className="md:col-span-2 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
              <div className="text-xs text-slate-500">
                {t('bz.swSelParent')} <span className="text-slate-300">{parentName || '—'}</span>
              </div>
              <button
                type="submit"
                disabled={saving || !warehouses.length}
                className="rounded-xl bg-[#D4AF37] px-5 py-3 font-semibold text-[#07142c] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? t('bz.swCreating') : t('bz.swCreateBtn')}
              </button>
            </div>
          </form>
        </section>
      ) : (
        <div className="rounded-xl border border-white/10 bg-[#08152f] p-4 text-sm text-slate-400">
          {t('bz.swViewOnly')}
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-[#08152f] p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{t('bz.swRegistered')}</h2>
            <p className="mt-1 text-sm text-slate-400">
              {t('bz.swUnits').replace('{n}', String(subwarehouses.length))}
            </p>
          </div>
        </div>

        {!subwarehouses.length ? (
          <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-slate-500">
            {t('bz.swNone')}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {subwarehouses.map((item) => {
              const parent = warehouses.find(
                (warehouse) => warehouse.id === item.parent_warehouse_id
              );
              const manager =
                item.manager_user_id === ctx.userId
                  ? ctx.displayName
                  : managers.find((candidate) => candidate.user_id === item.manager_user_id)
                      ?.display_name;

              return (
                <article
                  key={item.id}
                  className="rounded-xl border border-white/10 bg-[#0F2347] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                        {item.code}
                      </div>
                      <h3 className="mt-1 text-lg font-semibold">{item.name}</h3>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${item.active ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-500/10 text-slate-400'}`}
                    >
                      {item.active ? t('bz.swActive') : t('bz.swInactive')}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-300">
                    <div>
                      <span className="text-slate-500">{t('bz.swParentL')}</span>{' '}
                      {parent?.name || item.parent_warehouse_id}
                    </div>
                    {item.city && (
                      <div>
                        <span className="text-slate-500">{t('bz.swCityL')}</span> {item.city}
                      </div>
                    )}
                    {item.zone && (
                      <div>
                        <span className="text-slate-500">{t('bz.swZoneL')}</span> {item.zone}
                      </div>
                    )}
                    {manager && (
                      <div>
                        <span className="text-slate-500">{t('bz.swManagerL')}</span> {manager}
                      </div>
                    )}
                    {item.address && (
                      <div>
                        <span className="text-slate-500">{t('bz.swAddressL')}</span> {item.address}
                      </div>
                    )}
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => void toggleActive(item)}
                      className="mt-5 w-full rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
                    >
                      {item.active ? t('bz.swDeactivate') : t('bz.swReactivate')}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
