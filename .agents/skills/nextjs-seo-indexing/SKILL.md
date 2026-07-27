---
name: nextjs-seo-indexing
description: Next.js SEO optimization, OpenGraph cards, Metadata API, and JSON-LD schemas.
---

# Next.js SEO & Indexing Guidelines

1. **Metadata API**:
   - Export static/dynamic `metadata` objects in `layout.tsx` and `page.tsx`.
   - Configure title, description, openGraph, twitter, canonical URLs, and robots tags.
2. **Structured Data**:
   - Embed JSON-LD schemas (`application/ld+json`) for rich search snippets.
3. **Sitemap & Robots**:
   - Implement `app/sitemap.ts` and `app/robots.ts`.
