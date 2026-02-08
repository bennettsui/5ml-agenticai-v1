import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/toaster";
import { Chatbot } from "@/components/chatbot/Chatbot";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CRM + Knowledge Base",
  description: "Client Relationship Management and Knowledge Base System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <AppShell>{children}</AppShell>
          <Chatbot />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
