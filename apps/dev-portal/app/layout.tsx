import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Atlas Dev Portal - Prism v14.2',
  description: 'Developer quickstart and docs for Atlas Prism hard-reset.',
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  icons: {
    shortcut: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
