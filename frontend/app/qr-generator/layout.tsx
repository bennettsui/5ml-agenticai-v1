import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QR Code & Barcode Generator — Hi-Res, Logo, 3D Print + NFC',
  description:
    'Generate professional QR codes and barcodes up to 2000×2000px. Add your logo, export SVG, batch-process, and order a 3D-printed version with an embedded NFC chip.',
  keywords: [
    'QR code generator', 'barcode generator', 'hi-res QR code', 'logo QR code',
    'SVG QR export', 'batch barcode', 'NFC QR code', '3D printed QR', 'EAN barcode', 'UPC barcode',
  ],
  openGraph: {
    title: 'QR Code & Barcode Generator — Hi-Res, Logo, 3D Print + NFC',
    description: 'Professional QR & barcode generator with logo overlay, 2000px output, SVG export, and physical 3D + NFC ordering.',
    type: 'website',
  },
};

export default function QRGeneratorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {children}
    </div>
  );
}
