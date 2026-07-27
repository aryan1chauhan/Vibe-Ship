---
name: api-security-best-practices
description: API protection, rate limiting, CSRF defense, and request guards.
---

# API Security Guidelines

1. **Authentication & Authorization**:
   - Verify bearer tokens / cookies on every protected route.
   - Enforce resource-level permission checks (ensure `user_id` matches session).
2. **Input Sanitization**:
   - Validate and sanitize all query parameters, headers, and request bodies.
3. **Defense in Depth**:
   - Apply rate limiting headers and prevent header manipulation.
