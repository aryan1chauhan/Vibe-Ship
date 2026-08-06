import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CrunchAI — AI-Powered Deadline Agent",
    template: "%s | CrunchAI",
  },
  description:
    "Never miss a deadline again. CrunchAI plans, schedules, and renegotiates your work automatically with AI.",
  keywords: [
    "AI",
    "deadline",
    "planning",
    "scheduling",
    "productivity",
    "agent",
  ],
  openGraph: {
    title: "CrunchAI — AI-Powered Deadline Agent",
    description:
      "Never miss a deadline again. AI plans, schedules, and renegotiates your work automatically.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} dark h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
