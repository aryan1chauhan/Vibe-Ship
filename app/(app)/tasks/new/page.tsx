'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { NaturalLanguageInput } from '@/components/tasks/NaturalLanguageInput';
import type { TaskType } from '@/types/database';

export default function NewTaskPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: {
    title: string;
    description: string;
    deadline: string;
    taskType: TaskType;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description || null,
          deadline: new Date(data.deadline).toISOString(),
          task_type: data.taskType,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create task');
      }

      const { task } = await res.json();
      router.push(`/tasks/${task.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {}
      <Link
        href="/tasks"
        className="inline-flex items-center gap-1 text-sm transition-colors"
        style={{ color: 'var(--foreground-muted)' }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to tasks
      </Link>

      {}
      <div>
        <h1 className="text-2xl font-bold">New Task</h1>
        <p
          className="text-sm mt-1"
          style={{ color: 'var(--foreground-muted)' }}
        >
          Describe what you need to finish. The AI agent will create a sprint
          plan.
        </p>
      </div>

      {}
      <div className="glass p-6">
        <NaturalLanguageInput onSubmit={handleSubmit} loading={loading} />

        {error && (
          <div
            className="mt-4 p-3 rounded-lg text-sm"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--danger-light)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
