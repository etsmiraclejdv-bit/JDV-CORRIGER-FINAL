'use client';

import React, { useEffect, useState } from 'react';
import { Warehouse, Plus, MapPin, RefreshCw, ArrowRightLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { fetchOrgProfile } from '@/lib/auth/context';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import CreateWarehouseManagerForm from '@/components/entrepot/CreateWarehouseManagerForm';

type Wh = {
  id: string;
  code: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  active: boolean;
  manager_user_id?: string | null;
};

type P = {
  id: string;
  first_name: string;
  last_name: string;
  city: string | null;
  status: string;
};

type A = {
  id: string;
  prospecteur_id: string;
  warehouse_id: string;
  department: string | null;
  city: string | null;
  work_zone: string | null;
  is_primary: boolean;
  active: boolean;
  prospecteurs?: P;
  warehouses?: Wh;
};

const input =
  'w-full bg-[#0A1628] border border-[#34D399]/20 rounded-xl px-3 py-2.5 text-white text-sm';
const label = 'block text-[11px] text-[#A0AEC0] mb-1';

export default function WarehousesPage() {
  const { t } = useLanguage();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [warehouses, setWarehouses] = useState<Wh[]>([]);
  const [prospecteurs, setProspecteurs] = useState<P[]>([]);
  const [assignments, setAssignments] = useState<A[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [openedWarehouse, setOpenedWarehouse] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: '',
    name: '',
    address: '',
    city: '',
    country: 'Benin',
  });
  const [selected, setSelected] = useState<
    Record<
      string,
      {
        warehouse_id: string;
        department: string;
        city: string;
        work_zone: string;
      }
    >
  >({});
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);

    const { data: profile } = await fetchOrgProfile();

    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    setOrgId(profile.organization_id);

    const [w, p, a] = await Promise.all([
      supabase
        .from('warehouses')
        .select('id,code,name,address,city,country,active,manager_user_id')
        .eq('organization_id', profile.organization_id)
        .order('name'),

      supabase
        .from('prospecteurs')
        .select('id,first_name,last_name,city,status')
        .eq('organization_id', profile.organization_id)
        .eq('status', 'active')
        .order('first_name'),

      supabase
        .from('prospecteur_warehouse_assignments')
        .select(
          'id,prospecteur_id,warehouse_id,department,city,work_zone,is_primary,active,prospecteurs(id,first_name,last_name,city,status),warehouses(id,code,name,address,city,country,active)'
        )
        .eq('organization_id', profile.organization_id)
        .eq('active', true)
        .eq('is_primary', true),
    ]);

    setWarehouses((w.data ?? []) as Wh[]);
    setProspecteurs((p.data ?? []) as P[]);
    const normalizedAssignments = (a.data ?? []).map((row) => {
      const record = row as unknown as Record<string, unknown>;
      const prospecteursRelation = record.prospecteurs;
      const warehousesRelation = record.warehouses;
      return {
        ...record,
        prospecteurs: Array.isArray(prospecteursRelation)
          ? (prospecteursRelation[0] ?? undefined)
          : prospecteursRelation,
        warehouses: Array.isArray(warehousesRelation)
          ? (warehousesRelation[0] ?? undefined)
          : warehousesRelation,
      };
    });
    setAssignments(normalizedAssignments as unknown as A[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orgId) return;

    const { error } = await supabase.rpc('jdvcrm_create_warehouse_v1', {
      p_organization_id: orgId,
      p_code: form.code,
      p_name: form.name,
      p_address: form.address || undefined,
      p_city: form.city,
      p_country: form.country || 'Bénin',
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(t('bz.enCreated'));
    setForm({
      code: '',
      name: '',
      address: '',
      city: '',
      country: 'Benin',
    });
    setShowCreate(false);
    load();
  };

  const assign = async (pid: string) => {
    if (!orgId) return;
    const v = selected[pid];
    if (!v?.warehouse_id) {
      toast.error(t('bz.enPickWh'));
      return;
    }

    setSaving(pid);
    const { error } = await supabase.rpc('jdvcrm_assign_prospecteur_warehouse_v1', {
      p_organization_id: orgId,
      p_prospecteur_id: pid,
      p_warehouse_id: v.warehouse_id,
      p_department: v.department || undefined,
      p_city: v.city || undefined,
      p_work_zone: v.work_zone || undefined,
    });
    setSaving(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(t('bz.enAssigned'));
    await load();
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <Warehouse className="text-[#34D399]" />
            <h1 className="text-2xl font-bold text-white">{t('bz.enTitle')}</h1>
          </div>
          <p className="text-sm text-[#A0AEC0] mt-1">{t('bz.enIntro')}</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={load}
            className="p-2.5 rounded-xl border border-[#34D399]/20 text-[#A0AEC0]"
          >
            <RefreshCw size={16} />
          </button>

          <button
            type="button"
            onClick={() => setShowCreate((v) => !v)}
            className="btn-gold px-4 py-2 rounded-xl text-sm font-bold"
          >
            <Plus size={15} className="inline mr-1" />
            {t('bz.enNew')}
          </button>
        </div>
      </div>

      <CreateWarehouseManagerForm warehouses={warehouses} onCreated={() => void load()} />

      {showCreate && (
        <form
          onSubmit={create}
          className="bg-[#0F2347] border border-[#34D399]/20 rounded-2xl p-5 grid md:grid-cols-5 gap-3"
        >
          <input
            required
            placeholder={t('bz.enCode')}
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            className={input}
          />
          <input
            required
            placeholder={t('bz.enName')}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={input}
          />
          <input
            placeholder={t('bz.enAddress')}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className={input}
          />
          <input
            required
            placeholder={t('bz.enCity')}
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className={input}
          />
          <button type="submit" className="btn-gold rounded-xl">
            <Save size={15} className="inline mr-1" />
            {t('bz.enCreate')}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-[#A0AEC0]">{t('bz.enLoading')}</div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-4">
            {warehouses.map((w) => (
              <button
                type="button"
                key={w.id}
                onClick={() => setOpenedWarehouse(w.id)}
                className={
                  'text-left bg-[#0F2347] border rounded-2xl p-4 transition-all ' +
                  (openedWarehouse === w.id
                    ? 'border-[#34D399]/60 bg-[#34D399]/5'
                    : 'border-[#34D399]/15 hover:border-[#34D399]/40')
                }
              >
                <div className="flex justify-between">
                  <b className="text-white">{w.name}</b>
                  <span className="text-xs text-[#34D399]">{w.code}</span>
                </div>
                <p className="text-xs text-[#A0AEC0] mt-2">
                  <MapPin size={12} className="inline" /> {w.address || w.city || t('bz.enNoAddr')}
                </p>
                <p className="text-[11px] text-[#718096] mt-3">{t('bz.enOpen')}</p>
              </button>
            ))}
          </div>

          {openedWarehouse && (
            <div className="bg-[#0F2347] border border-[#34D399]/20 rounded-2xl p-5 space-y-4">
              {(() => {
                const w = warehouses.find((x) => x.id === openedWarehouse);
                const members = assignments.filter((x) => x.warehouse_id === openedWarehouse);

                if (!w) return null;

                return (
                  <>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-[#34D399]">
                          {t('bz.enSystem')}
                        </p>
                        <h2 className="text-lg font-bold text-white">{w.name}</h2>
                        <p className="text-xs text-[#A0AEC0]">
                          {w.code} · {w.city || t('bz.enNoCity')} · {w.address || t('bz.enNoAddr')}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setOpenedWarehouse(null)}
                        className="text-xs text-[#A0AEC0] hover:text-white"
                      >
                        {t('bz.enClose')}
                      </button>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-white mb-2">
                        {t('bz.enAssignedPros')}
                      </h3>

                      {members.length === 0 ? (
                        <p className="text-sm text-[#718096]">{t('bz.enNoPros')}</p>
                      ) : (
                        <div className="space-y-2">
                          {members.map((a) => (
                            <div
                              key={a.id}
                              className="flex items-center justify-between p-3 rounded-xl bg-[#0A1628] border border-[#34D399]/10"
                            >
                              <div>
                                <p className="text-sm font-semibold text-white">
                                  {a.prospecteurs?.first_name} {a.prospecteurs?.last_name}
                                </p>
                                <p className="text-xs text-[#718096]">
                                  {a.department || t('bz.enNoDept')} · {a.city || t('bz.enNoCity')}{' '}
                                  · {a.work_zone || t('bz.enNoZone')}
                                </p>
                              </div>
                              <span className="text-xs text-emerald-300">
                                {t('bz.enAssignedL')}
                                {a.is_primary ? t('bz.enPrimary') : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          <div className="bg-[#0F2347] border border-[#34D399]/20 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[#34D399]/10">
              <h2 className="font-semibold text-white">{t('bz.enMoveH')}</h2>
              <p className="text-xs text-[#718096] mt-1">{t('bz.enMoveNote')}</p>
            </div>

            <div className="divide-y divide-[#34D399]/10">
              {prospecteurs.map((p) => {
                const a = assignments.find((x) => x.prospecteur_id === p.id);
                const v = selected[p.id] ?? {
                  warehouse_id: a?.warehouse_id ?? '',
                  department: a?.department ?? '',
                  city: a?.city ?? p.city ?? '',
                  work_zone: a?.work_zone ?? '',
                };

                return (
                  <div key={p.id} className="p-4 grid lg:grid-cols-6 gap-3 items-end">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {p.first_name} {p.last_name}
                      </p>
                      <p className="text-xs text-[#718096]">
                        {a?.warehouses?.name ?? t('bz.enNoWh')}
                      </p>
                    </div>

                    <div>
                      <label className={label}>{t('bz.enColWh')}</label>
                      <select
                        value={v.warehouse_id}
                        onChange={(e) =>
                          setSelected((s) => ({
                            ...s,
                            [p.id]: {
                              ...v,
                              warehouse_id: e.target.value,
                            },
                          }))
                        }
                        className={input}
                      >
                        <option value="">{t('bz.enChoose')}</option>
                        {warehouses.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name} — {w.city}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={label}>{t('bz.enDept')}</label>
                      <input
                        value={v.department}
                        onChange={(e) =>
                          setSelected((s) => ({
                            ...s,
                            [p.id]: {
                              ...v,
                              department: e.target.value,
                            },
                          }))
                        }
                        className={input}
                        placeholder={t('bz.enDept')}
                      />
                    </div>

                    <div>
                      <label className={label}>{t('bz.enCity')}</label>
                      <input
                        value={v.city}
                        onChange={(e) =>
                          setSelected((s) => ({
                            ...s,
                            [p.id]: {
                              ...v,
                              city: e.target.value,
                            },
                          }))
                        }
                        className={input}
                        placeholder={t('bz.enCity')}
                      />
                    </div>

                    <div>
                      <label className={label}>{t('bz.enZone')}</label>
                      <input
                        value={v.work_zone}
                        onChange={(e) =>
                          setSelected((s) => ({
                            ...s,
                            [p.id]: {
                              ...v,
                              work_zone: e.target.value,
                            },
                          }))
                        }
                        className={input}
                        placeholder={t('bz.enZonePh')}
                      />
                    </div>

                    <button
                      type="button"
                      disabled={saving === p.id}
                      onClick={() => assign(p.id)}
                      className="btn-gold rounded-xl py-2.5 disabled:opacity-50"
                    >
                      {saving === p.id ? (
                        '…'
                      ) : (
                        <>
                          <ArrowRightLeft size={15} className="inline mr-1" />
                          {t('bz.enAssign')}
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
