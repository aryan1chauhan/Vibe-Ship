---
name: nextjs-supabase-auth
description: Supabase authentication and session management via @supabase/ssr.
---

# Next.js Supabase Auth Patterns

1. **Client & Server Integration**:
   - Browser client: `createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)` in `lib/supabase/client.ts`.
   - Server client: `createServerClient` in `lib/supabase/server.ts` with cookie get/set handlers.
   - Middleware: Session update & protection in `middleware.ts` via `updateSession(request)`.
2. **Protected Routes**:
   - Redirect unauthenticated users to `/login` with clean callback params.
