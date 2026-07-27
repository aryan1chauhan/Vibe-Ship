---
name: nextjs-app-router-patterns
description: Next.js 15+ App Router conventions, routing, and component architecture.
---

# Next.js App Router Patterns

1. **Server vs Client Components**:
   - Default to Server Components for data fetching and layout rendering.
   - Use `'use client'` only for interactive components with local state, event listeners, or browser APIs.
2. **Route Handlers**:
   - Route handlers in `app/api/.../route.ts` must use explicit HTTP methods (`GET`, `POST`, `PATCH`, `DELETE`).
   - Use standard `NextResponse.json()` responses with consistent status codes.
3. **Async Route Parameters**:
   - In Next.js 15+, `params` and `searchParams` in route components and route handlers are Promises (`await params`).
