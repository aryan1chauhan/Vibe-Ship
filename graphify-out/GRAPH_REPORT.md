# Codebase Graph Report (Graphify)

## Architecture Overview
`crunchai` is a Next.js 15+ App Router application with Supabase integration and Gemini AI Agent core.

### Key Directory Structure
- `app/(app)`: Main application layout, dashboard, task routes.
- `app/(auth)`: Auth pages (login, callback).
- `app/api/agent`: Agent execution endpoints (`brief`, `plan`, `replan`).
- `app/api/tasks`: Task CRUD endpoints.
- `lib/agent`: Agent core logic, tools, and prompts (`executor.ts`, `tools.ts`, `prompts.ts`).
- `lib/supabase`: Supabase server & client initializers.
- `components/agent`: Agent UI components (`AgentThinkingLog.tsx`).
- `components/tasks`: Task components (`TaskCard.tsx`, `NaturalLanguageInput.tsx`).
- `components/ui`: UI components (`Sidebar.tsx`, `LoadingSkeleton.tsx`).

### Dependency Graph Nodes
- `app/layout.tsx` -> `app/providers.tsx`
- `app/api/agent/brief/route.ts` -> `lib/agent/index.ts`
- `lib/agent/index.ts` -> `lib/agent/executor.ts` & `lib/agent/tools.ts`
- `lib/supabase/server.ts` -> `@supabase/ssr`
