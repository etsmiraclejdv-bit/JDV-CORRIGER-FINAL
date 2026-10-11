'use client';

import { useEffect, useState } from 'react';
import { Quote, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

type Testimonial = { id: string; author_name: string; author_role: string | null; company_name: string | null; quote: string; rating: number | null };

// Affiche uniquement les témoignages approuvés (table testimonials). Aucun témoignage n'est inventé :
// tant qu'il n'y en a pas, la section reste invisible.
export default function TestimonialsSection() {
  const [items, setItems] = useState<Testimonial[]>([]);

  useEffect(() => {
    supabase.from('testimonials').select('id,author_name,author_role,company_name,quote,rating')
      .eq('status', 'approved').order('sort_order', { ascending: true }).limit(9)
      .then(({ data }) => setItems(((data ?? []) as Testimonial[])));
  }, []);

  if (items.length === 0) return null;

  return (
    <section id="temoignages" className="py-20">
      <div className="mx-auto max-w-screen-xl px-6 lg:px-10">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--brand-text)' }}>Témoignages</p>
          <h2 className="text-3xl font-extrabold text-foreground lg:text-4xl">Ils utilisent JDV CRM au quotidien</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <figure key={t.id} className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card">
              <Quote size={22} style={{ color: 'var(--brand-text)' }} />
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-foreground">{t.quote}</blockquote>
              {t.rating ? (
                <div className="mt-4 flex gap-0.5" aria-label={`Note : ${t.rating} sur 5`}>
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} style={{ color: 'var(--brand)' }} fill={i < (t.rating ?? 0) ? 'currentColor' : 'none'} />)}
                </div>
              ) : null}
              <figcaption className="mt-3 text-sm">
                <span className="font-semibold text-foreground">{t.author_name}</span>
                <span className="block text-muted-foreground">{[t.author_role, t.company_name].filter(Boolean).join(' · ')}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
