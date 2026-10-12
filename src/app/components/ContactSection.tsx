'use client';

import { FormEvent, useState } from 'react';
import { CheckCircle2, Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { SITE } from '@/lib/siteConfig';
import PlatformTestimonialsPanel from './PlatformTestimonialsPanel';

const field = 'input-navy w-full px-4 py-3 text-sm';
const label = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground';

export default function ContactSection() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const c = SITE.contact;

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
          title: 'Téléphone direct du concepteur',
          value: phone,
          href: `tel:${phone.replace(/[^+\\d]/g, '')}`,
        }))
      : c.phone
        ? [{
            icon: Phone,
            title: 'Téléphone',
            value: c.phone,
            href: `tel:${c.phone.replace(/[^+\\d]/g, '')}`,
          }]
        : []),
    c.email && { icon: Mail, title: 'E-mail', value: c.email, href: `mailto:${c.email}` },
    c.address && { icon: MapPin, title: 'Adresse', value: c.address, href: undefined },
    c.hours && { icon: Clock, title: 'Horaires', value: c.hours, href: undefined },
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
      if (!res.ok) throw new Error(data?.error || 'Envoi impossible. Réessayez plus tard.');
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Envoi impossible.');
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
            Contact
          </p>
          <h2 className="text-3xl font-extrabold text-foreground lg:text-4xl">
            Parlons de votre activité
          </h2>
          <p className="mt-4 text-muted-foreground">
            Une question, une démonstration, un besoin particulier ? Écrivez-nous, nous vous
            répondons rapidement.
          </p>
        </div>

        <div className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="min-w-0 space-y-5">
            {channels.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {channels.map(({ icon: Icon, title, value, href }) => (
                  <div
                    key={title}
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
                  <h3 className="mt-4 text-xl font-bold text-foreground">Message envoyé</h3>
                  <p className="mt-2 text-muted-foreground">
                    Merci. Nous vous répondrons dès que possible.
                  </p>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-4">
                  <div
                    aria-hidden="true"
                    style={{ position: 'absolute', left: '-9999px', height: 0, overflow: 'hidden' }}
                  >
                    <label>
                      Ne pas remplir
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
                        Nom complet *
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
                        Sujet
                      </label>
                      <input
                        id="c-subject"
                        name="subject"
                        maxLength={160}
                        className={field}
                        placeholder="Démonstration, tarifs, partenariat…"
                      />
                    </div>
                    <div>
                      <label className={label} htmlFor="c-email">
                        E-mail
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
                        Téléphone / WhatsApp
                      </label>
                      <input id="c-phone" name="phone" maxLength={40} className={field} />
                    </div>
                  </div>
                  <div>
                    <label className={label} htmlFor="c-message">
                      Message *
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
                  <p className="text-xs text-muted-foreground">
                    Indiquez au moins une adresse e-mail ou un numéro de téléphone pour que nous
                    puissions vous répondre.
                  </p>
                  <button
                    disabled={sending}
                    className="btn-gold w-full rounded-xl py-3.5 font-bold disabled:opacity-60"
                  >
                    {sending ? 'Envoi…' : 'Envoyer le message'}
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
