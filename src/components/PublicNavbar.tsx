'use client';
import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const navLinks = [
  { label: 'Accueil', href: '/' },
  { label: 'Services', href: '#services' },
  { label: 'Fonctionnalités', href: '#features' },
  { label: 'Actualités', href: '#actualites' },
  { label: 'Avis', href: '#avis-plateforme' },
  { label: 'Contact', href: '#contact' },
  { label: 'Tarifs', href: '#pricing' },
  { label: 'Le concepteur', href: '/a-propos-concepteur' },
];

export default function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || mobileOpen ? 'nav-glass shadow-card' : 'bg-transparent'
      }`}
    >
      <nav
        aria-label="Navigation principale"
        className="mx-auto flex h-16 max-w-screen-xl items-center justify-between gap-4 px-4 sm:px-6 xl:px-10"
      >
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="JDV CRM, accueil">
          <Image
            src="/assets/images/image_a5395bef-1789678648033.jpg"
            alt=""
            width={36}
            height={36}
            className="flex-shrink-0 rounded-lg object-contain"
            priority
          />
          <span className="whitespace-nowrap text-lg font-bold tracking-tight text-foreground sm:text-xl">
            JDV <span className="gold-gradient-text">CRM</span>
          </span>
        </Link>

        <div className="hidden items-center gap-6 xl:flex">
          {navLinks.map((link) => (
            <a
              key={`nav-${link.href}`}
              href={link.href}
              className="whitespace-nowrap text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/business/login"
            className="hidden whitespace-nowrap px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            Connexion
          </Link>
          <a
            href="#register"
            className="btn-gold hidden items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold sm:flex"
          >
            Essai gratuit
            <ChevronRight size={14} aria-hidden="true" />
          </a>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground xl:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileOpen}
            aria-controls="public-mobile-menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div
          id="public-mobile-menu"
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border animate-slide-up xl:hidden"
        >
          <div className="mx-auto grid max-w-screen-xl gap-1 px-4 py-4 sm:grid-cols-2 sm:px-6">
            {navLinks.map((link) => (
              <a
                key={`mobile-nav-${link.href}`}
                href={link.href}
                className="rounded-xl px-3 py-3 text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="mx-auto flex max-w-screen-xl flex-col gap-2 border-t border-border px-4 py-4 sm:flex-row sm:px-6">
            <Link
              href="/business/login"
              className="rounded-xl border border-border px-5 py-3 text-center text-sm font-semibold text-foreground hover:bg-muted sm:flex-1"
              onClick={() => setMobileOpen(false)}
            >
              Connexion
            </Link>
            <a
              href="#register"
              className="btn-gold rounded-xl px-5 py-3 text-center text-sm font-semibold sm:flex-1"
              onClick={() => setMobileOpen(false)}
            >
              Démarrer l&apos;essai gratuit
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
