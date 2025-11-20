---
status: planned
created: '2025-11-20'
tags:
  - frontend
  - architecture
  - nextjs
  - shadcn
priority: medium
created_at: '2025-11-20T05:38:11.714Z'
---

# Frontend Architecture Update

> **Status**: 📅 Planned · **Priority**: Medium · **Created**: 2025-11-20

## Overview

Update frontend architecture to use Next.js for SSR and shadcn/ui for the component library. This moves away from the current Vite SPA setup to a more robust SSR framework.

## Design

### Framework Selection
- **SSR Framework**: **Vite + React (with SSR plugin)**
  - **Keep Vite** as the build tool (already in use).
  - Add **vite-plugin-ssr** (or **Vike**) for SSR capabilities while maintaining Vite's speed.
  - Alternative: Use Vite's built-in SSR API directly if minimal SSR is needed.
  - Provides SSR benefits without abandoning the existing Vite setup.
- **UI Library**: **shadcn/ui**
  - Built on Radix UI for accessibility.
  - Tailwind CSS v3 for styling (Vite-compatible, more stable ecosystem).
  - Copy-paste component architecture allows for maximum customization and ownership of code.
  - Fully compatible with Vite + React setup.

### Architecture Changes
- **Serving**: Add Node.js runtime for SSR alongside existing Go backend (or proxy through Go).
- **Structure**:
  - Keep `web/` directory with Vite configuration.
  - Add Vike/vite-plugin-ssr configuration for SSR.
  - Existing components (e.g., `Terminal.tsx`) need minimal changes (handle `window` checks for SSR).
  - Maintain TypeScript and existing tooling.

## Plan

- [ ] **Add Tailwind CSS v3**
  - [ ] Install Tailwind CSS v3 (`npm install -D tailwindcss@^3 postcss autoprefixer`).
  - [ ] Run `npx tailwindcss init -p` to generate config files.
  - [ ] Configure `tailwind.config.js` with content paths.
  - [ ] Update `vite.config.ts` if needed.
- [ ] **Setup shadcn/ui**
  - [ ] Run `npx shadcn-ui@latest init`.
  - [ ] Configure `components.json` for Vite.
  - [ ] Install first components (e.g., Button, Card).
- [ ] **Add SSR Support** (Optional Phase)
  - [ ] Install Vike (`npm install vike`).
  - [ ] Configure SSR routes and rendering.
  - [ ] Adapt `Terminal.tsx` for SSR (client-only rendering where needed).
- [ ] **Update Build & Deploy**
  - [ ] Update `Dockerfile` to support Node.js runtime for SSR (if SSR enabled).
  - [ ] Update `Makefile` for new build process.

## Test

- [ ] **Build Verification**: `npm run build` succeeds.
- [ ] **SSR Check**: Verify initial HTML contains content (not just empty root div).
- [ ] **Terminal Functionality**: Verify xterm.js works correctly in the browser.
- [ ] **UI Components**: Verify shadcn/ui components render correctly with Tailwind.

## Notes

### Why Not Next.js?
- Next.js replaces Vite entirely (incompatible build systems).
- Would require complete frontend rewrite and tooling change.
- Vike/vite-plugin-ssr provides SSR while keeping Vite's speed and existing setup.

### Alternatives Considered
1. **Remix** - Also replaces Vite, similar tradeoffs to Next.js.
2. **Vike (vite-plugin-ssr)** - ✅ Best fit: adds SSR to Vite.
3. **Astro** - Good for content sites, but less suitable for interactive dashboard.
4. **Keep SPA** - Simplest option if SSR isn't actually needed for this use case.

### Open Questions
- Do we actually need SSR? AgentRelay is a developer tool (not public-facing content site).
- Could stay with SPA and just add shadcn/ui for better UI components.

### Tailwind v3 vs v4
- **Using v3**: More mature, better plugin ecosystem, shadcn/ui fully tested with v3.
- v4 is still in alpha/beta with breaking changes and limited tooling support.
