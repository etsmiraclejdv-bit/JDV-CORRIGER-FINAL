import Image from 'next/image';
import {
  Building2, Warehouse, Package, UsersRound, MapPin, UserCheck, CreditCard, HandCoins, LineChart,
} from 'lucide-react';

// Les noms de fichiers contiennent des espaces et des accents : encodeURI garantit une adresse valide.
const IMG = {
  presentation: encodeURI('/assets/images/Présentation CRM JDV en entreprise.png'),
  terrain: encodeURI('/assets/images/CRM mobile pour commerciaux terrain.png'),
  equipe: encodeURI('/assets/images/JDV CRM _ Votre succès, notre priorité.png'),
};

type Step = { letter: string; icon: typeof Building2; title: string; text: string };
type Chapter = { tag: string; title: string; intro: string; image: string; alt: string; steps: Step[] };

const chapters: Chapter[] = [
  {
    tag: 'Chapitre 1',
    title: 'Mettre en place votre entreprise',
    intro: 'De la création du dossier à un catalogue prêt à vendre, tout se prépare au même endroit.',
    image: IMG.presentation,
    alt: 'Un conseiller JDV CRM présente le tableau de bord à un chef d’entreprise',
    steps: [
      { letter: 'A', icon: Building2, title: 'Créer votre entreprise', text: 'Un dossier unique, vérifié par JDV IA : identité, documents, validation en quelques minutes.' },
      { letter: 'B', icon: Warehouse, title: 'Organiser vos agences', text: 'Entrepôts pilotés par un chef d’agence, sous-entrepôts et zones de travail.' },
      { letter: 'C', icon: Package, title: 'Garnir catalogue et stock', text: 'Articles, catégories, seuils minimum, approvisionnements et journal de stock.' },
    ],
  },
  {
    tag: 'Chapitre 2',
    title: 'Aller chercher vos clients sur le terrain',
    intro: 'Vos prospecteurs travaillent depuis leur téléphone, avec le bon stock et les bons clients.',
    image: IMG.terrain,
    alt: 'Un prospecteur enregistre un nouveau prospect depuis son téléphone',
    steps: [
      { letter: 'D', icon: UsersRound, title: 'Équiper vos prospecteurs', text: 'Comptes, affectation à une agence, marchandises confiées et suivi des retours.' },
      { letter: 'E', icon: MapPin, title: 'Prospecter', text: 'Visites terrain, prospects enregistrés en quelques gestes, suivi en temps réel.' },
      { letter: 'F', icon: UserCheck, title: 'Convertir en clients', text: 'Fiches clients, portefeuilles privés et historique de chaque relation.' },
    ],
  },
  {
    tag: 'Chapitre 3',
    title: 'Encaisser, recouvrer et piloter',
    intro: 'Chaque vente à crédit est suivie jusqu’au dernier paiement, et vous gardez la vue d’ensemble.',
    image: IMG.equipe,
    alt: 'Une équipe commerciale consulte le tableau de bord JDV CRM',
    steps: [
      { letter: 'G', icon: CreditCard, title: 'Vendre à crédit', text: 'Échéanciers, paiements journaliers et impact immédiat sur le stock.' },
      { letter: 'H', icon: HandCoins, title: 'Encaisser et recouvrer', text: 'Relances, impayés, retours de marchandise et commissions des prospecteurs.' },
      { letter: 'Z', icon: LineChart, title: 'Piloter et grandir', text: 'Rapports, clôtures de stock, traçabilité et alertes pour décider vite.' },
    ],
  },
];

export default function JourneySection() {
  return (
    <section id="parcours" className="py-20">
      <div className="mx-auto max-w-screen-xl px-6 lg:px-10">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--brand-text)' }}>Le projet de A à Z</p>
          <h2 className="text-3xl font-extrabold text-foreground lg:text-4xl">Du premier prospect au dernier paiement</h2>
          <p className="mt-4 text-muted-foreground">JDV CRM accompagne chaque étape de votre activité, sans changer d’outil ni ressaisir une information.</p>
        </div>

        <div className="space-y-16">
          {chapters.map((c, i) => (
            <article key={c.tag} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
              <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
                <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
                  <Image src={c.image} alt={c.alt} width={1698} height={926} sizes="(min-width: 1024px) 560px, 100vw" className="h-auto w-full" />
                </div>
              </div>
              <div className={i % 2 === 1 ? 'lg:order-1' : ''}>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--brand-text)' }}>{c.tag}</p>
                <h3 className="mt-2 text-2xl font-bold text-foreground">{c.title}</h3>
                <p className="mt-2 text-muted-foreground">{c.intro}</p>
                <ol className="mt-6 space-y-4">
                  {c.steps.map((s) => {
                    const Icon = s.icon;
                    return (
                      <li key={s.letter} className="flex gap-4 rounded-2xl border border-border bg-card p-4">
                        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl font-extrabold" style={{ background: 'var(--brand-gradient)', color: 'var(--on-brand)' }}>{s.letter}</span>
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-semibold text-foreground"><Icon size={16} style={{ color: 'var(--brand-text)' }} />{s.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
