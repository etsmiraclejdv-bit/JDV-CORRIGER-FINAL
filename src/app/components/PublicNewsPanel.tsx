'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Newspaper, X } from 'lucide-react';

type NewsItem = {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
};

export default function PublicNewsPanel() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || items.length || loading) return;
    let active = true;
    setLoading(true);
    fetch('/api/public-news')
      .then(async (response) => {
        if (!response.ok) throw new Error('Le flux d’actualités est momentanément indisponible.');
        return response.json();
      })
      .then((data: { items?: NewsItem[] }) => {
        if (active) setItems(Array.isArray(data.items) ? data.items : []);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Chargement impossible.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, items.length, loading]);

  return (
    <>
      <section
        id="actualites"
        className="mx-auto max-w-screen-xl scroll-mt-28 px-6 py-8 lg:px-10"
        aria-label="Actualités"
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-[#D4AF37]/30 bg-[#0B1B3D] p-5 text-left shadow-card transition hover:border-[#D4AF37]/70 sm:p-6"
          aria-haspopup="dialog"
        >
          <span className="flex min-w-0 items-center gap-4">
            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">
              <Newspaper size={24} />
            </span>
            <span>
              <span className="block text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">
                Google Actualités
              </span>
              <span className="mt-1 block text-lg font-bold text-white">
                L’actualité à portée de clic
              </span>
              <span className="mt-1 block text-sm text-slate-300">
                Consultez les dernières informations dans une fenêtre dédiée.
              </span>
            </span>
          </span>
          <ExternalLink
            className="flex-none text-[#D4AF37] transition group-hover:translate-x-1"
            size={20}
          />
        </button>
      </section>

      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="jdv-news-title"
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#D4AF37]/30 bg-[#08152f] text-white shadow-2xl"
          >
            <header className="flex items-center justify-between gap-3 border-b border-white/10 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <Newspaper className="text-[#D4AF37]" size={22} />
                <div>
                  <h2 id="jdv-news-title" className="font-bold">
                    Google Actualités
                  </h2>
                  <p className="text-xs text-slate-400">Flux public d’actualités</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer les actualités"
                className="rounded-lg p-2 text-slate-300 hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              {loading && (
                <p className="py-8 text-center text-sm text-slate-300">
                  Chargement des actualités…
                </p>
              )}
              {error && (
                <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
                  {error}{' '}
                  <button
                    className="ml-2 underline"
                    onClick={() => {
                      setError('');
                      setItems([]);
                    }}
                  >
                    Réessayer
                  </button>
                </div>
              )}
              {!loading && !error && items.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-300">
                  Aucun article disponible pour le moment.
                </p>
              )}
              <div className="space-y-3">
                {items.map((item, index) => (
                  <article
                    key={item.link + index}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <h3 className="font-semibold leading-6">{item.title}</h3>
                    <p className="mt-2 text-xs text-slate-400">
                      {item.source}
                      {item.publishedAt
                        ? ' · ' + new Date(item.publishedAt).toLocaleString('fr-FR')
                        : ''}
                    </p>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#D4AF37] hover:underline"
                    >
                      Lire l’article <ExternalLink size={14} />
                    </a>
                  </article>
                ))}
              </div>
            </div>
            <footer className="border-t border-white/10 p-4">
              <a
                href="https://news.google.com/?hl=fr&gl=BJ&ceid=BJ:fr"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[#D4AF37] hover:underline"
              >
                Ouvrir Google Actualités <ExternalLink size={14} />
              </a>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
