'use client';

import { useEffect, useState } from 'react';
import { MessageSquareQuote, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

type PlatformTestimonial = {
  id: string;
  author_name: string;
  author_role: string | null;
  company_name: string | null;
  quote: string;
  rating: number | null;
};

export default function PlatformTestimonialsPanel() {
  const [items, setItems] = useState<PlatformTestimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await supabase
          .from('testimonials')
          .select('id,author_name,author_role,company_name,quote,rating')
          .eq('status', 'approved')
          .order('sort_order', { ascending: true })
          .limit(3);
        if (active) setItems((data ?? []) as PlatformTestimonial[]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <aside className="h-full rounded-3xl border border-border bg-card p-6 shadow-card sm:p-7">
      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--brand)_14%,transparent)]">
          <MessageSquareQuote size={21} style={{ color: 'var(--brand-text)' }} />
        </span>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--brand-text)' }}>Avis & témoignages</p>
          <h3 className="text-xl font-bold text-foreground">Ils parlent de JDV CRM</h3>
          <p className="mt-1 text-sm text-muted-foreground">Les retours publiés par la plateforme.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3" aria-label="Chargement des avis">
          <div className="h-24 animate-pulse rounded-2xl bg-muted" />
          <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
          Les témoignages approuvés par le concepteur apparaîtront ici prochainement.
        </div>
      ) : (
        <div className="space-y-4">
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
    </aside>
  );
}
