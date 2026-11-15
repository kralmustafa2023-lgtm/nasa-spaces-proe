import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mission 180 | NASA Space Apps 2026',
  description: 'Uzay görevi sağlık takip simülasyonu — P1 altyapısı.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" style={{ backgroundColor: '#030a14', colorScheme: 'dark' }}>
      <body style={{ backgroundColor: '#030a14', color: '#e8f3f7', margin: 0, padding: 0, overflow: 'hidden' }}>
        {children}
      </body>
    </html>
  );
}
