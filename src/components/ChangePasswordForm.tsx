'use client';
import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { friendlyAuthError, validateNewPassword } from '@/lib/security/password';
import { inputClass, labelClass } from '@/lib/ui/forms';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

/** Changement de mot de passe de l'utilisateur connecté (le mot de passe actuel est revérifié avant tout changement). */
export default function ChangePasswordForm() {
  const { t } = useLanguage();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    const problem = validateNewPassword(current, next, confirm);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError('');
    const { data: userData } = await supabase.auth.getUser();
    const email = userData.user?.email;
    if (!email) {
      setSaving(false);
      setError(t('sh.pwSession'));
      return;
    }
    // Revérifie le mot de passe actuel : une session laissée ouverte ne suffit pas à prendre le contrôle du compte.
    const { error: checkError } = await supabase.auth.signInWithPassword({
      email,
      password: current,
    });
    if (checkError) {
      setSaving(false);
      setError(friendlyAuthError(checkError.message));
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: next });
    setSaving(false);
    if (updateError) {
      setError(friendlyAuthError(updateError.message));
      return;
    }
    setCurrent('');
    setNext('');
    setConfirm('');
    toast.success(t('sh.pwOk'));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      <h3 className="text-sm font-semibold text-white">{t('sh.pwTitle')}</h3>
      {error && (
        <div
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300"
          role="alert"
        >
          {error}
        </div>
      )}
      <div>
        <label className={labelClass} htmlFor="pw-current">
          {t('sh.pwCur')}
        </label>
        <input
          id="pw-current"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="pw-new">
          {t('sh.pwNew')}
        </label>
        <input
          id="pw-new"
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className={inputClass}
        />
        <p className="text-xs text-[#718096] mt-1">{t('sh.pwHint')}</p>
      </div>
      <div>
        <label className={labelClass} htmlFor="pw-confirm">
          {t('sh.pwConf')}
        </label>
        <input
          id="pw-confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="w-full btn-outline-gold py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
      >
        <Check size={14} />
        {saving ? t('sh.pwSaving') : t('sh.pwBtn')}
      </button>
    </form>
  );
}
