---
name: ui-ux-pro-max-skill
description: AI-powered UI/UX design intelligence (84 UI styles, 192 color palettes, 74 font pairings, 98 UX guidelines, 25 chart types). Always read before making any frontend/UI changes.
---

# UI/UX Pro Max Skill

## Core Principles
1. **Visual Excellence**: Every interface must feature rich aesthetics, harmonious color palettes, modern typography, glassmorphism/subtle gradients, and responsive layouts.
2. **Design Tokens & Hierarchy**:
   - Primary, secondary, neutral, and accent colors defined with HSL tailwind/CSS variables.
   - Consistent typography hierarchy (Heading 1-6, body, caption).
   - Dynamic micro-animations for hover states, state transitions, and loading states.
3. **Responsive & Accessible (WCAG 2.1 AA)**:
   - Mobile-first responsive grids.
   - Contrast ratios >= 4.5:1 for standard text.
   - Explicit `data-testid` attributes on all interactive UI controls.

## Color Systems & Dark Mode
- Dark background tokens: `hsl(224, 71%, 4%)` / `hsl(224, 71%, 8%)`.
- Primary vibrant accent: HSL tailored primary gradients (e.g., Violet/Indigo/Cyan).
- Glassmorphic panels: `backdrop-blur-md bg-white/5 border border-white/10`.

## Component Guidelines
- Use clear visual feedback for interactive states (hover, focus-visible, active, disabled).
- Include skeletons for async data loading (`<LoadingSkeleton />`).
- Ensure no layout shift on interactive components.
