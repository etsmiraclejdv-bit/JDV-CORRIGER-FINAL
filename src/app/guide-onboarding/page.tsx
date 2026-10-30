'use client';
import React, { useState } from 'react';
import {
  BookOpen,
  Users,
  Building2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Package,
  ArrowLeftRight,
  RotateCcw,
  Wrench,
  Bell,
  ClipboardList,
  Wallet,
  UserPlus,
  Settings,
  BarChart2,
  Truck,
  MapPin,
  Star,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TerrainKey } from '@/lib/i18n/terrain';

interface Step {
  num: number;
  title: TerrainKey;
  icon: React.ReactNode;
  desc: TerrainKey;
  tips?: TerrainKey[];
}

interface Section {
  id: string;
  role: TerrainKey;
  roleColor: string;
  icon: React.ReactNode;
  description: TerrainKey;
  steps: Step[];
}

const sections: Section[] = [
  // ── PROSPECTEUR TERRAIN ──────────────────────────────────────────────
  {
    id: 'terrain',
    role: 'gd.rT',
    roleColor: '#63B3ED',
    icon: <MapPin size={20} />,
    description: 'gd.dT',
    steps: [
      {
        num: 1,
        title: 'gd.t1t',
        icon: <ShieldCheck size={16} />,
        desc: 'gd.t1d',
        tips: ['gd.t1k1', 'gd.t1k2'],
      },
      {
        num: 2,
        title: 'gd.t2t',
        icon: <BarChart2 size={16} />,
        desc: 'gd.t2d',
        tips: ['gd.t2k1'],
      },
      {
        num: 3,
        title: 'gd.t3t',
        icon: <UserPlus size={16} />,
        desc: 'gd.t3d',
        tips: ['gd.t3k1', 'gd.t3k2'],
      },
      {
        num: 4,
        title: 'gd.t4t',
        icon: <Users size={16} />,
        desc: 'gd.t4d',
        tips: ['gd.t4k1', 'gd.t4k2'],
      },
      {
        num: 5,
        title: 'gd.t5t',
        icon: <ShoppingCart size={16} />,
        desc: 'gd.t5d',
        tips: ['gd.t5k1', 'gd.t5k2'],
      },
      {
        num: 6,
        title: 'gd.t6t',
        icon: <Wallet size={16} />,
        desc: 'gd.t6d',
        tips: ['gd.t6k1'],
      },
      {
        num: 7,
        title: 'gd.t7t',
        icon: <Bell size={16} />,
        desc: 'gd.t7d',
        tips: ['gd.t7k1'],
      },
      {
        num: 8,
        title: 'gd.t8t',
        icon: <Settings size={16} />,
        desc: 'gd.t8d',
        tips: ['gd.t8k1'],
      },
    ],
  },

  // ── ENTREPRISE / BUSINESS ADMIN ──────────────────────────────────────
  {
    id: 'business',
    role: 'gd.rB',
    roleColor: '#D4AF37',
    icon: <Building2 size={20} />,
    description: 'gd.dB',
    steps: [
      {
        num: 1,
        title: 'gd.b1t',
        icon: <ShieldCheck size={16} />,
        desc: 'gd.b1d',
        tips: ['gd.b1k1'],
      },
      {
        num: 2,
        title: 'gd.b2t',
        icon: <UserPlus size={16} />,
        desc: 'gd.b2d',
        tips: ['gd.b2k1', 'gd.b2k2'],
      },
      {
        num: 3,
        title: 'gd.b3t',
        icon: <Users size={16} />,
        desc: 'gd.b3d',
        tips: ['gd.b3k1', 'gd.b3k2'],
      },
      {
        num: 4,
        title: 'gd.b4t',
        icon: <BookOpen size={16} />,
        desc: 'gd.b4d',
        tips: ['gd.b4k1'],
      },
      {
        num: 5,
        title: 'gd.b5t',
        icon: <Truck size={16} />,
        desc: 'gd.b5d',
        tips: ['gd.b5k1'],
      },
      {
        num: 6,
        title: 'gd.b6t',
        icon: <ArrowLeftRight size={16} />,
        desc: 'gd.b6d',
        tips: ['gd.b6k1'],
      },
      {
        num: 7,
        title: 'gd.b7t',
        icon: <ShoppingCart size={16} />,
        desc: 'gd.b7d',
        tips: ['gd.b7k1', 'gd.b7k2'],
      },
      {
        num: 8,
        title: 'gd.b8t',
        icon: <RotateCcw size={16} />,
        desc: 'gd.b8d',
        tips: ['gd.b8k1', 'gd.b8k2'],
      },
      {
        num: 9,
        title: 'gd.b9t',
        icon: <BarChart2 size={16} />,
        desc: 'gd.b9d',
        tips: ['gd.b9k1'],
      },
      {
        num: 10,
        title: 'gd.b10t',
        icon: <ClipboardList size={16} />,
        desc: 'gd.b10d',
        tips: ['gd.b10k1'],
      },
      {
        num: 11,
        title: 'gd.b11t',
        icon: <Bell size={16} />,
        desc: 'gd.b11d',
        tips: ['gd.b11k1'],
      },
      {
        num: 12,
        title: 'gd.b12t',
        icon: <Settings size={16} />,
        desc: 'gd.b12d',
        tips: ['gd.b12k1'],
      },
      {
        num: 13,
        title: 'gd.b13t',
        icon: <Star size={16} />,
        desc: 'gd.b13d',
        tips: ['gd.b13k1', 'gd.b13k2'],
      },
    ],
  },

  // ── SUPER ADMIN / CONCEPTEUR ─────────────────────────────────────────
  {
    id: 'superadmin',
    role: 'gd.rS',
    roleColor: '#FC8181',
    icon: <ShieldCheck size={20} />,
    description: 'gd.dS',
    steps: [
      {
        num: 1,
        title: 'gd.s1t',
        icon: <ShieldCheck size={16} />,
        desc: 'gd.s1d',
        tips: ['gd.s1k1', 'gd.s1k2'],
      },
      {
        num: 2,
        title: 'gd.s2t',
        icon: <BarChart2 size={16} />,
        desc: 'gd.s2d',
        tips: ['gd.s2k1'],
      },
      {
        num: 3,
        title: 'gd.s3t',
        icon: <Building2 size={16} />,
        desc: 'gd.s3d',
        tips: ['gd.s3k1'],
      },
      {
        num: 4,
        title: 'gd.s4t',
        icon: <Package size={16} />,
        desc: 'gd.s4d',
        tips: ['gd.s4k1', 'gd.s4k2'],
      },
      {
        num: 5,
        title: 'gd.s5t',
        icon: <Users size={16} />,
        desc: 'gd.s5d',
        tips: ['gd.s5k1', 'gd.s5k2'],
      },
      {
        num: 6,
        title: 'gd.s6t',
        icon: <Wallet size={16} />,
        desc: 'gd.s6d',
        tips: ['gd.s6k1'],
      },
      {
        num: 7,
        title: 'gd.s7t',
        icon: <CheckCircle size={16} />,
        desc: 'gd.s7d',
        tips: ['gd.s7k1'],
      },
      {
        num: 8,
        title: 'gd.s8t',
        icon: <Wrench size={16} />,
        desc: 'gd.s8d',
        tips: ['gd.s8k1', 'gd.s8k2'],
      },
      {
        num: 9,
        title: 'gd.s9t',
        icon: <ClipboardList size={16} />,
        desc: 'gd.s9d',
        tips: ['gd.s9k1'],
      },
      {
        num: 10,
        title: 'gd.s10t',
        icon: <Settings size={16} />,
        desc: 'gd.s10d',
        tips: ['gd.s10k1', 'gd.s10k2'],
      },
      {
        num: 11,
        title: 'gd.s11t',
        icon: <Bell size={16} />,
        desc: 'gd.s11d',
        tips: [],
      },
    ],
  },
];

export default function GuideOnboardingPage() {
  const { t } = useLanguage();
  const [openSection, setOpenSection] = useState<string>('business');
  const [openSteps, setOpenSteps] = useState<Record<string, boolean>>({});

  function toggleStep(sectionId: string, stepNum: number) {
    const key = `${sectionId}-${stepNum}`;
    setOpenSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="min-h-screen bg-[#0B1B3D] py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.2)] rounded-full px-4 py-1.5 mb-5">
            <BookOpen size={14} className="text-[#D4AF37]" />
            <span className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider">
              {t('gd.badge')}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            {t('gd.h1')} <span className="gold-gradient-text">JDV CRM</span>
          </h1>
          <p className="text-[#A0AEC0] text-sm max-w-xl mx-auto">{t('gd.intro')}</p>
        </div>

        {/* Role tabs */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setOpenSection(s.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                openSection === s.id
                  ? 'bg-[#0F2347] border-[rgba(212,175,55,0.4)] text-white'
                  : 'bg-transparent border-[rgba(212,175,55,0.15)] text-[#A0AEC0] hover:text-white hover:border-[rgba(212,175,55,0.3)]'
              }`}
            >
              <span style={{ color: openSection === s.id ? s.roleColor : undefined }}>
                {s.icon}
              </span>
              {t(s.role)}
            </button>
          ))}
        </div>

        {/* Active section */}
        {sections
          .filter((s) => s.id === openSection)
          .map((section) => (
            <div key={section.id}>
              {/* Section header */}
              <div className="bg-[#0F2347] border border-[rgba(212,175,55,0.15)] rounded-2xl p-5 mb-5">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="p-2 rounded-xl"
                    style={{ backgroundColor: `${section.roleColor}20`, color: section.roleColor }}
                  >
                    {section.icon}
                  </div>
                  <h2 className="text-lg font-bold text-white">{t(section.role)}</h2>
                </div>
                <p className="text-sm text-[#A0AEC0]">{t(section.description)}</p>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                {section.steps.map((step) => {
                  const key = `${section.id}-${step.num}`;
                  const isOpen = openSteps[key] ?? false;
                  return (
                    <div
                      key={step.num}
                      className="bg-[#0F2347] border border-[rgba(212,175,55,0.12)] rounded-2xl overflow-hidden"
                    >
                      <button
                        onClick={() => toggleStep(section.id, step.num)}
                        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-[rgba(212,175,55,0.04)] transition-colors"
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{
                            backgroundColor: `${section.roleColor}20`,
                            color: section.roleColor,
                          }}
                        >
                          {step.num}
                        </div>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span style={{ color: section.roleColor }} className="flex-shrink-0">
                            {step.icon}
                          </span>
                          <span className="text-sm font-semibold text-white truncate">
                            {t(step.title)}
                          </span>
                        </div>
                        {isOpen ? (
                          <ChevronUp size={16} className="text-[#718096] flex-shrink-0" />
                        ) : (
                          <ChevronDown size={16} className="text-[#718096] flex-shrink-0" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5 border-t border-[rgba(212,175,55,0.08)]">
                          <p className="text-sm text-[#A0AEC0] mt-4 leading-relaxed">
                            {t(step.desc)}
                          </p>
                          {step.tips && step.tips.length > 0 && (
                            <div className="mt-4 space-y-2">
                              {step.tips.map((tip, i) => (
                                <div
                                  key={i}
                                  className="flex items-start gap-2 bg-[rgba(99,179,237,0.06)] border border-[rgba(99,179,237,0.15)] rounded-xl px-3 py-2"
                                >
                                  <Info size={13} className="text-[#63B3ED] flex-shrink-0 mt-0.5" />
                                  <p className="text-xs text-[#A0AEC0]">{t(tip)}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Quick links */}
              <div className="mt-6 bg-[rgba(212,175,55,0.05)] border border-[rgba(212,175,55,0.15)] rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-[#D4AF37] mb-3 flex items-center gap-2">
                  <AlertCircle size={14} />
                  {t('gd.quick').replace('{r}', t(section.role))}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {section.id === 'terrain' && (
                    <>
                      <Link
                        href="/terrain/login"
                        className="text-xs text-[#63B3ED] hover:text-white bg-[rgba(99,179,237,0.1)] border border-[rgba(99,179,237,0.2)] rounded-lg px-3 py-1.5 transition-colors"
                      >
                        {t('gd.lTLogin')}
                      </Link>
                      <Link
                        href="/terrain/dashboard"
                        className="text-xs text-[#63B3ED] hover:text-white bg-[rgba(99,179,237,0.1)] border border-[rgba(99,179,237,0.2)] rounded-lg px-3 py-1.5 transition-colors"
                      >
                        {t('gd.lTDash')}
                      </Link>
                      <Link
                        href="/terrain/dashboard/prospects"
                        className="text-xs text-[#63B3ED] hover:text-white bg-[rgba(99,179,237,0.1)] border border-[rgba(99,179,237,0.2)] rounded-lg px-3 py-1.5 transition-colors"
                      >
                        {t('gd.lTPros')}
                      </Link>
                      <Link
                        href="/terrain/dashboard/ventes"
                        className="text-xs text-[#63B3ED] hover:text-white bg-[rgba(99,179,237,0.1)] border border-[rgba(99,179,237,0.2)] rounded-lg px-3 py-1.5 transition-colors"
                      >
                        {t('gd.lTSales')}
                      </Link>
                      <Link
                        href="/terrain/dashboard/commission"
                        className="text-xs text-[#63B3ED] hover:text-white bg-[rgba(99,179,237,0.1)] border border-[rgba(99,179,237,0.2)] rounded-lg px-3 py-1.5 transition-colors"
                      >
                        {t('gd.lTComm')}
                      </Link>
                    </>
                  )}
                  {section.id === 'business' && (
                    <>
                      <Link
                        href="/business/login"
                        className="text-xs text-[#D4AF37] hover:text-white bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.2)] rounded-lg px-3 py-1.5 transition-colors"
                      >
                        {t('gd.lBLogin')}
                      </Link>
                      <Link
                        href="/business/dashboard"
                        className="text-xs text-[#D4AF37] hover:text-white bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.2)] rounded-lg px-3 py-1.5 transition-colors"
                      >
                        {t('gd.lBDash')}
                      </Link>
                      <Link
                        href="/business/dashboard/catalogue"
                        className="text-xs text-[#D4AF37] hover:text-white bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.2)] rounded-lg px-3 py-1.5 transition-colors"
                      >
                        {t('gd.lBCat')}
                      </Link>
                      <Link
                        href="/business/dashboard/ventes"
                        className="text-xs text-[#D4AF37] hover:text-white bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.2)] rounded-lg px-3 py-1.5 transition-colors"
                      >
                        {t('gd.lBSales')}
                      </Link>
                      <Link
                        href="/business/dashboard/clients"
                        className="text-xs text-[#D4AF37] hover:text-white bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.2)] rounded-lg px-3 py-1.5 transition-colors"
                      >
                        {t('gd.lBCli')}
                      </Link>
                      <Link
                        href="/business/dashboard/reports"
                        className="text-xs text-[#D4AF37] hover:text-white bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.2)] rounded-lg px-3 py-1.5 transition-colors"
                      >
                        {t('gd.lBRep')}
                      </Link>
                      <Link
                        href="/payment-wall"
                        className="text-xs text-[#D4AF37] hover:text-white bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.2)] rounded-lg px-3 py-1.5 transition-colors"
                      >
                        {t('gd.lBSub')}
                      </Link>
                    </>
                  )}
                  {section.id === 'superadmin' && (
                    <>
                      <Link
                        href="/hidden-concepteur-gate/dashboard"
                        className="text-xs text-[#FC8181] hover:text-white bg-[rgba(252,129,129,0.1)] border border-[rgba(252,129,129,0.2)] rounded-lg px-3 py-1.5 transition-colors"
                      >
                        {t('gd.lSDash')}
                      </Link>
                      <Link
                        href="/hidden-concepteur-gate/dashboard/maintenance"
                        className="text-xs text-[#FC8181] hover:text-white bg-[rgba(252,129,129,0.1)] border border-[rgba(252,129,129,0.2)] rounded-lg px-3 py-1.5 transition-colors"
                      >
                        {t('gd.lSMaint')}
                      </Link>
                      <Link
                        href="/hidden-concepteur-gate/dashboard/audit"
                        className="text-xs text-[#FC8181] hover:text-white bg-[rgba(252,129,129,0.1)] border border-[rgba(252,129,129,0.2)] rounded-lg px-3 py-1.5 transition-colors"
                      >
                        {t('gd.lSAudit')}
                      </Link>
                      <Link
                        href="/hidden-concepteur-gate/dashboard/settings"
                        className="text-xs text-[#FC8181] hover:text-white bg-[rgba(252,129,129,0.1)] border border-[rgba(252,129,129,0.2)] rounded-lg px-3 py-1.5 transition-colors"
                      >
                        {t('gd.lSSet')}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
