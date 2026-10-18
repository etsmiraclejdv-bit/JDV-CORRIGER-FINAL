'use client';

import { useMemo, useState, type FormEvent } from 'react';
import {
  Activity,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Compass,
  Eye,
  FileText,
  Megaphone,
  MousePointerClick,
  Plus,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import {
  generateMarketingRecommendations,
  type MarketingMetrics,
  type MarketingRecommendation,
} from '@/lib/marketing/recommendationEngine';

type Channel = 'organic' | 'paid';
type Objective = 'visibilite' | 'leads' | 'conversion' | 'fidelisation';

const EMPTY_METRICS: MarketingMetrics = {
  storefrontConversionRatePct: null,
  profileCompletenessPct: null,
  qualifiedVisits: null,
  repeatCustomerRatePct: null,
  recentReviews: null,
};

const OBJECTIVES: { value: Objective; label: string }[] = [
  { value: 'visibilite', label: 'Développer la visibilité' },
  { value: 'leads', label: 'Obtenir des prospects' },
  { value: 'conversion', label: 'Augmenter les conversions' },
  { value: 'fidelisation', label: 'Fidéliser les clients' },
];

const PRIORITY_LABEL: Record<MarketingRecommendation['priority'], string> = {
  high: 'Priorité élevée',
  medium: 'À traiter ensuite',
  low: 'Amélioration continue',
};

function MetricCard({
  label,
  icon: Icon,
  description,
}: {
  label: string;
  icon: typeof Eye;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#0F2347] p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#F5D76E]">
          <Icon size={19} />
        </span>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#A0AEC0]">
          À connecter
        </span>
      </div>
      <p className="mt-5 text-sm font-medium text-white">{label}</p>
      <p className="mt-1 text-xs leading-5 text-[#8FA2C1]">{description}</p>
      <p className="mt-4 text-lg font-semibold text-[#A0AEC0]">—</p>
    </article>
  );
}

function RecommendationCard({ item, index }: { item: MarketingRecommendation; index: number }) {
  const priorityClass =
    item.priority === 'high'
      ? 'border-amber-300/25 bg-amber-300/10 text-amber-200'
      : item.priority === 'medium'
        ? 'border-sky-300/20 bg-sky-300/10 text-sky-200'
        : 'border-white/10 bg-white/5 text-[#A0AEC0]';

  return (
    <article className="rounded-2xl border border-white/10 bg-[#0F2347] p-5 transition hover:border-[#D4AF37]/30">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs font-semibold text-[#D4AF37]">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#D4AF37]/10">{index + 1}</span>
          Recommandation guidée
        </span>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${priorityClass}`}>
          {PRIORITY_LABEL[item.priority]}
        </span>
      </div>
      <h3 className="mt-4 text-base font-semibold text-white">{item.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#A0AEC0]">{item.reason}</p>
      <div className="mt-4 rounded-xl border border-white/5 bg-[#08152F] p-4">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#D4AF37]">
          <Sparkles size={14} /> Action proposée
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-200">{item.action}</p>
        <div className="mt-3 border-t border-white/10 pt-3">
          <p className="text-[11px] uppercase tracking-wide text-[#7186A8]">Indicateur de réussite</p>
          <p className="mt-1 text-xs leading-5 text-[#C5D0E2]">{item.successMetric}</p>
        </div>
      </div>
    </article>
  );
}

export default function MarketingGrowthPage() {
  const [channel, setChannel] = useState<Channel>('organic');
  const [organicTasksDone, setOrganicTasksDone] = useState<string[]>([]);
  const organicTasks = [
    { id: 'profile', title: 'Compléter la vitrine de l’entreprise', detail: 'Vérifier nom, coordonnées, horaires, services et zone desservie.' },
    { id: 'photos', title: 'Ajouter des photos et le logo', detail: 'Utiliser des visuels réels, nets et représentatifs de l’activité.' },
    { id: 'keywords', title: 'Améliorer le référencement local', detail: 'Décrire clairement les services et les mots que les clients utilisent.' },
    { id: 'content', title: 'Préparer une publication utile', detail: 'Rédiger un conseil, une nouveauté ou une présentation de produit.' },
    { id: 'reviews', title: 'Demander un avis client authentique', detail: 'Inviter un vrai client à donner librement son avis.' },
    { id: 'referrals', title: 'Préparer une action de parrainage', detail: 'Définir le message de recommandation et demander le consentement.' },
  ];
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [objective, setObjective] = useState<Objective>('leads');
  const [budget, setBudget] = useState('0');
  const [duration, setDuration] = useState('14');
  const [campaignDraft, setCampaignDraft] = useState<{
    name: string;
    objective: Objective;
    channel: Channel;
    budget: number;
    duration: number;
  } | null>(null);
  const recommendations = useMemo(
    () => generateMarketingRecommendations(EMPTY_METRICS),
    [],
  );

  function createLocalDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedBudget = Number(budget);
    const parsedDuration = Number(duration);
    if (!campaignName.trim() || !Number.isFinite(parsedBudget) || parsedBudget < 0 ||
      !Number.isInteger(parsedDuration) || parsedDuration < 1 || parsedDuration > 365) return;
    setCampaignDraft({
      name: campaignName.trim(),
      objective,
      channel,
      budget: parsedBudget,
      duration: parsedDuration,
    });
    setShowCampaignForm(false);
    setCampaignName('');
  }

  return (
    <div className="min-h-full space-y-7 p-4 sm:p-6 lg:p-8">
      <header className="relative overflow-hidden rounded-3xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#102851] via-[#0D2041] to-[#08152F] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-[#D4AF37]/10" />
        <div className="pointer-events-none absolute -right-2 -top-10 h-44 w-44 rounded-full border border-[#D4AF37]/15" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#D4AF37]">
              <Sparkles size={15} /> Intelligence marketing · Concepteur
            </p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Centre de croissance
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#B6C5DC]">
              Préparez la croissance des entreprises clientes : visibilité, acquisition de prospects,
              conversion et fidélisation. Les données de performance apparaîtront après raccordement
              sécurisé des sources existantes.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-100">
                <ShieldCheck size={14} /> Séparation des données préservée
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#C5D0E2]">
                <Activity size={14} /> Mode préparation
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowCampaignForm(true)}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-[#07142D] shadow-lg shadow-black/10 transition hover:bg-[#F0D675]"
          >
            <Plus size={17} /> Préparer une campagne
          </button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Visites qualifiées" icon={Eye} description="Visites de vitrines attribuées à une source mesurée." />
        <MetricCard label="Prospects générés" icon={Users} description="Demandes de contact et prospects réellement enregistrés." />
        <MetricCard label="Taux de conversion" icon={MousePointerClick} description="Conversions confirmées rapportées aux visites mesurées." />
        <MetricCard label="Coût par résultat" icon={Wallet} description="Calcul disponible après connexion des dépenses publicitaires réelles." />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
        <div className="space-y-5 rounded-2xl border border-white/10 bg-[#0B1B3D] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Plan d’acquisition</h2>
              <p className="mt-1 text-sm text-[#8FA2C1]">Choisissez le levier à préparer pour les entreprises clientes.</p>
            </div>
            <div className="flex rounded-xl border border-white/10 bg-[#08152F] p-1">
              <button
                onClick={() => setChannel('organic')}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${channel === 'organic' ? 'bg-[#D4AF37] text-[#07142D]' : 'text-[#A0AEC0] hover:text-white'}`}
              >
                Organique
              </button>
              <button
                onClick={() => setChannel('paid')}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${channel === 'paid' ? 'bg-[#D4AF37] text-[#07142D]' : 'text-[#A0AEC0] hover:text-white'}`}
              >
                Publicité payante
              </button>
            </div>
          </div>
          {channel === 'organic' ? (
            <div className="grid gap-3 md:grid-cols-2">
              {[
                { icon: Compass, title: 'Vitrine & référencement', desc: 'Compléter les informations et faciliter la découverte locale.' },
                { icon: Users, title: 'Parrainage', desc: 'Préparer des liens de recommandation traçables, avec consentement.' },
                { icon: BadgeCheck, title: 'Réputation client', desc: 'Encourager des avis authentiques et suivre leur traitement.' },
                { icon: FileText, title: 'Contenu utile', desc: 'Planifier des publications adaptées à l’activité et à la clientèle.' },
              ].map(({ icon: Icon, title, desc }) => (
                <article key={title} className="flex gap-3 rounded-xl border border-white/10 bg-[#0F2347] p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]"><Icon size={18} /></span>
                  <div><h3 className="text-sm font-semibold text-white">{title}</h3><p className="mt-1 text-xs leading-5 text-[#8FA2C1]">{desc}</p></div>
                </article>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-3 rounded-xl border border-amber-200/20 bg-amber-200/5 p-4">
                <Wallet size={19} className="mt-0.5 shrink-0 text-amber-200" />
                <div><h3 className="text-sm font-semibold text-amber-100">Préparation sans dépense</h3><p className="mt-1 text-xs leading-5 text-[#B6C5DC]">Aucun compte publicitaire n’est connecté. Le budget ci-dessous sert uniquement à préparer un brouillon ; aucune annonce ne sera publiée ni facturée.</p></div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-[#0F2347] p-4"><p className="text-xs text-[#8FA2C1]">Canaux possibles après intégration</p><p className="mt-2 text-sm font-semibold text-white">Meta · Google · TikTok</p><p className="mt-1 text-xs text-[#7186A8]">Connexion officielle et autorisations requises</p></div>
                <div className="rounded-xl border border-white/10 bg-[#0F2347] p-4"><p className="text-xs text-[#8FA2C1]">Avant lancement</p><p className="mt-2 text-sm font-semibold text-white">Audience · Budget · Validation</p><p className="mt-1 text-xs text-[#7186A8]">Validation humaine obligatoire</p></div>
              </div>
            </div>
          )}
          {channel === 'organic' && (
            <section aria-labelledby="organic-checklist-title" className="rounded-xl border border-[#D4AF37]/20 bg-[#08152F] p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 id="organic-checklist-title" className="text-sm font-semibold text-white">Plan d’action organique</h3>
                  <p className="mt-1 text-xs leading-5 text-[#8FA2C1]">Cochez les étapes réalisées pour suivre votre préparation. Cette liste reste dans cette session et n’est pas encore enregistrée dans la base JDV CRM.</p>
                </div>
                <span className="rounded-full border border-[#D4AF37]/20 px-3 py-1 text-xs font-semibold text-[#F5D76E]">{organicTasksDone.length}/{organicTasks.length} étapes</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[#D4AF37] transition-all" style={{ width: `${(organicTasksDone.length / organicTasks.length) * 100}%` }} />
              </div>
              <div className="mt-4 space-y-2">
                {organicTasks.map((task) => {
                  const done = organicTasksDone.includes(task.id);
                  return (
                    <label key={task.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${done ? 'border-emerald-300/20 bg-emerald-300/5' : 'border-white/5 bg-[#0F2347]/60 hover:border-white/15'}`}>
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={(event) => setOrganicTasksDone((current) => event.target.checked ? [...current, task.id] : current.filter((id) => id !== task.id))}
                        className="mt-1 h-4 w-4 rounded border-white/20 bg-[#08152F] accent-[#D4AF37]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm font-medium ${done ? 'text-emerald-100 line-through' : 'text-white'}`}>{task.title}</span>
                        <span className="mt-1 block text-xs leading-5 text-[#8FA2C1]">{task.detail}</span>
                      </span>
                      {done && <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-300" />}
                    </label>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-[#7186A8]">Les coches suivent votre progression, elles ne publient rien automatiquement.</p>
                <button type="button" onClick={() => setOrganicTasksDone([])} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-[#C5D0E2] hover:bg-white/5">Réinitialiser la liste</button>
              </div>
            </section>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <p className="flex items-center gap-2 text-xs text-[#7186A8]"><CircleHelp size={14} /> Les connexions aux plateformes seront ajoutées après audit des autorisations.</p>
            <button onClick={() => setShowCampaignForm(true)} className="inline-flex items-center gap-2 text-sm font-semibold text-[#F5D76E] hover:text-white">Préparer un brouillon <ChevronRight size={15} /></button>
          </div>
        </div>

        <aside className="space-y-4 rounded-2xl border border-white/10 bg-[#0B1B3D] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]"><Target size={19} /></span>
            <div><h2 className="text-base font-semibold text-white">Objectifs marketing</h2><p className="text-xs text-[#8FA2C1]">À définir pour chaque campagne</p></div>
          </div>
          <div className="space-y-3">
            {[
              ['01', 'Faire connaître', 'Atteindre les bons publics'],
              ['02', 'Générer des contacts', 'Transformer l’intérêt en prospects'],
              ['03', 'Convertir', 'Mesurer les actions utiles'],
              ['04', 'Fidéliser', 'Encourager le retour des clients'],
            ].map(([n, title, desc]) => (
              <div key={n} className="flex gap-3 rounded-xl border border-white/5 bg-[#0F2347]/70 p-3">
                <span className="text-xs font-bold text-[#D4AF37]">{n}</span><div><p className="text-sm font-medium text-white">{title}</p><p className="mt-0.5 text-xs text-[#8FA2C1]">{desc}</p></div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/5 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-100"><CheckCircle2 size={14} /> Approche responsable</div>
            <p className="mt-2 text-xs leading-5 text-[#A8C8C0]">Pas de faux chiffres, de profils inventés, d’avis fabriqués ni de dépense automatique.</p>
          </div>
        </aside>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#D4AF37]"><Sparkles size={14} /> Moteur explicable</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Recommandations prioritaires</h2>
            <p className="mt-1 max-w-2xl text-sm text-[#8FA2C1]">Les suggestions ci-dessous indiquent les mesures à raccorder avant de pouvoir analyser les résultats. Elles ne représentent pas des performances observées.</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#A0AEC0]">Données réelles non raccordées</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {recommendations.map((item, index) => <RecommendationCard key={item.id} item={item} index={index} />)}
        </div>
      </section>

      {campaignDraft && (
        <section className="rounded-2xl border border-emerald-300/20 bg-emerald-300/5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-300/10 text-emerald-200"><CheckCircle2 size={19} /></span>
              <div><p className="text-sm font-semibold text-white">Brouillon préparé dans cette session</p><p className="mt-1 text-xs text-[#A0AEC0]">Il n’est pas enregistré en base, pas publié et ne dépense aucun budget.</p></div>
            </div>
            <button onClick={() => setCampaignDraft(null)} aria-label="Fermer le brouillon" className="rounded-lg p-2 text-[#A0AEC0] hover:bg-white/5 hover:text-white"><X size={16} /></button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div><p className="text-xs text-[#7186A8]">Nom</p><p className="mt-1 text-sm font-medium text-white">{campaignDraft.name}</p></div>
            <div><p className="text-xs text-[#7186A8]">Canal</p><p className="mt-1 text-sm font-medium text-white">{campaignDraft.channel === 'organic' ? 'Organique' : 'Payant'}</p></div>
            <div><p className="text-xs text-[#7186A8]">Objectif</p><p className="mt-1 text-sm font-medium text-white">{OBJECTIVES.find(o => o.value === campaignDraft.objective)?.label}</p></div>
            <div><p className="text-xs text-[#7186A8]">Budget indicatif / durée</p><p className="mt-1 text-sm font-medium text-white">{campaignDraft.budget.toLocaleString('fr-FR')} · {campaignDraft.duration} jours</p></div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-[#0B1B3D] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]"><ShieldCheck size={19} /></span>
          <div>
            <h2 className="text-sm font-semibold text-white">Confidentialité et séparation des entreprises</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-[#8FA2C1]">Cette interface ne lit pas directement les données opérationnelles des entreprises. Avant de raccorder les statistiques, chaque requête devra respecter les droits existants et le périmètre de l’organisation. La vue concepteur devra s’appuyer sur des agrégats autorisés, et non sur les données privées brutes des clients.</p>
          </div>
        </div>
      </section>

      {showCampaignForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCampaignForm(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="campaign-dialog-title" className="my-auto w-full max-w-xl rounded-2xl border border-[#D4AF37]/20 bg-[#0B1B3D] p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#D4AF37]"><Megaphone size={14} /> Planification</p><h2 id="campaign-dialog-title" className="mt-2 text-xl font-bold text-white">Préparer une campagne</h2><p className="mt-1 text-sm text-[#8FA2C1]">Création d’un brouillon local uniquement.</p></div>
              <button onClick={() => setShowCampaignForm(false)} aria-label="Fermer" className="rounded-lg p-2 text-[#A0AEC0] hover:bg-white/5 hover:text-white"><X size={17} /></button>
            </div>
            <form onSubmit={createLocalDraft} className="mt-6 space-y-4">
              <label className="block space-y-2"><span className="text-sm font-medium text-white">Nom de la campagne</span><input required maxLength={100} value={campaignName} onChange={(event) => setCampaignName(event.target.value)} placeholder="Ex. Visibilité de la vitrine" className="w-full rounded-xl border border-white/10 bg-[#08152F] px-3 py-3 text-sm text-white outline-none focus:border-[#D4AF37]/60" /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2"><span className="text-sm font-medium text-white">Canal</span><select value={channel} onChange={(event) => setChannel(event.target.value as Channel)} className="w-full rounded-xl border border-white/10 bg-[#08152F] px-3 py-3 text-sm text-white"><option value="organic">Croissance organique</option><option value="paid">Publicité payante</option></select></label>
                <label className="block space-y-2"><span className="text-sm font-medium text-white">Objectif</span><select value={objective} onChange={(event) => setObjective(event.target.value as Objective)} className="w-full rounded-xl border border-white/10 bg-[#08152F] px-3 py-3 text-sm text-white">{OBJECTIVES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                <label className="block space-y-2"><span className="text-sm font-medium text-white">Budget indicatif (XOF)</span><input type="number" min="0" max="1000000000" step="1" required value={budget} onChange={(event) => setBudget(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#08152F] px-3 py-3 text-sm text-white" /><span className="text-xs text-[#7186A8]">Aucune somme ne sera débitée.</span></label>
                <label className="block space-y-2"><span className="text-sm font-medium text-white">Durée (jours)</span><input type="number" min="1" max="365" step="1" required value={duration} onChange={(event) => setDuration(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#08152F] px-3 py-3 text-sm text-white" /></label>
              </div>
              <div className="flex gap-3 rounded-xl border border-amber-200/15 bg-amber-200/5 p-3"><CalendarDays size={16} className="mt-0.5 shrink-0 text-amber-200" /><p className="text-xs leading-5 text-[#B6C5DC]">La planification et la publication réelles seront activées après intégration des sources, des droits d’accès et d’un mécanisme de validation humaine.</p></div>
              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setShowCampaignForm(false)} className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-[#C5D0E2] hover:bg-white/5">Annuler</button><button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-bold text-[#07142D] hover:bg-[#F0D675]"><Rocket size={16} /> Créer le brouillon</button></div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
