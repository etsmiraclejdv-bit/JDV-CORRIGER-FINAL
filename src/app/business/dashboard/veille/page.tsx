'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import { ExternalLink, Globe, Newspaper, Search, RefreshCw, Clock3 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TerrainKey } from '@/lib/i18n/terrain';

type Article = {
  title: string;
  link: string;
  source: string;
  publishedAt: string | null;
  summary: string;
};
const categories: { id: string; label: TerrainKey }[] = [
  { id: 'business', label: 'bz.veCatBusiness' },
  { id: 'technology', label: 'bz.veCatTech' },
  { id: 'africa', label: 'bz.veCatAfrica' },
  { id: 'world', label: 'bz.veCatWorld' },
];

export default function VeillePage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('business');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Une erreur « bz.… » est une clé de traduction ; sinon c'est un texte brut.
  const shownError = error.startsWith('bz.') ? t(error as TerrainKey) : error;

  async function loadNews(nextCategory = category) {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/jdv-news?category=${encodeURIComponent(nextCategory)}`, {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('bz.veFeedDown');
      const data = await response.json();
      setArticles(Array.isArray(data.articles) ? data.articles : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'bz.veLoadFail');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNews(category);
  }, [category]);

  function searchGoogle(e: FormEvent) {
    e.preventDefault();
    const value = query.trim();
    if (value)
      window.open(
        `https://www.google.com/search?q=${encodeURIComponent(value)}`,
        '_blank',
        'noopener,noreferrer'
      );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 lg:p-8 text-white">
      <header>
        <div className="mb-2 flex items-center gap-2 text-sky-300">
          <Globe size={20} />
          <span className="text-xs font-semibold uppercase tracking-[.2em]">
            {t('bz.veKicker')}
          </span>
        </div>
        <h1 className="text-2xl font-bold">{t('bz.veTitle')}</h1>
        <p className="mt-2 text-sm text-slate-300">{t('bz.veIntro')}</p>
      </header>
      <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <Search size={18} className="text-amber-300" />
          {t('bz.veGoogle')}
        </h2>
        <form onSubmit={searchGoogle} className="flex flex-col gap-3 sm:flex-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('bz.veSearchPh')}
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-300"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-semibold text-slate-950"
          >
            <Search size={17} />
            {t('bz.veSearchBtn')}
            <ExternalLink size={15} />
          </button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {[t('bz.veSug1'), t('bz.veSug2'), t('bz.veSug3')].map((s) => (
            <button
              key={s}
              onClick={() => setQuery(s)}
              className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:border-amber-300/50 hover:text-white"
            >
              {s}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">{t('bz.veGoogleNote')}</p>
      </section>
      <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-semibold">
              <Newspaper size={18} className="text-amber-300" />
              {t('bz.veNews')}
            </h2>
            <p className="mt-1 text-xs text-slate-400">{t('bz.veNewsSub')}</p>
          </div>
          <button
            onClick={() => void loadNews()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            {t('bz.inRefresh')}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`rounded-full px-3 py-2 text-sm ${category === c.id ? 'bg-amber-400 text-slate-950' : 'border border-white/10 text-slate-300 hover:bg-white/5'}`}
            >
              {t(c.label)}
            </button>
          ))}
        </div>
        {error && (
          <p className="rounded-xl border border-red-400/20 bg-red-950/30 p-3 text-sm text-red-200">
            {shownError}
          </p>
        )}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-24 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-400">
            {t('bz.veNone')}
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {articles.map((article, i) => (
              <article
                key={article.link || i}
                className="rounded-xl border border-white/10 bg-slate-950/50 p-4 hover:border-sky-300/30"
              >
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-sky-300">
                  {article.source || t('bz.veOnlineNews')}
                </p>
                <h3 className="font-semibold leading-snug">{article.title}</h3>
                {article.summary && (
                  <p className="mt-2 line-clamp-3 text-sm text-slate-300">{article.summary}</p>
                )}
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock3 size={13} />
                    {article.publishedAt || t('bz.veNoDate')}
                  </span>
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-amber-300 hover:text-amber-200"
                  >
                    {t('bz.veRead')} <ExternalLink size={14} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
        <p className="text-xs text-slate-500">{t('bz.veFooter')}</p>
      </section>
    </div>
  );
}
