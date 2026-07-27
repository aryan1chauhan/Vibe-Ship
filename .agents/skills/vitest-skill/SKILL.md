---
name: vitest-skill
description: Vitest unit testing, test fixtures, and assertion patterns.
---

# Vitest Testing Guidelines

1. **Unit & Integration Testing**:
   - Write clear tests covering happy paths and edge cases.
   - Use `describe`, `it`, `expect`, `vi.fn()`, `vi.spyOn()`.
2. **Isolation**:
   - Reset state between tests (`beforeEach(() => vi.clearAllMocks())`).
3. **Execution**:
   - Run tests efficiently with `npx vitest run`.
