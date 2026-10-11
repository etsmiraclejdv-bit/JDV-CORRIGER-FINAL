import CompanyVitrine from '@/components/CompanyVitrine';

type VitrinePageProps = {
  params: Promise<{ organizationId: string }>;
};

export default async function VitrinePage({ params }: VitrinePageProps) {
  const { organizationId } = await params;
  return <CompanyVitrine organizationId={organizationId} />;
}
