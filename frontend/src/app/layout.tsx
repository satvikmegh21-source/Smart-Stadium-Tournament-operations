import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import { AuthProvider } from '../context/AuthContext';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Smart Stadium & Tournament Operations Platform',
  description: 'Enterprise cloud platform managing the complete lifecycle of sports tournaments, stadium facilities, ticketing, vendor operations, real-time safety, and security coordination.',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${outfit.variable} font-sans bg-background text-foreground antialiased selection:bg-indigo-500/30 selection:text-indigo-200`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
