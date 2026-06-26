import type { Metadata } from 'next';
import { NewTaskClient } from './NewTaskClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'New Task — CrunchAI',
  description: 'Create a new task and generate sprint plan',
};

export default function NewTaskPage() {
  return <NewTaskClient />;
}
