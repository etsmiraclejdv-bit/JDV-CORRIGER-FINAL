import LanguageSettingsSection from '@/components/settings/LanguageSettingsSection';

export default function WorkspaceSettingsPage() {
  return (
    <div className="space-y-6 p-6 lg:p-8">
      <header>
        <h1 className="text-2xl font-bold text-white">Paramètres de l’entrepôt</h1>
        <p className="mt-1 text-sm text-slate-400">Préférences de votre espace de travail.</p>
      </header>
      <LanguageSettingsSection />
    </div>
  );
}
