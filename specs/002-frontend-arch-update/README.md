---
status: complete
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

> **Status**: ✅ Complete · **Priority**: Medium · **Created**: 2025-11-20

## Overview

Update frontend architecture to use Next.js for SSR and shadcn/ui for the component library. This moves away from the current Vite SPA setup to a more robust SSR framework.

## Implementation Summary

**Completed:** Tailwind CSS v3 + shadcn/ui (without SSR)

After reviewing the open questions in this spec, we decided to implement Tailwind CSS v3 and shadcn/ui first without SSR. Since AgentRelay is a developer tool (not a public-facing content site), SSR may not be necessary. This implementation provides:

1. **Modern UI Framework**: Tailwind CSS v3 with full theming support (light/dark mode via CSS variables)
2. **Component Library**: shadcn/ui with Button and Card components demonstrating the architecture
3. **Build Tooling**: Updated Makefile with `build-web` and `run-web` targets
4. **Modern UI**: Redesigned App.tsx showcasing the component library with a card-based layout

SSR support (via Vike) can be added in a future iteration if needed.

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

- [x] **Add Tailwind CSS v3**
  - [x] Install Tailwind CSS v3 (`npm install -D tailwindcss@^3 postcss autoprefixer`).
  - [x] Run `npx tailwindcss init -p` to generate config files.
  - [x] Configure `tailwind.config.js` with content paths and CSS variables.
  - [x] Add CSS variables for theming (light/dark mode support).
  - [x] Update `vite.config.ts` with path aliases.
- [x] **Setup shadcn/ui**
  - [x] Install required dependencies (class-variance-authority, clsx, tailwind-merge, lucide-react, @radix-ui/react-slot).
  - [x] Configure `components.json` for Vite.
  - [x] Create utility function (`cn` helper in `lib/utils.ts`).
  - [x] Install first components (Button, Card).
  - [x] Update App.tsx with modern UI using shadcn components.
- [ ] **Add SSR Support** (Deferred - not needed for developer tool)
  - [ ] Install Vike (`npm install vike`).
  - [ ] Configure SSR routes and rendering.
  - [ ] Adapt `Terminal.tsx` for SSR (client-only rendering where needed).
- [x] **Update Build & Deploy**
  - [x] Update `Makefile` with `build-web` and `run-web` targets.
  - [ ] Update `Dockerfile` to support Node.js runtime for SSR (not needed without SSR).

## Test

- [x] **Build Verification**: `npm run build` succeeds.
- [x] **Build Verification**: `make build-web` succeeds.
- [x] **Dev Server**: `npm run dev` runs successfully.
- [ ] **SSR Check**: Not applicable (SSR deferred).
- [ ] **Terminal Functionality**: Not applicable yet (Terminal component not implemented in this spec).
- [x] **UI Components**: Verified shadcn/ui components (Button, Card) render correctly with Tailwind.
- [x] **Theming**: Verified CSS variables and theming setup work correctly.

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
