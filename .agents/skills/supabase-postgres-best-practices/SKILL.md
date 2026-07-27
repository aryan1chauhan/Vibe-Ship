---
name: supabase-postgres-best-practices
description: Supabase PostgreSQL query tuning, RLS policies, and database optimization.
---

# Supabase Postgres Best Practices

1. **Row Level Security (RLS)**:
   - Always enable RLS on user-facing tables: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`.
   - Use `auth.uid()` in policies for user data isolation.
2. **Indexing**:
   - Index foreign keys and columns frequently queried in `WHERE` clauses.
3. **Schema Migrations**:
   - Keep `supabase-schema.sql` synchronized with table definitions and RLS policy rules.
