'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

type RealtimeTable = 'tasks' | 'sprint_sessions' | 'agent_events';


export function useRealtime(tables: RealtimeTable[] = ['tasks', 'sprint_sessions', 'agent_events']) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();
    let channel = supabase.channel('realtime-changes');

    if (tables.includes('tasks')) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['agent-brief'] });
        }
      );
    }

    if (tables.includes('sprint_sessions')) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sprint_sessions' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['sessions'] });
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['agent-brief'] });
        }
      );
    }

    if (tables.includes('agent_events')) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agent_events' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['agent-events'] });
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['agent-brief'] });
        }
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, JSON.stringify(tables)]);
}
