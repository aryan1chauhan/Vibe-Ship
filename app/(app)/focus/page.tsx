import type { Metadata } from 'next';
import { FocusClient } from './FocusClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Focus — CrunchAI',
  description: 'Distraction-free focus session view',
};

export default function FocusPage() {
  return <FocusClient />;
}
