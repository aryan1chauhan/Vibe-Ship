import type { Metadata } from 'next';
import { Target, Clock, Play } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Focus — CrunchAI',
  description: 'Distraction-free focus session view',
};

export default function FocusPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: 'var(--primary-glow)' }}
        >
          <Target
            className="w-10 h-10"
            style={{ color: 'var(--primary-light)' }}
          />
        </div>
        <h2 className="text-2xl font-bold">Focus Mode</h2>
        <p
          className="max-w-md mx-auto"
          style={{ color: 'var(--foreground-muted)' }}
        >
          Start a sprint session to enter focus mode. A distraction-free timer
          with session tracking will appear here.
        </p>
        <div className="flex items-center justify-center gap-2 pt-4">
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--foreground-muted)',
            }}
          >
            <Clock className="w-4 h-4" />
            No active session
          </div>
        </div>
      </div>
    </div>
  );
}
