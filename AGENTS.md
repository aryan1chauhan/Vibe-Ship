<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Mandatory Pre-Action Skill & MCP Check Protocol (ALWAYS ACTIVE)
Before taking ANY action, writing code, modifying UI, running commands, editing database schemas, or making any changes:
1. **Self-Audit Skills & MCP Tools**: Automatically check all installed project skills in `.agents/skills/`, available system skills, and MCP servers (`StitchMCP`, `firebase-mcp-server`).
2. **Evaluate Necessity**: Determine whether any skill or MCP tool is relevant or required for the specific task at hand.
3. **Pre-Execution Activation**: Read the applicable skill file (`.agents/skills/<skill-name>/SKILL.md`) using `view_file` or prepare the required MCP tool call BEFORE writing code or taking action.
4. **Strict Enforcement**: Apply all guidelines, rules, and constraints defined in the relevant skills and MCP tools throughout execution.

# Ponytail Mode Active
Always apply the `ponytail` skill rules to all coding, refactoring, and project tasks. Focus on the simplest working solution, stdlib/native features, minimal code diffs, and zero over-engineering.

# Graphify First (Token Efficiency)
Before reading or searching files across the repository, check `graphify-out/` (`graph.json`, `GRAPH_REPORT.md`, or run `graphify query`) to navigate the codebase structural relationships directly without wasteful full-repo rescans.

# UI/UX Pro Max First (Mandatory UI/UX Standard)
Before designing, building, modifying, refactoring, or reviewing ANY UI component, page, layout, animation, or visual element, you MUST first read `.agents/skills/ui-ux-pro-max-skill/SKILL.md` to enforce world-class UI/UX design intelligence, color system hierarchy, typography, responsive patterns, and accessibility standards.

# Reticle Integration (Always Active)
Always maintain and use Reticle (`app/reticle-dev.tsx` / `@reticlehq/react`) for UI capability tracking, testids, element selection, and visual AI debugging. Ensure all key interactive buttons, forms, and tables maintain descriptive `data-testid` attributes registered in Reticle capabilities.

# Installed Project Skills (.agents/skills/)
Always follow the specific instructions and guidelines from these project skills when working on related tasks:

- **`ui-ux-pro-max-skill`**: AI-powered UI/UX design intelligence (84 UI styles, 192 color palettes, 74 font pairings, 98 UX guidelines, 25 chart types). Always read `.agents/skills/ui-ux-pro-max-skill/SKILL.md` before making any frontend/UI changes.
- **`ponytail`**: Focus on the simplest working solution, stdlib/native features, minimal code diffs, and zero over-engineering.
- **`huashu-design`**: HTML-native design philosophy, high-fidelity UI prototyping, micro-animations, 5D design review, and visual aesthetic polish.
- **`taste-skill`**: Anti-slop frontend design skill for landing pages, portfolios, and redesigns. Infers brief, sets design dials, and prevents templated UI outputs.
- **`playwright`**: End-to-end (E2E) web testing, browser automation, visual regression testing, and user-facing assertions.
- **`nextjs-app-router-patterns`**: Next.js 15 App Router conventions, routing, and component architecture.
- **`nextjs-supabase-auth`**: Supabase authentication and session management via `@supabase/ssr`.
- **`supabase-postgres-best-practices`**: Supabase PostgreSQL query tuning, RLS policies, and database optimization.
- **`zod-validation-expert`**: Type-safe runtime schema validation for API request payloads.
- **`vitest-skill`**: Vitest unit testing, test fixtures, and assertion patterns.
- **`api-security-best-practices`**: API protection, rate limiting, CSRF defense, and request guards.
- **`whatsapp-cloud-api`**: WhatsApp Cloud API integration for Meta message delivery.
- **`nextjs-seo-indexing`**: Next.js SEO optimization, OpenGraph cards, Metadata API, and JSON-LD schemas.

# Available MCP Servers & Tools
- **`StitchMCP`**: UI design systems, screen creation/editing, design variant generation (`create_project`, `generate_screen_from_text`, `edit_screens`, `create_design_system`, `apply_design_system`).
- **`firebase-mcp-server`**: Firebase app & project configuration, SDK config, security rules, environment management, and deployment tracking (`firebase_get_project`, `firebase_get_sdk_config`, `firebase_get_security_rules`, `firebase_deploy_status`).
