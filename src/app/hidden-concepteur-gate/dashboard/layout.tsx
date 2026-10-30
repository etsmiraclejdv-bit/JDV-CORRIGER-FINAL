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
import MobileTabBar from '@/components/MobileTabBar';

const navItems = [
  {
    id: 'overview',
    label: "Vue d'ensemble",
    icon: <LayoutDashboard size={18} />,
    href: '/hidden-concepteur-gate/dashboard',
    group: 'Principal',
  },
  {
    id: 'companies',
    label: 'Entreprises',
    icon: <Building2 size={18} />,
    href: '/hidden-concepteur-gate/dashboard/companies',
    group: 'Gestion',
  },
  {
    id: 'company-applications',
    label: "Demandes d'entreprises",
    icon: <FileCheck size={18} />,
    href: '/hidden-concepteur-gate/dashboard/company-applications',
    group: 'Gestion',
  },
  {
    id: 'stock',
    label: 'Stock plateforme',
    icon: <Package size={18} />,
    href: '/hidden-concepteur-gate/dashboard/stock',
    group: 'Gestion',
  },
  {
    id: 'prospecteurs',
    label: 'Prospecteurs',
    icon: <Users size={18} />,
    href: '/hidden-concepteur-gate/dashboard/prospecteurs',
    group: 'Gestion',
  },
  {
    id: 'payments',
    label: 'Paiements',
    icon: <CreditCard size={18} />,
    href: '/hidden-concepteur-gate/dashboard/payments',
    group: 'Gestion',
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    icon: <Wrench size={18} />,
    href: '/hidden-concepteur-gate/dashboard/maintenance',
    group: 'Système',
  },
  {
    id: 'audit',
    label: "Journal d'audit",
    icon: <ClipboardList size={18} />,
    href: '/hidden-concepteur-gate/dashboard/audit',
    group: 'Système',
  },
  {
    id: 'guide',
    label: "Guide d'utilisation",
    icon: <HelpCircle size={18} />,
    href: '/guide-onboarding',
    group: 'Système',
  },
  {
    id: 'marketing-growth',
    label: 'Croissance marketing',
    icon: <BarChart3 size={18} />,
    href: '/hidden-concepteur-gate/dashboard/croissance-marketing',
    group: 'Gestion',
  },
  {
    id: 'design-studio',
    label: 'Studio de design',
    icon: <Palette size={18} />,
    href: '/hidden-concepteur-gate/dashboard/design-studio',
    group: 'Système',
  },
  {
    id: 'platform-testimonials',
    label: 'Avis plateforme',
    icon: <MessageSquareQuote size={18} />,
    href: '/hidden-concepteur-gate/dashboard/testimonials',
    group: 'Système',
  },
  {
    id: 'settings',
    label: 'Paramètres',
    icon: <Settings size={18} />,
    href: '/hidden-concepteur-gate/dashboard/settings',
    group: 'Système',
  },
];

export default function SuperAdminDashboardLayout({ children }: { children: React.ReactNode }) {
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
          <div className="w-8 h-8 border-2 border-[#34D399] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#CBD5E1]">Vérification des droits d&apos;accès...</p>
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
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#94A3B8] px-3 mb-2">
                  {group}
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
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-all ${isActive ? 'bg-[#0F3B35] text-[#34D399] border border-[#1E355B]' : 'text-[#CBD5E1] hover:text-[#F4F7FC] hover:bg-[#14294B]'} ${collapsed ? 'justify-center' : ''}`}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
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
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[#CBD5E1] hover:text-[#F4F7FC] hover:bg-[#14294B] transition-all text-sm ${collapsed ? 'justify-center w-full' : 'flex-1'}`}
              title="Mon profil"
            >
              <User size={16} />
              {!collapsed && <span>Mon profil</span>}
            </button>
            <button
              onClick={handleLogout}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[#CBD5E1] hover:text-red-400 transition-all text-sm ${collapsed ? 'justify-center w-full' : ''}`}
              title="Déconnexion"
            >
              <LogOut size={16} />
              {!collapsed && <span>Quitter</span>}
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
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#1E355B] bg-[#08152F]/80 backdrop-blur-sm flex-shrink-0">
          <h1 data-jdv-design="page-title" className="text-base font-semibold text-[#F4F7FC]">
            Super Admin — Supervision Plateforme
          </h1>
          <div className="flex items-center gap-3">
            <NotificationBell />
          </div>
        </div>
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>
      </div>

      <MobileTabBar rootHref="/hidden-concepteur-gate/dashboard" items={navItems.map((item) => ({ href: item.href, label: item.label, icon: item.icon }))} />
      <Modal open={profileOpen} onClose={() => setProfileOpen(false)} title="" size="sm">
        <UserProfilePanel onClose={() => setProfileOpen(false)} />
      </Modal>
    </div>
  );
}
