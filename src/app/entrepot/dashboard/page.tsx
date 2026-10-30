'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Search, Store, Truck, ScanBarcode } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useWarehouse } from '@/components/entrepot/WarehouseContext';
import { Banner, Card, PageTitle, Stat, useBanner, useFormat } from '@/components/entrepot/common';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TerrainKey } from '@/lib/i18n/terrain';

type StockRow = {
  article_id: string;
  article_name: string;
  quantity: number;
  minimum_quantity: number;
  is_low: boolean;
};
type Prosp = {
  prospecteur_id: string;
  full_name: string | null;
  overdue_count: number;
  to_return_units: number;
};
type Report = {
  sales_total: { quantity: number; amount: number; sales_count: number };
  tickets: { opened: number; resolved: number; still_open: number };
  supply_requests: { created_today: number; pending: number };
  entries: { quantity: number }[];
  exits: { quantity: number }[];
};

export default function EntrepotOverviewPage() {
  const { current } = useWarehouse();
  const { t } = useLanguage();
  const fill = (key: TerrainKey, vars: Record<string, string | number>) =>
    Object.entries(vars).reduce(
      (text, [name, value]) => text.replace(`{${name}}`, String(value)),
      t(key)
    );
  const { money, num } = useFormat();
  const { banner, fail } = useBanner();
  const [stock, setStock] = useState<StockRow[]>([]);
  const [prosp, setProsp] = useState<Prosp[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!current) return;
    setLoading(true);
    const id = current.warehouse_id;
    const [s, p, r] = await Promise.all([
      supabase.rpc('jdvcrm_warehouse_stock_v1', { p_warehouse_id: id }),
      supabase.rpc('jdvcrm_warehouse_prospecteurs_v1', { p_warehouse_id: id }),
      supabase.rpc('jdvcrm_warehouse_day_report_v1', { p_warehouse_id: id }),
    ]);
    const err = s.error || p.error || r.error;
    if (err) fail(err.message);
    setStock((s.data ?? []) as StockRow[]);
    setProsp((p.data ?? []) as Prosp[]);
    setReport((r.data ?? null) as Report | null);
    setLoading(false);
  }, [current, fail]);

  useEffect(() => {
    load();
  }, [load]);

  const inStock = stock.filter((s) => Number(s.quantity) > 0).length;
  const low = stock.filter((s) => s.is_low);
  const overdue = prosp.reduce((a, p) => a + Number(p.overdue_count), 0);
  const entries = (report?.entries ?? []).reduce((a, e) => a + Number(e.quantity), 0);
  const exits = (report?.exits ?? []).reduce((a, e) => a + Number(e.quantity), 0);

  return (
    <div className="p-6 space-y-6 text-white">
      <PageTitle title={t('dashboard')} subtitle={t('we.dashSub')} />
      <Banner state={banner} />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            href: '/entrepot/dashboard/sous-entrepots',
            label: t('subWarehouses'),
            icon: Store,
          },
          {
            href: '/entrepot/dashboard/approvisionnement',
            label: t('supplyNav'),
            icon: Truck,
          },
          {
            href: '/entrepot/dashboard/expeditions-prospecteurs',
            label: t('prospectorShipments'),
            icon: ScanBarcode,
          },
          {
            href: '/entrepot/dashboard/tracabilite',
            label: t('traceability'),
            icon: Search,
          },
        ].map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-2xl border border-[#294365] bg-[#08152f] p-4 transition hover:-translate-y-0.5 hover:border-[#34D399]/50 hover:bg-[#10264a]"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#34D399]/10 text-[#34D399]">
                <Icon size={19} />
              </span>
              <ArrowUpRight
                size={16}
                className="text-slate-500 transition group-hover:text-[#34D399]"
              />
            </div>
            <h2 className="mt-3 text-sm font-semibold text-white">{label}</h2>
            
          </Link>
        ))}
      </section>
      {loading ? (
        <p className="text-slate-400 text-sm">{t('we.loading')}</p>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Stat label={t('we.sInStock')} value={num(inStock)} />
            <Stat
              label={t('we.sLowAlerts')}
              value={num(low.length)}
              tone={low.length ? 'warn' : 'ok'}
            />
            <Stat label={t('we.sPros')} value={num(prosp.length)} />
            <Stat label={t('we.sLateLots')} value={num(overdue)} tone={overdue ? 'warn' : 'ok'} />
            <Stat label={t('we.sEntries')} value={`+${num(entries)}`} />
            <Stat label={t('we.sExits')} value={`−${num(exits)}`} />
            <Stat label={t('we.sSales')} value={money(report?.sales_total?.amount)} />
            <Stat
              label={t('we.sCalls')}
              value={num(report?.tickets?.still_open)}
              tone={report?.tickets?.still_open ? 'warn' : 'ok'}
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title={t('we.restock')}>
              {low.length === 0 ? (
                <p className="text-sm text-slate-400">{t('we.noneBelow')}</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {low.map((s) => (
                    <li
                      key={s.article_id}
                      className="flex justify-between rounded-lg bg-[#0F2347] p-3"
                    >
                      <span>{s.article_name}</span>
                      <span className="text-red-400">
                        {fill('we.thresholdOf', { a: num(s.quantity), b: num(s.minimum_quantity) })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/entrepot/dashboard/approvisionnement"
                className="inline-block mt-4 text-sm text-[#34D399] underline"
              >
                {t('we.askSupply')}
              </Link>
            </Card>
            <Card title={t('we.watchPros')}>
              {prosp.filter((p) => Number(p.overdue_count) > 0).length === 0 ? (
                <p className="text-sm text-slate-400">{t('we.noLateLots')}</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {prosp
                    .filter((p) => Number(p.overdue_count) > 0)
                    .map((p) => (
                      <li
                        key={p.prospecteur_id}
                        className="flex justify-between rounded-lg bg-[#0F2347] p-3"
                      >
                        <span>{p.full_name ?? '—'}</span>
                        <span className="text-red-400">
                          {fill('we.lotsUnits', {
                            a: num(p.overdue_count),
                            b: num(p.to_return_units),
                          })}
                        </span>
                      </li>
                    ))}
                </ul>
              )}
              <Link
                href="/entrepot/dashboard/prospecteurs"
                className="inline-block mt-4 text-sm text-[#34D399] underline"
              >
                {t('we.managePros')}
              </Link>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
