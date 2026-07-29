import { genAI } from '@/lib/gemini';
import { AGENT_SYSTEM_PROMPT } from './prompts';
import { AGENT_TOOLS } from './tool-schemas';
import { executeTool } from './tools';
import type { AgentMemory } from './memory';
import type { EventEmitter } from './events';

// ──────────────────────────────────────────────
// Component 3: Reasoning Loop (Gemini)
//
// Gemini decides what should happen next.
// It does NOT perform calculations or touch the DB.
// It asks for tools, and we execute them.
//
// Component 10 (Stop Condition) lives here:
// - No more tool calls from Gemini → done
// - Max iterations reached → done
// ──────────────────────────────────────────────

const MAX_ITERATIONS = 10;

export async function runPlanningLoop(
  memory: AgentMemory,
  events: EventEmitter
): Promise<void> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: AGENT_SYSTEM_PROMPT,
    tools: [{ functionDeclarations: AGENT_TOOLS as any }],
  });

  const chat = model.startChat({
    history: [],
  });

  const userMessage = `Create a sprint plan for this task:
Title: ${memory.task.title}
Description: ${memory.task.description || 'None'}
Deadline: ${memory.task.deadline}
Type: ${memory.task.task_type}

User Prefs:
Daily Available Hours: ${memory.userPrefs.daily_available_hours}
Work Start Hour: ${memory.userPrefs.work_start_hour}
Work End Hour: ${memory.userPrefs.work_end_hour}
Timezone: ${memory.userPrefs.timezone}`;

  let response = await chat.sendMessage(userMessage);
  let iterations = 0;

  // ── Stop condition: no tool calls OR max iterations ──
  while (iterations < MAX_ITERATIONS) {
    const toolCalls = response.response.functionCalls();
    if (!toolCalls || toolCalls.length === 0) {
      break;
    }

    const functionResponses: any[] = [];

    for (const call of toolCalls) {
      const { name, args } = call;
      await events.emit('tool_call', name, { args });

      const result = await executeTool(name, args, memory);

      await events.emit('tool_result', name, { result });

      functionResponses.push({
        functionResponse: {
          name,
          response: { result },
        },
      });
    }

    response = await chat.sendMessage(functionResponses);
    iterations++;
  }
}
