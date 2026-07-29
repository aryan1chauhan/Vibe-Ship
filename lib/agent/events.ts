import type { SupabaseClient } from '@supabase/supabase-js';

// ──────────────────────────────────────────────
// Component 8: Event/Notification Layer
//
// Single responsibility: write to agent_events table.
// Supabase Realtime broadcasts these to the frontend.
// ──────────────────────────────────────────────

export interface EventEmitter {
  emit(eventType: string, toolCalled?: string | null, payload?: any): Promise<void>;
}

export function createEventEmitter(
  supabase: SupabaseClient,
  userId: string,
  taskId: string
): EventEmitter {
  return {
    async emit(
      eventType: string,
      toolCalled: string | null = null,
      payload: any = {}
    ) {
      await supabase.from('agent_events').insert({
        user_id: userId,
        task_id: taskId,
        event_type: eventType,
        tool_called: toolCalled,
        payload,
      });
    },
  };
}
