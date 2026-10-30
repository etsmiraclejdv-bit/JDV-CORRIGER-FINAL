import OfflineContent from './OfflineContent';

export const metadata = {
  title: 'JDV CRM — Mode hors ligne',
  description: 'Information lorsque JDV CRM ne peut pas joindre le serveur.',
};

export default function OfflinePage() {
  return <OfflineContent />;
}
