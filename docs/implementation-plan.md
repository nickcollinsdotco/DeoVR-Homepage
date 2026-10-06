# DeoVR Homepage: Implementation Plan

Companion to `docs/design-direction.md` (read that first). Last updated: 2026-10-06. Direction: **Viewfinder structure (§6) with the spatial layer (§14)**.

---

## 1. Architecture

- **Next.js 16 (App Router) + React 19 + TypeScript (strict)**, statically generated, deployed on **Vercel**.
- **Styling:** Tailwind v4 provides preflight and the `@theme` token layer; components use semantic class names in plain CSS split by area (`src/styles/*.css`, imported in order from `src/app/globals.css`). Colour tokens are OKLCH. Headset view is a token swap on `html[data-view="headset"]` plus one mode file, not a parallel codebase.
- **Static data.** A committed snapshot of the real DeoVR catalogue (`src/data/videos.json`, `channels.json`) plus an editorial layer (`src/data/curation.ts`). No runtime API dependency.
- **Immersive layer, lazy.** three.js loads via dynamic import on idle, never on the critical path. If WebGL is unavailable, every surface falls back to covers and DeoVR's flat preview clips.
- **State**
  - Filters, feed and quick view → **URL search params** (`?feed=trending&intent=travel&fov=360&comfort=still&v=5fy5b3`), restored after hydration and on back/forward.
  - Headset queue + view mode → React context persisted to `localStorage` (`AppProviders`).
  - Portals → a tiny module-level registry (`lib/immersive/portals.ts`) that cards write to and one canvas reads from, so cards never import three.js.
- **Dependencies:** `next`, `react`, `three` (lazy), `clsx`; dev-only `ffmpeg-static` for the media script. No UI kit, no icon pack.

### Folder structure
```
src/
  app/                    layout (fonts, providers), page, globals.css, icon.svg
  styles/                 tokens, base, controls, shell, stage, discovery, cards,
                          chapters, quickview, queue, responsive, headset, immersive
  components/
    HomePage.tsx          composition + page state (filters ⇄ URL, quick view, toasts)
    providers/            AppProviders: headset queue + view mode (localStorage)
    shell/                TopBar, LibraryMenu, HeadsetDock, SiteFooter
    stage/                Stage: featured world, info column, alternates
    discovery/            DiscoveryBar, ImmersionFilter, Feed (grid + interleaved chapters)
    chapters/             EditorialChapter, PlacesChapter (planets), CreatorsRow
    video/                VideoCard (portal or flat preview), ImmersionSignature
    quickview/            QuickView: pre-flight <dialog> with the look-around world
    queue/                QueueTray
    immersive/            WorldStage (stage + quick view), PortalCanvas (cards + planets)
    ui/                   Icons (hand-drawn SVG set, DeoVR mark)
  lib/
    catalog.ts            types, snapshot access, media lookups, editorial queries
    filters.ts            Filters, facets, filtering/sorting, URL mirror
    format.ts             titles, durations, counts, ages
    immersive/
      equirect.ts         projection shader, renderer setup, textures, WebXR
      portals.ts          portal registry shared by cards and PortalCanvas
  data/
    videos.json, channels.json   catalogue snapshot (scripts/snapshot.mjs)
    media.json                   id → self-hosted still / loop (scripts/media.mjs)
    curation.ts                  featured stage, places, intents
public/
  media/eq/               left-eye equirect stills, one per non-premium immersive video
  media/loop/             8s equirect loops for the featured stage
  directions/             the five coded explorations (A–E), static HTML, served at /directions
scripts/
  snapshot.mjs            DeoVR → src/data/*.json (+ directions data.js)
  media.mjs               DeoVR source files → public/media + src/data/media.json
```

---

## 2. Key modules

| Module | Responsibility | Notes |
|---|---|---|
| `HomePage` | Composes the page; owns filters (mirrored to URL), quick view (`?v=`), toasts | `Feed` is keyed by filters, so paging and previews reset on change |
| `Stage` | Featured item: world, place, title, hook, signature, actions; seven alternates | Alternates select on dwell (220ms) or focus; arrow keys rove |
| `WorldStage` | Draggable 180°/360° view, crossfade between worlds, compass, Step inside (FLIP to viewport), Enter VR | Keyboard arrows look around; Esc steps back; idle drift only on 360° and never under reduced motion |
| `PortalCanvas` | One fixed canvas *behind* the page draws every live portal into its card's rectangle | Covers fade out via `--portal` to reveal it; rounded corners are clipped in the shader |
| `VideoCard` | Cover, duration, signature, title, creator, stats; portal on hover/focus/dwell, else DeoVR preview clip | Focus without a pointer sweeps the view gently |
| `PlacesChapter` | 360° places as little planets; unwrap to a window on intent | The silhouette is the field of view |
| `DiscoveryBar` / `ImmersionFilter` | Feed tabs, intent chips (*where*), Immersion facets (*how it feels*), active filter chips | Instant apply; counts in an `aria-live` region |
| `QuickView` | Pre-flight dialog: look-around world, expanded signature, comfort note, actions, similar | `<dialog>`, focus on Close, deep link |
| `QueueTray` | Headset queue with total runtime | Honest copy: saved in this browser only |
| `HeadsetDock` | Bottom-centre labelled navigation in headset view | ≥ 64px targets |

---

## 3. Data model

```ts
type Video = {
  id: string; slug: string;          // DeoVR id and short link (deovr.com/{slug})
  title: string; description: string; channel: string;
  cover: { sm: string; lg: string }; // cover-app 420×252 / cover-desktop 1200×720
  preview: string;                   // /preview/14x1/{id}_300p.mp4 (500×300, flat crop)
  durationSec: number; fps: number; views: number; likes: number; comments: number;
  publishedAt: string;               // ISO
  fov: number;                       // 0 flat, 180, 190 fisheye, 360
  depth: "2D" | "3D";
  clarity: string;                   // "8K", "6K", … from source resolution
  comfort: "still" | "gentle" | "moving"; // estimate, see below
  flashing: boolean; premium: boolean; passthrough: boolean;
  categories: string[]; intents: string[]; feeds: Record<string, number | undefined>;
};
```

**Comfort is an estimate, and the UI says so.** DeoVR's `extreme-motion` warning is the only "moving" signal (creators tag generously, so platform categories alone over-warn). Camera-platform categories without that warning (drone, car, boat, train…) read as "gentle"; everything else "still". In a real product this should be a creator-set field.

**Intents** map DeoVR categories onto seven subjects (Travel, City walks, Nature & calm, Music & events, Adrenaline, Stories & animation, Passthrough). The mapping lives in `scripts/snapshot.mjs`.

---

## 4. Media strategy

Rule: **never show a blurry frame.** If we don't have sharp motion, show a sharp still.

| Tier | Used for | Source |
|---|---|---|
| **Equirect loop** | Featured stage (7 items) | `public/media/loop/{id}.mp4`: 8s, left eye, 2048×1024 (360°) or 1280² (180°), H.264 CRF 30, ~0.6–3MB |
| **Equirect still** | Portals, planets, quick view | `public/media/eq/{id}.jpg`: left eye, 2048×1024 (360°) or 1280² (180°), ~150KB |
| **Flat cover** | Poster under every world; cards at rest | DeoVR `cover-app` / `cover-desktop` |
| **Flat preview clip** | Cards without an equirect still (flat, premium) | DeoVR `/preview/14x1/{id}_300p.mp4`, played at card size only |

**`scripts/media.mjs`** asks DeoVR's player API for each video's source files (signed URLs that expire after 24h, hence self-hosting), seeks over HTTP range requests with `ffmpeg-static` so only a few seconds are fetched, crops the left eye of side-by-side or top-bottom stereo, and writes the stills and loops. Premium videos expose no source URL, so they keep their flat cover: 81 of 129 immersive videos have stills.

**Product recommendation from this:** DeoVR already stores the equirect masters; serving a small equirect still per video would let any client (web, app, headset) offer look-around previews.

Covers use `next/image` with `unoptimized` (DeoVR's CDN already serves right-sized JPEGs). Stills load only for cards within ~400px of the viewport. Loops are fetched only for the active stage item.

---

## 5. Immersive rendering

- **One shader for every surface** (`lib/immersive/equirect.ts`): a full-screen quad computes a view ray per pixel, either rectilinear (yaw, pitch, vertical FOV) or inverse stereographic (little planet), and blends the two for the unwrap. 180° sources mask outside ±90° longitude, so planets become domes. A second texture slot crossfades worlds. `textureGrad` with seam-aware derivatives keeps mipmapping clean at the longitude wrap.
- **Two WebGL contexts at most** on the homepage: the stage (`WorldStage`) and the shared portal canvas. Quick view adds a third while open.
- **180° yaw limits** follow the viewport aspect, so the hemisphere's edge never enters the frame.
- **WebXR:** `enterVR` wraps the current texture on an inverted sphere (360°) or hemisphere (180°) and runs `renderer.setAnimationLoop` until the session ends. Mono (left eye) preview; stereo playback stays in the DeoVR player.

---

## 6. Motion

Audited against Emil Kowalski's design-engineering rules (`emil-design-eng`, `review-animations`).

- **Tokens:** `--ease: cubic-bezier(0.23, 1, 0.32, 1)` for enter/exit and UI response, `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)` for on-screen movement; `--d1 150ms`, `--d2 220ms`, `--d3 420ms` (media crossfades only).
- **GPU only.** Step inside lays the world out full-viewport and FLIPs it from its slot with `transform` + `clip-path` (480ms in, 320ms out); the canvas keeps one buffer size, so nothing reflows mid-flight.
- **Asymmetric:** portals open on a ~160ms dwell and fade in deliberately, then close faster; planets unwrap slower than they rewrap; dialogs enter in 220ms and exit in 150ms.
- **Interruptible:** world crossfades continue from what is on screen when a new alternate arrives mid-fade; pointer look-around follows with damped momentum rather than 1:1.
- **Origin:** the Immersion popover scales from its trigger (top right); modals stay centred. Entrances start at `scale(.97)` + opacity via `@starting-style`, never from zero.
- **Press feedback:** `scale(.97)` on buttons, chips, tabs, alternates, planets and dock buttons.
- **Nothing moves on keyboard navigation:** focus opens a portal as a still, forward view (no auto-sweep).
- **Hover motion** is gated behind `(hover: hover) and (pointer: fine)`.
- **Reduced motion:** gentler, not zero. Fades stay; scale, translate, idle drift, autoplaying loops and the Step inside flight are removed.
- **Headset view:** fades and small scales only; no idle drift (lateral motion causes vection).
- **Idle cost:** the portal canvas redraws only when something moves (animation, scroll, resize, registry change); the stage stops rendering and pauses its loop when scrolled out of view.

---

## 7. Responsive and headset

- Breakpoints per design doc §12 (`src/styles/responsive.css`): 4 → 3 → 1 grid columns, stage stacks under 820px, discovery chips wrap, quick view becomes a bottom sheet.
- Headset view (`src/styles/headset.css`): root font 20px, `--target: 4rem`, top bar replaced by `HeadsetDock`, search moves into the discovery bar, max 3 columns, row scroll snapping.
- **One persistent control layer in headset view.** The dock is a solid full-width band at the bottom, and the discovery bar is not sticky, so fixed controls never stack over other controls (a jittery controller ray would hit whichever is in front). Enabled by UA (`OculusBrowser`, Pico, Wolvic, visionOS), `?view=headset`, or the toggle.

---

## 8. Accessibility

- Landmarks, one `h1` (stage title), skip link, `aria-live` for result counts, previews and queue toasts.
- Keyboard: `/` search; arrows rove alternates and grid cards; `Q` queues the focused card; arrows look around a focused world; `Esc` closes dialogs and steps back out of a world.
- `<dialog>` quick view with initial focus on Close; Step inside moves focus to Step back and restores it.
- Signature items carry spoken labels; comfort uses shape + label, never colour alone.

---

## 9. Performance

Budgets: LCP < 2.0s (stage poster), CLS < 0.02, homepage JS < 120KB gz.

Current: three.js (~134KB gz) is a lazy chunk loaded on idle. The initial bundle is ~200KB gz, most of it the Next/React runtime, so it is **over the 120KB budget**; next steps would be trimming client boundaries (render shell, chapters and footer as server components).

---

## 10. Build log

Each phase: run the app, screenshot desktop 1440 / mobile 390 / headset view, name the three biggest weaknesses, fix, commit.

| Phase | Status |
|---|---|
| Data snapshot (`scripts/snapshot.mjs`): 141 videos, 86 channels | ✅ |
| Round 1 explorations A/B/C (`/directions`); B's stage + C's grid chosen | ✅ |
| Foundation, visual system, shell, stage, grid, discovery, quick view, queue, chapters, headset view | ✅ |
| Round 2 spatial spikes D/E; media pipeline (`scripts/media.mjs`) | ✅ |
| Immersive layer: world stage, portals, planets, Step inside, quick view world, WebXR | ✅ (WebXR not yet tested on a headset) |
| Curation pass: place-first For you, place-led chapters | ✅ |
| Restructure into the folder layout above; lint clean | ✅ |
| Deploy to Vercel ([deo-vr-homepage.vercel.app](https://deo-vr-homepage.vercel.app)) | ✅ |
| Quest Browser check (Enter VR on device) | Pending |
| Bundle trim toward 120KB | Not started |

### Definition of done
- Deployed on Vercel; public GitHub repo; README with run instructions, design summary, media attribution.
- `npm run typecheck`, `npm run lint`, `npm run build` pass.
- `docs/process.md`: tools, approach, biggest-impact changes, next steps (≤ 300 words).
