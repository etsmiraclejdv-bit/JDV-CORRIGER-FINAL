'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  Globe,
  MapPin,
  MessageSquareQuote,
  Newspaper,
  Phone,
  Search,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

// The public vitrine RPC is introduced by the accompanying SQL migration.
const db = supabase as any;

type Review = {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

type Organization = {
  id: string;
  name: string;
  legal_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  country: string;
  address: string | null;
  city: string | null;
  logo_url: string | null;
  website: string | null;
  primary_color: string | null;
  secondary_color: string | null;
};

type VitrinePayload = {
  organization: Organization;
  reviews: Review[];
};

type NewsArticle = {
  title: string;
  link: string;
  source: string;
  publishedAt: string | null;
  summary: string;
};

const categories = [
  { id: 'business', label: 'Économie' },
  { id: 'technology', label: 'Technologie & IA' },
  { id: 'africa', label: 'Afrique & Bénin' },
  { id: 'world', label: 'International' },
];

export default function CompanyVitrine({ organizationId }: { organizationId: string }) {
  const [data, setData] = useState<VitrinePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<'news' | 'google'>('news');
  const [category, setCategory] = useState('business');
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState('');
  const [search, setSearch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data: result, error } = await db.rpc('jdvcrm_public_company_vitrine_v1', {
        p_organization_id: organizationId,
      });

      if (!alive) return;

      if (error || !result?.organization) {
        setLoadError('Cette vitrine est introuvable ou momentanément indisponible.');
      } else {
        setData(result as VitrinePayload);
      }
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [organizationId]);

  async function loadNews(nextCategory = category) {
    setNewsLoading(true);
    setNewsError('');

    try {
      const response = await fetch('/api/jdv-news?category=' + encodeURIComponent(nextCategory), {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('Les actualités sont momentanément indisponibles.');
      const result = await response.json();
      setArticles(Array.isArray(result.articles) ? result.articles : []);
    } catch (error) {
      setNewsError(error instanceof Error ? error.message : 'Impossible de charger les actualités.');
    } finally {
      setNewsLoading(false);
    }
  }

  function openPanel(tab: 'news' | 'google') {
    setPanelTab(tab);
    setPanelOpen(true);
    if (tab === 'news') void loadNews();
  }

  function searchGoogle(event: FormEvent) {
    event.preventDefault();
    const query = search.trim();
    if (query) {
      window.open(
        'https://www.google.com/search?q=' + encodeURIComponent(query),
        '_blank',
        'noopener,noreferrer'
      );
    }
  }

  async function submitReview(event: FormEvent) {
    event.preventDefault();
    setReviewBusy(true);
    setReviewMessage('');

    try {
      const response = await fetch('/api/public/vitrine/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, customerName, rating, comment }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Impossible d’envoyer cet avis.');

      setReviewMessage(result.message || 'Merci pour votre avis. Il sera publié après validation.');
      setCustomerName('');
      setComment('');
      setRating(5);
    } catch (error) {
      setReviewMessage(error instanceof Error ? error.message : 'Impossible d’envoyer cet avis.');
    } finally {
      setReviewBusy(false);
    }
  }

  if (loading) {
    return <main className="min-h-screen bg-slate-950 p-8 text-white">Chargement de la vitrine…</main>;
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <h1 className="text-2xl font-bold">Vitrine d’entreprise</h1>
        <p className="mt-3 text-slate-300">{loadError}</p>
      </main>
    );
  }

  const org = data.organization;
  const accent = org.secondary_color || '#D4AF37';

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-[#08152f]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-5 py-6">
          {org.logo_url ? (
            <img
              src={org.logo_url}
              alt={'Logo ' + org.name}
              className="h-16 w-16 rounded-xl border border-white/10 bg-white object-contain p-1"
            />
          ) : (
            <div
              className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/5 text-2xl font-bold"
              style={{ color: accent }}
            >
              {org.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p
              className="text-xs font-semibold uppercase tracking-[.2em]"
              style={{ color: accent }}
            >
              Vitrine de l’entreprise
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{org.name}</h1>
            {org.legal_name && org.legal_name !== org.name && (
              <p className="mt-1 text-sm text-slate-300">{org.legal_name}</p>
            )}
          </div>
          <Link href="/" className="text-sm text-slate-300 hover:text-white">
            JDV CRM
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[1.3fr_.7fr]">
        <section className="space-y-5 rounded-2xl border border-white/10 bg-white/[.03] p-5 sm:p-7">
          <h2 className="text-xl font-semibold">Contact et informations</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {(org.address || org.city || org.country) && (
              <div className="flex gap-3 text-slate-300">
                <MapPin className="shrink-0" style={{ color: accent }} />
                <span>{[org.address, org.city, org.country].filter(Boolean).join(', ')}</span>
              </div>
            )}
            {org.phone && (
              <a className="flex gap-3 text-slate-300 hover:text-white" href={'tel:' + org.phone}>
                <Phone className="shrink-0" style={{ color: accent }} />
                {org.phone}
              </a>
            )}
            {org.email && (
              <a
                className="flex gap-3 text-slate-300 hover:text-white"
                href={'mailto:' + org.email}
              >
                <Globe className="shrink-0" style={{ color: accent }} />
                {org.email}
              </a>
            )}
            {org.website && (
              <a
                className="flex gap-3 text-slate-300 hover:text-white"
                href={/^https?:\/\//i.test(org.website) ? org.website : 'https://' + org.website}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="shrink-0" style={{ color: accent }} />
                Site internet
              </a>
            )}
          </div>

          {!org.address && !org.city && !org.phone && !org.email && !org.website && (
            <p className="text-sm text-slate-400">
              Cette entreprise n’a pas encore renseigné ses coordonnées publiques.
            </p>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => openPanel('news')}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-3 font-semibold text-slate-950"
              style={{ backgroundColor: accent }}
            >
              <Newspaper size={18} /> Google & Actualités
            </button>
            {org.whatsapp && (
              <a
                href={'https://wa.me/' + org.whatsapp.replace(/\D/g, '')}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-emerald-400/30 px-4 py-3 text-emerald-300"
              >
                Contacter par WhatsApp
              </a>
            )}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[.03] p-5">
          <div className="flex items-center gap-2">
            <MessageSquareQuote style={{ color: accent }} />
            <h2 className="text-xl font-semibold">Avis des clients</h2>
          </div>

          {data.reviews.length ? (
            <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
              {data.reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-xl border border-white/10 bg-slate-900/70 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <strong>{review.customer_name}</strong>
                    <span className="text-sm" style={{ color: accent }}>
                      {'★'.repeat(review.rating)}
                      {'☆'.repeat(5 - review.rating)}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">
                    {review.comment}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {new Date(review.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Aucun avis publié pour le moment.</p>
          )}

          <form onSubmit={submitReview} className="space-y-3 border-t border-white/10 pt-4">
            <h3 className="font-semibold">Donner votre avis</h3>
            <label className="block text-sm text-slate-300">
              Votre nom
              <input
                required
                minLength={2}
                maxLength={160}
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
            <label className="block text-sm text-slate-300">
              Votre note
              <select
                value={rating}
                onChange={(event) => setRating(Number(event.target.value))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white"
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value} / 5
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-slate-300">
              Votre commentaire
              <textarea
                required
                minLength={10}
                maxLength={3000}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
            {reviewMessage && (
              <p role="status" className="text-sm text-slate-300">
                {reviewMessage}
              </p>
            )}
            <button
              disabled={reviewBusy}
              className="rounded-xl px-4 py-3 font-semibold text-slate-950 disabled:opacity-50"
              style={{ backgroundColor: accent }}
            >
              {reviewBusy ? 'Envoi…' : 'Envoyer mon avis'}
            </button>
            <p className="text-xs text-slate-500">
              Les avis sont publiés après validation par l’entreprise. Merci de ne pas inclure de
              données personnelles sensibles.
            </p>
          </form>
        </section>
      </div>

      <footer className="border-t border-white/10 px-5 py-6 text-center text-xs text-slate-500">
        Vitrine publique proposée par JDV CRM.
      </footer>

      {panelOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-end bg-black/45 p-3 sm:p-6"
          onClick={() => setPanelOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Google et Actualités"
            className="flex max-h-[78vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#08152f] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center gap-3 border-b border-white/10 p-4">
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">Google & Actualités</h2>
                <p className="text-xs text-slate-400">{org.name}</p>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                aria-label="Fermer"
                className="rounded-lg p-2 hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </header>

            <div className="flex gap-2 border-b border-white/10 p-3">
              <button
                onClick={() => {
                  setPanelTab('news');
                  void loadNews();
                }}
                className={
                  'rounded-lg px-3 py-2 text-sm ' +
                  (panelTab === 'news'
                    ? 'bg-amber-300 text-slate-950'
                    : 'border border-white/10 text-slate-300')
                }
              >
                <Newspaper size={15} className="mr-1 inline" />
                Actualités
              </button>
              <button
                onClick={() => setPanelTab('google')}
                className={
                  'rounded-lg px-3 py-2 text-sm ' +
                  (panelTab === 'google'
                    ? 'bg-amber-300 text-slate-950'
                    : 'border border-white/10 text-slate-300')
                }
              >
                <Search size={15} className="mr-1 inline" />
                Recherche Google
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
              {panelTab === 'google' ? (
                <>
                  <form onSubmit={searchGoogle} className="flex gap-2">
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Rechercher sur Google…"
                      className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
                    />
                    <button className="rounded-lg bg-amber-300 px-3 py-2 text-sm font-semibold text-slate-950">
                      Chercher
                    </button>
                  </form>
                  <p className="text-xs text-slate-400">
                    La recherche Google s’ouvre dans un nouvel onglet : Google ne permet pas
                    l’affichage complet de ses résultats dans un cadre intégré.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setCategory(item.id);
                          void loadNews(item.id);
                        }}
                        className={
                          'rounded-full px-3 py-1.5 text-xs ' +
                          (category === item.id
                            ? 'bg-sky-300 text-slate-950'
                            : 'border border-white/10 text-slate-300')
                        }
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {newsError && (
                    <p className="rounded-lg bg-red-950/50 p-3 text-sm text-red-200">{newsError}</p>
                  )}

                  {newsLoading ? (
                    <p className="py-8 text-center text-slate-400">Chargement des actualités…</p>
                  ) : articles.length ? (
                    articles.map((article, index) => (
                      <article
                        key={article.link || index}
                        className="rounded-xl border border-white/10 bg-slate-950/60 p-4"
                      >
                        <p className="text-xs text-sky-300">
                          {article.source || 'Actualité en ligne'}
                          {article.publishedAt ? ' · ' + article.publishedAt : ''}
                        </p>
                        <h3 className="mt-2 font-semibold">{article.title}</h3>
                        {article.summary && (
                          <p className="mt-2 text-sm text-slate-300">{article.summary}</p>
                        )}
                        <a
                          href={article.link}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-1 text-sm text-amber-300"
                        >
                          Lire l’article <ExternalLink size={14} />
                        </a>
                      </article>
                    ))
                  ) : (
                    <p className="py-8 text-center text-slate-400">
                      Aucune actualité disponible pour le moment.
                    </p>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
