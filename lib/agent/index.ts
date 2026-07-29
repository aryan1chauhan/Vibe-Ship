// ──────────────────────────────────────────────
// lib/agent barrel export
//
// API routes import from '@/lib/agent' — this
// file ensures they keep working without knowing
// about the internal module structure.
// ──────────────────────────────────────────────

export { runAgentLoop, runReplanLoop } from './orchestrator';
export type { AgentLoopOptions, UserPrefs } from './types';
