'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { supabase } from '@/lib/supabase/client';

export default function LanguageSettingsSection() {
  const { locale, setLocale, locales, t } = useLanguage();
  const [saving, setSaving] = useState(false);

  async function changeLanguage(next: string) {
    const selected = locales.find((item) => item.code === next);
    if (!selected) return;
    setLocale(selected.code);
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('profiles')
          .update({ preferred_language: selected.code } as never)
          .eq('id', user.id);
        if (error) console.warn('Language preference could not be synced to profile:', error.message);
      }
    } catch (error) {
      console.warn('Language preference remains saved on this device.', error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="jdv-language-settings-title" className="rounded-2xl border border-white/10 bg-[#0F2347] p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="rounded-xl bg-emerald-400/10 p-2 text-emerald-300"><Globe size={20} /></span>
        <div>
          <h2 id="jdv-language-settings-title" className="text-base font-semibold text-white">{t('language')}</h2>
          <p className="mt-1 text-sm text-slate-400">{t('selectLanguage')}</p>
        </div>
      </div>
      <label htmlFor="jdv-workspace-language" className="mb-2 block text-sm font-medium text-slate-200">{t('language')}</label>
      <select id="jdv-workspace-language" value={locale} onChange={(event) => void changeLanguage(event.target.value)}
        className="w-full max-w-md rounded-xl border border-white/15 bg-[#08152F] px-4 py-3 text-sm text-white outline-none focus:border-emerald-300">
        {locales.map((item) => <option key={item.code} value={item.code}>{item.nativeName}</option>)}
      </select>
      <p role="status" className="mt-2 text-xs text-slate-400">{saving ? t('we.loading') : ''}</p>
    </section>
  );
}
