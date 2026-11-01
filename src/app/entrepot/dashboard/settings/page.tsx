import LanguageSettingsSection from '@/components/settings/LanguageSettingsSection';

export default function EntrepôtSettingsPage() {
  return (
    <div className="space-y-6 p-5 sm:p-8">
      <header>
        <h1 className="text-2xl font-bold text-white">Paramètres</h1>
        <p className="mt-1 text-sm text-slate-400">Préférences de votre espace entrepôt.</p>
      </header>
      <LanguageSettingsSection />
    </div>
  );
}
