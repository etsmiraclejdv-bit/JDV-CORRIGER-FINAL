'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Copy, Printer, RefreshCw, Send, Tag } from 'lucide-react';
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
  useFormat,
  useUnitCodeLabels,
} from '@/components/entrepot/common';
import { codeListProblem, friendlyRpcError, parseCodeList } from '@/lib/unitCodes/helpers';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TerrainKey } from '@/lib/i18n/terrain';
import {
  dispatchUnitCodes,
  listWarehouseUnitCodes,
  registerUnitCodes,
  type UnitCodeRow,
} from '@/lib/services/unitCodesService';

type Article = { article_id: string; article_code: string; article_name: string };
type Prospecteur = { prospecteur_id: string; full_name: string | null };

export default function CodesProduitsPage() {
  const { current } = useWarehouse();
  const { t } = useLanguage();
  const { dateFr, num } = useFormat();
  const { statuses, statusLabel } = useUnitCodeLabels();
  const fill = (key: TerrainKey, vars: Record<string, string | number>) =>
    Object.entries(vars).reduce(
      (text, [name, value]) => text.replace(`{${name}}`, String(value)),
      t(key)
    );
  const { banner, ok, fail } = useBanner();
  const [articles, setArticles] = useState<Article[]>([]);
  const [prospecteurs, setProspecteurs] = useState<Prospecteur[]>([]);
  const [rows, setRows] = useState<UnitCodeRow[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [busy, setBusy] = useState(false);

  const [articleId, setArticleId] = useState('');
  const [mode, setMode] = useState<'own' | 'generate'>('own');
  const [codesText, setCodesText] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [generated, setGenerated] = useState<string[]>([]);

  const [prospecteurId, setProspecteurId] = useState('');
  const [dispatchText, setDispatchText] = useState('');
  const [notes, setNotes] = useState('');
  const idempotencyRef = useRef<string | null>(null);

  const warehouseId = current?.warehouse_id ?? '';

  const load = useCallback(async () => {
    if (!warehouseId) return;
    const [stock, people, list] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).rpc('jdvcrm_warehouse_dispatch_catalog_v1', {
        p_warehouse_id: warehouseId,
      }),
      supabase.rpc('jdvcrm_warehouse_prospecteurs_v1', { p_warehouse_id: warehouseId }),
      listWarehouseUnitCodes(warehouseId, statusFilter || undefined),
    ]);
    const catalog = (stock.data ?? []) as Array<Record<string, unknown>>;
    setArticles(
      catalog.map((r) => ({
        article_id: String(r.article_id),
        article_code: String(r.article_code ?? r.code ?? ''),
        article_name: String(r.article_name ?? r.name ?? t('we.cArticleFallback')),
      }))
    );
    setProspecteurs((people.data ?? []) as Prospecteur[]);
    setRows((list.data ?? []) as UnitCodeRow[]);
  }, [warehouseId, statusFilter, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const articleLabel = useMemo(
    () => new Map(articles.map((a) => [a.article_id, a.article_code + ' · ' + a.article_name])),
    [articles]
  );
  const parsedOwn = useMemo(() => parseCodeList(codesText), [codesText]);
  const parsedDispatch = useMemo(() => parseCodeList(dispatchText), [dispatchText]);

  async function register() {
    if (!warehouseId || !articleId) return fail(t('we.cChooseItem'));
    let codes: string[] | undefined;
    if (mode === 'own') {
      const problem = codeListProblem(parsedOwn);
      if (problem) return fail(problem);
      if (parsedOwn.codes.length === 0) return fail(t('we.cEnterOne'));
      codes = parsedOwn.codes;
    } else if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500) {
      return fail(t('we.cQtyRange'));
    }
    setBusy(true);
    const { data, error } = await registerUnitCodes({
      warehouseId,
      articleId,
      codes,
      quantity: mode === 'generate' ? quantity : undefined,
    });
    setBusy(false);
    if (error) return fail(friendlyRpcError(error.message));
    setGenerated(data?.codes ?? []);
    setCodesText('');
    ok(fill('we.cRegistered', { n: num(data?.count ?? 0) }));
    void load();
  }

  async function dispatch() {
    if (!warehouseId || !prospecteurId) return fail(t('we.cChoosePros'));
    const problem = codeListProblem(parsedDispatch);
    if (problem) return fail(problem);
    if (parsedDispatch.codes.length === 0) return fail(t('we.cEnterOne'));
    if (!idempotencyRef.current) idempotencyRef.current = crypto.randomUUID();
    setBusy(true);
    const { data, error } = await dispatchUnitCodes({
      warehouseId,
      prospecteurId,
      codes: parsedDispatch.codes,
      notes,
      idempotencyKey: idempotencyRef.current,
    });
    setBusy(false);
    if (error) return fail(friendlyRpcError(error.message));
    idempotencyRef.current = null;
    setDispatchText('');
    setNotes('');
    ok(
      fill('we.cDispatched', {
        n: data?.shipment_number ?? '',
        c: num(data?.unit_count ?? parsedDispatch.codes.length),
      })
    );
    void load();
  }

  const copyGenerated = () => {
    void navigator.clipboard?.writeText(generated.join('\n'));
    ok(t('we.cCopied'));
  };

  return (
    <div className="p-6 space-y-6 text-white">
      <PageTitle title={t('productCodes')} subtitle={t('we.cSub')}>
        <button onClick={() => void load()} className={btnGhost} aria-label={t('we.refresh')}>
          <RefreshCw size={16} />
        </button>
      </PageTitle>
      <Banner state={banner} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={t('we.c1Title')}>
          <div className="space-y-3">
            <select
              className={inputCls}
              value={articleId}
              onChange={(e) => setArticleId(e.target.value)}
            >
              <option value="">{t('we.cItemPh')}</option>
              {articles.map((a) => (
                <option key={a.article_id} value={a.article_id}>
                  {a.article_code} · {a.article_name}
                </option>
              ))}
            </select>
            <div className="flex gap-2 text-sm">
              <button
                type="button"
                className={mode === 'own' ? btnGold : btnGhost}
                onClick={() => setMode('own')}
              >
                {t('we.cOwn')}
              </button>
              <button
                type="button"
                className={mode === 'generate' ? btnGold : btnGhost}
                onClick={() => setMode('generate')}
              >
                {t('we.cGenerate')}
              </button>
            </div>
            {mode === 'own' ? (
              <>
                <textarea
                  className={inputCls}
                  rows={5}
                  value={codesText}
                  onChange={(e) => setCodesText(e.target.value)}
                  placeholder={t('we.cOwnPh')}
                />
                <p className="text-xs text-slate-400">
                  {fill('we.cValidN', { n: num(parsedOwn.codes.length) })}
                </p>
              </>
            ) : (
              <label className="block text-sm text-slate-300">
                {t('we.cGenQty')}
                <input
                  type="number"
                  min={1}
                  max={500}
                  className={inputCls + ' mt-1'}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </label>
            )}
            <button disabled={busy} onClick={() => void register()} className={btnGold}>
              <Tag size={14} className="inline mr-2" />
              {t('we.cRegister')}
            </button>
            {generated.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-[#0F2347] p-3">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>{fill('we.cToWrite', { n: num(generated.length) })}</span>
                  <span className="flex gap-2">
                    <button type="button" className={btnGhost} onClick={copyGenerated}>
                      <Copy size={14} />
                    </button>
                    <button type="button" className={btnGhost} onClick={() => window.print()}>
                      <Printer size={14} />
                    </button>
                  </span>
                </div>
                <pre className="max-h-40 overflow-auto text-xs">{generated.join('\n')}</pre>
              </div>
            )}
          </div>
        </Card>

        <Card title={t('we.c2Title')}>
          <div className="space-y-3">
            <select
              className={inputCls}
              value={prospecteurId}
              onChange={(e) => setProspecteurId(e.target.value)}
            >
              <option value="">{t('we.cProsPh')}</option>
              {prospecteurs.map((p) => (
                <option key={p.prospecteur_id} value={p.prospecteur_id}>
                  {p.full_name ?? p.prospecteur_id}
                </option>
              ))}
            </select>
            <textarea
              className={inputCls}
              rows={5}
              value={dispatchText}
              onChange={(e) => setDispatchText(e.target.value)}
              placeholder={t('we.cDispatchPh')}
            />
            <p className="text-xs text-slate-400">
              {fill('we.cValidN', { n: num(parsedDispatch.codes.length) })}
            </p>
            <input
              className={inputCls}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('we.cNotePh')}
            />
            <button disabled={busy} onClick={() => void dispatch()} className={btnGold}>
              <Send size={14} className="inline mr-2" />
              {t('we.cDispatch')}
            </button>
          </div>
        </Card>
      </div>

      <Card title={t('we.cBranchCodes')}>
        <select
          className={inputCls + ' mb-3 max-w-xs'}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">{t('we.cAllStatuses')}</option>
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-white/10">
                <th className="p-2">{t('we.cThCode')}</th>
                <th className="p-2">{t('we.cThItem')}</th>
                <th className="p-2">{t('we.cThStatus')}</th>
                <th className="p-2">{t('we.cThRegistered')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="p-2 font-mono">{r.code}</td>
                  <td className="p-2">{articleLabel.get(r.article_id) ?? '—'}</td>
                  <td className="p-2">{statusLabel(r.status)}</td>
                  <td className="p-2">{dateFr(r.registered_at)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="p-2 text-slate-400" colSpan={4}>
                    {t('we.cNoCode')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
