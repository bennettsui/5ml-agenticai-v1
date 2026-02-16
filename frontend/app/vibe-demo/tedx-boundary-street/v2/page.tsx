import { Metadata } from 'next';
import TEDxMarketingClient from './client';

export const metadata: Metadata = {
  title: 'TEDxBoundaryStreet – Ideas of Crossing',
  description:
    'TEDxBoundaryStreet is a new TEDx event in Hong Kong exploring Ideas of Crossing — what stays, what shifts and what matters in an age of AI and rapid change. 以廣東話為主，連結關心未來的香港人。',
  openGraph: {
    title: 'TEDxBoundaryStreet – Ideas of Crossing',
    description:
      'What stays. What shifts. What matters. A TEDx event in Hong Kong exploring the boundaries between history and progress, technology and humanity.',
    type: 'website',
    url: 'https://tedxboundarystreet.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TEDxBoundaryStreet – Ideas of Crossing',
    description:
      'What stays. What shifts. What matters. A TEDx event in Hong Kong.',
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Event',
            name: 'TEDxBoundaryStreet',
            description:
              'Ideas of Crossing — What stays. What shifts. What matters.',
            url: 'https://tedxboundarystreet.com',
            organizer: {
              '@type': 'Organization',
              name: 'TEDxBoundaryStreet',
              url: 'https://tedxboundarystreet.com',
            },
            eventStatus: 'https://schema.org/EventScheduled',
            eventAttendanceMode:
              'https://schema.org/OfflineEventAttendanceMode',
            inLanguage: ['zh-HK', 'en'],
          }),
        }}
      />
      <TEDxMarketingClient />
    </>
  );
}
