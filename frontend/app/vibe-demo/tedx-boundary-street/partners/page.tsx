import { Metadata } from 'next';
import TEDxPartnersClient from './client';

export const metadata: Metadata = {
  title: 'Partner with TEDxBoundaryStreet – Ideas of Crossing',
  description:
    '與 TEDxBoundaryStreet 合作 — 場地、製作、體驗設計、社群。Partner with TEDxBoundaryStreet — venue, production, experience design, community & accessibility support for a non-profit TEDx event in Hong Kong.',
  openGraph: {
    title: 'Partner with TEDxBoundaryStreet – Ideas of Crossing',
    description:
      'We are looking for partners who want to think with us about technology, humanity and the boundaries of the city. A non-profit TEDx event in Hong Kong.',
    type: 'website',
    url: 'https://tedxboundarystreet.com/partners',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Partner with TEDxBoundaryStreet',
    description:
      'Partner with a non-profit TEDx event in Hong Kong exploring Ideas of Crossing.',
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
            '@type': 'WebPage',
            name: 'Partner with TEDxBoundaryStreet',
            description:
              'Partnership opportunities for TEDxBoundaryStreet — Ideas of Crossing.',
            url: 'https://tedxboundarystreet.com/partners',
            isPartOf: {
              '@type': 'WebSite',
              name: 'TEDxBoundaryStreet',
              url: 'https://tedxboundarystreet.com',
            },
            inLanguage: ['zh-HK', 'en'],
          }),
        }}
      />
      <TEDxPartnersClient />
    </>
  );
}
