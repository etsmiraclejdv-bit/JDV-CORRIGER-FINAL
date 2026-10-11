'use client';
import { useEffect, useMemo, useState } from 'react';
import { MousePointer2, Type, Palette, Square, RotateCcw } from 'lucide-react';
import type { DesignConfig } from './types';

type ElementStyle = { color?: string; backgroundColor?: string; fontFamily?: string; fontSize?: number; fontWeight?: string; borderColor?: string; borderWidth?: number; borderStyle?: string; borderRadius?: number; shadow?: string; padding?: number };
type ExtendedConfig = DesignConfig & { elementStyles?: Record<string, ElementStyle> };
const targets = [
  { id: 'sidebar', label: 'Menu latéral' }, { id: 'page-title', label: 'Titre de page' },
  { id: 'card', label: 'Cartes / panneaux' }, { id: 'button', label: 'Boutons' },
  { id: 'input', label: 'Champs de formulaire' }, { id: 'badge', label: 'Badges / statuts' },
];
const fonts = [{value:'Inter, Arial, sans-serif',label:'Inter / Sans-serif'},{value:'Arial, sans-serif',label:'Arial'},{value:'Georgia, serif',label:'Georgia / Élégante'},{value:'Trebuchet MS, sans-serif',label:'Trebuchet'},{value:'Courier New, monospace',label:'Monospace'}];
const shadows = [{value:'none',label:'Aucune'},{value:'0 2px 6px rgba(0,0,0,.12)',label:'Discrète'},{value:'0 8px 24px rgba(0,0,0,.18)',label:'Marquée'},{value:'0 12px 36px rgba(0,0,0,.28)',label:'Profonde'}];

export default function VisualDesignEditor({config,onChange}:{config:DesignConfig;onChange:(next:DesignConfig)=>void}) {
 const extended=config as ExtendedConfig;
 const [selected,setSelected]=useState('card');
 const [style,setStyle]=useState<ElementStyle>({});
 const current=useMemo(()=>extended.elementStyles?.[selected]??{},[extended.elementStyles,selected]);
 useEffect(()=>setStyle(current),[current]);
 function update(patch:Partial<ElementStyle>) {
  const nextStyle={...style,...patch}; setStyle(nextStyle);
  onChange({...extended,elementStyles:{...(extended.elementStyles??{}),[selected]:nextStyle}} as ExtendedConfig);
 }
 function resetSelected() {
  const styles={...(extended.elementStyles??{})}; delete styles[selected];
  onChange({...extended,elementStyles:styles} as ExtendedConfig); setStyle({});
 }
 const css=(id:string):React.CSSProperties=>{
  const s=extended.elementStyles?.[id]??{};
  return {color:s.color,backgroundColor:s.backgroundColor,fontFamily:s.fontFamily,fontSize:s.fontSize,fontWeight:s.fontWeight as React.CSSProperties['fontWeight'],borderColor:s.borderColor,borderWidth:s.borderWidth,borderStyle:s.borderStyle as React.CSSProperties['borderStyle'],borderRadius:s.borderRadius,boxShadow:s.shadow,padding:s.padding};
 };
 const chosen=(id:string)=>selected===id?' ring-2 ring-[#D4AF37]':'';
 return <div className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_290px]">
  <section className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0A1730]">
   <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3"><div><p className="text-sm font-semibold text-white">Aperçu interactif</p><p className="text-xs text-slate-400">Clique sur un élément pour le sélectionner.</p></div><span className="flex items-center gap-2 rounded-full bg-[#D4AF37]/10 px-3 py-1.5 text-xs text-[#F5E17A]"><MousePointer2 size={13}/>{targets.find(t=>t.id===selected)?.label}</span></div>
   <div className="grid min-h-[460px] md:grid-cols-[155px_minmax(0,1fr)]">
    <button type="button" onClick={()=>setSelected('sidebar')} className={'border-b border-white/10 p-3 text-left text-xs md:border-b-0 md:border-r'+chosen('sidebar')} style={{backgroundColor:extended.mode==='dark'?'#101F3A':'#E8EDF5',color:extended.mode==='dark'?'#F8FAFC':'#24324A',...css('sidebar')}}>
     <div className="mb-5 flex items-center gap-2 font-bold"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#D4AF37] text-[#0B1B3D]">J</span> JDV CRM</div>
     {['Vue générale','Prospecteurs','Clients','Ventes','Stocks','Paramètres'].map((x,i)=><div key={x} className="mb-1 rounded-lg px-2 py-2" style={i===0?{backgroundColor:extended.primaryColor,color:'#fff'}:{}}>{x}</div>)}
    </button>
    <div className="min-w-0 p-4 sm:p-6" style={{backgroundColor:extended.mode==='dark'?'#0B1426':'#F5F7FB',color:extended.mode==='dark'?'#F8FAFC':'#182235'}}>
     <button type="button" onClick={()=>setSelected('page-title')} className={'mb-4 block w-full rounded-lg border border-transparent p-2 text-left'+chosen('page-title')} style={css('page-title')}><p className="text-xs opacity-60">ESPACE DE TRAVAIL / TABLEAU DE BORD</p><h3 className="mt-1 text-xl font-bold">Bonjour, bienvenue !</h3></button>
     <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-3">{[['Prospects','128'],['Clients actifs','86'],['Ventes du mois','2 450 000']].map(([n,v])=><button type="button" key={n} onClick={()=>setSelected('card')} className={'min-w-0 rounded-xl border border-slate-200 bg-white p-3 text-left text-slate-900 shadow-sm sm:p-4'+chosen('card')} style={css('card')}><span className="block text-xs opacity-70">{n}</span><strong className="mt-2 block break-words text-xl" style={{color:extended.primaryColor}}>{v}</strong><span className="mt-1 block text-xs opacity-60">+12 % ce mois</span></button>)}</div>
     <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 text-slate-900" style={css('card')}><p className="mb-3 font-semibold">Créer un prospect</p><button type="button" onClick={()=>setSelected('input')} className={'mb-3 block w-full rounded-lg border border-slate-300 px-3 py-2 text-left text-sm text-slate-500'+chosen('input')} style={css('input')}>Nom du prospect…</button><div className="flex flex-wrap items-center gap-2"><button type="button" onClick={()=>setSelected('button')} className={'rounded-lg px-4 py-2 text-sm font-semibold'+chosen('button')} style={{backgroundColor:extended.primaryColor,color:'#fff',...css('button')}}>Enregistrer</button><button type="button" onClick={()=>setSelected('badge')} className={'rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800'+chosen('badge')} style={css('badge')}>Actif</button></div></div>
     <p className="text-xs opacity-60">Maquette interactive de l’interface CRM.</p>
    </div>
   </div>
  </section>
  <aside className="space-y-4 rounded-2xl border border-white/10 bg-[#0F2347] p-4">
   <div><p className="flex items-center gap-2 text-sm font-semibold text-white"><Square size={15} className="text-[#D4AF37]"/> Propriétés de l’élément</p><p className="mt-1 text-xs text-slate-400">Modifie la couleur, la forme, la police et le contour.</p></div>
   <label className="block space-y-1.5"><span className="text-xs text-slate-300">Élément à modifier</span><select value={selected} onChange={e=>setSelected(e.target.value)} className="w-full rounded-lg border border-white/10 bg-[#08152F] p-2.5 text-sm text-white">{targets.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
   <div className="grid grid-cols-2 gap-3">
    <label className="space-y-1.5"><span className="flex items-center gap-1 text-xs text-slate-300"><Palette size={12}/>Texte</span><input type="color" value={style.color??'#182235'} onChange={e=>update({color:e.target.value})} className="h-10 w-full rounded-lg bg-[#08152F] p-1"/></label>
    <label className="space-y-1.5"><span className="flex items-center gap-1 text-xs text-slate-300"><Palette size={12}/>Fond</span><input type="color" value={style.backgroundColor??'#FFFFFF'} onChange={e=>update({backgroundColor:e.target.value})} className="h-10 w-full rounded-lg bg-[#08152F] p-1"/></label>
    <label className="col-span-2 space-y-1.5"><span className="flex items-center gap-1 text-xs text-slate-300"><Type size={12}/>Police</span><select value={style.fontFamily??'Inter, Arial, sans-serif'} onChange={e=>update({fontFamily:e.target.value})} className="w-full rounded-lg bg-[#08152F] p-2.5 text-sm text-white">{fonts.map(f=><option key={f.value} value={f.value}>{f.label}</option>)}</select></label>
    <label className="space-y-1.5"><span className="text-xs text-slate-300">Taille : {style.fontSize??14}px</span><input type="range" min="10" max="32" value={style.fontSize??14} onChange={e=>update({fontSize:Number(e.target.value)})} className="w-full"/></label>
    <label className="space-y-1.5"><span className="text-xs text-slate-300">Graisse</span><select value={style.fontWeight??'400'} onChange={e=>update({fontWeight:e.target.value})} className="w-full rounded-lg bg-[#08152F] p-2 text-sm text-white"><option value="400">Normale</option><option value="500">Moyenne</option><option value="600">Semi-gras</option><option value="700">Gras</option><option value="800">Très gras</option></select></label>
   </div>
   <div className="border-t border-white/10 pt-3"><p className="mb-3 text-xs font-semibold text-slate-200">Forme et contour</p>
    <label className="mb-3 block space-y-1.5"><span className="text-xs text-slate-300">Couleur du contour</span><input type="color" value={style.borderColor??'#CBD5E1'} onChange={e=>update({borderColor:e.target.value})} className="h-9 w-full rounded-lg bg-[#08152F] p-1"/></label>
    <label className="mb-3 block space-y-1.5"><span className="text-xs text-slate-300">Épaisseur : {style.borderWidth??1}px</span><input type="range" min="0" max="8" value={style.borderWidth??1} onChange={e=>update({borderWidth:Number(e.target.value),borderStyle:Number(e.target.value)===0?'none':(style.borderStyle??'solid')})} className="w-full"/></label>
    <label className="mb-3 block space-y-1.5"><span className="text-xs text-slate-300">Style du contour</span><select value={style.borderStyle??'solid'} onChange={e=>update({borderStyle:e.target.value})} className="w-full rounded-lg bg-[#08152F] p-2 text-sm text-white"><option value="solid">Continu</option><option value="dashed">Tirets</option><option value="dotted">Pointillé</option><option value="double">Double</option><option value="none">Sans contour</option></select></label>
    <label className="mb-3 block space-y-1.5"><span className="text-xs text-slate-300">Arrondi : {style.borderRadius??12}px</span><input type="range" min="0" max="32" value={style.borderRadius??12} onChange={e=>update({borderRadius:Number(e.target.value)})} className="w-full"/></label>
    <label className="mb-3 block space-y-1.5"><span className="text-xs text-slate-300">Espacement intérieur : {style.padding??12}px</span><input type="range" min="0" max="36" value={style.padding??12} onChange={e=>update({padding:Number(e.target.value)})} className="w-full"/></label>
    <label className="block space-y-1.5"><span className="text-xs text-slate-300">Ombre</span><select value={style.shadow??'none'} onChange={e=>update({shadow:e.target.value})} className="w-full rounded-lg bg-[#08152F] p-2 text-sm text-white">{shadows.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
   </div>
   <button type="button" onClick={resetSelected} className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-sm text-slate-300"><RotateCcw size={14}/> Réinitialiser cet élément</button>
   <p className="text-[11px] leading-5 text-slate-500">Les réglages sont conservés dans la configuration JSON lorsque tu enregistres un brouillon ou publies. L’application aux pages réelles nécessite de relier les composants CRM à ces styles.</p>
  </aside>
 </div>;
}
