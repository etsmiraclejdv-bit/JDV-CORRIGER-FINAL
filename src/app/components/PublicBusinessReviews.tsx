'use client';

import { useEffect, useState } from 'react';
import { MessageSquareText, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

type ClientReview = {
  id: string;
  customer_name: string;
  comment: string;
  rating: number;
  created_at: string;
};

export default function PublicBusinessReviews({ organizationId }: { organizationId: string }) {
  const { t, locale } = useLanguage();
  const [reviews, setReviews] = useState<ClientReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('client_reviews')
          .select('id,customer_name,comment,rating,created_at')
          .eq('organization_id', organizationId)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(20);
        if (error) throw error;
        if (active) setReviews((data ?? []) as ClientReview[]);
      } catch {
        if (active) setReviews([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [organizationId]);

  return (
    <section
      aria-labelledby="business-reviews-title"
      className="rounded-2xl border border-border bg-card p-5 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--brand)_14%,transparent)]">
          <MessageSquareText size={21} style={{ color: 'var(--brand-text)' }} />
        </span>
        <div>
          <h2 id="business-reviews-title" className="text-xl font-bold text-foreground">
            {t('pg.rvTitle')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('pg.rvSub')}</p>
        </div>
      </div>
      {loading ? (
        <p className="mt-5 text-sm text-muted-foreground">{t('pg.rvLoading')}</p>
      ) : reviews.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          {t('pg.rvNone')}
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-xl border border-border p-4">
              <div
                className="flex gap-1"
                aria-label={t('pg.rvRating').replace('{n}', String(review.rating))}
              >
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    size={15}
                    fill={index < review.rating ? 'currentColor' : 'none'}
                    style={{ color: 'var(--brand)' }}
                  />
                ))}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">
                {review.comment}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{review.customer_name}</span>
                <time dateTime={review.created_at}>
                  {new Date(review.created_at).toLocaleDateString(locale)}
                </time>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
