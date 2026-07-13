import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { PwaRegister } from '@/components/pwa-register';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['opsz', 'SOFT'],
});

export const metadata: Metadata = {
  applicationName: 'MONO',
  title: 'MONO — облік доходів студії',
  description: 'Інструмент обліку прибутковості квіткової студії MONO',
  icons: { icon: '/icon.svg' },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'MONO' },
};

export const viewport: Viewport = {
  themeColor: '#b0475f',
  width: 'device-width',
  initialScale: 1,
  // Shrink the layout when the on-screen keyboard opens instead of letting it
  // cover the focused field. (No maximum-scale/user-scalable: never block zoom.)
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk" className={`${inter.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Providers>{children}</Providers>
        <PwaRegister />
      </body>
    </html>
  );
}
