'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, MapPin, MessageSquareQuote, Newspaper, Search, X } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TerrainKey } from '@/lib/i18n/terrain';

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
  country: string;
  language: string;
  city: string | null;
  logo_url: string | null;
  website: string | null;
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

const categories: { id: string; label: TerrainKey }[] = [
  { id: 'business', label: 'cv.catB' },
  { id: 'technology', label: 'cv.catT' },
  { id: 'africa', label: 'cv.catA' },
  { id: 'world', label: 'cv.catW' },
];

export default function CompanyVitrine({ organizationId }: { organizationId: string }) {
  const { t, locale } = useLanguage();
  // Les messages d’état peuvent être une clé de traduction (affichée via tr) ou un texte du serveur.
  const tr = (s: string) => (s.startsWith('cv.') ? t(s as TerrainKey) : s);
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
      try {
        const response = await fetch('/api/public/vitrine/' + encodeURIComponent(organizationId), {
          cache: 'no-store',
        });
        const result = await response.json();
        if (!alive) return;

        if (!response.ok || !result?.organization) {
          setLoadError(result.error || 'cv.notFound');
        } else {
          setData(result as VitrinePayload);
        }
      } catch {
        if (alive) setLoadError('cv.unreach');
      }
      if (alive) setLoading(false);
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
      if (!response.ok) throw new Error('cv.newsUnavail');
      const result = await response.json();
      setArticles(Array.isArray(result.articles) ? result.articles : []);
    } catch (error) {
      setNewsError(error instanceof Error ? error.message : 'cv.newsErr');
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
      if (!response.ok) throw new Error(result.error || 'cv.sendErr');

      setReviewMessage(result.message || 'cv.thanks');
      setCustomerName('');
      setComment('');
      setRating(5);
    } catch (error) {
      setReviewMessage(error instanceof Error ? error.message : 'cv.sendErr');
    } finally {
      setReviewBusy(false);
    }
  }

  if (loading) {
    return <main className="min-h-screen bg-slate-950 p-8 text-white">{t('pg.vLoading')}</main>;
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <h1 className="text-2xl font-bold">{t('cv.title')}</h1>
        <p className="mt-3 text-slate-300">{tr(loadError)}</p>
      </main>
    );
  }

  const org = data.organization;
  const accent = '#D4AF37';

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-[#08152f]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-5 py-6">
          {org.logo_url ? (
            <Image
              src={org.logo_url}
              alt={t('pg.vLogo').replace('{name}', org.name)}
              width={64}
              height={64}
              unoptimized
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
              {t('cv.shop')}
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
          <h2 className="text-xl font-semibold">{t('cv.about')}</h2>
          <div className="space-y-4 text-slate-300">
            {(org.city || org.country) && (
              <p className="flex gap-3">
                <MapPin className="shrink-0" style={{ color: accent }} />
                <span>{[org.city, org.country].filter(Boolean).join(', ')}</span>
              </p>
            )}
            {org.website && /^https?:\/\//i.test(org.website) && (
              <a
                className="flex gap-3 break-all hover:text-white"
                href={org.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="shrink-0" style={{ color: accent }} />
                {t('pg.vSite')}
              </a>
            )}
            {!org.city && !org.country && !org.website && (
              <p className="text-sm text-slate-400">{t('cv.soon')}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => openPanel('news')}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-3 font-semibold text-slate-950"
              style={{ backgroundColor: accent }}
            >
              <Newspaper size={18} /> {t('cv.gn')}
            </button>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[.03] p-5">
          <div className="flex items-center gap-2">
            <MessageSquareQuote style={{ color: accent }} />
            <h2 className="text-xl font-semibold">{t('pg.rvTitle')}</h2>
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
                    {new Date(review.created_at).toLocaleDateString(locale)}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">{t('pg.rvNone')}</p>
          )}

          <form onSubmit={submitReview} className="space-y-3 border-t border-white/10 pt-4">
            <h3 className="font-semibold">{t('cv.give')}</h3>
            <label className="block text-sm text-slate-300">
              {t('cv.yName')}
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
              {t('cv.yRate')}
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
              {t('cv.yComm')}
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
                {tr(reviewMessage)}
              </p>
            )}
            <button
              disabled={reviewBusy}
              className="rounded-xl px-4 py-3 font-semibold text-slate-950 disabled:opacity-50"
              style={{ backgroundColor: accent }}
            >
              {reviewBusy ? t('cv.sending') : t('cv.send')}
            </button>
            <p className="text-xs text-slate-500">{t('cv.rnote')}</p>
          </form>
        </section>
      </div>

      <footer className="border-t border-white/10 px-5 py-6 text-center text-xs text-slate-500">
        {t('cv.foot')}
      </footer>

      {panelOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-end bg-black/45 p-3 sm:p-6"
          onClick={() => setPanelOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={t('cv.gn')}
            className="flex max-h-[78vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#08152f] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center gap-3 border-b border-white/10 p-4">
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">{t('cv.gn')}</h2>
                <p className="text-xs text-slate-400">{org.name}</p>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                aria-label={t('cv.close')}
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
                {t('cv.tabNews')}
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
                {t('cv.tabG')}
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
              {panelTab === 'google' ? (
                <>
                  <form onSubmit={searchGoogle} className="flex gap-2">
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder={t('cv.gPh')}
                      className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
                    />
                    <button className="rounded-lg bg-amber-300 px-3 py-2 text-sm font-semibold text-slate-950">
                      {t('cv.gGo')}
                    </button>
                  </form>
                  <p className="text-xs text-slate-400">{t('cv.gNote')}</p>
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
                        {t(item.label)}
                      </button>
                    ))}
                  </div>

                  {newsError && (
                    <p className="rounded-lg bg-red-950/50 p-3 text-sm text-red-200">
                      {tr(newsError)}
                    </p>
                  )}

                  {newsLoading ? (
                    <p className="py-8 text-center text-slate-400">{t('cv.loadingNews')}</p>
                  ) : articles.length ? (
                    articles.map((article, index) => (
                      <article
                        key={article.link || index}
                        className="rounded-xl border border-white/10 bg-slate-950/60 p-4"
                      >
                        <p className="text-xs text-sky-300">
                          {article.source || t('cv.onlineNews')}
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
                          {t('cv.read')} <ExternalLink size={14} />
                        </a>
                      </article>
                    ))
                  ) : (
                    <p className="py-8 text-center text-slate-400">{t('cv.noNews')}</p>
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
