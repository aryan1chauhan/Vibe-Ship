import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin'],
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
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
