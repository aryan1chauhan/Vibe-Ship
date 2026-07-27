import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import './globals.css';

export const dynamic = 'force-dynamic';

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CrunchAI — Your AI Agent That Manages Your Time',
  description:
    'Stop procrastinating. CrunchAI breaks down your tasks, builds sprint plans, and replans when life happens. An agentic AI time manager for students and professionals.',
  keywords: ['AI', 'time management', 'productivity', 'sprint planning', 'students'],
  openGraph: {
    title: 'CrunchAI — Your AI Agent That Manages Your Time',
    description: 'An agentic AI that breaks down tasks, builds sprint plans, and auto-replans when you miss sessions.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${spaceGrotesk.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased bg-[#090a0f] text-zinc-100 font-sans">{children}</body>
    </html>
  );
}
