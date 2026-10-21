'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PackageCheck, ScanBarcode, Send, RefreshCw, AlertTriangle, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useWarehouse } from '@/components/entrepot/WarehouseContext';
import {
  Banner,
  Card,
  PageTitle,
  btnGold,
  inputCls,
  useBanner,
} from '@/components/entrepot/common';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TerrainKey } from '@/lib/i18n/terrain';

type Article = {
  article_id: string;
  article_code: string;
  article_name: string;
  barcode: string | null;
  quantity: number;
  reserved_quantity: number;
};
type Prospecteur = { prospecteur_id: string; full_name: string | null; code?: string };
type CartLine = {
  article_id: string;
  article_code: string;
  article_name: string;
  barcode: string | null;
  quantity: number;
  scanned_code: string;
};
type SupplyRequest = {
  id: string;
  prospecteur_id: string;
  notes: string | null;
  requested_at: string;
  prospecteur_supply_request_items: Array<{ article_id: string; quantity: number }>;
};

export default function ExpeditionsProspecteursPage() {
  const { current } = useWarehouse();
  const { t, locale } = useLanguage();
  const fill = (key: TerrainKey, vars: Record<string, string | number>) =>
    Object.entries(vars).reduce(
      (text, [name, value]) => text.replace(`{${name}}`, String(value)),
      t(key)
    );
  const { banner, ok, fail } = useBanner();
  const [articles, setArticles] = useState<Article[]>([]);
  const [prospecteurs, setProspecteurs] = useState<Prospecteur[]>([]);
  const [pendingRequests, setPendingRequests] = useState<SupplyRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [requestedQuantities, setRequestedQuantities] = useState<Record<string, number>>({});
  const [cart, setCart] = useState<CartLine[]>([]);
  const [prospecteurId, setProspecteurId] = useState('');
  const [scan, setScan] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const scanRef = useRef<HTMLInputElement>(null);
  const idempotencyRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!current) return;
    setLoading(true);
    const [stock, people, requests] = await Promise.all([
      (supabase as any).rpc('jdvcrm_warehouse_dispatch_catalog_v1', {
        p_warehouse_id: current.warehouse_id,
      }),
      supabase.rpc('jdvcrm_warehouse_prospecteurs_v1', { p_warehouse_id: current.warehouse_id }),
      (supabase as any)
        .from('prospecteur_supply_requests')
        .select(
          'id,prospecteur_id,notes,requested_at,prospecteur_supply_request_items(article_id,quantity)'
        )
        .eq('warehouse_id', current.warehouse_id)
        .eq('status', 'pending')
        .order('requested_at', { ascending: true }),
    ]);
    if (stock.error) fail(stock.error.message);
    if (people.error) fail(people.error.message);
    if (requests.error) fail(t('we.xPendingErr') + requests.error.message);
    const rows = (stock.data ?? []) as Array<Record<string, unknown>>;
    setArticles(
      rows.map((r) => ({
        article_id: String(r.article_id),
        article_code: String(r.article_code ?? r.code ?? ''),
        article_name: String(r.article_name ?? r.name ?? t('we.xItemFallback')),
        barcode: typeof r.barcode === 'string' ? r.barcode : null,
        quantity: Number(r.quantity ?? 0),
        reserved_quantity: Number(r.reserved_quantity ?? 0),
      }))
    );
    setProspecteurs((people.data ?? []) as Prospecteur[]);
    setPendingRequests((requests.data ?? []) as SupplyRequest[]);
    setLoading(false);
  }, [current, fail, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const units = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  function addByCode(raw: string) {
    const code = raw.trim();
    if (!code) return;
    const article = articles.find((a) => a.barcode === code || a.article_code === code);
    if (!article) {
      fail(fill('we.xUnknownCode', { c: code }));
      setScan('');
      return;
    }
    const available = Math.max(0, article.quantity - article.reserved_quantity);
    const existing = cart.find((item) => item.article_id === article.article_id);
    if ((existing?.quantity ?? 0) + 1 > available) {
      fail(fill('we.xNotEnough', { a: article.article_name }));
      setScan('');
      return;
    }
    setCart((prev) => {
      const found = prev.find((item) => item.article_id === article.article_id);
      if (found)
        return prev.map((item) =>
          item.article_id === article.article_id
            ? { ...item, quantity: item.quantity + 1, scanned_code: code }
            : item
        );
      return [
        ...prev,
        {
          article_id: article.article_id,
          article_code: article.article_code,
          article_name: article.article_name,
          barcode: article.barcode,
          quantity: 1,
          scanned_code: code,
        },
      ];
    });
    setScan('');
    requestAnimationFrame(() => scanRef.current?.focus());
  }

  async function dispatch() {
    if (!current || !prospecteurId || cart.length === 0) {
      fail(t('we.xPickAndScan'));
      return;
    }
    setBusy(true);
    const items = cart.map((item) => ({
      article_id: item.article_id,
      quantity: item.quantity,
      scanned_code: item.scanned_code,
      device_type: 'usb_bluetooth_reader',
    }));
    const { data, error } = selectedRequestId
      ? await (supabase as any).rpc('jdvcrm_dispatch_prospecteur_supply_request_v1', {
          p_request_id: selectedRequestId,
          p_items: items,
          p_notes: notes.trim() || null,
          p_idempotency_key: (idempotencyRef.current ??= crypto.randomUUID()),
        })
      : await (supabase as any).rpc('jdvcrm_dispatch_prospecteur_shipment_v1', {
          p_warehouse_id: current.warehouse_id,
          p_prospecteur_id: prospecteurId,
          p_items: items,
          p_notes: notes.trim() || null,
          p_idempotency_key: (idempotencyRef.current ??= crypto.randomUUID()),
        });
    setBusy(false);
    if (error) {
      const missingRpc =
        error.code === 'PGRST202' ||
        error.code === '42883' ||
        /could not find the function|function .* does not exist/i.test(error.message ?? '');
      fail(
        missingRpc ? t('we.xMissingRpc') : t('we.xFailed') + (error.message || t('we.xUnknownErr'))
      );
      return;
    }
    const result = data as { shipment_number?: string };
    ok(fill('we.xShipped', { n: result?.shipment_number ?? '' }));
    idempotencyRef.current = null;
    setCart([]);
    setNotes('');
    setSelectedRequestId('');
    setRequestedQuantities({});
    void load();
  }

  return (
    <div className="p-6 space-y-6 text-white">
      <PageTitle title={t('we.xTitle')} subtitle={t('we.xSub')} />
      <Banner state={banner} />
      <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
        <Card title={t('we.x1Title')}>
          <label className="block text-sm text-slate-300 mb-2">{t('we.xRequestLabel')}</label>
          <select
            className={inputCls + ' mb-4'}
            value={selectedRequestId}
            onChange={(e) => {
              const id = e.target.value;
              const request = pendingRequests.find((item) => item.id === id);
              setSelectedRequestId(id);
              setCart([]);
              setNotes(request?.notes ?? '');
              setRequestedQuantities(
                request
                  ? Object.fromEntries(
                      request.prospecteur_supply_request_items.map((item) => [
                        item.article_id,
                        Number(item.quantity),
                      ])
                    )
                  : {}
              );
              setProspecteurId(request?.prospecteur_id ?? '');
              idempotencyRef.current = null;
            }}
          >
            <option value="">{t('we.xDirect')}</option>
            {pendingRequests.map((request) => {
              const person = prospecteurs.find((p) => p.prospecteur_id === request.prospecteur_id);
              const summary = request.prospecteur_supply_request_items
                .map((item) => {
                  const article = articles.find((a) => a.article_id === item.article_id);
                  return (article?.article_name ?? t('we.xItemFallback')) + ' × ' + item.quantity;
                })
                .join(', ');
              return (
                <option key={request.id} value={request.id}>
                  {(person?.full_name ?? person?.code ?? t('we.xPerson')) +
                    ' · ' +
                    new Date(request.requested_at).toLocaleString(locale) +
                    ' · ' +
                    summary}
                </option>
              );
            })}
          </select>
          {selectedRequestId && (
            <p className="mb-4 rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-200">
              {t('we.xRequestSelected')}
            </p>
          )}
          <label className="block text-sm text-slate-300 mb-2">{t('we.xRecipient')}</label>
          <select
            className={inputCls + ' mb-4'}
            value={prospecteurId}
            disabled={Boolean(selectedRequestId)}
            onChange={(e) => setProspecteurId(e.target.value)}
          >
            <option value="">{t('we.xPickPros')}</option>
            {prospecteurs.map((p) => (
              <option key={p.prospecteur_id} value={p.prospecteur_id}>
                {p.full_name ?? p.code ?? p.prospecteur_id}
              </option>
            ))}
          </select>
          <label className="block text-sm text-slate-300 mb-2">{t('we.xScanLabel')}</label>
          <div className="flex gap-2">
            <input
              ref={scanRef}
              className={inputCls}
              value={scan}
              onChange={(e) => setScan(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addByCode(scan);
                }
              }}
              placeholder={t('we.xScanPh')}
              autoComplete="off"
            />
            <button className={btnGold} onClick={() => addByCode(scan)}>
              <ScanBarcode size={16} />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">{t('we.xHid')}</p>
          <div className="mt-5 space-y-2">
            {cart.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-slate-400">
                {t('we.xNoScan')}
              </p>
            ) : (
              cart.map((item) => {
                const available = articles.find((a) => a.article_id === item.article_id);
                return (
                  <div
                    key={item.article_id}
                    className="flex items-center gap-3 rounded-xl border border-white/10 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{item.article_name}</p>
                      <p className="text-xs text-slate-400">
                        {item.article_code} · {t('we.xAvailable')}{' '}
                        {Math.max(
                          0,
                          (available?.quantity ?? 0) - (available?.reserved_quantity ?? 0)
                        )}
                      </p>
                    </div>
                    <input
                      aria-label={fill('we.xQtyAria', { a: item.article_name })}
                      type="number"
                      min="1"
                      max={available?.quantity ?? 1}
                      value={item.quantity}
                      onChange={(e) => {
                        const q = Number(e.target.value);
                        if (!Number.isInteger(q) || q < 1) return;
                        setCart((prev) =>
                          prev.map((x) =>
                            x.article_id === item.article_id ? { ...x, quantity: q } : x
                          )
                        );
                      }}
                      className="w-20 rounded-lg bg-[#08152f] border border-white/15 p-2 text-center"
                    />
                    <button
                      aria-label={t('we.xRemoveItem')}
                      onClick={() =>
                        setCart((prev) => prev.filter((x) => x.article_id !== item.article_id))
                      }
                      className="text-red-300 p-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
          <label className="block text-sm text-slate-300 mt-4 mb-2">{t('we.xHandNote')}</label>
          <textarea
            className={inputCls}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder={t('we.xHandPh')}
          />
          <button
            disabled={busy || !cart.length || !prospecteurId}
            onClick={dispatch}
            className={btnGold + ' mt-4 w-full disabled:opacity-50'}
          >
            {busy ? (
              t('we.xSaving')
            ) : (
              <>
                <Send size={16} className="inline mr-2" />
                {fill('we.xShipUnits', { n: units })}
              </>
            )}
          </button>
        </Card>
        <Card title={t('we.x2Title')}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-300">{fill('we.xRefs', { n: articles.length })}</p>
            <button
              onClick={() => void load()}
              className="text-slate-300 p-2"
              aria-label={t('we.refresh')}
            >
              <RefreshCw size={16} />
            </button>
          </div>
          {loading ? (
            <p className="text-slate-400 text-sm">{t('we.xLoadingCat')}</p>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto">
              {articles.map((a) => (
                <div
                  key={a.article_id}
                  className="flex items-center justify-between gap-3 border-b border-white/5 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{a.article_name}</p>
                    <div className="text-xs text-slate-400">
                      <p>
                        {t('we.xTraceCode')} {a.article_code}
                      </p>
                      {a.barcode ? (
                        <p className="text-slate-500">
                          {t('we.xMakerCode')} {a.barcode}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <span className="text-sm tabular-nums">
                    {Math.max(0, a.quantity - a.reserved_quantity)}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-200">
            <AlertTriangle size={14} className="inline mr-1" />
            {t('we.xWarn')}
          </div>
        </Card>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <PackageCheck size={15} /> {t('we.xFooter')}
      </div>
    </div>
  );
}
