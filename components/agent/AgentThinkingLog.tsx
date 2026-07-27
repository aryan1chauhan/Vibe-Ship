import { useState } from 'react';
import { format } from 'date-fns';
import { Terminal, ChevronDown, ChevronRight, TerminalSquare } from 'lucide-react';
import type { AgentEvent } from '@/types/database';

interface AgentThinkingLogProps {
  events: AgentEvent[];
}

export function AgentThinkingLog({ events }: AgentThinkingLogProps) {
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedEvents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isThinking = events.length > 0 && 
    events[events.length - 1].event_type !== 'thinking_complete' && 
    events[events.length - 1].event_type !== 'error';

  return (
    <div className="glass rounded-xl overflow-hidden border border-[rgba(255,255,255,0.05)] shadow-xl">
      <div 
        className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.05)]"
        style={{ background: 'rgba(0, 0, 0, 0.2)' }}
      >
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
          </div>
          <span 
            className="text-xs font-mono font-medium ml-2 flex items-center gap-1.5"
            style={{ color: 'var(--foreground-muted)' }}
          >
            <TerminalSquare className="w-3.5 h-3.5 text-purple-400" />
            crunchai-agent-log
          </span>
        </div>
        {isThinking && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
            <span 
              className="text-[10px] font-mono animate-pulse" 
              style={{ color: 'var(--primary-light)' }}
            >
              THINKING
            </span>
          </div>
        )}
      </div>

      <div 
        className="p-4 font-mono text-xs space-y-4 max-h-100 overflow-y-auto"
        style={{ background: '#0a0514' }}
      >
        {events.length === 0 ? (
          <div className="text-center py-6" style={{ color: 'var(--foreground-muted)' }}>
            No agent events logged yet.
          </div>
        ) : (
          events.map((event, index) => {
            const isExpanded = !!expandedEvents[event.id];
            const hasPayload = event.payload && Object.keys(event.payload).length > 0;
            const timeStr = format(new Date(event.created_at), 'hh:mm:ss.SSS a');

            let prefix = '> ';
            let textColor = 'var(--foreground)';
            let title = '';

            switch (event.event_type) {
              case 'thinking_start':
                prefix = '● ';
                textColor = '#38bdf8';
                title = event.payload?.message as string || 'Initializing loop';
                break;
              case 'tool_call':
                prefix = '⚙ ';
                textColor = '#c084fc';
                title = `Calling tool: ${event.tool_called}`;
                break;
              case 'tool_result':
                prefix = '✔ ';
                textColor = '#34d399';
                title = `Completed: ${event.tool_called}`;
                break;
              case 'thinking_complete':
                prefix = '★ ';
                textColor = '#a7f3d0';
                title = event.payload?.message as string || 'Finished planning';
                break;
              case 'error':
                prefix = '✘ ';
                textColor = '#f87171';
                title = `Error: ${event.payload?.message || 'Unknown execution failure'}`;
                break;
            }

            return (
              <div 
                key={event.id} 
                className="space-y-1.5 transition-all duration-200"
                style={{ color: textColor }}
              >
                <div 
                  className={`flex items-start gap-2 ${hasPayload ? 'cursor-pointer select-none hover:opacity-80' : ''}`}
                  onClick={() => hasPayload && toggleExpand(event.id)}
                >
                  <span className="shrink-0">{prefix}</span>
                  <span className="flex-1 font-medium">{title}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] opacity-40">{timeStr}</span>
                    {hasPayload && (
                      isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                </div>

                {isExpanded && hasPayload && (
                  <div 
                    className="ml-5 p-3 rounded-lg overflow-x-auto text-[11px] border border-[rgba(255,255,255,0.03)]"
                    style={{ background: 'rgba(255, 255, 255, 0.02)' }}
                  >
                    <pre className="text-purple-300">
                      {JSON.stringify(event.payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}

        {isThinking && (
          <div 
            className="flex items-center gap-2 text-purple-400/70"
            style={{ color: 'rgba(192, 132, 252, 0.6)' }}
          >
            <span className="animate-pulse">_</span>
            <span className="animate-pulse">CrunchAI is computing schedule details...</span>
          </div>
        )}
      </div>
    </div>
  );
}
