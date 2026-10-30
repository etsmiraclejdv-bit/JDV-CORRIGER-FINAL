'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

type WarehouseAccess = { access_role?: string };

export default function AgencyLoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setLoading(false);
      setError(t('auth.invalid'));
      return;
    }

    const { data, error: accessError } = await supabase.rpc('jdvcrm_my_warehouses_v1');
    const hasAgencyAccess =
      !accessError &&
      Array.isArray(data) &&
      (data as WarehouseAccess[]).some((item) => item.access_role === 'manager');

    if (!hasAgencyAccess) {
      await supabase.auth.signOut();
      setLoading(false);
      setError("Ce compte ne possède pas d'accès responsable d'agence.");
      return;
    }

    router.replace('/agence/dashboard');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07142d] p-6 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 rounded-2xl border border-emerald-400/20 bg-white/5 p-8"
      >
        <div className="text-center">
          <Building2 className="mx-auto text-emerald-300" size={36} />
          <h1 className="mt-3 text-2xl font-bold">
            JDV <span className="text-emerald-300">Agence</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Accès réservé aux responsables d&apos;agence
          </p>
        </div>
        <label className="block text-sm">
          {t('auth.emailAddress')}
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-[#0F2347] p-2.5"
          />
        </label>
        <label className="block text-sm">
          {t('auth.password')}
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-[#0F2347] p-2.5"
          />
        </label>
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm"
          >
            {error}
          </div>
        )}
        <button
          disabled={loading}
          className="w-full rounded-lg bg-emerald-300 py-2.5 font-semibold text-[#08152f] disabled:opacity-50"
        >
          {loading ? t('auth.signingIn') : t('auth.signIn')}
        </button>
      </form>
    </main>
  );
}
