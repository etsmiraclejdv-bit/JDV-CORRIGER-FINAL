"use client";

import {
  ArrowRight,
  Banknote,
  Building2,
  CheckCircle2,
  CreditCard,
  MapPin,
  Package,
  Users,
} from 'lucide-react';

const steps = [
  { icon: Building2, label: 'Entreprise', text: 'Pilotez votre activité' },
  { icon: MapPin, label: 'Prospection', text: 'Trouvez les bons prospects' },
  { icon: Users, label: 'Conversion', text: 'Transformez en clients' },
  { icon: CreditCard, label: 'Vente à crédit', text: 'Suivez chaque échéance' },
  { icon: Banknote, label: 'Recouvrement', text: 'Sécurisez vos paiements' },
];

export default function Loading() {
  return (
    <main className="jdv-loading" aria-label="Chargement de JDV CRM">
      <div className="jdv-loading__glow jdv-loading__glow--one" />
      <div className="jdv-loading__glow jdv-loading__glow--two" />
      <div className="jdv-loading__grid" />
      <section className="jdv-loading__content">
        <div className="jdv-loading__brand">
          <div className="jdv-loading__logo-wrap">
            <div className="jdv-loading__orbit jdv-loading__orbit--outer" />
            <div className="jdv-loading__orbit jdv-loading__orbit--inner" />
            <div className="jdv-loading__logo-card">
              <img src="/assets/images/app_logo.png" alt="JDV CRM" className="jdv-loading__logo" />
            </div>
          </div>
          <div className="jdv-loading__name">JDV <span>CRM</span></div>
          <p>Gestion • Prospection • Vente à crédit • Recouvrement</p>
        </div>

        <div className="jdv-loading__headline">
          <span>Une entreprise mieux gérée.</span>
          <strong>Des prospects mieux convertis.</strong>
          <span>Des ventes mieux suivies.</span>
        </div>

        <div className="jdv-loading__flow" aria-hidden="true">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div className="jdv-loading__flow-item" key={step.label} style={{ animationDelay: index * 180 + 'ms' }}>
                <div className="jdv-loading__flow-card">
                  <Icon size={22} strokeWidth={1.8} />
                  <div>
                    <b>{step.label}</b>
                    <small>{step.text}</small>
                  </div>
                  {index < steps.length - 1 && <ArrowRight className="jdv-loading__arrow" size={17} />}
                </div>
              </div>
            );
          })}
        </div>

        <div className="jdv-loading__visual">
          <div className="jdv-loading__warehouse"><Package size={24} /><span>Stock maîtrisé</span></div>
          <div className="jdv-loading__path"><i /><i /><i /><i /><i /></div>
          <div className="jdv-loading__sale"><CreditCard size={26} /><span>Vente à crédit</span><em><CheckCircle2 size={15} /> suivie</em></div>
          <div className="jdv-loading__path jdv-loading__path--reverse"><i /><i /><i /><i /></div>
          <div className="jdv-loading__money"><Banknote size={24} /><span>Paiements sécurisés</span></div>
        </div>

        <div className="jdv-loading__progress">
          <div className="jdv-loading__progress-track"><span /></div>
          <div className="jdv-loading__status"><span>JDV CRM prépare votre espace</span><span>Chargement…</span></div>
        </div>
      </section>
      <p className="jdv-loading__footer">Votre activité. Votre contrôle. Votre croissance.</p>
    </main>
  );
}
