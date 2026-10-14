import Link from 'next/link';
import OfflineRetryButton from '@/components/OfflineRetryButton';

export const metadata = {
  title: 'JDV CRM — Mode hors ligne',
  description: 'Information lorsque JDV CRM ne peut pas joindre le serveur.',
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#08152f] px-5 py-12 text-white">
      <section className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/[.04] p-7 shadow-2xl sm:p-10">
        <div className="mb-5 inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-sm text-amber-200">
          Mode hors ligne
        </div>
        <h1 className="text-2xl font-bold sm:text-3xl">La connexion Internet est indisponible.</h1>
        <p className="mt-4 leading-7 text-slate-300">
          JDV CRM n’a pas pu joindre le serveur. Pour protéger vos données, cette page ne prétend
          pas que vos ventes, rendez-vous ou mouvements de stock ont été enregistrés ou synchronisés.
        </p>
        <ul className="mt-5 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
          <li>Vérifiez votre connexion puis réessayez.</li>
          <li>Les données affichées précédemment peuvent être anciennes.</li>
          <li>
            Ne considérez pas une opération comme validée tant que JDV CRM ne l’a pas confirmée.
          </li>
        </ul>
        <div className="mt-7 flex flex-wrap gap-3">
          <OfflineRetryButton />
          <Link
            href="/"
            className="rounded-xl border border-white/20 px-5 py-3 font-semibold text-white"
          >
            Page d’accueil
          </Link>
        </div>
      </section>
    </main>
  );
}
