'use client';
import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { locale, t } = useLanguage();

  const copy = {
    fr: [
      'Accueil',
      'Services',
      'Fonctionnalités',
      'Actualités',
      'Avis',
      'Contact',
      'Tarifs',
      'Le concepteur',
      'Essai gratuit',
      'Démarrer l’essai gratuit',
    ],
    en: [
      'Home',
      'Services',
      'Features',
      'News',
      'Reviews',
      'Contact',
      'Pricing',
      'About the creator',
      'Free trial',
      'Start free trial',
    ],
    es: [
      'Inicio',
      'Servicios',
      'Funciones',
      'Noticias',
      'Opiniones',
      'Contacto',
      'Precios',
      'El creador',
      'Prueba gratis',
      'Iniciar prueba gratis',
    ],
    fil: [
      'Home',
      'Mga serbisyo',
      'Mga feature',
      'Balita',
      'Mga review',
      'Makipag-ugnayan',
      'Presyo',
      'Tungkol sa gumawa',
      'Libreng pagsubok',
      'Simulan ang libreng pagsubok',
    ],
    it: [
      'Home',
      'Servizi',
      'Funzionalità',
      'Notizie',
      'Recensioni',
      'Contatti',
      'Prezzi',
      'Il creatore',
      'Prova gratuita',
      'Inizia la prova gratuita',
    ],
    'zh-CN': [
      '首页',
      '服务',
      '功能',
      '新闻',
      '评价',
      '联系',
      '价格',
      '关于创作者',
      '免费试用',
      '开始免费试用',
    ],
    'zh-TW': [
      '首頁',
      '服務',
      '功能',
      '新聞',
      '評價',
      '聯絡',
      '價格',
      '關於創作者',
      '免費試用',
      '開始免費試用',
    ],
    pt: [
      'Início',
      'Serviços',
      'Funcionalidades',
      'Notícias',
      'Avaliações',
      'Contacto',
      'Preços',
      'Sobre o criador',
      'Teste grátis',
      'Começar teste grátis',
    ],
    de: [
      'Startseite',
      'Dienste',
      'Funktionen',
      'Neuigkeiten',
      'Bewertungen',
      'Kontakt',
      'Preise',
      'Über den Entwickler',
      'Kostenlos testen',
      'Kostenlos testen starten',
    ],
    ar: [
      'الرئيسية',
      'الخدمات',
      'الميزات',
      'الأخبار',
      'التقييمات',
      'اتصل بنا',
      'الأسعار',
      'عن المطور',
      'تجربة مجانية',
      'ابدأ التجربة المجانية',
    ],
    sw: [
      'Mwanzo',
      'Huduma',
      'Vipengele',
      'Habari',
      'Maoni',
      'Mawasiliano',
      'Bei',
      'Kuhusu mtengenezaji',
      'Jaribio la bure',
      'Anza jaribio la bure',
    ],
  }[locale] ?? [
    'Accueil',
    'Services',
    'Fonctionnalités',
    'Actualités',
    'Avis',
    'Contact',
    'Tarifs',
    'Le concepteur',
    'Essai gratuit',
    'Démarrer l’essai gratuit',
  ];

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navLinks = [
    { label: copy[0], href: '/' },
    { label: copy[1], href: '#services' },
    { label: copy[2], href: '#features' },
    { label: copy[3], href: '#actualites' },
    { label: copy[4], href: '#avis-plateforme' },
    { label: copy[5], href: '#contact' },
    { label: copy[6], href: '#pricing' },
    { label: copy[7], href: '/a-propos-concepteur' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'nav-glass shadow-card' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between rounded-t-[15px] border-0 px-6 lg:px-10">
        <div className="flex items-center gap-3">
          <Image
            src="/assets/images/image_a5395bef-1789678648033.jpg"
            alt="JDV CRM Logo"
            width={36}
            height={36}
            className="rounded-lg object-contain flex-shrink-0"
            priority
          />

          <span className="font-bold text-xl tracking-tight text-foreground">
            JDV <span className="gold-gradient-text">CRM</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {navLinks?.map((link) => (
            <a
              key={`nav-${link?.href}`}
              href={link?.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              {link?.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/business/login"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
          >
            {t('login')}
          </Link>
          <a
            href="#register"
            className="btn-gold text-sm font-semibold px-5 py-2 rounded-xl flex items-center gap-2"
          >
            {copy[8]}
            <ChevronRight size={14} />
          </a>
        </div>

        <button
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? t('closeMenu') : t('openMenu')}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden nav-glass border-t border-border animate-slide-up">
          <div className="px-6 py-4 flex flex-col gap-4">
            {navLinks?.map((link) => (
              <a
                key={`mobile-nav-${link?.href}`}
                href={link?.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground py-2"
                onClick={() => setMobileOpen(false)}
              >
                {link?.label}
              </a>
            ))}
            <hr className="divider-gold" />
            <Link
              href="/business/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground py-2 text-center"
              onClick={() => setMobileOpen(false)}
            >
              {t('login')}
            </Link>
            <a
              href="#register"
              className="btn-gold text-sm font-semibold px-5 py-3 rounded-xl text-center"
              onClick={() => setMobileOpen(false)}
            >
              {copy[9]}
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
