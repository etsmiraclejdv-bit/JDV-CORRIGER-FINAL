/* eslint-disable prettier/prettier */
'use client';

import { FormEvent, useEffect, useState } from 'react';
import { MessageSquareQuote, Star, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

type PlatformTestimonial = {
  id: string;
  author_name: string;
  author_role: string | null;
  company_name: string | null;
  quote: string;
  rating: number | null;
};

const fieldClass = 'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground';

export default function PlatformTestimonialsPanel() {
  const [items, setItems] = useState<PlatformTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState('');
  const [authorRole, setAuthorRole] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [quote, setQuote] = useState('');
  const [rating, setRating] = useState(5);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await supabase
          .from('testimonials')
          .select('id,author_name,author_role,company_name,quote,rating')
          .eq('status', 'approved')
          .order('sort_order', { ascending: true })
          .limit(6);
        if (active) setItems((data ?? []) as PlatformTestimonial[]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/public/platform-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorName, authorRole, companyName, quote, rating }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Envoi impossible. Réessayez.');
      setMessage(result.message || 'Merci pour votre avis.');
      setAuthorName('');
      setAuthorRole('');
      setCompanyName('');
      setQuote('');
      setRating(5);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Envoi impossible.');
    } finally {
      setSending(false);
    }
  }

  return (
    <aside id="avis-plateforme" className="h-full scroll-mt-28 rounded-3xl border border-border bg-card p-6 shadow-card sm:p-7">
      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--brand)_14%,transparent)]">
          <MessageSquareQuote size={21} style={{ color: 'var(--brand-text)' }} />
        </span>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--brand-text)' }}>
            Avis & témoignages
          </p>
          <h3 className="text-xl font-bold text-foreground">Votre avis sur JDV CRM</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Notez la plateforme et partagez votre expérience. Votre avis sera vérifié avant publication.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3" aria-label="Chargement des avis">
          <div className="h-24 animate-pulse rounded-2xl bg-muted" />
          <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        </div>
      ) : items.length === 0 ? (
        <div className="mb-6 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Les premiers témoignages validés apparaîtront ici.
        </div>
      ) : (
        <div className="mb-7 space-y-4">
          {items.map((item) => (
            <figure key={item.id} className="rounded-2xl border border-border p-4">
              <blockquote className="text-sm leading-relaxed text-foreground">« {item.quote} »</blockquote>
              {item.rating ? (
                <div className="mt-3 flex gap-0.5" aria-label={`Note : ${item.rating} sur 5`}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={14} fill={index < item.rating! ? 'currentColor' : 'none'} style={{ color: 'var(--brand)' }} />
                  ))}
                </div>
              ) : null}
              <figcaption className="mt-3 text-sm">
                <span className="font-semibold text-foreground">{item.author_name}</span>
                <span className="block text-xs text-muted-foreground">{[item.author_role, item.company_name].filter(Boolean).join(' · ')}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <div className="border-t border-border pt-6">
        <h4 className="mb-4 text-base font-bold text-foreground">Envoyer un avis et une note</h4>
        {message && <p role="status" className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-foreground">{message}</p>}
        {error && <p role="alert" className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}
        <form onSubmit={submitReview} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-semibold text-muted-foreground">
              Votre nom *
              <input required minLength={2} maxLength={120} value={authorName} onChange={(e) => setAuthorName(e.target.value)} className={fieldClass} autoComplete="name" />
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-muted-foreground">
              Fonction (facultatif)
              <input maxLength={120} value={authorRole} onChange={(e) => setAuthorRole(e.target.value)} className={fieldClass} placeholder="Ex. : entrepreneur" />
            </label>
          </div>
          <label className="block space-y-1.5 text-xs font-semibold text-muted-foreground">
            Entreprise (facultatif)
            <input maxLength={160} value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={fieldClass} autoComplete="organization" />
          </label>
          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-muted-foreground">Votre note *</legend>
            <div className="flex items-center gap-2" role="radiogroup" aria-label="Votre note sur 5">
              {Array.from({ length: 5 }, (_, index) => index + 1).map((value) => (
                <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value} sur 5`} onClick={() => setRating(value)} className="rounded-lg p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" style={{ color: value <= rating ? 'var(--brand)' : 'var(--muted-foreground)' }}>
                  <Star size={25} fill={value <= rating ? 'currentColor' : 'none'} />
                </button>
              ))}
              <span className="text-sm font-semibold text-foreground">{rating}/5</span>
            </div>
          </fieldset>
          <label className="block space-y-1.5 text-xs font-semibold text-muted-foreground">
            Votre expérience *
            <textarea required minLength={10} maxLength={600} rows={4} value={quote} onChange={(e) => setQuote(e.target.value)} className={fieldClass} placeholder="Dites-nous ce que JDV CRM vous aide à accomplir…" />
            <span className="block text-right font-normal">{quote.length}/600</span>
          </label>
          <button type="submit" disabled={sending} className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-60" style={{ background: 'var(--brand)', color: 'var(--brand-ink, #0B1B3D)' }}>
            <Send size={16} /> {sending ? 'Envoi en cours…' : 'Envoyer mon avis'}
          </button>
          <p className="text-xs leading-5 text-muted-foreground">Les avis sont soumis à modération avant affichage public. N’incluez aucune information confidentielle.</p>
        </form>
      </div>
    </aside>
  );
}
