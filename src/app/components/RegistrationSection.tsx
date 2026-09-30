'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Building2, Mail, Lock, Phone, Globe, MapPin, Briefcase, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { sendCompanyRegistrationEmail } from '@/lib/services/emailService';
import { trackRegistration } from '@/lib/analytics';
import { runOnboarding, savePendingOnboarding } from '@/lib/onboarding';
import Link from 'next/link';

interface RegistrationFormData {
  organizationName: string;
  adminEmail: string;
  password: string;
  confirmPassword: string;
  phone: string;
  country: string;
  city: string;
  sector: string;
  termsAccepted: boolean;
}

const countries = [
  'Côte d\'Ivoire', 'Sénégal', 'Ghana', 'Mali', 'Burkina Faso',
  'Guinée', 'Togo', 'Bénin', 'Niger', 'Cameroun', 'Nigeria', 'Autre',
];

const sectors = [
  'Commerce général', 'Électroménager', 'Téléphonie & Informatique',
  'Ameublement & Décoration', 'Alimentation & Boissons',
  'Textile & Prêt-à-porter', 'Construction & Matériaux',
  'Pharmacie & Santé', 'Agriculture', 'Services financiers', 'Autre',
];

export default function RegistrationSection() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegistrationFormData>();

  const password = watch('password');

  const onSubmit = async (data: RegistrationFormData) => {
    setLoading(true);
    setError('');
    try {
      // 1. Créer le compte d'authentification
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.adminEmail,
        password: data.password,
      });
      if (signUpError) throw new Error(signUpError.message);
      if (!authData.user) throw new Error('Erreur lors de la création du compte');

      // 2. Créer l'entreprise, le rôle administrateur et l'abonnement d'essai (fonction SQL sécurisée).
      //    Sans session (email à confirmer), on garde les infos et on termine à la première connexion.
      const payload = {
        companyName: data.organizationName,
        email: data.adminEmail,
        phone: data.phone,
        country: data.country,
        city: data.city,
        industry: data.sector,
        contactName: data.organizationName,
      };
      if (authData.session) {
        const { error: onboardingError } = await runOnboarding(authData.user.id, payload);
        if (onboardingError) throw new Error(onboardingError.message);
      } else {
        savePendingOnboarding(payload);
      }

      // 4. Send welcome email (non-blocking)
      sendCompanyRegistrationEmail({
        to: data.adminEmail,
        organizationName: data.organizationName,
      });

      // 5. Track GA4 registration event
      trackRegistration({
        organizationName: data.organizationName,
        sector: data.sector,
        country: data.country,
      });

      setLoading(false);
      setSubmitted(true);
      toast.success('Entreprise enregistrée ! Vérifiez votre email pour activer votre compte.');
    } catch (err) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(msg);
      toast.error(msg);
    }
  };

  if (submitted) {
    return (
      <section id="register" className="py-20">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 flex justify-center">
          <div className="card-navy rounded-3xl p-12 text-center max-w-lg shadow-card-hover animate-scale-in">
            <div className="w-20 h-20 rounded-full badge-success flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={36} className="text-success" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">Inscription réussie !</h3>
            <p className="text-muted-foreground mb-6">
              Votre compte d&apos;essai a été créé. Consultez votre boîte email pour confirmer votre adresse et accéder à votre tableau de bord.
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              Votre essai gratuit est valable 14 jours, sans limitation de fonctionnalités.
            </p>
            <Link href="/business/login" className="btn-gold inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-semibold">
              Aller à la connexion
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="register" className="py-20">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left — Copy */}
          <div className="lg:pt-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3" style={{ letterSpacing: '0.12em' }}>
              Inscription
            </p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-foreground mb-6">
              Démarrez votre{' '}
              <span className="gold-gradient-text">essai gratuit</span>{' '}
              maintenant
            </h2>
            <p className="text-base text-muted-foreground mb-8 leading-relaxed">
              Créez votre espace entreprise en moins de 2 minutes. Aucune carte bancaire requise pour l&apos;essai.
            </p>

            <div className="space-y-4">
              {[
                { icon: <CheckCircle size={16} />, text: '14 jours d\'essai gratuit complet' },
                { icon: <CheckCircle size={16} />, text: 'Configuration de vos prospecteurs incluse' },
                { icon: <CheckCircle size={16} />, text: 'Support d\'onboarding dédié' },
                { icon: <CheckCircle size={16} />, text: 'Données isolées par RLS — aucun partage' },
              ].map((item, i) => (
                <div key={`benefit-${i}`} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="text-success flex-shrink-0">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          {/* Right — Form */}
          <div className="card-navy rounded-3xl p-8 shadow-card-hover">
            <h3 className="text-lg font-semibold text-foreground mb-6">Créer votre espace entreprise</h3>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Organization Name */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide" style={{ letterSpacing: '0.05em' }}>
                  Nom de l&apos;entreprise *
                </label>
                <div className="relative">
                  <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    {...register('organizationName', { required: 'Le nom de l\'entreprise est requis', minLength: { value: 2, message: 'Minimum 2 caractères' } })}
                    className="input-navy w-full pl-9 pr-4 py-3 text-sm"
                    placeholder="Ex: Diallo & Frères SARL"
                  />
                </div>
                {errors.organizationName && (
                  <p className="text-xs text-danger mt-1">{errors.organizationName.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide" style={{ letterSpacing: '0.05em' }}>
                  Email administrateur *
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    {...register('adminEmail', {
                      required: 'L\'email est requis',
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email invalide' },
                    })}
                    className="input-navy w-full pl-9 pr-4 py-3 text-sm"
                    placeholder="admin@monentreprise.com"
                  />
                </div>
                {errors.adminEmail && (
                  <p className="text-xs text-danger mt-1">{errors.adminEmail.message}</p>
                )}
              </div>

              {/* Password + Confirm */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide" style={{ letterSpacing: '0.05em' }}>
                    Mot de passe *
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('password', {
                        required: 'Mot de passe requis',
                        minLength: { value: 8, message: 'Minimum 8 caractères' },
                      })}
                      className="input-navy w-full pl-9 pr-9 py-3 text-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-danger mt-1">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide" style={{ letterSpacing: '0.05em' }}>
                    Confirmation *
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      {...register('confirmPassword', {
                        required: 'Confirmation requise',
                        validate: (v) => v === password || 'Les mots de passe ne correspondent pas',
                      })}
                      className="input-navy w-full pl-9 pr-9 py-3 text-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-danger mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide" style={{ letterSpacing: '0.05em' }}>
                  Téléphone *
                </label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel"
                    {...register('phone', { required: 'Téléphone requis' })}
                    className="input-navy w-full pl-9 pr-4 py-3 text-sm"
                    placeholder="+225 07 00 00 00 00"
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-danger mt-1">{errors.phone.message}</p>
                )}
              </div>

              {/* Country + City */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide" style={{ letterSpacing: '0.05em' }}>
                    Pays *
                  </label>
                  <div className="relative">
                    <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <select
                      {...register('country', { required: 'Pays requis' })}
                      className="input-navy w-full pl-9 pr-4 py-3 text-sm appearance-none"
                    >
                      <option value="">Choisir...</option>
                      {countries.map((c) => (
                        <option key={`country-${c}`} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  {errors.country && (
                    <p className="text-xs text-danger mt-1">{errors.country.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide" style={{ letterSpacing: '0.05em' }}>
                    Ville *
                  </label>
                  <div className="relative">
                    <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      {...register('city', { required: 'Ville requise' })}
                      className="input-navy w-full pl-9 pr-4 py-3 text-sm"
                      placeholder="Abidjan"
                    />
                  </div>
                  {errors.city && (
                    <p className="text-xs text-danger mt-1">{errors.city.message}</p>
                  )}
                </div>
              </div>

              {/* Sector */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide" style={{ letterSpacing: '0.05em' }}>
                  Secteur d&apos;activité *
                </label>
                <div className="relative">
                  <Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <select
                    {...register('sector', { required: 'Secteur requis' })}
                    className="input-navy w-full pl-9 pr-4 py-3 text-sm appearance-none"
                  >
                    <option value="">Choisir votre secteur...</option>
                    {sectors.map((s) => (
                      <option key={`sector-${s}`} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                {errors.sector && (
                  <p className="text-xs text-danger mt-1">{errors.sector.message}</p>
                )}
              </div>

              {/* Terms */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('termsAccepted', { required: 'Vous devez accepter les conditions' })}
                    className="mt-0.5 w-4 h-4 rounded accent-primary"
                  />
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    J&apos;accepte les{' '}
                    <Link href="/legal#conditions" className="text-primary hover:underline">conditions d&apos;utilisation</Link>
                    {' '}et la{' '}
                    <Link href="/legal#confidentialite" className="text-primary hover:underline">politique de confidentialité</Link>
                    {' '}de JDV CRM.
                  </span>
                </label>
                {errors.termsAccepted && (
                  <p className="text-xs text-danger mt-1">{errors.termsAccepted.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-gold w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Création en cours...
                  </>
                ) : (
                  'Créer mon espace entreprise gratuitement'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}