import Image from 'next/image';
import { Eye, Handshake, ShieldCheck, Smartphone } from 'lucide-react';

const values = [
  {
    icon: Smartphone,
    title: 'Simplicité',
    text: 'Des outils clairs, utilisables au bureau comme sur le terrain, sans formation lourde.',
  },
  {
    icon: Eye,
    title: 'Transparence',
    text: 'Chaque vente, chaque paiement et chaque mouvement de stock est traçable.',
  },
  {
    icon: Handshake,
    title: 'Proximité',
    text: 'Pensé pour la réalité des équipes commerciales d’Afrique de l’Ouest.',
  },
  {
    icon: ShieldCheck,
    title: 'Sécurité',
    text: 'Vos données restent séparées de celles des autres entreprises, avec un accès selon le rôle de chacun.',
  },
];

export default function BrandSection() {
  return (
    <section id="marque" className="py-20">
      <div className="mx-auto grid max-w-screen-xl items-center gap-12 px-6 lg:grid-cols-2 lg:px-10">
        <div>
          <p
            className="mb-3 text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--brand-text)' }}
          >
            Notre identité
          </p>
          <h2 className="text-3xl font-extrabold text-foreground lg:text-4xl">
            Votre succès, notre priorité
          </h2>
          <p className="mt-4 text-muted-foreground">
            JDV CRM a été conçu pour les entreprises qui vendent à crédit et travaillent avec des
            prospecteurs sur le terrain. Notre mission : vous donner un seul outil pour prospecter,
            vendre, encaisser et piloter votre activité, avec la rigueur qu’exige la confiance de
            vos clients.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {values.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-4">
                <Icon size={20} style={{ color: 'var(--brand-text)' }} />
                <p className="mt-2 font-semibold text-foreground">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center">
          <div className="overflow-hidden rounded-[2rem] border border-border bg-card p-3 shadow-card">
            <Image
              src="/assets/images/image_a5395bef-1789678648033.jpg"
              alt="Logo JDV CRM — Joie de Vivre"
              width={420}
              height={420}
              sizes="(min-width: 1024px) 420px, 80vw"
              className="h-auto w-full max-w-[420px] rounded-3xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
