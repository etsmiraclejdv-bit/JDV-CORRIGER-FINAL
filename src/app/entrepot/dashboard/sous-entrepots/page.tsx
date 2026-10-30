'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useWarehouse } from '@/components/entrepot/WarehouseContext';
import {
  Banner,
  Card,
  PageTitle,
  btnGhost,
  btnGold,
  inputCls,
  useBanner,
} from '@/components/entrepot/common';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TerrainKey } from '@/lib/i18n/terrain';

type Sub = {
  id: string;
  code: string;
  name: string;
  address: string | null;
  city: string | null;
  zone: string | null;
  manager_user_id: string | null;
  active: boolean;
};

const EMPTY = { name: '', code: '', city: '', zone: '', address: '', manager: '' };

export default function SousEntrepotsChefAgencePage() {
  const { current } = useWarehouse();
  const { t } = useLanguage();
  const fill = (key: TerrainKey, vars: Record<string, string | number>) =>
    Object.entries(vars).reduce(
      (text, [name, value]) => text.replace(`{${name}}`, String(value)),
      t(key)
    );
  const { banner, ok, fail, clear } = useBanner();
  const [subs, setSubs] = useState<Sub[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = useCallback(async () => {
    if (!current) return;
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    setUserId(auth.user?.id ?? null);
    const { data, error } = await supabase
      .from('warehouse_subwarehouses')
      .select('id,code,name,address,city,zone,manager_user_id,active')
      .eq('parent_warehouse_id', current.warehouse_id)
      .order('name');
    if (error) fail(error.message);
    setSubs((data ?? []) as Sub[]);
    setLoading(false);
  }, [current, fail]);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clear();
    if (!current || !userId) return;
    if (!form.name.trim() || !form.code.trim()) {
      fail(t('we.eNameCode'));
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('warehouse_subwarehouses').insert({
      organization_id: current.organization_id,
      parent_warehouse_id: current.warehouse_id,
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      city: form.city.trim() || null,
      zone: form.zone.trim() || null,
      address: form.address.trim() || null,
      manager_user_id: form.manager === 'me' ? userId : null,
      created_by: userId,
      active: true,
    });
    setSaving(false);
    if (error) {
      fail(error.code === '23505' ? t('we.eCodeExists') : error.message);
      return;
    }
    setForm(EMPTY);
    ok(t('we.created'));
    load();
  }

  async function toggle(s: Sub) {
    clear();
    const { error } = await supabase
      .from('warehouse_subwarehouses')
      .update({ active: !s.active })
      .eq('id', s.id);
    if (error) {
      fail(error.message);
      return;
    }
    ok(s.active ? t('we.deactivated') : t('we.reactivated'));
    load();
  }

  async function setManager(s: Sub, mine: boolean) {
    clear();
    const { error } = await supabase
      .from('warehouse_subwarehouses')
      .update({ manager_user_id: mine ? userId : null })
      .eq('id', s.id);
    if (error) {
      fail(error.message);
      return;
    }
    ok(mine ? t('we.nowManager') : t('we.managerRemoved'));
    load();
  }

  if (!current) return null;

  return (
    <div className="p-6 space-y-6 text-white">
      <PageTitle title={t('we.sTitle')} subtitle={fill('we.sSub', { n: current.name })} />
      <Banner state={banner} />

      {current.access_role === 'admin' && (
      <Card title={t('we.sCreateCard')}>
        <form onSubmit={create} className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            {t('we.fName')}
            <input
              className={`${inputCls} mt-1`}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="AKASSATO-NORD"
            />
          </label>
          <label className="text-sm">
            {t('we.fUniqueCode')}
            <input
              className={`${inputCls} mt-1`}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="AK-NORD"
            />
          </label>
          <label className="text-sm">
            {t('we.fCity')}
            <input
              className={`${inputCls} mt-1`}
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </label>
          <label className="text-sm">
            {t('we.fZone')}
            <input
              className={`${inputCls} mt-1`}
              value={form.zone}
              onChange={(e) => setForm({ ...form, zone: e.target.value })}
            />
          </label>
          <label className="text-sm md:col-span-2">
            {t('we.fAddress')}
            <input
              className={`${inputCls} mt-1`}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </label>
          <label className="text-sm">
            {t('we.fManager')}
            <select
              className={`${inputCls} mt-1`}
              value={form.manager}
              onChange={(e) => setForm({ ...form, manager: e.target.value })}
            >
              <option value="">{t('we.fNoManager')}</option>
              <option value="me">{t('we.fMe')}</option>
            </select>
          </label>
          <div className="flex items-end justify-end">
            <button className={btnGold} disabled={saving}>
              {saving ? t('we.creating') : t('we.createBtn')}
            </button>
          </div>
        </form>
      </Card>

      </Card>)}

      {current.access_role === 'manager' && (
        <p role="status" className="rounded-xl border border-white/10 bg-[#0F2347] p-3 text-sm text-slate-300">
          Consultation des sous-entrepôts uniquement. La création et la modification sont réservées à l’administrateur de l’entreprise.
        </p>
      )}

      <Card title={fill('we.subsOfBranch', { n: subs.length })}>
        {loading ? (
          <p className="text-sm text-slate-400">{t('we.loading')}</p>
        ) : subs.length === 0 ? (
          <p className="text-sm text-slate-400">{t('we.noSubs')}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {subs.map((s) => (
              <article key={s.id} className="rounded-xl border border-white/10 bg-[#0F2347] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#34D399]">
                      {s.code}
                    </div>
                    <h3 className="mt-1 font-semibold">{s.name}</h3>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${s.active ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-500/10 text-slate-400'}`}
                  >
                    {s.active ? t('we.active') : t('we.inactive')}
                  </span>
                </div>
                <div className="mt-3 space-y-1 text-sm text-slate-300">
                  {s.city && (
                    <div>
                      <span className="text-slate-500">{t('we.lCity')}</span> {s.city}
                    </div>
                  )}
                  {s.zone && (
                    <div>
                      <span className="text-slate-500">{t('we.lZone')}</span> {s.zone}
                    </div>
                  )}
                  {s.address && (
                    <div>
                      <span className="text-slate-500">{t('we.lAddress')}</span> {s.address}
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500">{t('we.lManager')}</span>{' '}
                    {s.manager_user_id
                      ? s.manager_user_id === userId
                        ? t('we.youManager')
                        : t('we.assigned')
                      : t('we.none')}
                  </div>
                </div>
                {current.access_role === 'admin' && (
<div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => toggle(s)} className={`${btnGhost} flex-1`}>
                    {s.active ? t('we.deactivate') : t('we.reactivate')}
                  </button>
                  {s.manager_user_id === userId ? (
                    <button type="button" onClick={() => setManager(s, false)} className={btnGhost}>
                      {t('we.removeMe')}
                    </button>
                  ) : !s.manager_user_id ? (
                    <button type="button" onClick={() => setManager(s, true)} className={btnGhost}>
                      {t('we.takeIt')}
                    </button>
                  ) : null}
                </div>
                )}
              </article>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
