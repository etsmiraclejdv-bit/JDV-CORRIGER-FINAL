'use client';

import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  UserCheck,
  Wallet,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  AlertTriangle,
  Warehouse,
  PackageCheck,
  MapPin,
  Palette,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import NotificationBell from '@/components/NotificationBell';
import UserProfilePanel from '@/components/UserProfilePanel';
import Modal from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase/client';
import IntelligencePresenceTracker from '@/components/IntelligencePresenceTracker';
import ConcepteurBranchBar from '@/components/ConcepteurBranchBar';
import MobileTabBar from '@/components/MobileTabBar';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TranslationKey } from '@/lib/i18n/messages';

const GROUP_KEYS: Record<string, TranslationKey> = {
  Principal: 'primaryGroup',
  Stock: 'stock',
  Activité: 'activityGroup',
  Aide: 'help',
};

const navItems: Array<{
  id: string;
  labelKey: TranslationKey;
  icon: React.ReactNode;
  href: string;
  group: string;
}> = [
  {
    id: 'dashboard',
    labelKey: 'myDashboard',
    icon: <LayoutDashboard size={18} />,
    href: '/terrain/dashboard',
    group: 'Principal',
  },
  {
    id: 'intelligence',
    labelKey: 'myAssistant',
    icon: <AlertTriangle size={18} />,
    href: '/terrain/dashboard/intelligence',
    group: 'Principal',
  },
  {
    id: 'approvisionnement',
    labelKey: 'mySupply',
    icon: <Warehouse size={18} />,
    href: '/terrain/dashboard/approvisionnement',
    group: 'Stock',
  },
  {
    id: 'reception-marchandises',
    labelKey: 'goodsReceipt',
    icon: <PackageCheck size={18} />,
    href: '/terrain/dashboard/reception-marchandises',
    group: 'Stock',
  },
  {
    id: 'ventes',
    labelKey: 'mySales',
    icon: <ShoppingCart size={18} />,
    href: '/terrain/dashboard/ventes',
    group: 'Activité',
  },
  {
    id: 'prospects',
    labelKey: 'myProspects',
    icon: <Users size={18} />,
    href: '/terrain/dashboard/prospects',
    group: 'Activité',
  },
  {
    id: 'clients',
    labelKey: 'myClients',
    icon: <UserCheck size={18} />,
    href: '/terrain/dashboard/clients',
    group: 'Activité',
  },
  {
    id: 'visites',
    labelKey: 'myVisits',
    icon: <MapPin size={18} />,
    href: '/terrain/dashboard/visites',
    group: 'Activité',
  },
  {
    id: 'relances',
    labelKey: 'myFollowUps',
    icon: <AlertTriangle size={18} />,
    href: '/terrain/dashboard/relances',
    group: 'Activité',
  },
  {
    id: 'commission',
    labelKey: 'myCommission',
    icon: <Wallet size={18} />,
    href: '/terrain/dashboard/commission',
    group: 'Activité',
  },
  {
    id: 'personnalisation',
    labelKey: 'customizeScreen',
    icon: <Palette size={18} />,
    href: '/terrain/dashboard/personnalisation',
    group: 'Aide',
  },
  {
    id: 'guide',
    labelKey: 'userGuide',
    icon: <HelpCircle size={18} />,
    href: '/guide-onboarding',
    group: 'Aide',
  },
];
export default function TerrainDashboardLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const groups = Array.from(new Set(navItems.map((i) => i.group)));
  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/terrain/login');
  }
  return (
    <>
      <IntelligencePresenceTracker />
      <div className="flex h-screen bg-[#F7F4EB] overflow-hidden">
        <aside
          className={`hidden md:flex h-screen flex-col bg-[#FFFEFA] border-r border-[#E5E0D3] transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-56'}`}
        >
          <div
            className={`h-16 flex items-center border-b border-[#E5E0D3] px-4 flex-shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}
          >
            {!collapsed && (
              <div className="flex items-center gap-2">
                <AppLogo size={26} />
                <span className="font-bold text-sm text-[#20332F]">
                  JDV <span className="text-[#147866]">Terrain</span>
                </span>
              </div>
            )}
            {collapsed && <AppLogo size={26} />}{' '}
            {!collapsed && (
              <button
                onClick={() => setCollapsed(true)}
                className="p-1.5 rounded-lg text-[#87938C] hover:text-[#20332F] hover:bg-[#F1EFE6] transition-all"
              >
                <ChevronLeft size={16} />
              </button>
            )}
          </div>
          <nav className="flex-1 overflow-y-auto py-3 px-2">
            {groups.map((group) => (
              <div key={group} className="mb-4">
                {!collapsed && (
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#87938C] px-3 mb-2">
                    {t(GROUP_KEYS[group] ?? 'menu')}
                  </p>
                )}
                {navItems
                  .filter((i) => i.group === group)
                  .map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/terrain/dashboard' && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        title={collapsed ? t(item.labelKey) : undefined}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-all ${isActive ? 'bg-[#E5F2EC] text-[#147866] border border-[#E5E0D3]' : 'text-[#65766F] hover:text-[#20332F] hover:bg-[#F1EFE6]'} ${collapsed ? 'justify-center' : ''}`}
                      >
                        <span className="flex-shrink-0">{item.icon}</span>
                        {!collapsed && <span className="flex-1 truncate">{t(item.labelKey)}</span>}
                      </Link>
                    );
                  })}
              </div>
            ))}
          </nav>
          <div className="border-t border-[#E5E0D3] p-2 flex-shrink-0">
            <div className={`flex ${collapsed ? 'flex-col gap-1 items-center' : 'gap-2'}`}>
              <button
                onClick={() => setProfileOpen(true)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[#65766F] hover:text-[#20332F] hover:bg-[#F1EFE6] transition-all text-sm ${collapsed ? 'justify-center w-full' : 'flex-1'}`}
                title={t('profile')}
              >
                <User size={16} />
                {!collapsed && <span>{t('profile')}</span>}
              </button>
              <button
                onClick={handleLogout}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[#65766F] hover:text-red-400 transition-all text-sm ${collapsed ? 'justify-center w-full' : ''}`}
                title={t('logout')}
              >
                <LogOut size={16} />
                {!collapsed && <span>{t('quit')}</span>}
              </button>
            </div>
            {collapsed && (
              <button
                onClick={() => setCollapsed(false)}
                className="w-full flex justify-center p-2 mt-1 text-[#87938C] hover:text-[#20332F] hover:bg-[#F1EFE6] rounded-xl transition-all"
              >
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </aside>
        <div className="flex-1 flex flex-col overflow-hidden">
          <ConcepteurBranchBar />
          <div className="h-16 flex items-center justify-between px-4 md:px-6 pt-[env(safe-area-inset-top)] border-b border-[#E5E0D3] bg-[#FFFEFA]/80 backdrop-blur-sm flex-shrink-0">
            <h1 className="text-base font-semibold text-[#20332F]">{t('terrainPortal')}</h1>
            <div className="flex items-center gap-3">
              <NotificationBell />
            </div>
          </div>
          <main className="flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>
        </div>
        <MobileTabBar
          rootHref="/terrain/dashboard"
          items={navItems.map((i) => ({ href: i.href, label: t(i.labelKey), icon: i.icon }))}
        />
        <Modal open={profileOpen} onClose={() => setProfileOpen(false)} title="" size="sm">
          <UserProfilePanel onClose={() => setProfileOpen(false)} />
        </Modal>
      </div>
    </>
  );
}
