---
name: stitch-design-taste
description: Semantic Design System Skill for Google Stitch. Generates agent-friendly DESIGN.md files that enforce premium, anti-generic UI standards — strict typography, calibrated color, asymmetric layouts, perpetual micro-motion, and hardware-accelerated performance.
---

# Stitch Design Taste — Semantic Design System Skill

## Overview
This skill generates `DESIGN.md` files optimized for Google Stitch screen generation. It translates the battle-tested anti-slop frontend engineering directives into Stitch's native semantic design language — descriptive, natural-language rules paired with precise values that Stitch's AI agent can interpret to produce premium, non-generic interfaces.

The generated `DESIGN.md` serves as the **single source of truth** for prompting Stitch to generate new screens that align with a curated, high-agency design language. Stitch interprets design through **"Visual Descriptions"** supported by specific color values, typography specs, and component behaviors.

## Prerequisites
- Access to Google Stitch via [labs.google/stitch](https://labs.google/stitch)
- Stitch MCP Server for programmatic integration with Cursor, Antigravity, or Gemini CLI

## Stitch MCP Server Tools
Use the `StitchMCP` server for all screen and design system operations:
- `create_project` / `get_project` / `list_projects`: Manage Stitch project spaces
- `generate_screen_from_text`: Generate initial screen mockups from detailed prompts
- `edit_screens`: Refine existing screens with targeted edit instructions
- `generate_variants`: Explore aesthetic and layout variations
- `create_design_system` / `create_design_system_from_design_md`: Sync design system tokens
- `apply_design_system`: Apply tokens to screens

## Anti-Patterns & Constraints
- Maximum 1 accent color. Saturation below 80%
- No neon/outer glow shadows or purple button glows
- No pure black (`#000000`) — use Off-Black or Zinc-950
- Use sans-serif pairings (`Geist` + `Geist Mono` or `Satoshi` + `JetBrains Mono`) for dashboards
- Minimum 44px tap targets on all interactive touchpoints
- Animate exclusively via `transform` and `opacity`
