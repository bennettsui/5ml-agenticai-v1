import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QR & Barcode Generator',
  description: 'Generate QR codes and barcodes (EAN, UPC, Code128) with logo embedding, batch export, and brand colour customisation.',
};

export default function QRGeneratorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {children}
    </div>
  );
}
