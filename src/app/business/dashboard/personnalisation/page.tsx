export default function OrganizationDesignPage() {
  return (
    <div className="mx-auto max-w-3xl p-6 sm:p-8">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Espace entreprise</p>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Studio de design réservé au concepteur</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Le Studio de design global de JDV CRM est géré depuis l’espace concepteur de la plateforme.
          Il n’est pas disponible dans le tableau de bord de l’entreprise.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Les réglages de la plateforme, les versions publiées et la charte globale sont centralisés dans la branche Concepteur.
        </p>
      </section>
    </div>
  );
}
