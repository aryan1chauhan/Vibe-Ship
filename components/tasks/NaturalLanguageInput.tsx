'use client';

import { useState } from 'react';
import { Sparkles, Send, Calendar, Tag } from 'lucide-react';
import type { TaskType } from '@/types/database';

interface NaturalLanguageInputProps {
  onSubmit: (data: {
    title: string;
    description: string;
    deadline: string;
    taskType: TaskType;
  }) => void;
  loading?: boolean;
}

const TASK_TYPES: { value: TaskType; label: string; emoji: string }[] = [
  { value: 'assignment', label: 'Assignment', emoji: '📝' },
  { value: 'project', label: 'Project', emoji: '🚀' },
  { value: 'exam', label: 'Exam', emoji: '📚' },
  { value: 'personal', label: 'Personal', emoji: '🎯' },
  { value: 'work', label: 'Work', emoji: '💼' },
];

const PLACEHOLDER_EXAMPLES = [
  'Submit project report by June 29 2pm',
  'Study for data structures exam next Monday',
  'Finish UI redesign before Friday EOD',
  'Prepare presentation for client meeting tomorrow',
];

export function NaturalLanguageInput({
  onSubmit,
  loading,
}: NaturalLanguageInputProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('assignment');
  const [placeholderIndex] = useState(
    Math.floor(Math.random() * PLACEHOLDER_EXAMPLES.length)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadline) return;
    onSubmit({ title: title.trim(), description: description.trim(), deadline, taskType });
  };

  
  const now = new Date();
  const minDatetime = now.toISOString().slice(0, 16);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {}
      <div>
        <label
          className="flex items-center gap-2 text-sm font-medium mb-2"
          style={{ color: 'var(--foreground-muted)' }}
        >
          <Sparkles className="w-4 h-4" style={{ color: 'var(--primary-light)' }} />
          What do you need to finish?
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={PLACEHOLDER_EXAMPLES[placeholderIndex]}
          className="input text-lg"
          style={{ padding: '14px 16px' }}
          autoFocus
          required
        />
      </div>

      {}
      <div>
        <label
          className="text-sm font-medium mb-2 block"
          style={{ color: 'var(--foreground-muted)' }}
        >
          Any extra details? (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Need to include data analysis, minimum 2000 words, must cite 5 sources..."
          className="input"
          rows={3}
          style={{ resize: 'vertical' }}
        />
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            className="flex items-center gap-2 text-sm font-medium mb-2"
            style={{ color: 'var(--foreground-muted)' }}
          >
            <Calendar className="w-4 h-4" />
            Deadline
          </label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            min={minDatetime}
            className="input"
            required
          />
        </div>

        <div>
          <label
            className="flex items-center gap-2 text-sm font-medium mb-2"
            style={{ color: 'var(--foreground-muted)' }}
          >
            <Tag className="w-4 h-4" />
            Type
          </label>
          <div className="flex flex-wrap gap-2">
            {TASK_TYPES.map(({ value, label, emoji }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTaskType(value)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
                style={{
                  background:
                    taskType === value ? 'var(--primary-glow)' : 'var(--surface)',
                  color:
                    taskType === value
                      ? 'var(--primary-light)'
                      : 'var(--foreground-muted)',
                  border: `1px solid ${
                    taskType === value
                      ? 'rgba(124, 58, 237, 0.3)'
                      : 'var(--border)'
                  }`,
                }}
              >
                {emoji} {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {}
      <button
        type="submit"
        disabled={loading || !title.trim() || !deadline}
        className="btn-primary w-full justify-center text-base"
        style={{
          padding: '14px',
          opacity: loading || !title.trim() || !deadline ? 0.5 : 1,
          cursor: loading || !title.trim() || !deadline ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Agent is planning...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Create Sprint Plan
            <Send className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
