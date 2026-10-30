'use client';

import React, { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import styles from './LanguageSwitcher.module.css';

export default function LanguageSwitcher({
  variant = 'floating',
}: {
  variant?: 'floating' | 'inline';
}) {
  const [open, setOpen] = useState(false);
  const { locale, setLocale, locales, t } = useLanguage();

  async function handleSelect(lang: typeof locale) {
    setLocale(lang);
    setOpen(false);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ preferred_language: lang } as never)
          .eq('id', user.id);
      }
    } catch {
      // Local preference remains available even when the profile cannot be updated.
    }
  }

  const current = locales.find((item) => item.code === locale);
  return (
    <div className={`${styles.menu} ${variant === 'inline' ? styles.inlineMenu : ''}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={t('selectLanguage')}
        className={styles.trigger}
      >
        <Globe size={15} aria-hidden="true" />
        <span>
          <span className={styles.languageLabel}>{t('language')}</span>{' '}
          {current?.nativeName ?? locale}
        </span>
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label={t('close')}
            className={styles.backdrop}
            onClick={() => setOpen(false)}
          />
          <div role="listbox" aria-label={t('selectLanguage')} className={styles.options}>
            {locales.map((item) => (
              <button
                type="button"
                role="option"
                aria-selected={locale === item.code}
                key={item.code}
                onClick={() => void handleSelect(item.code)}
                className={styles.option}
              >
                <span>{item.nativeName}</span>
                {locale === item.code && <Check size={14} aria-hidden="true" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
