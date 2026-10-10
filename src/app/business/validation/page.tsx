'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import CompanyValidationPanel from '@/components/CompanyValidationPanel';
import { supabase } from '@/lib/supabase/client';

type State = { kind: 'loading' } | { kind: 'none' } | { kind: 'ready'; id: string; name: string };

export default function BusinessValidationPage() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { router.replace('/business/login'); return; }
      const { data } = await supabase.from('organization_applications')
        .select('id,status,company_name').eq('applicant_user_id', auth.user.id)
        .order('created_at', { ascending: false }).limit(1);
      const row = ((data ?? []) as { id: string; status: string; company_name: string }[])[0];
      if (!row) { setState({ kind: 'none' }); return; }
      if (row.status === 'activated') { router.replace('/business/dashboard'); return; }
      setState({ kind: 'ready', id: row.id, name: row.company_name });
    })();
  }, [router]);

  async function logout() { await supabase.auth.signOut(); router.replace('/business/login'); }

  return (
    <main className="min-h-screen bg-[#0B1B3D] px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3"><AppLogo size={36} /><span className="text-xl font-bold">JDV <span className="gold-gradient-text">CRM</span></span></div>
          <button onClick={logout} className="flex items-center gap-2 text-sm text-[#A0AEC0] hover:text-white"><LogOut size={15} /> Quitter</button>
        </div>
        <h1 className="text-2xl font-extrabold">Validation de votre entreprise</h1>
        {state.kind === 'ready' && <p className="mb-6 mt-1 text-sm text-[#A0AEC0]">Dossier : {state.name}</p>}
        {state.kind === 'loading' && <p className="mt-4 text-sm text-[#A0AEC0]">Chargement…</p>}
        {state.kind === 'none' && (
          <div className="mt-6 rounded-2xl border border-[#D4AF37]/20 bg-[#0F2347] p-6 text-sm text-[#A0AEC0]">
            Aucun dossier d’entreprise n’est associé à ce compte. <Link href="/#register" className="text-[#D4AF37] underline">Créer mon dossier</Link>
          </div>
        )}
        {state.kind === 'ready' && <CompanyValidationPanel applicationId={state.id} />}
      </div>
    </main>
  );
}
