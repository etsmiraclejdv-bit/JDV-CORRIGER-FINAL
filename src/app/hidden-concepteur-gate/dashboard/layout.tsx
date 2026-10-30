'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Building2,
  Package,
  Users,
  Settings,
  Wrench,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  User,
  HelpCircle,
  CreditCard,
  FileCheck,
  Palette,
  BarChart3,
  MessageSquareQuote,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import NotificationBell from '@/components/NotificationBell';
import UserProfilePanel from '@/components/UserProfilePanel';
import Modal from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase/client';
import { checkCurrentSuperAdmin } from '@/lib/auth/super-admin';
import ConcepteurBranchBar from '@/components/ConcepteurBranchBar';
 fix/traduction-pages-diverses
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TerrainKey } from '@/lib/i18n/terrain';
=======
import MobileTabBar from '@/components/MobileTabBar';
 main

const navItems: {
  id: string;
  label: TerrainKey;
  icon: React.ReactNode;
  href: string;
  group: 'main' | 'manage' | 'system';
}[] = [
  {
    id: 'overview',
    label: 'cg.nOverview',
    icon: <LayoutDashboard size={18} />,
    href: '/hidden-concepteur-gate/dashboard',
    group: 'main',
  },
  {
    id: 'companies',
    label: 'cg.nCompanies',
    icon: <Building2 size={18} />,
    href: '/hidden-concepteur-gate/dashboard/companies',
    group: 'manage',
  },
  {
    id: 'company-applications',
    label: 'cg.nApps',
    icon: <FileCheck size={18} />,
    href: '/hidden-concepteur-gate/dashboard/company-applications',
    group: 'manage',
  },
  {
    id: 'stock',
    label: 'cg.nStock',
    icon: <Package size={18} />,
    href: '/hidden-concepteur-gate/dashboard/stock',
    group: 'manage',
  },
  {
    id: 'prospecteurs',
    label: 'cg.nPros',
    icon: <Users size={18} />,
    href: '/hidden-concepteur-gate/dashboard/prospecteurs',
    group: 'manage',
  },
  {
    id: 'payments',
    label: 'cg.nPay',
    icon: <CreditCard size={18} />,
    href: '/hidden-concepteur-gate/dashboard/payments',
    group: 'manage',
  },
  {
    id: 'maintenance',
    label: 'cg.nMaint',
    icon: <Wrench size={18} />,
    href: '/hidden-concepteur-gate/dashboard/maintenance',
    group: 'system',
  },
  {
    id: 'audit',
    label: 'cg.nAudit',
    icon: <ClipboardList size={18} />,
    href: '/hidden-concepteur-gate/dashboard/audit',
    group: 'system',
  },
  {
    id: 'guide',
    label: 'cg.nGuide',
    icon: <HelpCircle size={18} />,
    href: '/guide-onboarding',
    group: 'system',
  },
  {
    id: 'marketing-growth',
    label: 'cg.nGrowth',
    icon: <BarChart3 size={18} />,
    href: '/hidden-concepteur-gate/dashboard/croissance-marketing',
    group: 'manage',
  },
  {
    id: 'design-studio',
    label: 'cg.nDesign',
    icon: <Palette size={18} />,
    href: '/hidden-concepteur-gate/dashboard/design-studio',
    group: 'system',
  },
  {
    id: 'platform-testimonials',
    label: 'cg.nReviews',
    icon: <MessageSquareQuote size={18} />,
    href: '/hidden-concepteur-gate/dashboard/testimonials',
    group: 'system',
  },
  {
    id: 'settings',
    label: 'cg.nSettings',
    icon: <Settings size={18} />,
    href: '/hidden-concepteur-gate/dashboard/settings',
    group: 'system',
  },
];

const GROUP_KEYS: Record<string, TerrainKey> = {
  main: 'cg.gMain',
  manage: 'cg.gManage',
  system: 'cg.gSystem',
};

export default function SuperAdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const groups = Array.from(new Set(navItems.map((item) => item.group)));

  useEffect(() => {
    checkCurrentSuperAdmin().then((result) => {
      if (!result.ok) router.replace('/hidden-concepteur-gate/login');
      else setAuthChecked(true);
    });
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/hidden-concepteur-gate/login');
  }

  if (!authChecked) {
    return (
      <div className="flex h-screen bg-[#0B1B3D] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
 fix/traduction-pages-diverses
          <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#A0AEC0]">{t('cg.lyChecking')}</p>
=======
          <div className="w-8 h-8 border-2 border-[#34D399] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#CBD5E1]">Vérification des droits d&apos;accès...</p>
 main
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0B1B3D] overflow-hidden">
      <aside
        data-jdv-design="sidebar"
        className={`hidden md:flex h-screen flex-col bg-[#08152F] border-r border-[#1E355B] transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-60'}`}
      >
        <div
          className={`h-16 flex items-center border-b border-[#1E355B] px-4 flex-shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}
        >
          {!collapsed && (
            <div className="flex items-center gap-2">
              <AppLogo size={28} />
              <span className="font-bold text-sm text-[#F4F7FC]">
                JDV <span className="text-[#34D399]">Admin</span>
              </span>
            </div>
          )}
          {collapsed && <AppLogo size={28} />}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F4F7FC] hover:bg-[#14294B] transition-all"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        <nav data-jdv-design="sidebar" className="flex-1 overflow-y-auto py-3 px-2">
          {groups.map((group) => (
            <div key={group} className="mb-4">
              {!collapsed && (
 fix/traduction-pages-diverses
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#718096] px-3 mb-2">
                  {t(GROUP_KEYS[group])}
=======
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#94A3B8] px-3 mb-2">
                  {group}
 main
                </p>
              )}
              {navItems
                .filter((item) => item.group === group)
                .map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/hidden-concepteur-gate/dashboard' &&
                      pathname.startsWith(item.href));
                  return (
                    <Link
                      data-jdv-design="sidebar"
                      key={item.id}
                      href={item.href}
 fix/traduction-pages-diverses
                      title={collapsed ? t(item.label) : undefined}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-all ${isActive ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/20' : 'text-[#A0AEC0] hover:text-white hover:bg-[#0F2347]'} ${collapsed ? 'justify-center' : ''}`}
=======
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-all ${isActive ? 'bg-[#0F3B35] text-[#34D399] border border-[#1E355B]' : 'text-[#CBD5E1] hover:text-[#F4F7FC] hover:bg-[#14294B]'} ${collapsed ? 'justify-center' : ''}`}
 main
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      {!collapsed && <span className="flex-1 truncate">{t(item.label)}</span>}
                    </Link>
                  );
                })}
            </div>
          ))}
        </nav>

        <div className="border-t border-[#1E355B] p-2 flex-shrink-0">
          <div className={`flex ${collapsed ? 'flex-col gap-1 items-center' : 'gap-2'}`}>
            <button
              onClick={() => setProfileOpen(true)}
 fix/traduction-pages-diverses
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[#A0AEC0] hover:text-white hover:bg-[#0F2347] transition-all text-sm ${collapsed ? 'justify-center w-full' : 'flex-1'}`}
              title={t('cg.lyProfile')}
=======
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[#CBD5E1] hover:text-[#F4F7FC] hover:bg-[#14294B] transition-all text-sm ${collapsed ? 'justify-center w-full' : 'flex-1'}`}
              title="Mon profil"
 main
            >
              <User size={16} />
              {!collapsed && <span>{t('cg.lyProfile')}</span>}
            </button>
            <button
              onClick={handleLogout}
 fix/traduction-pages-diverses
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[#A0AEC0] hover:text-red-400 transition-all text-sm ${collapsed ? 'justify-center w-full' : ''}`}
              title={t('cg.lyLogout')}
=======
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[#CBD5E1] hover:text-red-400 transition-all text-sm ${collapsed ? 'justify-center w-full' : ''}`}
              title="Déconnexion"
 main
            >
              <LogOut size={16} />
              {!collapsed && <span>{t('cg.lyQuit')}</span>}
            </button>
          </div>
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="w-full flex justify-center p-2 mt-1 text-[#94A3B8] hover:text-[#F4F7FC] hover:bg-[#14294B] rounded-xl transition-all"
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <ConcepteurBranchBar />
 fix/traduction-pages-diverses
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#D4AF37]/10 bg-[#08152f]/80 backdrop-blur-sm flex-shrink-0">
          <h1 data-jdv-design="page-title" className="text-base font-semibold text-white">
            {t('cg.lyTitle')}
=======
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#1E355B] bg-[#08152F]/80 backdrop-blur-sm flex-shrink-0">
          <h1 data-jdv-design="page-title" className="text-base font-semibold text-[#F4F7FC]">
            Super Admin — Supervision Plateforme
 main
          </h1>
          <div className="flex items-center gap-3">
            <NotificationBell />
          </div>
        </div>
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>
      </div>

      <MobileTabBar
        rootHref="/hidden-concepteur-gate/dashboard"
        items={navItems.map((item) => ({
          href: item.href,
          label: item.label,
          icon: item.icon,
        }))}
      />
      <Modal open={profileOpen} onClose={() => setProfileOpen(false)} title="" size="sm">
        <UserProfilePanel onClose={() => setProfileOpen(false)} />
      </Modal>
    </div>
  );
}
