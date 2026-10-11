import { BarChart3, Boxes, CreditCard, HandCoins, MapPin, Users } from 'lucide-react';

const services = [
  {
    icon: Users,
    title: 'Gestion commerciale',
    text: 'Prospects, clients, ventes et historique de chaque relation dans un seul dossier.',
  },
  {
    icon: CreditCard,
    title: 'Vente à crédit',
    text: 'Échéanciers, paiements journaliers et suivi de chaque échéance jusqu’au dernier paiement.',
  },
  {
    icon: MapPin,
    title: 'Prospection terrain',
    text: 'Vos prospecteurs enregistrent leurs visites et leurs prospects depuis leur téléphone.',
  },
  {
    icon: Boxes,
    title: 'Stock et agences',
    text: 'Entrepôts, sous-entrepôts, chefs d’agence, approvisionnements, clôtures et journal de stock.',
  },
  {
    icon: HandCoins,
    title: 'Recouvrement',
    text: 'Relances, impayés, retours de marchandise et commissions des prospecteurs.',
  },
  {
    icon: BarChart3,
    title: 'Pilotage et assistant IA',
    text: 'Rapports, alertes et un assistant qui répond à vos questions sur le logiciel et vos données.',
  },
];

export default function ServicesSection() {
  return (
    <section id="services" className="py-20">
      <div className="mx-auto max-w-screen-xl px-6 lg:px-10">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p
            className="mb-3 text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--brand-text)' }}
          >
            Nos services
          </p>
          <h2 className="text-3xl font-extrabold text-foreground lg:text-4xl">
            Tout ce qu’il faut pour vendre, encaisser et piloter
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: 'color-mix(in srgb, var(--brand) 14%, transparent)' }}
              >
                <Icon size={22} style={{ color: 'var(--brand-text)' }} />
              </span>
              <h3 className="mt-4 text-lg font-bold text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
