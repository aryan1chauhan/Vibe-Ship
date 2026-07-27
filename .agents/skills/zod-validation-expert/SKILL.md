---
name: zod-validation-expert
description: Type-safe runtime schema validation for API request payloads.
---

# Zod Validation Patterns

1. **Input Validation**:
   - Validate incoming request bodies in API routes before processing (`schema.safeParse(body)`).
2. **Type Inference**:
   - Export inferred TypeScript types (`export type InputType = z.infer<typeof inputSchema>`).
3. **Error Reporting**:
   - Return structured 400 validation error responses with field-level details.
