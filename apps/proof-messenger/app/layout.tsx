import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Providers from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Atlas Proof Messenger',
  description: 'Tin nhắn bảo mật với xác minh mật mã - Secure messaging with cryptographic proof verification',
  openGraph: {
    title: 'Atlas Proof Messenger',
    description: 'Tin nhắn bảo mật với xác minh mật mã - Secure messaging with cryptographic proof verification',
    url: 'https://atlas-proof-messenger.vercel.app',
    siteName: 'Atlas Proof Messenger',
    images: [
      {
        url: 'https://atlas-proof-messenger.vercel.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Atlas Proof Messenger - E2EE Messaging',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Atlas Proof Messenger',
    description: 'Tin nhắn bảo mật với xác minh mật mã',
    images: ['https://atlas-proof-messenger.vercel.app/og-image.png'],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' }
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}