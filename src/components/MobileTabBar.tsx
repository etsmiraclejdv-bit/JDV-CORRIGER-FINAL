'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

export type MobileTabItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

type Props = {
  items: MobileTabItem[];
  rootHref: string;
  primaryCount?: number;
};

/**
 * Barre de navigation du bas, visible uniquement sur téléphone (< md).
 * Les premiers éléments sont affichés ; le bouton « Plus » ouvre la liste complète.
 */
export default function MobileTabBar({ items, rootHref, primaryCount = 4 }: Props) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) =>
    href === rootHref ? pathname === href : pathname.startsWith(href);
  const primary = items.slice(0, primaryCount);

  return (
    <div className="md:hidden">
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setOpen(false)}>
          <div
            className="absolute inset-x-0 bottom-0 max-h-[75vh] overflow-y-auto rounded-t-2xl border-t border-[#D4AF37]/20 bg-[#08152f] p-3 pb-[calc(env(safe-area-inset-bottom)+4.5rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between px-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#718096]">
                {t('menu')}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-[#A0AEC0]"
                aria-label={`${t('close')} ${t('menu')}`}
              >
                <X size={18} />
              </button>
            </div>
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${isActive(item.href) ? 'bg-[#D4AF37]/15 text-[#D4AF37]' : 'text-[#A0AEC0]'}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 flex border-t border-[#D4AF37]/20 bg-[#08152f] pb-[env(safe-area-inset-bottom)]"
        aria-label={t('mainNavigation')}
      >
        {primary.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2 text-[10px] font-medium ${isActive(item.href) ? 'text-[#D4AF37]' : 'text-[#A0AEC0]'}`}
          >
            {item.icon}
            <span className="w-full truncate text-center">{item.label}</span>
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2 text-[10px] font-medium ${open ? 'text-[#D4AF37]' : 'text-[#A0AEC0]'}`}
        >
          <Menu size={20} />
          <span>{t('more')}</span>
        </button>
      </nav>
    </div>
  );
}
