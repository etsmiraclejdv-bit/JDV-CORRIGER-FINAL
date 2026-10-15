'use client';

import { FormEvent, useState } from 'react';
import { CheckCircle2, Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { SITE } from '@/lib/siteConfig';
import PlatformTestimonialsPanel from './PlatformTestimonialsPanel';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

const field = 'input-navy w-full px-4 py-3 text-sm';
const label = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground';

export default function ContactSection() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const c = SITE.contact;
  const { t } = useLanguage();

  const channels = [
    c.whatsapp && {
      icon: MessageCircle,
      title: 'WhatsApp',
      value: `+${c.whatsapp}`,
      href: `https://wa.me/${c.whatsapp}`,
    },
    ...(Array.isArray(c.phones) && c.phones.length
      ? c.phones.map((phone) => ({
          icon: Phone,
          title: t('contact.ch.designerPhone'),
          value: phone,
          href: `tel:${phone.replace(/[^+\d]/g, '')}`,
        }))
      : c.phone
        ? [
            {
              icon: Phone,
              title: t('contact.ch.phone'),
              value: c.phone,
              href: `tel:${c.phone.replace(/[^+\\d]/g, '')}`,
            },
          ]
        : []),
    c.email && {
      icon: Mail,
      title: t('contact.ch.email'),
      value: c.email,
      href: `mailto:${c.email}`,
    },
    c.address && {
      icon: MapPin,
      title: t('contact.ch.address'),
      value: c.address,
      href: undefined,
    },
    c.hours && { icon: Clock, title: t('contact.ch.hours'), value: c.hours, href: undefined },
  ].filter(Boolean) as { icon: typeof Mail; title: string; value: string; href?: string }[];

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSending(true);
    const f = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(f.entries())),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || t('contact.sendFail'));
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('contact.sendFailShort'));
    } finally {
      setSending(false);
    }
  }

  return (
    <section id="contact" className="py-20">
      <div className="mx-auto max-w-screen-xl px-6 lg:px-10">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p
            className="mb-3 text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--brand-text)' }}
          >
            {t('contact.kicker')}
          </p>
          <h2 className="text-3xl font-extrabold text-foreground lg:text-4xl">
            {t('contact.title')}
          </h2>
          <p className="mt-4 text-muted-foreground">{t('contact.intro')}</p>
        </div>

        <div className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="min-w-0 space-y-5">
            {channels.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {channels.map(({ icon: Icon, title, value, href }, index) => (
                  <div
                    key={`${title}-${value}-${index}`}
                    className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4"
                  >
                    <span
                      className="flex h-10 w-10 flex-none items-center justify-center rounded-xl"
                      style={{ background: 'color-mix(in srgb, var(--brand) 14%, transparent)' }}
                    >
                      <Icon size={18} style={{ color: 'var(--brand-text)' }} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {title}
                      </p>
                      {href ? (
                        <a
                          href={href}
                          className="break-words text-sm font-semibold text-foreground hover:underline"
                        >
                          {value}
                        </a>
                      ) : (
                        <p className="text-sm font-semibold text-foreground">{value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-7">
              {sent ? (
                <div className="py-10 text-center">
                  <CheckCircle2
                    size={48}
                    className="mx-auto"
                    style={{ color: 'var(--brand-text)' }}
                  />
                  <h3 className="mt-4 text-xl font-bold text-foreground">
                    {t('contact.sentTitle')}
                  </h3>
                  <p className="mt-2 text-muted-foreground">{t('contact.sentText')}</p>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-4">
                  <div
                    aria-hidden="true"
                    style={{ position: 'absolute', left: '-9999px', height: 0, overflow: 'hidden' }}
                  >
                    <label>
                      {t('contact.honeypot')}
                      <input name="website" tabIndex={-1} autoComplete="off" />
                    </label>
                  </div>
                  {error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                      {error}
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={label} htmlFor="c-name">
                        {t('contact.f.name')}
                      </label>
                      <input
                        id="c-name"
                        name="fullName"
                        required
                        minLength={2}
                        maxLength={120}
                        className={field}
                      />
                    </div>
                    <div>
                      <label className={label} htmlFor="c-subject">
                        {t('contact.f.subject')}
                      </label>
                      <input
                        id="c-subject"
                        name="subject"
                        maxLength={160}
                        className={field}
                        placeholder={t('contact.ph.subject')}
                      />
                    </div>
                    <div>
                      <label className={label} htmlFor="c-email">
                        {t('contact.f.email')}
                      </label>
                      <input
                        id="c-email"
                        name="email"
                        type="email"
                        maxLength={200}
                        className={field}
                      />
                    </div>
                    <div>
                      <label className={label} htmlFor="c-phone">
                        {t('contact.f.phone')}
                      </label>
                      <input id="c-phone" name="phone" maxLength={40} className={field} />
                    </div>
                  </div>
                  <div>
                    <label className={label} htmlFor="c-message">
                      {t('contact.f.message')}
                    </label>
                    <textarea
                      id="c-message"
                      name="message"
                      required
                      minLength={5}
                      maxLength={2000}
                      rows={4}
                      className={field}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{t('contact.hint')}</p>
                  <button
                    disabled={sending}
                    className="btn-gold w-full rounded-xl py-3.5 font-bold disabled:opacity-60"
                  >
                    {sending ? t('contact.sending') : t('contact.send')}
                  </button>
                </form>
              )}
            </div>
          </div>

          <PlatformTestimonialsPanel />
        </div>
      </div>
    </section>
  );
}
