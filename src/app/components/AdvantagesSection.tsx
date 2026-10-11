import { Gauge, Lock, Rocket, Smartphone, Wallet, Workflow } from 'lucide-react';

const advantages = [
  {
    icon: Workflow,
    title: 'Un outil, tout le parcours',
    text: 'De la prospection au recouvrement, sans changer de logiciel ni ressaisir une information.',
  },
  {
    icon: Wallet,
    title: 'Pensé pour votre région',
    text: 'Montants en FCFA, paiements par mobile money et organisation en agences et sous-agences.',
  },
  {
    icon: Smartphone,
    title: 'Le terrain d’abord',
    text: 'Vos prospecteurs travaillent depuis leur téléphone, même en déplacement.',
  },
  {
    icon: Gauge,
    title: 'Une vue claire en temps réel',
    text: 'Stock, ventes, impayés et activité de l’équipe sur un seul tableau de bord.',
  },
  {
    icon: Lock,
    title: 'Vos données protégées',
    text: 'Chaque entreprise a son espace isolé, et chaque utilisateur n’accède qu’à ce que son rôle permet.',
  },
  {
    icon: Rocket,
    title: 'Démarrage rapide',
    text: 'Un essai gratuit de 14 jours pour découvrir l’outil avec votre propre activité.',
  },
];

export default function AdvantagesSection() {
  return (
    <section id="avantages" className="py-20">
      <div className="mx-auto max-w-screen-xl px-6 lg:px-10">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p
            className="mb-3 text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--brand-text)' }}
          >
            Pourquoi JDV CRM
          </p>
          <h2 className="text-3xl font-extrabold text-foreground lg:text-4xl">
            Les avantages qui font la différence
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {advantages.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
              <span
                className="flex h-10 w-10 flex-none items-center justify-center rounded-xl"
                style={{ background: 'var(--brand-gradient)', color: 'var(--on-brand)' }}
              >
                <Icon size={19} />
              </span>
              <div>
                <p className="font-semibold text-foreground">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
