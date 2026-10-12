'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PackageCheck, ScanBarcode, Send, RefreshCw, AlertTriangle, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useWarehouse } from '@/components/entrepot/WarehouseContext';
import { Banner, Card, PageTitle, btnGold, inputCls, useBanner } from '@/components/entrepot/common';

type Article = { article_id: string; article_code: string; article_name: string; barcode: string | null; quantity: number; reserved_quantity: number; };
type Prospecteur = { prospecteur_id: string; full_name: string | null; code?: string };
type CartLine = { article_id: string; article_code: string; article_name: string; barcode: string | null; quantity: number; scanned_code: string; };

export default function ExpeditionsProspecteursPage() {
  const { current } = useWarehouse();
  const { banner, ok, fail } = useBanner();
  const [articles, setArticles] = useState<Article[]>([]);
  const [prospecteurs, setProspecteurs] = useState<Prospecteur[]>([]);
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
    const [stock, people] = await Promise.all([
 feature/jdv-scan-approvisionnement
      supabase.rpc('jdvcrm_warehouse_dispatch_catalog_v1', { p_warehouse_id: current.warehouse_id }),
=======
      (supabase as any).rpc('jdvcrm_warehouse_dispatch_catalog_v1', { p_warehouse_id: current.warehouse_id }),
 main
      supabase.rpc('jdvcrm_warehouse_prospecteurs_v1', { p_warehouse_id: current.warehouse_id }),
    ]);
    if (stock.error) fail(stock.error.message);
    if (people.error) fail(people.error.message);
    const rows = (stock.data ?? []) as Array<Record<string, unknown>>;
    setArticles(rows.map((r) => ({
      article_id: String(r.article_id),
      article_code: String(r.article_code ?? r.code ?? ''),
      article_name: String(r.article_name ?? r.name ?? 'Article'),
      barcode: typeof r.barcode === 'string' ? r.barcode : null,
      quantity: Number(r.quantity ?? 0),
      reserved_quantity: Number(r.reserved_quantity ?? 0),
    })));
    setProspecteurs((people.data ?? []) as Prospecteur[]);
    setLoading(false);
  }, [current, fail]);

  useEffect(() => { void load(); }, [load]);

  const units = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  function addByCode(raw: string) {
    const code = raw.trim();
    if (!code) return;
    const article = articles.find((a) => a.barcode === code || a.article_code === code);
    if (!article) { fail('Code inconnu : ' + code + '. Vérifiez le code ou créez la fiche article.'); setScan(''); return; }
    const available = Math.max(0, article.quantity - article.reserved_quantity);
    const existing = cart.find((item) => item.article_id === article.article_id);
    if ((existing?.quantity ?? 0) + 1 > available) { fail('Stock disponible insuffisant pour ' + article.article_name + '.'); setScan(''); return; }
    setCart((prev) => {
      const found = prev.find((item) => item.article_id === article.article_id);
      if (found) return prev.map((item) => item.article_id === article.article_id ? { ...item, quantity: item.quantity + 1, scanned_code: code } : item);
      return [...prev, { article_id: article.article_id, article_code: article.article_code, article_name: article.article_name, barcode: article.barcode, quantity: 1, scanned_code: code }];
    });
    setScan('');
    requestAnimationFrame(() => scanRef.current?.focus());
  }

  async function dispatch() {
    if (!current || !prospecteurId || cart.length === 0) { fail('Choisissez un prospecteur et scannez au moins un article.'); return; }
    setBusy(true);
 feature/jdv-scan-approvisionnement
    const { data, error } = await supabase.rpc('jdvcrm_dispatch_prospecteur_shipment_v1', {
=======
    const { data, error } = await (supabase as any).rpc('jdvcrm_dispatch_prospecteur_shipment_v1', {
 main
      p_warehouse_id: current.warehouse_id,
      p_prospecteur_id: prospecteurId,
      p_items: cart.map((item) => ({ article_id: item.article_id, quantity: item.quantity, scanned_code: item.scanned_code, device_type: 'usb_bluetooth_reader' })),
      p_notes: notes.trim() || null,
      p_idempotency_key: (idempotencyRef.current ??= crypto.randomUUID()),
    });
    setBusy(false);
    if (error) { fail(error.message); return; }
    const result = data as { shipment_number?: string };
    ok('Bon ' + (result?.shipment_number ?? '') + ' expédié. Le prospecteur doit confirmer la réception.');
    idempotencyRef.current = null;
    setCart([]); setNotes('');
    void load();
  }

  return (
    <div className="p-6 space-y-6 text-white">
      <PageTitle title="Expéditions vers les prospecteurs" subtitle="Scannez avec un lecteur USB/Bluetooth, puis créez le bon d’expédition." />
      <Banner state={banner} />
      <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
        <Card title="1. Préparer la marchandise">
          <label className="block text-sm text-slate-300 mb-2">Prospecteur destinataire</label>
          <select className={inputCls + ' mb-4'} value={prospecteurId} onChange={(e) => setProspecteurId(e.target.value)}>
            <option value="">Choisir un prospecteur affecté à cet entrepôt</option>
            {prospecteurs.map((p) => <option key={p.prospecteur_id} value={p.prospecteur_id}>{p.full_name ?? p.code ?? p.prospecteur_id}</option>)}
          </select>
          <label className="block text-sm text-slate-300 mb-2">Code article — scanner puis appuyer sur Entrée</label>
          <div className="flex gap-2">
            <input ref={scanRef} className={inputCls} value={scan} onChange={(e) => setScan(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addByCode(scan); } }} placeholder="Code-barres ou code interne" autoComplete="off" />
            <button className={btnGold} onClick={() => addByCode(scan)}><ScanBarcode size={16} /></button>
          </div>
          <p className="text-xs text-slate-400 mt-2">Le lecteur HID se comporte comme un clavier. Chaque lecture ajoute une unité. Pour les lots, ajustez la quantité dans le récapitulatif.</p>
          <div className="mt-5 space-y-2">
            {cart.length === 0 ? <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-slate-400">Aucun article scanné.</p> : cart.map((item) => {
              const available = articles.find((a) => a.article_id === item.article_id);
              return <div key={item.article_id} className="flex items-center gap-3 rounded-xl border border-white/10 p-3">
                <div className="min-w-0 flex-1"><p className="font-medium">{item.article_name}</p><p className="text-xs text-slate-400">{item.article_code} · Disponible : {Math.max(0, (available?.quantity ?? 0) - (available?.reserved_quantity ?? 0))}</p></div>
                <input aria-label={'Quantité ' + item.article_name} type="number" min="1" max={available?.quantity ?? 1} value={item.quantity} onChange={(e) => { const q = Number(e.target.value); if (!Number.isInteger(q) || q < 1) return; setCart((prev) => prev.map((x) => x.article_id === item.article_id ? { ...x, quantity: q } : x)); }} className="w-20 rounded-lg bg-[#08152f] border border-white/15 p-2 text-center" />
                <button aria-label="Retirer l'article" onClick={() => setCart((prev) => prev.filter((x) => x.article_id !== item.article_id))} className="text-red-300 p-2"><Trash2 size={16} /></button>
              </div>;
            })}
          </div>
          <label className="block text-sm text-slate-300 mt-4 mb-2">Note de remise (facultatif)</label>
          <textarea className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Observations sur la remise..." />
          <button disabled={busy || !cart.length || !prospecteurId} onClick={dispatch} className={btnGold + ' mt-4 w-full disabled:opacity-50'}>{busy ? 'Enregistrement…' : <><Send size={16} className="inline mr-2" />Expédier {units} unité(s)</>}</button>
        </Card>
        <Card title="2. Contrôle du stock">
          <div className="flex items-center justify-between mb-4"><p className="text-sm text-slate-300">{articles.length} références disponibles</p><button onClick={() => void load()} className="text-slate-300 p-2" aria-label="Actualiser"><RefreshCw size={16} /></button></div>
          {loading ? <p className="text-slate-400 text-sm">Chargement du catalogue…</p> : <div className="space-y-2 max-h-[520px] overflow-y-auto">
            {articles.map((a) => <div key={a.article_id} className="flex items-center justify-between gap-3 border-b border-white/5 py-2"><div className="min-w-0"><p className="text-sm font-medium truncate">{a.article_name}</p><p className="text-xs text-slate-400">{a.barcode || a.article_code}</p></div><span className="text-sm tabular-nums">{Math.max(0, a.quantity - a.reserved_quantity)}</span></div>)}
          </div>}
          <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-200"><AlertTriangle size={14} className="inline mr-1" />Le stock n’est déduit qu’après validation de l’expédition par le serveur. Le bon restera en attente de l’accusé de réception.</div>
        </Card>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400"><PackageCheck size={15} /> Après expédition, le prospecteur doit scanner les articles reçus dans son espace.</div>
    </div>
  );
}
