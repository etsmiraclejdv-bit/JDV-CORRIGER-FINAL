import Link from 'next/link';
import { Building2, MapPin, ShieldCheck } from 'lucide-react';
import { checkCurrentSuperAdmin } from '@/lib/auth/super-admin';
import { supabase } from '@/lib/supabase/client';

export default async function ConcepteurGatePage() {
  const auth = await checkCurrentSuperAdmin();

  if (!auth.ok) {
    return (
      <main className="min-h-screen bg-[#07142d] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-red-400/20 bg-white/5 p-8 text-center text-white">
          <h1 className="text-2xl font-semibold mb-3">Accès concepteur refusé</h1>
          <p className="text-slate-300">{auth.message}</p>
        </div>
      </main>
    );
  }

  const { data: workspace, error } = await supabase.rpc('jdvcrm_get_concepteur_workspace_v1');
  if (error || !workspace?.length) {
    return (
      <main className="min-h-screen bg-[#07142d] flex items-center justify-center p-6">
        <div className="max-w-xl w-full rounded-2xl border border-red-400/20 bg-white/5 p-8 text-center text-white">
          <h1 className="text-2xl font-semibold mb-3">Espace concepteur indisponible</h1>
          <p className="text-slate-300">{error?.message ?? 'Aucune branche opérationnelle n’a été retournée par la base.'}</p>
        </div>
      </main>
    );
  }

  const icons = { admin: Building2, prospecteur: MapPin, concepteur: ShieldCheck } as const;
  const descriptions: Record<string,string> = {
    admin: 'Gérer l’entreprise, les entrepôts, le stock, les prospecteurs, les ventes, paiements, commissions et retours.',
    prospecteur: 'Créer prospects et clients, gérer le portefeuille, réapprovisionner depuis l’entrepôt affecté, vendre, encaisser et retourner.',
    concepteur: 'Piloter la plateforme, les entreprises, utilisateurs, abonnements, plans, audit, maintenance et configuration globale.',
  };

  return (
    <main className="min-h-screen bg-[#07142d] text-white p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <p className="text-[#D4AF37] uppercase tracking-[0.25em] text-xs font-semibold">JDV CRM</p>
          <h1 className="mt-3 text-3xl md:text-5xl font-bold">Espace Concepteur</h1>
          <p className="mt-3 text-slate-300 max-w-3xl">
            Les trois branches sont résolues par la base. L’entreprise du concepteur est hors abonnement,
            sans essai ni paywall.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {workspace.map((branch: {branch_code:string; branch_label:string; route:string}) => {
            const Icon = icons[branch.branch_code as keyof typeof icons] ?? ShieldCheck;
            return (
              <Link key={branch.branch_code} href={branch.route}
                className="group rounded-2xl border border-white/10 bg-white/[0.04] p-6 hover:border-[#D4AF37]/50 hover:bg-white/[0.07] transition">
                <Icon className="mb-5 text-[#D4AF37]" size={30} />
                <h2 className="text-xl font-semibold">{branch.branch_label}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">{descriptions[branch.branch_code]}</p>
                <span className="mt-6 inline-block text-sm font-medium text-[#D4AF37]">Ouvrir →</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-5 text-sm text-slate-200">
          <strong className="text-[#D4AF37]">Règle Concepteur :</strong> accès illimité aux trois branches.
          Les contrôles d’abonnement concernent uniquement les entreprises clientes de la plateforme.
        </div>
      </div>
    </main>
  );
}
