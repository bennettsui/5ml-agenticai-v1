import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "5ML Agentic AI Platform",
  description: "Multi-layer AI orchestration platform with specialized agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
