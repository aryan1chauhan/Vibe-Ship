'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

type RealtimeTable = 'tasks' | 'sprint_sessions' | 'agent_events';

/**
 * Subscribe to Supabase realtime changes and invalidate relevant TanStack Query caches.
 * Call this once at the layout level.
 */
export function useRealtime(tables: RealtimeTable[] = ['tasks', 'sprint_sessions', 'agent_events']) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('realtime-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sprint_sessions' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['sessions'] });
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agent_events' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['agent-events'] });
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
