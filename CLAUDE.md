# DeoVR Homepage Redesign: Agent Guide

Design-challenge prototype: redesign of the deovr.com homepage as a dark, premium, VR-aware video discovery experience. It's evaluated by the DeoVR/SLR team on product thinking and visual quality, not on code volume.

**Before changing anything, read `docs/design-direction.md` (the why) and `docs/implementation-plan.md` (the how).** If a change conflicts with them, update the doc in the same change or don't make the change.

## Thesis (memorise this)
Every VR video is a window to somewhere. The homepage is a **Viewfinder** made literal: a featured stage that *is* the place (a real 360°/180° world you can look around in), then a discovery grid where every immersive card is a portal. Before people commit, it tells them what a video will feel like: field of view, depth, clarity, comfort, length (the **Immersion Signature**).

## Design rules
- **Content is the colour.** Chrome is neutral warm near-black. One accent (DeoVR pink) for primary action / selection only. The blue→pink→orange brand gradient appears only in the logo.
- **Banned**: purple/blue AI gradients, glassmorphism, glow effects, gold "premium", decorative 3D (floating objects, 3D for its own sake), giant rounded cards, decorative animation, pure `#000` backgrounds, pure `#fff` text, thin font weights.
- **Type**: Inter for UI/body (weights 400/500/600, `tnum` for numbers). Instrument Sans 600 for display only at large sizes, tracked slightly tight (`--display-tracking`, -0.02em), never cramped.
- **3D only to show the content's real geometry** (equirect worlds, portals, little planets, WebXR on request). See design-direction §14.
- **Depth via light and scale**, not shadows/blur. Radii: 8px cards, pill chips/buttons only.
- **Immersion Signature is consistent everywhere**: same order (FOV · depth · clarity/fps · comfort · length), same glyphs. Never glyph-only in headset view.
- **Focus is preview**: dwell or keyboard focus on a featured alternate crossfades the stage world. Dwell or focus on an immersive card opens a portal inside it (one at a time). Click a card for quick view, not navigation.
- **Never show a blurry frame**: worlds come from self-hosted equirect loops and stills; without one, show the sharp cover. 300p DeoVR previews only play at card size. See `docs/implementation-plan.md` §4.
- Five directions were prototyped in code and live in `public/directions/` (served at `/directions`). The shipped page is B's stage + C's grid + the D/E spatial layer (design-direction §6, §14). Don't reintroduce A's rails or E's single-shelf layout without updating the design doc.
- **Every hover affordance has a focus and tap equivalent.** Nothing important is hover-only.
- **Headset view is a first-class mode** (`<html data-view="headset">`): ≥ 64px targets, ≥ 16px text, max 3 grid columns, bottom dock nav (a solid full-width band; the only fixed control layer, so nothing sticky stacks over other targets), fades/small scales only, no lateral motion.
- Fewer, better: when in doubt, remove a module rather than add one.

## Engineering rules
- Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4 (preflight + `@theme`) with OKLCH tokens in `src/styles/tokens.css`; component CSS is split by area in `src/styles/`. Next 16 has breaking changes from older versions: check `node_modules/next/dist/docs/` before using an unfamiliar API. Server components by default; `"use client"` only where there's interaction.
- Filter/feed/quick-view state lives in URL search params. Queue and view mode live in context + `localStorage`.
- Data is a committed static snapshot of real DeoVR content (`src/data/*.json`, produced by `scripts/snapshot.mjs`). Never invent fake videos or lorem ipsum. Derived fields (e.g. comfort) must be labelled as estimates in the UI.
- three.js is lazy-loaded and lives only in `src/lib/immersive/` and `src/components/immersive/`. Every WebGL surface must fall back to covers / flat previews.
- Equirect stills and stage loops are self-hosted in `public/media/` (`scripts/media.mjs`). Covers and flat previews are hotlinked from `cdn-vr.deovr.com`; images use `next/image` with `unoptimized` + explicit sizes. Previews: `preload="none"`, mounted on intent, unmounted on leave.
- Keep dependencies intentional. Ask before adding anything beyond `next`, `react`, `tailwindcss`, `clsx`, `@vercel/analytics` (and the pre-approved optional `motion`, lazy `three`).
- Accessibility is required: semantic landmarks, keyboard support, `<dialog>` with focus restore, `aria-live` feedback, AA contrast, `prefers-reduced-motion` disables autoplay.
- Performance budgets: LCP < 2.0s, CLS < 0.02, homepage JS < 120KB gz.

## Workflow
- Follow the build log in `docs/implementation-plan.md` §10. After each significant phase, inspect desktop, mobile and headset layouts in an available connected browser; name the 3 biggest weaknesses and fix them before continuing. If no browser surface is available, record visual QA as pending and never claim screenshot review.
- Compiling is not the bar. Judge the rendered hierarchy, image quality and interaction states critically. If it looks generic, redesign it.
- Read `package.json` for current commands. Review `scripts/snapshot.mjs` and `scripts/media.mjs` before refreshing committed data or media.

## Reference
- Current-site audit screenshots: `docs/research/`.
- DeoVR data shapes seen in the wild: `projectionParams { format, projection, viewAngle: 180|360 }`, `resolution` (up to 3840), cover images `…-cover-app.jpg` (420×252) / `…-cover-desktop.jpg` (1200×720), previews `/preview/14x1/{id}_300p.mp4` (500×300).
