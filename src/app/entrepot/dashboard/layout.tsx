'use client';

import { useEffect, useState, type ElementType } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Users,
  Headphones,
  Truck,
  ScanBarcode,
  Search,
  ClipboardCheck,
  LogOut,
  ArrowLeft,
  Store,
  Lock,
  BookOpen,
  Tag,
} from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import ConcepteurBranchBar from '@/components/ConcepteurBranchBar';
import MobileTabBar from '@/components/MobileTabBar';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TranslationKey } from '@/lib/i18n/messages';
import { supabase } from '@/lib/supabase/client';
import { WarehouseProvider, useWarehouse } from '@/components/entrepot/WarehouseContext';

const NAV: Array<{ href: string; labelKey: TranslationKey; icon: ElementType }> = [
  { href: '/entrepot/dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
  { href: '/entrepot/dashboard/stock', labelKey: 'warehouseStockNav', icon: Package },
  { href: '/entrepot/dashboard/sous-entrepots', labelKey: 'subWarehouses', icon: Store },
  { href: '/entrepot/dashboard/prospecteurs', labelKey: 'prospectorsReturns', icon: Users },
  { href: '/entrepot/dashboard/appels', labelKey: 'callsComplaints', icon: Headphones },
  { href: '/entrepot/dashboard/approvisionnement', labelKey: 'supplyNav', icon: Truck },
  {
    href: '/entrepot/dashboard/expeditions-prospecteurs',
    labelKey: 'prospectorShipments',
    icon: ScanBarcode,
  },
  { href: '/entrepot/dashboard/codes-produits', labelKey: 'productCodes', icon: Tag },
  { href: '/entrepot/dashboard/tracabilite', labelKey: 'traceability', icon: Search },
  { href: '/entrepot/dashboard/fin-de-service', labelKey: 'endOfService', icon: ClipboardCheck },
  { href: '/entrepot/dashboard/cloture-stock', labelKey: 'stockClosing', icon: Lock },
  { href: '/entrepot/dashboard/journal-stock', labelKey: 'stockJournal', icon: BookOpen },
];

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const workspaceRoot = pathname.startsWith('/agence/dashboard') ? '/agence/dashboard' : '/entrepot/dashboard';
  const { warehouses, current, setCurrentId, loading, error } = useWarehouse();
  const { t } = useLanguage();
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace(workspaceRoot === '/agence/dashboard' ? '/agence/login' : '/entrepot/login');
      else setChecked(true);
    });
  }, [router, workspaceRoot]);
  async function logout() {
    await supabase.auth.signOut();
    router.replace(workspaceRoot === '/agence/dashboard' ? '/agence/login' : '/entrepot/login');
  }

  useEffect(() => {
    if (current?.access_role === 'manager' && workspaceRoot === '/entrepot/dashboard') {
      router.replace('/agence/dashboard');
    }
  }, [current, router, workspaceRoot]);

  useEffect(() => {
    if (!current || current.access_role !== 'manager') return;
    const managerRoutes = [
      workspaceRoot,
      `${workspaceRoot}/stock`,
      `${workspaceRoot}/sous-entrepots`,
    ];
    const allowed = managerRoutes.some((route) =>
      route === workspaceRoot
        ? pathname === route
        : pathname === route || pathname.startsWith(`${route}/`)
    );
    if (!allowed) router.replace(workspaceRoot);
  }, [current, pathname, router, workspaceRoot]);
  if (!checked || loading)
    return (
      <div className="flex h-screen items-center justify-center bg-[#0B1B3D] text-slate-300 text-sm">
        Chargement de l&apos;espace {workspaceRoot === '/agence/dashboard' ? 'agence' : 'entrepôt'}…
      </div>
    );
  if (error || !current)
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#0B1B3D] p-6 text-center text-white">
        <p className="max-w-md">
          {error
            ? `Erreur : ${error}`
            : "Aucune agence active n'est rattachée à ce compte. Contactez votre administrateur."}
        </p>
        <button onClick={logout} className="rounded-lg border border-white/10 px-4 py-2 text-sm">
          Se déconnecter
        </button>
      </div>
    );
  const isAdmin = current.access_role === 'admin';
  // Un responsable d'agence ne voit et n'ouvre que le tableau de bord,
  // le stock et les sous-entrepôts. Les opérations avancées restent réservées à l'admin.
  const visibleNav = isAdmin
    ? NAV
    : NAV.filter(({ href }) =>
        ['/entrepot/dashboard', '/entrepot/dashboard/stock', '/entrepot/dashboard/sous-entrepots'].includes(href)
      );
  return (
    <div className="jdv-workspace-shell flex h-screen bg-[#0B1B3D] text-white overflow-hidden">
      <aside className="hidden md:flex w-64 flex-shrink-0 flex-col bg-[#08152f] border-r border-[#34D399]/10">
        <div className="h-16 flex items-center gap-2 px-4 border-b border-[#34D399]/10">
          <AppLogo size={26} />
          <span className="font-bold text-sm">
            JDV <span className="text-[#34D399]">{t(workspaceRoot === '/agence/dashboard' ? 'agencyBrand' : 'warehouse')}</span>
          </span>
        </div>
        <div className="p-3 border-b border-[#34D399]/10">
          {warehouses.length > 1 ? (
            <select
              value={current.warehouse_id}
              onChange={(e) => setCurrentId(e.target.value)}
              className="w-full rounded-lg bg-[#0F2347] border border-white/10 p-2 text-sm"
            >
              {warehouses.map((w) => (
                <option key={w.warehouse_id} value={w.warehouse_id}>
                  {w.name}
                  {w.city ? ` - ${w.city}` : ''}
                </option>
              ))}
            </select>
          ) : (
            <div className="text-sm">
              <div className="font-semibold">{current.name}</div>
              <div className="text-xs text-slate-400">{current.city ?? current.code}</div>
            </div>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {visibleNav.map(({ href, labelKey, icon: Icon }) => {
            const active =
              href === '/entrepot/dashboard' ? pathname === workspaceRoot : pathname.startsWith(href.replace('/entrepot/dashboard', workspaceRoot));
            return (
              <Link
                key={href}
                href={href.replace('/entrepot/dashboard', workspaceRoot)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-all ${active ? 'bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/20' : 'text-[#A0AEC0] hover:text-white hover:bg-[#0F2347]'}`}
              >
                <Icon size={18} />
                {t(labelKey)}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[#34D399]/10 p-2 space-y-1">
          {isAdmin && (
            <Link
              href="/business/dashboard/sous-branches"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-[#A0AEC0] hover:text-white hover:bg-[#0F2347]"
            >
              <ArrowLeft size={16} />
              {t('backToAdmin')}
            </Link>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-[#A0AEC0] hover:text-red-400 hover:bg-[#0F2347]"
          >
            <LogOut size={16} />
            {t('quit')}
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div
          data-jdv-design="topbar"
          className="h-16 flex items-center justify-between gap-3 px-4 md:px-6 pt-[env(safe-area-inset-top)] border-b border-[#34D399]/10 bg-[#08152f]/80 flex-shrink-0"
        >
          <h1 className="min-w-0 truncate text-base font-semibold">
            {current.name}
            {current.city ? (
              <span className="text-slate-400 font-normal"> · {current.city}</span>
            ) : null}
          </h1>
          <span className="hidden sm:inline text-xs text-slate-400">
            {isAdmin ? t('adminAccess') : t('agencyManager')}
          </span>
          <button
            onClick={logout}
            className="md:hidden rounded-lg p-2 text-[#A0AEC0] hover:text-red-400"
            aria-label={t('quit')}
          >
            <LogOut size={18} />
          </button>
        </div>
        {warehouses.length > 1 && (
          <div className="md:hidden border-b border-[#34D399]/10 bg-[#08152f] p-2">
            <select
              value={current.warehouse_id}
              onChange={(e) => setCurrentId(e.target.value)}
              className="w-full rounded-lg bg-[#0F2347] border border-white/10 p-2 text-sm"
            >
              {warehouses.map((w) => (
                <option key={w.warehouse_id} value={w.warehouse_id}>
                  {w.name}
                  {w.city ? ` - ${w.city}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
        <ConcepteurBranchBar />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>
      </div>
      <MobileTabBar
        rootHref={workspaceRoot}
        items={visibleNav.map(({ href, labelKey, icon: Icon }) => ({
          href: href.replace('/entrepot/dashboard', workspaceRoot),
          label: t(labelKey),
          icon: <Icon size={20} />,
        }))}
      />
    </div>
  );
}

export default function EntrepotDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const requiredRole = pathname.startsWith('/agence/dashboard') ? 'manager' : undefined;
  return (
    <WarehouseProvider
      requiredRole={requiredRole}
      allowSuperAdmin={pathname.startsWith('/agence/dashboard')}
    >
      <Shell>{children}</Shell>
    </WarehouseProvider>
  );
}
