'use client';
import { FormEvent, useEffect, useState } from 'react';
import { Bot, ChevronRight, Loader2, Send, Sparkles, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TerrainKey } from '@/lib/i18n/terrain';

type Message = { role: 'user' | 'assistant'; content: string };
const starters: TerrainKey[] = ['ai.s1', 'ai.s2', 'ai.s3', 'ai.s4'];

function pageSection(pathname: string): TerrainKey {
  if (pathname.includes('/entrepot/dashboard')) return 'ai.secEnt';
  if (pathname.includes('/business/dashboard')) return 'ai.secBiz';
  if (pathname.includes('/a-propos')) return 'ai.secAbout';
  return 'ai.secOff';
}

// Libellé français envoyé au serveur (contexte de l'IA) — non affiché.
function pageLabel(pathname: string) {
  if (pathname.includes('/entrepot/dashboard')) return 'espace Entrepôt';
  if (pathname.includes('/business/dashboard')) return 'espace Business / Administration';
  if (pathname.includes('/a-propos')) return 'page institutionnelle';
  return 'page officielle JDV CRM';
}

export default function PublicAIAssistant() {
  const { t, locale } = useLanguage();
  const tr = (s: string) => (s.startsWith('ai.') ? t(s as TerrainKey) : s);
  const pathname = usePathname() || '/';
  const [open, setOpen] = useState(false),
    [input, setInput] = useState(''),
    [loading, setLoading] = useState(false);
  const [syncAt, setSyncAt] = useState(new Date());
  const [live, setLive] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'ai.hello',
    },
  ]);

  useEffect(() => {
    const channel = supabase
      .channel('jdv-ai-live-context')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, () =>
        setSyncAt(new Date())
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'warehouse_inventory' }, () =>
        setSyncAt(new Date())
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'warehouse_subwarehouses' },
        () => setSyncAt(new Date())
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_movements' }, () =>
        setSyncAt(new Date())
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prospects' }, () =>
        setSyncAt(new Date())
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () =>
        setSyncAt(new Date())
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () =>
        setSyncAt(new Date())
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jdvcrm_returns' }, () =>
        setSyncAt(new Date())
      )
      .subscribe((status) => setLive(status === 'SUBSCRIBED'));
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  async function send(text = input) {
    const content = text.trim();
    if (!content || loading) return;
    const next = [...messages, { role: 'user' as const, content }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch('/api/ai/jdv-crm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: 'Bearer ' + session.access_token } : {}),
        },
        body: JSON.stringify({
          messages: next.slice(-12).map((m) => ({ ...m, content: tr(m.content) })),
          page_context: { pathname, section: pageLabel(pathname), locale },
          client_synced_at: syncAt.toISOString(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'ai.unavail');
      setSyncAt(new Date(json.synchronized_at || Date.now()));
      setMessages((v) => [...v, { role: 'assistant', content: json.content }]);
    } catch (e) {
      setMessages((v) => [
        ...v,
        {
          role: 'assistant',
          content: e instanceof Error ? e.message : 'ai.err',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    void send();
  }
  return (
    <>
      <button
        aria-label={t('ai.open')}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full border border-[#D4AF37]/50 bg-[#08152f] px-5 py-4 text-white shadow-2xl transition hover:scale-[1.03]"
      >
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#D4AF37] text-[#08152f]">
          <Bot size={21} />
        </span>
        <span className="hidden sm:block text-left">
          <span className="block text-xs text-[#D4AF37]">JDV CRM</span>
          <span className="font-semibold">{t('ai.chip')}</span>
        </span>
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm sm:p-6"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 right-0 flex h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#061127] shadow-2xl sm:bottom-6 sm:h-[760px] sm:max-h-[88vh] sm:w-[470px] sm:rounded-3xl"
          >
            <header className="flex items-center justify-between border-b border-white/10 bg-[#08152f] px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#D4AF37] text-[#08152f]">
                  <Sparkles size={21} />
                </span>
                <div>
                  <div className="font-semibold text-white">{t('ai.title')}</div>
                  <div className="flex items-center gap-2 text-xs text-emerald-300">
                    <span className="relative grid h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    </span>
                    {live ? t('ai.live') : t('ai.wait')}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
              >
                <X size={20} />
              </button>
            </header>
            <div className="border-b border-white/5 px-4 py-2 text-[10px] text-slate-500">
              {t('ai.detected')
                .replace('{s}', t(pageSection(pathname)))
                .replace(
                  '{h}',
                  syncAt.toLocaleTimeString(locale, {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })
                )}
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'ml-8' : 'mr-6'}>
                  <div
                    className={
                      m.role === 'user'
                        ? 'rounded-2xl rounded-br-md bg-[#D4AF37] px-4 py-3 text-sm text-[#08152f]'
                        : 'rounded-2xl rounded-bl-md border border-white/10 bg-white/[.04] px-4 py-3 text-sm leading-6 text-slate-200'
                    }
                  >
                    {tr(m.content)}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="mr-6 rounded-2xl rounded-bl-md border border-white/10 bg-white/[.04] px-4 py-3 text-slate-400">
                  <Loader2 className="mr-2 inline animate-spin" size={16} />
                  {t('ai.loading')}
                </div>
              )}
            </div>
            {messages.length === 1 && (
              <div className="grid gap-2 px-4 pb-3">
                {starters.map((s) => (
                  <button
                    key={s}
                    onClick={() => void send(t(s))}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[.03] px-3 py-2 text-left text-xs text-slate-300 hover:border-[#D4AF37]/40 hover:text-white"
                  >
                    {t(s)}
                    <ChevronRight size={14} />
                  </button>
                ))}
              </div>
            )}
            <form onSubmit={submit} className="border-t border-white/10 bg-[#08152f] p-3">
              <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-black/20 p-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  rows={1}
                  placeholder={t('ai.ph')}
                  className="max-h-28 min-h-10 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-slate-500"
                />
                <button
                  disabled={loading || !input.trim()}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-[#D4AF37] text-[#08152f] disabled:opacity-40"
                >
                  <Send size={17} />
                </button>
              </div>
              <div className="mt-2 text-center text-[10px] text-slate-500">{t('ai.foot')}</div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
