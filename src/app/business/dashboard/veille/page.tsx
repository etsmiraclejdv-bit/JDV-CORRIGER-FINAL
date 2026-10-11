'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import { ExternalLink, Globe, Newspaper, Search, RefreshCw, Clock3 } from 'lucide-react';

type Article = { title: string; link: string; source: string; publishedAt: string | null; summary: string };
const categories = [
  { id: 'business', label: 'Économie & entreprises' },
  { id: 'technology', label: 'Technologie & IA' },
  { id: 'africa', label: 'Afrique & Bénin' },
  { id: 'world', label: 'International' },
];

export default function VeillePage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('business');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadNews(nextCategory = category) {
    setLoading(true); setError('');
    try {
      const response = await fetch(`/api/jdv-news?category=${encodeURIComponent(nextCategory)}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Le flux d’informations est momentanément indisponible.');
      const data = await response.json();
      setArticles(Array.isArray(data.articles) ? data.articles : []);
    } catch (e) { setError(e instanceof Error ? e.message : 'Impossible de charger les actualités.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { void loadNews(category); }, [category]);

  function searchGoogle(e: FormEvent) {
    e.preventDefault();
    const value = query.trim();
    if (value) window.open(`https://www.google.com/search?q=${encodeURIComponent(value)}`, '_blank', 'noopener,noreferrer');
  }

  return <div className="mx-auto max-w-6xl space-y-6 p-6 lg:p-8 text-white">
    <header><div className="mb-2 flex items-center gap-2 text-sky-300"><Globe size={20}/><span className="text-xs font-semibold uppercase tracking-[.2em]">Espace de veille</span></div><h1 className="text-2xl font-bold">Google & Actualités</h1><p className="mt-2 text-sm text-slate-300">Recherche sur le web et veille d’information pour profiter des temps calmes tout en restant informé.</p></header>
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
      <h2 className="mb-3 flex items-center gap-2 font-semibold"><Search size={18} className="text-amber-300"/>Recherche Google</h2>
      <form onSubmit={searchGoogle} className="flex flex-col gap-3 sm:flex-row"><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Rechercher un marché, un fournisseur, une idée…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-300"/><button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-semibold text-slate-950"><Search size={17}/>Chercher sur Google<ExternalLink size={15}/></button></form>
      <div className="mt-3 flex flex-wrap gap-2">{['tendances commerciales en Afrique','conseils de gestion de stock','intelligence artificielle pour PME'].map((s)=><button key={s} onClick={()=>setQuery(s)} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:border-amber-300/50 hover:text-white">{s}</button>)}</div>
      <p className="mt-3 text-xs text-slate-500">Google s’ouvre dans un nouvel onglet : son site ne permet pas l’intégration complète dans une iframe de l’application.</p>
    </section>
    <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/70 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 font-semibold"><Newspaper size={18} className="text-amber-300"/>Actualités en ligne</h2><p className="mt-1 text-xs text-slate-400">Flux d’actualités externes, actualisés à la demande et mis en cache côté serveur.</p></div><button onClick={()=>void loadNews()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} className={loading?'animate-spin':''}/>Actualiser</button></div>
      <div className="flex flex-wrap gap-2">{categories.map((c)=><button key={c.id} onClick={()=>setCategory(c.id)} className={`rounded-full px-3 py-2 text-sm ${category===c.id?'bg-amber-400 text-slate-950':'border border-white/10 text-slate-300 hover:bg-white/5'}`}>{c.label}</button>)}</div>
      {error && <p className="rounded-xl border border-red-400/20 bg-red-950/30 p-3 text-sm text-red-200">{error}</p>}
      {loading ? <div className="space-y-3">{[1,2,3].map((n)=><div key={n} className="h-24 animate-pulse rounded-xl bg-white/5"/>)}</div> : articles.length===0 ? <p className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-400">Aucun article reçu pour le moment. Réessaie dans quelques instants.</p> : <div className="grid gap-3 md:grid-cols-2">{articles.map((article,i)=><article key={article.link || i} className="rounded-xl border border-white/10 bg-slate-950/50 p-4 hover:border-sky-300/30"><p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-sky-300">{article.source || 'Actualité en ligne'}</p><h3 className="font-semibold leading-snug">{article.title}</h3>{article.summary && <p className="mt-2 line-clamp-3 text-sm text-slate-300">{article.summary}</p>}<div className="mt-4 flex items-center justify-between gap-3"><span className="flex items-center gap-1 text-xs text-slate-500"><Clock3 size={13}/>{article.publishedAt || 'Date non précisée'}</span><a href={article.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-amber-300 hover:text-amber-200">Lire l’article <ExternalLink size={14}/></a></div></article>)}</div>}
      <p className="text-xs text-slate-500">Les articles sont fournis par des éditeurs externes. JDV CRM ne republie pas leurs contenus complets ; ouvre la source pour lire l’article intégral.</p>
    </section>
  </div>;
}
