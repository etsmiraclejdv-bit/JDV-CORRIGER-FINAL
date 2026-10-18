'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, ScanBarcode, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { getMyProspecteurContext } from '@/lib/services/prospecteurSupplyService';
import { confirmUnitCodeReceipt, getShipmentUnitCounts } from '@/lib/services/unitCodesService';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TerrainKey } from '@/lib/i18n/terrain';
import { codeListProblem, friendlyRpcError, parseCodeList } from '@/lib/unitCodes/helpers';

type ShipmentItem = {
  id: string;
  article_id: string;
  barcode_snapshot: string | null;
  article_code_snapshot: string;
  article_name_snapshot: string;
  quantity_dispatched: number;
  quantity_received: number | null;
  quantity_accepted: number | null;
  quantity_damaged: number;
  quantity_missing: number | null;
};
type Shipment = {
  id: string;
  shipment_number: string;
  status: string;
  dispatched_at: string | null;
  dispatch_notes: string | null;
  prospecteur_supply_shipment_items: ShipmentItem[];
};
type Detector = { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> };

export default function ReceptionMarchandisesPage() {
  const { t, locale } = useLanguage();
  const fill = (key: TerrainKey, vars: Record<string, string | number>) =>
    Object.entries(vars).reduce(
      (text, [name, value]) => text.replace(`{${name}}`, String(value)),
      t(key)
    );
  const [prospecteurId, setProspecteurId] = useState('');
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [scanned, setScanned] = useState<Record<string, number>>({});
  const [damaged, setDamaged] = useState<Record<string, number>>({});
  const [scannedCodes, setScannedCodes] = useState<Record<string, string>>({});
  const [manualCode, setManualCode] = useState('');
  const [unitCounts, setUnitCounts] = useState<Record<string, number>>({});
  const [receivedText, setReceivedText] = useState('');
  const [damagedText, setDamagedText] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<Detector | null>(null);
  const scanLockRef = useRef(false);
  const scannedRef = useRef<Record<string, number>>({});
  const [scanDevices, setScanDevices] = useState<Record<string, 'phone_camera' | 'manual'>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const context = await getMyProspecteurContext();
    if (context.error || !context.data?.id) {
      setMessage(context.error?.message ?? t('tr.noProspector'));
      setLoading(false);
      return;
    }
    setProspecteurId(context.data.id);
    const { data, error } = await (supabase as any)
      .from('prospecteur_supply_shipments')
      .select(
        'id,shipment_number,status,dispatched_at,dispatch_notes,prospecteur_supply_shipment_items(id,article_id,barcode_snapshot,article_code_snapshot,article_name_snapshot,quantity_dispatched,quantity_received,quantity_accepted,quantity_damaged,quantity_missing)'
      )
      .eq('prospecteur_id', context.data.id)
      .eq('status', 'dispatched')
      .order('dispatched_at', { ascending: false });
    if (error) setMessage(error.message);
    const loaded = (data ?? []) as unknown as Shipment[];
    setShipments(loaded);
    setUnitCounts(await getShipmentUnitCounts(loaded.map((x) => x.id)));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);
  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    []
  );

  const shipment = shipments.find((item) => item.id === selectedId);
  const codeMode = shipment ? (unitCounts[shipment.id] ?? 0) > 0 : false;

  async function confirmByCodes() {
    if (!shipment) return;
    const received = parseCodeList(receivedText);
    const damagedList = parseCodeList(damagedText);
    const problem = codeListProblem(received) ?? codeListProblem(damagedList);
    if (problem) {
      setMessage(problem);
      return;
    }
    if (received.codes.length === 0 && damagedList.codes.length === 0) {
      setMessage(t('tr.enterCodes'));
      return;
    }
    setBusy(true);
    const { data, error } = await confirmUnitCodeReceipt({
      shipmentId: shipment.id,
      codes: received.codes,
      damagedCodes: damagedList.codes,
      notes,
    });
    setBusy(false);
    if (error) {
      setMessage(t('tr.notSaved') + friendlyRpcError(error.message));
      return;
    }
    setMessage(
      fill('tr.savedCodes', {
        n: data?.shipment_number ?? shipment.shipment_number,
        r: data?.units_received ?? 0,
        d: data?.units_damaged ?? 0,
        m: data?.units_missing ?? 0,
      })
    );
    setSelectedId('');
    setReceivedText('');
    setDamagedText('');
    setNotes('');
    void load();
  }

  function matchCode(codeRaw: string, device: 'phone_camera' | 'manual' = 'manual') {
    const code = codeRaw.trim();
    if (!code || !shipment) return;
    const item = shipment.prospecteur_supply_shipment_items.find(
      (line) => line.barcode_snapshot === code || line.article_code_snapshot === code
    );
    if (!item) {
      setMessage(fill('tr.unexpectedCode', { c: code }));
      setManualCode('');
      return;
    }
    const current = scannedRef.current[item.article_id] ?? 0;
    if (current + 1 > item.quantity_dispatched) {
      setMessage(fill('tr.overQty', { a: item.article_name_snapshot }));
      setManualCode('');
      return;
    }
    const next = { ...scannedRef.current, [item.article_id]: current + 1 };
    scannedRef.current = next;
    setScanned(next);
    setScannedCodes((prev) => ({ ...prev, [item.article_id]: code }));
    setScanDevices((prev) => ({ ...prev, [item.article_id]: device }));
    setMessage(fill('tr.recognized', { a: item.article_name_snapshot }));
    setManualCode('');
  }

  async function startCamera() {
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(t('tr.camUnavailable'));
      return;
    }
    const BarcodeDetectorCtor = (
      window as unknown as { BarcodeDetector?: new (options?: { formats?: string[] }) => Detector }
    ).BarcodeDetector;
    if (!BarcodeDetectorCtor) {
      setCameraError(t('tr.noDecoder'));
      return;
    }
    try {
      const detector = new BarcodeDetectorCtor({
        formats: ['ean_13', 'ean_8', 'upc_a', 'code_128', 'qr_code'],
      });
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      detectorRef.current = detector;
      setCameraOn(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
      const scanFrame = async () => {
        if (!streamRef.current || !videoRef.current || !detectorRef.current) return;
        try {
          const results = await detectorRef.current.detect(videoRef.current);
          if (results.length && !scanLockRef.current) {
            scanLockRef.current = true;
            matchCode(results[0].rawValue, 'phone_camera');
            window.setTimeout(() => {
              scanLockRef.current = false;
            }, 900);
          }
        } catch {
          /* Une frame floue est ignorée. */
        }
        if (streamRef.current)
          window.setTimeout(() => {
            void scanFrame();
          }, 220);
      };
      window.setTimeout(() => {
        void scanFrame();
      }, 250);
    } catch {
      setCameraError(t('tr.camDenied'));
      setCameraOn(false);
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    detectorRef.current = null;
    setCameraOn(false);
  }

  async function confirmReceipt() {
    if (!shipment) return;
    const allLines = shipment.prospecteur_supply_shipment_items;
    if (allLines.some((line) => scanned[line.article_id] === undefined)) {
      setMessage(t('tr.fillEveryLine'));
      return;
    }
    const items = allLines.map((line) => {
      const received = scanned[line.article_id] ?? 0;
      const damagedQuantity = damaged[line.article_id] ?? 0;
      return {
        article_id: line.article_id,
        quantity_received: received,
        quantity_accepted: received - damagedQuantity,
        quantity_damaged: damagedQuantity,
        quantity_missing: Math.max(0, line.quantity_dispatched - received),
        scanned_code: scannedCodes[line.article_id] ?? null,
        device_type: scanDevices[line.article_id] ?? 'manual',
      };
    });
    setBusy(true);
    const { data, error } = await (supabase as any).rpc(
      'jdvcrm_confirm_prospecteur_shipment_receipt_v1',
      { p_shipment_id: shipment.id, p_items: items, p_notes: notes.trim() || null }
    );
    setBusy(false);
    if (error) {
      const missingRpc =
        error.code === 'PGRST202' ||
        error.code === '42883' ||
        /could not find the function|function .* does not exist/i.test(error.message ?? '');
      setMessage(
        missingRpc ? t('tr.missingRpc') : t('tr.notSaved') + (error.message || t('tr.unknownError'))
      );
      return;
    }
    const result = data as { status?: string; shipment_number?: string };
    setMessage(
      fill('tr.savedShipment', {
        n: result.shipment_number ?? shipment.shipment_number,
        s: result.status ?? t('tr.confirmed'),
      })
    );
    stopCamera();
    setSelectedId('');
    setScanned({});
    setDamaged({});
    scannedRef.current = {};
    setScannedCodes({});
    setScanDevices({});
    setNotes('');
    void load();
  }

  return (
    <div className="p-5 lg:p-8 space-y-6 text-white">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#D4AF37]">{t('tr.kicker')}</p>
          <h1 className="text-2xl font-bold">{t('tr.title')}</h1>
          <p className="text-sm text-[#A0AEC0]">{t('tr.intro')}</p>
        </div>
        <button
          onClick={() => void load()}
          className="rounded-xl bg-[#0F2347] p-3 text-slate-300"
          aria-label={t('tr.refresh')}
        >
          <RefreshCw size={17} />
        </button>
      </div>
      {message && (
        <div className="rounded-xl border border-[#D4AF37]/20 bg-[#0F2347] p-3 text-sm">
          {message}
        </div>
      )}
      {loading ? (
        <p className="text-slate-400">{t('tr.loading')}</p>
      ) : shipments.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#0F2347] p-6">
          <CheckCircle2 className="text-emerald-400" />
          <h2 className="mt-2 font-semibold">{t('tr.noneTitle')}</h2>
          <p className="text-sm text-slate-400">{t('tr.noneText')}</p>
        </div>
      ) : (
        <>
          <section className="rounded-2xl border border-white/10 bg-[#0F2347] p-4">
            <label className="mb-2 block text-sm text-slate-300">{t('tr.slip')}</label>
            <select
              className="w-full rounded-xl border border-white/10 bg-[#08152f] p-3"
              value={selectedId}
              onChange={(e) => {
                stopCamera();
                setSelectedId(e.target.value);
                setScanned({});
                setDamaged({});
                scannedRef.current = {};
                setScannedCodes({});
                setScanDevices({});
                setMessage('');
              }}
            >
              <option value="">{t('tr.pickSlip')}</option>
              {shipments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shipment_number} · {new Date(s.dispatched_at ?? '').toLocaleString(locale)}
                </option>
              ))}
            </select>
          </section>
          {shipment && codeMode && (
            <section className="rounded-2xl border border-[#D4AF37]/20 bg-[#0F2347] p-4 space-y-3">
              <h2 className="font-semibold">{shipment.shipment_number}</h2>
              <p className="text-sm text-slate-300">
                {fill('tr.codeModeInfo', { n: unitCounts[shipment.id] })}
              </p>
              <textarea
                value={receivedText}
                onChange={(e) => setReceivedText(e.target.value)}
                rows={6}
                placeholder={t('tr.goodCodes')}
                className="w-full rounded-xl border border-white/10 bg-[#08152f] p-3 font-mono"
              />
              <p className="text-xs text-slate-400">
                {fill('tr.codesCount', {
                  a: parseCodeList(receivedText).codes.length,
                  b: unitCounts[shipment.id],
                })}
              </p>
              <label className="block text-sm text-slate-300">{t('tr.damagedCodes')}</label>
              <textarea
                value={damagedText}
                onChange={(e) => setDamagedText(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-[#08152f] p-3 font-mono"
              />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder={t('tr.observation')}
                className="w-full rounded-xl border border-white/10 bg-[#08152f] p-3"
              />
              <button
                disabled={busy}
                onClick={() => void confirmByCodes()}
                className="w-full rounded-xl bg-[#D4AF37] p-3 font-semibold text-[#08152f] disabled:opacity-50"
              >
                {busy ? t('tr.confirming') : t('tr.confirm')}
              </button>
              <p className="text-xs text-slate-500">{t('tr.missingNote')}</p>
            </section>
          )}
          {shipment && !codeMode && (
            <>
              <section className="rounded-2xl border border-[#D4AF37]/20 bg-[#0F2347] p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{shipment.shipment_number}</h2>
                    <p className="text-xs text-slate-400">
                      {t('tr.qtyReceived')} {Object.values(scanned).reduce((n, x) => n + x, 0)} /{' '}
                      {shipment.prospecteur_supply_shipment_items.reduce(
                        (n, x) => n + x.quantity_dispatched,
                        0
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => (cameraOn ? stopCamera() : void startCamera())}
                    className="rounded-xl bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#08152f]"
                  >
                    {cameraOn ? (
                      t('tr.stopCam')
                    ) : (
                      <>
                        <Camera size={16} className="inline mr-2" />
                        {t('tr.openCam')}
                      </>
                    )}
                  </button>
                </div>
                {cameraError && (
                  <p className="text-sm text-amber-300">
                    <AlertTriangle size={14} className="inline mr-1" />
                    {cameraError}
                  </p>
                )}
                {cameraOn && (
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="max-h-72 w-full rounded-xl bg-black object-contain"
                  />
                )}
                <label className="block text-sm text-slate-300">{t('tr.enterTrace')}</label>
                <div className="flex gap-2">
                  <input
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        matchCode(manualCode);
                      }
                    }}
                    placeholder={t('tr.example')}
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#08152f] p-3"
                  />
                  <button
                    onClick={() => matchCode(manualCode)}
                    className="rounded-xl bg-[#D4AF37] px-3 text-[#08152f]"
                    aria-label={t('tr.validateCode')}
                  >
                    <ScanBarcode size={18} />
                  </button>
                </div>
              </section>
              <section className="rounded-2xl border border-white/10 bg-[#0F2347] p-4">
                <h2 className="mb-3 font-semibold">{t('tr.recap')}</h2>
                <div className="space-y-3">
                  {shipment.prospecteur_supply_shipment_items.map((line) => (
                    <div
                      key={line.id}
                      className="grid grid-cols-[minmax(0,1fr)_54px_76px_76px] items-start gap-2 border-b border-white/5 pb-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{line.article_name_snapshot}</p>
                        <p className="text-xs text-slate-400">
                          {t('tr.jdvCode')} {line.article_code_snapshot} · {t('tr.shipped')}{' '}
                          {line.quantity_dispatched}
                          {line.barcode_snapshot ? (
                            <span className="block text-xs text-slate-500">
                              {t('tr.makerCode')} {line.barcode_snapshot}
                            </span>
                          ) : null}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            if (!window.confirm(t('tr.confirmAbsent'))) return;
                            const next = { ...scannedRef.current, [line.article_id]: 0 };
                            scannedRef.current = next;
                            setScanned(next);
                            setDamaged((prev) => ({ ...prev, [line.article_id]: 0 }));
                            setScannedCodes((prev) => {
                              const codes = { ...prev };
                              delete codes[line.article_id];
                              return codes;
                            });
                            setScanDevices((prev) => ({ ...prev, [line.article_id]: 'manual' }));
                            setMessage(
                              fill('tr.absentDeclared', { a: line.article_name_snapshot })
                            );
                          }}
                          className="mt-2 text-left text-xs font-medium text-amber-300 underline underline-offset-2"
                        >
                          {t('tr.declareAbsent')}
                        </button>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-400">{t('tr.received')}</p>
                        <p className="font-bold">{scanned[line.article_id] ?? 0}</p>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400">{t('tr.actualReceived')}</label>
                        <input
                          type="number"
                          min="0"
                          max={line.quantity_dispatched}
                          value={scanned[line.article_id] ?? ''}
                          onChange={(e) => {
                            const q = Number(e.target.value);
                            if (e.target.value === '') {
                              const next = { ...scannedRef.current };
                              delete next[line.article_id];
                              scannedRef.current = next;
                              setScanned(next);
                              setDamaged((prev) => {
                                const updated = { ...prev };
                                delete updated[line.article_id];
                                return updated;
                              });
                              setScannedCodes((prev) => {
                                const codes = { ...prev };
                                delete codes[line.article_id];
                                return codes;
                              });
                              setScanDevices((prev) => ({ ...prev, [line.article_id]: 'manual' }));
                            } else if (
                              Number.isInteger(q) &&
                              q >= 0 &&
                              q <= line.quantity_dispatched
                            ) {
                              const next = { ...scannedRef.current, [line.article_id]: q };
                              scannedRef.current = next;
                              setScanned(next);
                              setDamaged((prev) => ({
                                ...prev,
                                [line.article_id]: Math.min(prev[line.article_id] ?? 0, q),
                              }));
                              setScannedCodes((prev) => {
                                const codes = { ...prev };
                                delete codes[line.article_id];
                                return codes;
                              });
                              setScanDevices((prev) => ({ ...prev, [line.article_id]: 'manual' }));
                            }
                          }}
                          className="mt-1 w-full rounded-lg border border-white/10 bg-[#08152f] p-2"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400">{t('tr.damaged')}</label>
                        <input
                          type="number"
                          min="0"
                          max={scanned[line.article_id] ?? 0}
                          value={damaged[line.article_id] ?? 0}
                          onChange={(e) => {
                            const q = Number(e.target.value);
                            const received = scanned[line.article_id] ?? 0;
                            if (e.target.value === '') {
                              setDamaged((prev) => ({ ...prev, [line.article_id]: 0 }));
                            } else if (Number.isInteger(q) && q >= 0 && q <= received) {
                              setDamaged((prev) => ({ ...prev, [line.article_id]: q }));
                            }
                          }}
                          className="mt-1 w-full rounded-lg border border-white/10 bg-[#08152f] p-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <label className="mt-4 block text-sm text-slate-300">{t('tr.obsLong')}</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#08152f] p-3"
                  placeholder={t('tr.details')}
                />
                <button
                  disabled={
                    busy ||
                    shipment.prospecteur_supply_shipment_items.some(
                      (line) => scanned[line.article_id] === undefined
                    )
                  }
                  onClick={() => void confirmReceipt()}
                  className="mt-4 w-full rounded-xl bg-[#D4AF37] p-3 font-semibold text-[#08152f] disabled:opacity-50"
                >
                  {busy ? t('tr.confirming') : t('tr.confirm')}
                </button>
              </section>
            </>
          )}
        </>
      )}
      <p className="text-xs text-slate-500">{t('tr.cameraNote')}</p>
    </div>
  );
}
