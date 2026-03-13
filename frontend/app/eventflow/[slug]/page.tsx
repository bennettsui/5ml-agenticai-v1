import EventDetail from './event-detail';

export async function generateStaticParams() {
  return [{ slug: 'placeholder' }];
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <EventDetail slug={slug} />;
}
