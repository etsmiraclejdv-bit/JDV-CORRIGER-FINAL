'use client';
import React, { useState } from 'react';
import AppLogo from '@/components/ui/AppLogo';
import NotificationBell from '@/components/NotificationBell';
import UserProfilePanel from '@/components/UserProfilePanel';
import Modal from '@/components/ui/Modal';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  BookOpen,
  ClipboardList,
  User,
  HelpCircle,
  AlertTriangle,
  Wallet,
  Truck,
  Percent,
  Warehouse,
  Network,
  MapPin,
  Undo2,
  ArrowLeftRight,
  Store,
  FilePlus2,
  Sparkles,
  Globe,
  MessageSquareQuote,
  Menu,
  X,
  Smartphone,
  Monitor,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TranslationKey } from '@/lib/i18n/messages';
import IntelligencePresenceTracker from '@/components/IntelligencePresenceTracker';
import OrganizationAmbience from '@/components/OrganizationAmbience';

const navItems: {
  id: string;
  label: TranslationKey;
  icon: React.ReactNode;
  href: string;
  group: TranslationKey;
}[] = [
  {
    id: 'overview',
    label: 'dashboard',
    icon: <LayoutDashboard size={18} />,
    href: '/business/dashboard',
    group: 'primaryGroup',
  },
  {
    id: 'intelligence',
    label: 'intelligenceJdv',
    icon: <AlertTriangle size={18} />,
    href: '/business/dashboard/intelligence',
    group: 'primaryGroup',
  },
  {
    id: 'prospects',
    label: 'prospects',
    icon: <UserCheck size={18} />,
    href: '/business/dashboard/prospects',
    group: 'crmGroup',
  },
  {
    id: 'clients',
    label: 'clients',
    icon: <Users size={18} />,
    href: '/business/dashboard/clients',
    group: 'crmGroup',
  },
  {
    id: 'ventes',
    label: 'sales',
    icon: <ShoppingCart size={18} />,
    href: '/business/dashboard/ventes',
    group: 'commercialGroup',
  },
  {
    id: 'relances',
    label: 'followUps',
    icon: <AlertTriangle size={18} />,
    href: '/business/dashboard/relances',
    group: 'commercialGroup',
  },
  {
    id: 'retours',
    label: 'merchandiseReturns',
    icon: <Undo2 size={18} />,
    href: '/business/dashboard/retours',
    group: 'commercialGroup',
  },
  {
    id: 'catalogue',
    label: 'productCatalogNav',
    icon: <BookOpen size={18} />,
    href: '/business/dashboard/catalogue',
    group: 'commercialGroup',
  },
  {
    id: 'prospecteurs',
    label: 'prospectorsNav',
    icon: <UserCheck size={18} />,
    href: '/business/dashboard/prospecteurs',
    group: 'teamGroup',
  },
  {
    id: 'visites',
    label: 'fieldVisits',
    icon: <MapPin size={18} />,
    href: '/business/dashboard/visites',
    group: 'teamGroup',
  },
  {
    id: 'suivi-prospecteurs',
    label: 'prospectorTracking',
    icon: <Users size={18} />,
    href: '/business/dashboard/suivi-prospecteurs',
    group: 'teamGroup',
  },
  {
    id: 'fournisseurs',
    label: 'suppliers',
    icon: <Truck size={18} />,
    href: '/business/dashboard/fournisseurs',
    group: 'logisticsGroup',
  },
  {
    id: 'achats',
    label: 'purchases',
    icon: <ClipboardList size={18} />,
    href: '/business/dashboard/achats',
    group: 'logisticsGroup',
  },
  {
    id: 'stock',
    label: 'stock',
    icon: <Package size={18} />,
    href: '/business/dashboard/stock',
    group: 'logisticsGroup',
  },
  {
    id: 'entrepots',
    label: 'warehousesZones',
    icon: <Warehouse size={18} />,
    href: '/business/dashboard/entrepots',
    group: 'logisticsGroup',
  },
  {
    id: 'sous-branches',
    label: 'warehouseBranches',
    icon: <Store size={18} />,
    href: '/business/dashboard/sous-branches',
    group: 'logisticsGroup',
  },
  {
    id: 'mouvements-stock',
    label: 'stockMovements',
    icon: <ArrowLeftRight size={18} />,
    href: '/business/dashboard/mouvements-stock',
    group: 'logisticsGroup',
  },
  {
    id: 'logistique',
    label: 'logisticsControlCenter',
    icon: <Network size={18} />,
    href: '/business/dashboard/logistique',
    group: 'logisticsGroup',
  },
  {
    id: 'finances',
    label: 'financesCommissions',
    icon: <Wallet size={18} />,
    href: '/business/dashboard/finances',
    group: 'analysisGroup',
  },
  {
    id: 'commissions',
    label: 'commissionRules',
    icon: <Percent size={18} />,
    href: '/business/dashboard/commissions',
    group: 'analysisGroup',
  },
  {
    id: 'rapports',
    label: 'reports',
    icon: <FileText size={18} />,
    href: '/business/dashboard/reports',
    group: 'analysisGroup',
  },
  {
    id: 'audit',
    label: 'auditLog',
    icon: <ClipboardList size={18} />,
    href: '/business/dashboard/audit',
    group: 'analysisGroup',
  },
  {
    id: 'guide',
    label: 'userGuide',
    icon: <HelpCircle size={18} />,
    href: '/guide-onboarding',
    group: 'systemGroup',
  },
  {
    id: 'formulaires',
    label: 'formsNav',
    icon: <FilePlus2 size={18} />,
    href: '/business/dashboard/formulaires',
    group: 'systemGroup',
  },
  {
    id: 'ambiance',
    label: 'ambienceBackgrounds',
    icon: <Sparkles size={18} />,
    href: '/business/dashboard/ambiance',
    group: 'systemGroup',
  },
  {
    id: 'veille',
    label: 'googleNews',
    icon: <Globe size={18} />,
    href: '/business/dashboard/veille',
    group: 'primaryGroup',
  },
  {
    id: 'avis-clients',
    label: 'customerReviews',
    icon: <MessageSquareQuote size={18} />,
    href: '/business/dashboard/avis-clients',
    group: 'crmGroup',
  },
  {
    id: 'settings',
    label: 'settings',
    icon: <Settings size={18} />,
    href: '/business/dashboard/settings',
    group: 'systemGroup',
  },
];

export default function BusinessDashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const groups = Array.from(new Set(navItems.map((i) => i.group)));
  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/business/login');
  }
  return (
    <>
      <IntelligencePresenceTracker />
      <div
        className={
          mobilePreview
            ? 'mx-auto my-4 relative w-[min(390px,calc(100vw-1rem))] h-[min(844px,calc(100dvh-2rem))] rounded-[2rem] border-[6px] border-slate-700 shadow-2xl overflow-hidden bg-[#0B1B3D]'
            : 'relative isolate flex h-screen bg-[#0B1B3D] overflow-hidden'
        }
      >
        <div className="relative isolate flex h-full w-full bg-[#0B1B3D] overflow-hidden">
          <OrganizationAmbience />
          <aside
            data-jdv-design="sidebar"
            className={`relative z-10 h-full md:h-screen flex flex-col bg-[#08152f] border-r border-[#D4AF37]/10 transition-all duration-300 flex-shrink-0 ${mobilePreview ? (mobileMenuOpen ? 'absolute inset-y-0 left-0 z-30 flex w-72 shadow-2xl' : 'hidden') : mobileMenuOpen ? 'fixed inset-y-0 left-0 z-30 flex w-72 shadow-2xl md:relative md:inset-auto md:shadow-none md:z-10' : 'hidden md:flex'} ${collapsed ? 'md:w-16' : 'md:w-60'}`}
          >
            <div
              className={`h-16 flex items-center border-b border-[#D4AF37]/10 px-4 flex-shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}
            >
              {!collapsed && (
                <div className="flex items-center gap-2">
                  <AppLogo size={28} />
                  <span className="font-bold text-base text-white">
                    JDV <span className="text-[#D4AF37]">CRM</span>
                  </span>
                </div>
              )}
              {collapsed && <AppLogo size={28} />}
              {!collapsed && (
                <button
                  onClick={() => setCollapsed(true)}
                  className="p-1.5 rounded-lg text-[#718096] hover:text-white hover:bg-[#0F2347] transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
              )}
            </div>
            <nav data-jdv-design="sidebar" className="flex-1 overflow-y-auto py-3 px-2">
              {groups.map((group) => (
                <div key={group} className="mb-4">
                  {!collapsed && (
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#718096] px-3 mb-2">
                      {t(group)}
                    </p>
                  )}
                  {navItems
                    .filter((i) => i.group === group)
                    .map((item) => {
                      const isActive =
                        pathname === item.href ||
                        (item.href !== '/business/dashboard' && pathname.startsWith(item.href));
                      return (
                        <Link
                          data-jdv-design="sidebar"
                          key={item.id}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          title={collapsed ? t(item.label) : undefined}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-all ${isActive ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/20' : 'text-[#A0AEC0] hover:text-white hover:bg-[#0F2347]'} ${collapsed ? 'justify-center' : ''}`}
                        >
                          <span className="flex-shrink-0">{item.icon}</span>
                          {!collapsed && <span className="flex-1 truncate">{t(item.label)}</span>}
                        </Link>
                      );
                    })}
                </div>
              ))}
            </nav>
            <div className="border-t border-[#D4AF37]/10 p-2 flex-shrink-0">
              <div className={`flex ${collapsed ? 'flex-col gap-1 items-center' : 'gap-2'}`}>
                <button
                  onClick={() => setProfileOpen(true)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[#A0AEC0] hover:text-white hover:bg-[#0F2347] transition-all text-sm ${collapsed ? 'justify-center w-full' : 'flex-1'}`}
                  title={t('profile')}
                >
                  <User size={16} />
                  {!collapsed && <span>{t('profile')}</span>}
                </button>
                <button
                  onClick={handleLogout}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[#A0AEC0] hover:text-red-400 transition-all text-sm ${collapsed ? 'justify-center w-full' : ''}`}
                  title={t('logout')}
                >
                  <LogOut size={16} />
                  {!collapsed && <span>{t('quit')}</span>}
                </button>
              </div>
              {collapsed && (
                <button
                  onClick={() => setCollapsed(false)}
                  className="w-full flex justify-center p-2 mt-1 text-[#718096] hover:text-white hover:bg-[#0F2347] rounded-xl transition-all"
                >
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          </aside>
          {mobileMenuOpen && !mobilePreview && (
            <button
              type="button"
              aria-label={t('closeMenu')}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-20 bg-black/60 md:hidden"
            />
          )}
          <div className="relative z-10 flex-1 min-w-0 flex flex-col overflow-hidden">
            <div className="h-16 flex items-center justify-between px-3 sm:px-6 border-b border-[#D4AF37]/10 bg-[#08152f]/80 backdrop-blur-sm flex-shrink-0">
              <div className="flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((open) => !open)}
                  aria-label={mobileMenuOpen ? t('closeMenu') : t('openMenu')}
                  className="inline-flex md:hidden items-center justify-center rounded-lg p-2 text-white hover:bg-[#0F2347]"
                  title={t('mobileMenu')}
                >
                  {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
                <h1
                  data-jdv-design="page-title"
                  className="truncate text-sm sm:text-base font-semibold text-white"
                >
                  {t('companyPortal')}
                </h1>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMobilePreview((value) => !value);
                    setMobileMenuOpen(false);
                  }}
                  aria-pressed={mobilePreview}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4AF37]/30 px-2 py-2 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10"
                  title={mobilePreview ? t('returnDesktop') : t('activateMobilePreview')}
                >
                  {mobilePreview ? <Monitor size={16} /> : <Smartphone size={16} />}
                  <span className="hidden sm:inline">
                    {mobilePreview ? t('desktopMode') : t('mobilePreview')}
                  </span>
                </button>
                <NotificationBell />
              </div>
            </div>
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
          <Modal open={profileOpen} onClose={() => setProfileOpen(false)} title="" size="sm">
            <UserProfilePanel onClose={() => setProfileOpen(false)} />
          </Modal>
        </div>
      </div>
    </>
  );
}
