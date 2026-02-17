import DebugSessionDetail from './debug-session-detail';

export async function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DebugSessionDetail sessionId={id} />;
}
