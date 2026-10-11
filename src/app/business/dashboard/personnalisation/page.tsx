'use client';
import { useCallback, useEffect, useState } from 'react';
import { Palette, Save, Send, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { fetchOrgProfile } from '@/lib/auth/context';
import { DEFAULT_DESIGN_CONFIG } from '@/features/design-studio/defaults';
import { createDesignVersion, listDesignVersions } from '@/features/design-studio/designService';
import type { DesignConfig, DesignVersion } from '@/features/design-studio/types';

export default function OrganizationDesignPage() {
  const [orgId, setOrgId] = useState('');
  const [config, setConfig] = useState<DesignConfig>(DEFAULT_DESIGN_CONFIG);
  const [versions, setVersions] = useState<DesignVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async (id: string) => {
    const result = await listDesignVersions('organization', id);
    if (result.error) { toast.error('Chargement des versions impossible. Vérifiez que la migration du studio a été appliquée.'); return; }
    setVersions(result.data);
    const published = result.data.find(v => v.status === 'published');
    if (published) setConfig({ ...DEFAULT_DESIGN_CONFIG, ...published.config });
  }, []);

  useEffect(() => {
    let live = true;
    fetchOrgProfile().then(async ({ data }) => {
      if (!live) return;
      const id = String((data as Record<string, unknown> | null)?.organization_id ?? '');
      if (!id) { toast.error('Aucune entreprise associée à ce compte.'); setLoading(false); return; }
      setOrgId(id); await reload(id); setLoading(false);
    }).catch(() => { if (live) { toast.error('Impossible de charger l’entreprise.'); setLoading(false); } });
    return () => { live = false; };
  }, [reload]);

  async function save(status: 'draft' | 'published') {
    if (!orgId) return;
    setSaving(true);
    const result = await createDesignVersion({ scope: 'organization', organizationId: orgId, config, status });
    setSaving(false);
    if (result.error) { toast.error(result.error.message || 'Enregistrement impossible. Vérifiez vos droits et la migration du studio.'); return; }
    toast.success(status === 'published' ? 'Thème de l’entreprise publié.' : 'Brouillon enregistré.');
    await reload(orgId);
  }

  if (loading) return <div className="p-8 text-sm text-[#A0AEC0]">Chargement de la personnalisation…</div>;
  const colors: { key: 'primaryColor'|'secondaryColor'|'accentColor'; label: string }[] = [{key:'primaryColor',label:'Couleur principale'},{key:'secondaryColor',label:'Couleur secondaire'},{key:'accentColor',label:'Couleur d’accentuation'}];

  return <div className="space-y-6 p-5 sm:p-8">
    <header><p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#D4AF37]"><Palette size={15}/> Personnalisation</p><h1 className="text-2xl font-bold text-white">Apparence de l’entreprise</h1><p className="mt-2 max-w-2xl text-sm text-[#A0AEC0]">Ces réglages s’appliquent à votre entreprise uniquement et restent soumis à la charte globale JDV CRM.</p></header>
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="space-y-5 rounded-2xl border border-white/10 bg-[#0F2347] p-5">
        <label className="block space-y-2 text-sm text-white">Nom affiché<input value={config.brandName} onChange={e=>setConfig(v=>({...v,brandName:e.target.value}))} maxLength={60} className="w-full rounded-xl border border-white/10 bg-[#08152F] px-3 py-2.5"/></label>
        <div className="grid gap-3 sm:grid-cols-3">{colors.map(c=><label key={c.key} className="space-y-2"><span className="block text-xs text-[#A0AEC0]">{c.label}</span><input type="color" value={config[c.key]} onChange={e=>setConfig(v=>({...v,[c.key]:e.target.value}))} className="h-10 w-full rounded-lg bg-[#08152F] p-1"/><input value={config[c.key]} onChange={e=>setConfig(v=>({...v,[c.key]:e.target.value}))} className="w-full rounded-lg bg-[#08152F] p-2 text-xs text-white"/></label>)}</div>
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm text-white">Thème<select value={config.mode} onChange={e=>setConfig(v=>({...v,mode:e.target.value as DesignConfig['mode']}))} className="mt-2 w-full rounded-xl bg-[#08152F] p-2.5"><option value="light">Clair</option><option value="dark">Sombre</option><option value="system">Système</option></select></label><label className="text-sm text-white">Densité<select value={config.density} onChange={e=>setConfig(v=>({...v,density:e.target.value as DesignConfig['density']}))} className="mt-2 w-full rounded-xl bg-[#08152F] p-2.5"><option value="comfortable">Confortable</option><option value="compact">Compacte</option></select></label></div>
        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4"><button disabled={saving} onClick={()=>save('draft')} className="flex items-center gap-2 rounded-xl border border-[#D4AF37]/30 px-4 py-2.5 text-sm text-[#F5E17A] disabled:opacity-50"><Save size={15}/> Brouillon</button><button disabled={saving} onClick={()=>save('published')} className="flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#0B1B3D] disabled:opacity-50"><Send size={15}/> Publier</button><button onClick={()=>setConfig(DEFAULT_DESIGN_CONFIG)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-[#A0AEC0]"><RotateCcw size={14}/> Réinitialiser</button></div>
      </section>
      <section className="space-y-3"><h2 className="text-sm font-semibold text-white">Aperçu</h2><div className="space-y-4 border p-5" style={{background:config.mode==='dark'?'#0B1B3D':'#F5F7FB',color:config.mode==='dark'?'#F7F9FC':'#0B1B3D',borderColor:config.primaryColor+'77',borderRadius:config.radius==='small'?8:config.radius==='medium'?16:24}}><div className="rounded-xl p-4 text-white" style={{background:config.secondaryColor}}><p className="font-bold">{config.brandName||'Mon entreprise'}</p><p className="text-xs opacity-70">Aperçu du thème de l’entreprise</p></div><div className="grid grid-cols-2 gap-3">{['Prospects','Clients','Ventes','Activité'].map(label=><div key={label} className="border p-4" style={{borderColor:config.primaryColor+'66',borderRadius:config.radius==='small'?6:config.radius==='medium'?12:18}}><p className="text-xs opacity-70">{label}</p><div className="mt-3 h-2 rounded-full" style={{background:config.primaryColor,width:'70%'}}/></div>)}</div></div><p className="text-xs text-[#718096]">Versions enregistrées : {versions.length}. Les changements visuels seront propagés à l’application après l’étape d’intégration.</p></section>
    </div>
  </div>;
}
