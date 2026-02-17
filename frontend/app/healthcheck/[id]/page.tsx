import HealthCheckDetail from './healthcheck-detail';

export async function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <HealthCheckDetail sessionId={id} />;
}
