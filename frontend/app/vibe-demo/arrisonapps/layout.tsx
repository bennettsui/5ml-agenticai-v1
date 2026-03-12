import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Arrisonapps — Fine Cigars',
  description: 'A curated selection of the world\'s finest cigars. Premium humidors and accessories for the discerning connoisseur.',
};

export default function ArrisonappsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
