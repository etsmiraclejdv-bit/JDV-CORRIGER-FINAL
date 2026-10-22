'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Lock, Mail, Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { checkCurrentBusinessAdmin } from '@/lib/auth/business-admin';
import { completePendingOnboarding } from '@/lib/onboarding';
import AppLogo from '@/components/ui/AppLogo';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function BusinessLoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const redirected = useRef(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError(t('auth.invalid'));
        } else {
          setError(signInError.message);
        }
        setLoading(false);
        return;
      }
      const { data: sessionData } = await supabase.auth.getUser();
      if (sessionData.user) {
        const completed = await completePendingOnboarding(sessionData.user.id, email);
        if (completed) {
          router.replace('/business/validation');
          return;
        }
      }
      const result = await checkCurrentBusinessAdmin();
      if (!result.ok) {
        // Dossier d'entreprise en cours de validation : on envoie le candidat vers sa page de validation
        if (
          sessionData.user &&
          (result.reason === 'no_organization' || result.reason === 'unauthorized')
        ) {
          const { data: pending } = await supabase
            .from('organization_applications')
            .select('id')
            .eq('applicant_user_id', sessionData.user.id)
            .neq('status', 'activated')
            .limit(1);
          if (pending && pending.length > 0) {
            router.replace('/business/validation');
            return;
          }
        }
        await supabase.auth.signOut();
        if (result.reason === 'profile_not_found') setError(t('bz.profileNotFound'));
        else if (result.reason === 'unauthorized') setError(t('bz.notAuthorized'));
        else if (result.reason === 'no_organization') setError(t('bz.noOrg'));
        else setError(result.message);
        setLoading(false);
        return;
      }
      if (!redirected.current) {
        redirected.current = true;
        router.replace('/business/dashboard');
      }
    } catch {
      setError(t('auth.unexpected'));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1B3D] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-3">
            <AppLogo size={40} />
            <span className="text-2xl font-bold text-white">
              JDV <span className="gold-gradient-text">CRM</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#A0AEC0]">
            <Building2 size={14} />
            <span>{t('bz.space')}</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#0F2347] border border-[#D4AF37]/20 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-xl font-bold text-white mb-1">{t('bz.loginTitle')}</h1>
          <p className="text-sm text-[#A0AEC0] mb-6">{t('bz.loginSub')}</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#A0AEC0] mb-1.5">
                {t('auth.emailAddress')}
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718096]"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@entreprise.com"
                  className="w-full bg-[#0A1628] border border-[#D4AF37]/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-[#718096] text-sm focus:outline-none focus:border-[#D4AF37]/60 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#A0AEC0] mb-1.5">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718096]"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#0A1628] border border-[#D4AF37]/20 rounded-xl pl-10 pr-12 py-3 text-white placeholder-[#718096] text-sm focus:outline-none focus:border-[#D4AF37]/60 transition-colors"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718096] hover:text-[#A0AEC0] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gold py-3 rounded-xl font-bold text-sm disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? t('auth.signingIn') : t('auth.signIn')}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#D4AF37]/10 text-center">
            <p className="text-xs text-[#718096]">
              {t('bz.fieldQ')}{' '}
              <Link href="/terrain/login" className="text-[#D4AF37] hover:underline">
                {t('bz.fieldAccess')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
