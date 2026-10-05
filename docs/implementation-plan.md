# DeoVR Homepage: Implementation Plan

Companion to `docs/design-direction.md` (read that first). Last updated: 2026-10-06. Direction: **Viewfinder** (B, with C's discovery layer).

---

## 1. Architecture

- **Next.js 16 (App Router) + React 19 + TypeScript (strict)**, deployed on **Vercel**.
- **Tailwind CSS v4** with design tokens defined as CSS custom properties (`@theme`) in OKLCH. Tokens switch on `[data-view="headset"]` on `<html>`, so headset view is a token swap plus a few structural changes, not a parallel codebase.
- **Static data.** The homepage is statically generated from a curated JSON snapshot of real DeoVR catalogue data (`src/data/videos.json`). No runtime API dependency, so the deploy can't break if DeoVR's endpoints change.
- **Media data stays separate.** The server page passes the video snapshot to the interactive discovery surface; channel metadata and the small media index stay typed helpers. Featured stage motion uses committed high-resolution loops where available and a sharp cover everywhere else. 300p remote clips play only inside small cards.
- **Server components by default.** Client components only where there's interaction: stage, discovery bar, card preview, quick view, queue, view-mode toggle.
- **State**
  - Filters / feed / quick view → **URL search params** (`?feed=trending&intent=travel&fov=360&comfort=still&v=snt4ez`), so states are shareable and browser back/forward friendly. Initial filters restore after hydration.
  - Headset queue + view mode → small React context persisted to `localStorage`.
  - Preview orchestration → one discriminated React state (`stage` or `tile`) shared by stage and cards, so only one clip is mounted at a time.
- **Dependencies (intentional, short list)**: `next`, `react`, `tailwindcss`, `clsx`. Optional: `motion` (only if CSS / View Transitions can't do the quick-view shared-element transition cleanly) and `three` (only for the stretch look-around stage, lazy-loaded). No UI kit, no icon pack. Icons are a small hand-drawn SVG set, so the signature glyphs stay consistent with the UI icons.

### Planned folder structure
```
src/
  app/
    layout.tsx          # fonts, <html data-view>, providers
    page.tsx            # homepage composition (server)
    globals.css         # tokens, base, utilities
  components/
    shell/              # TopBar, HeadsetDock, LibraryMenu, Footer, ViewModeToggle
    viewfinder/         # Viewfinder, Stage, StageInfo, ShelfTabs, Filmstrip, FilmTile
    discovery/          # ImmersionFilter, ShelfGrid, ActiveFilters
    video/              # VideoCard, ImmersionSignature, FovGlyph, ComfortMeter, PreviewVideo
    chapters/           # CalmPlaces, Destinations, SharpestIn8K, CreatorsRow, CategoryTiles
    quickview/          # QuickView (dialog), SpecExplainer, MoreLike
    queue/              # QueueProvider, QueueButton, QueueTray, Toast
    ui/                 # Button, Chip, IconButton, Dialog, Sheet, Icon
  data/
    videos.json         # snapshot
    channels.json
    stage.json          # tier-1 loop framing (yaw/pitch/start) + editorial headlines
    categories.ts       # intent → DeoVR category mapping
  lib/
    catalog.ts          # typed accessors, filtering, sorting, "more like this"
    format.ts           # duration, counts, relative dates
    view-mode.ts        # headset UA detection + persistence
    use-preview.ts      # preview dwell + single-active controller
scripts/
  snapshot.mjs          # pulls real DeoVR data → src/data/*.json (run manually, committed output)
  stage-loops.mjs       # cuts + reprojects HQ stage loops from DeoVR sources (ffmpeg-static, dev only)
public/media/stage/     # committed tier-1 loops + posters
explore/                # plain-HTML direction explorations (A/B/C), kept for the process write-up
```

---

## 2. Planned component responsibilities

| Component | Responsibility | Notes |
|---|---|---|
| `TopBar` | Logo, primary nav, search, Queue, account | Transparent over the stage, solid once scrolled into the grid; replaced by `HeadsetDock` in headset view |
| `HeadsetDock` | Bottom-centre labelled nav in headset view | 64px+ targets |
| `Viewfinder` | Owns focus state (shelf, index) and composes Stage + Tray | Client component; keyboard (←→↑↓, Enter, Q), dwell, thumbstick; URL `?shelf=` |
| `Stage` | Full-bleed media for the focused item + info block | Picks a media tier (see §4); crossfade swaps; never shows a blurry frame |
| `StageInfo` | Place/creator, display title, hook, signature, actions | `aria-live="polite"` so focus changes are announced (debounced) |
| `ShelfTabs` | Subject shelves with counts | `role="tablist"`; reused in the sticky grid bar |
| `Filmstrip` | Horizontal strip of `FilmTile`s for the active shelf | Roving tabindex, `role="listbox"`, centres the focused tile; scroll-snap |
| `FilmTile` | Cover, duration; plays the 300p preview *in the tile* when focused | Focused state: scale + light outline |
| `ImmersionFilter` | FOV / depth / clarity / comfort / length | Popover on desktop, sheet on mobile/headset; filters strip and grid |
| `ShelfGrid` | "All in {shelf}" grid below the viewfinder with a compact sticky bar | Same filter state as the strip |
| `VideoCard` | Grid card: cover, duration, signature, title, creator, social proof, preview | Container-query variants |
| `ImmersionSignature` | Ordered spec line | `compact` / `expanded` |
| `FovGlyph`, `ComfortMeter` | Signature glyphs | Pure SVG, `currentColor` |
| `PreviewVideo` | Lazy `<video>` mounted on intent, unmounted on leave | `preload="none"`, single active |
| `QuickView` | Pre-flight dialog | `<dialog>`, focus restore, `?v=` deep link |
| `QueueTray` + `Toast` | Headset queue, simulated sync | `aria-live` feedback |
| Chapters | `CalmPlaces`, `AllTheWayAround`, `CreatorsRow`, `CategoryTiles` | In the grid, For you only, hidden when filtered |

---

## 3. Data model

```ts
type Projection = '180' | '360' | 'flat';
type Depth = '3D' | '2D';
type Comfort = 'still' | 'gentle' | 'moving';

interface Video {
  id: string;              // DeoVR numeric id, e.g. "137089"
  slug: string;            // short link, e.g. "zwya5y" → deovr.com/zwya5y
  title: string;
  channel: { slug: string; name: string; avatar: string };
  cover: { sm: string; lg?: string };  // cover-app (420×252) / cover-desktop (1200×720), both 5:3
  preview: string;         // /preview/14x1/{id}_300p.mp4 (500×300, ~14s)
  durationSec: number;
  views: number; likes: number; comments: number;
  publishedAt: string;     // ISO
  projection: Projection;  // from projectionParams.viewAngle
  depth: Depth;            // from projectionParams.format (stereo vs mono)
  resolution: number;      // max source height (e.g. 3840 → "8K")
  fps?: number;
  comfort: Comfort;        // derived, see below
  flashing?: boolean;      // DeoVR "Flashing lights warning"
  premium?: boolean;
  passthrough?: boolean;
  intents: Intent[];       // mapped from DeoVR categories
  place?: { name: string; country: string }; // curated for destination chapter
  description?: string;
  feeds: { forYou?: number; new?: number; trending?: number }; // rank in each feed
}
```

**Comfort derivation (be honest about it).** DeoVR exposes a binary motion warning. We derive a 3-step value: `moving` if the motion warning is set or the categories include drone / driving / car / airplane / helicopter / extreme / adventure-sports / motorcycles; `gentle` if walking tour / city walk / boat; otherwise `still`. Spot-checked by hand for the curated set. The quick view labels it "Camera motion" and says it's an estimate. In a real product this would become a creator-set or ML-derived field. That's a recommendation in the process write-up.

**Clarity mapping**: height ≥ 3840 → 8K, ≥ 2880 → 6K, ≥ 2560 → 5K, ≥ 2160 → 4K, else HD. Exact thresholds get verified against DeoVR's own `8k-vr` / `6k-vr` category assignments during snapshotting.

**Intent mapping** (subject facet → DeoVR categories):
- Travel → travel, travel-nature, guided-tour, exploration-reality, if-you-were-here
- City walks → city, architecture, museum
- Nature & calm → nature, sea, animals, relaxation, timelapse, yoga, asmr
- Music & events → music, live-concert, live-performance, dance, celebration, theater, show
- Adrenaline → extreme, adventure-sports, drone, cars, motorcycles, airplane, helicopter, sport
- Stories & animation → story, cinematic-expression, cgi, anime, gameplay, horror, cosplay
- Passthrough → passthrough, passthrough-ai

---

## 4. Media strategy

The direction lives or dies on the stage looking sharp. Rule: **never show a blurry frame. If we don't have sharp motion, show a sharp still.**

### Tiers

| Tier | Used for | Source | Spec |
|---|---|---|---|
| **1. Stage loop** | Featured shelf (~8–12 items) | Self-hosted, cut and **reprojected from DeoVR's own 4K–8K source files** | Forward-facing flat view (~100° hFOV) from the left eye; 1920×1080 (plus 1280 for mobile), 8–12s seamless loop, H.264 High + AV1, ~2–4MB each; poster still 2400w AVIF/JPEG |
| **2. Stage still** | Any other focused item | DeoVR `cover-desktop` (1200×720) | Shown sharp, full-bleed; slow 1.5% settle on swap; motion is the tile's job |
| **3. Tile preview** | Focused filmstrip tile, hovered grid card, quick view | DeoVR `/preview/14x1/{id}_300p.mp4` (500×300) | Plays at tile size, where 300p is sharp |

### Producing tier-1 loops (`scripts/stage-loops.mjs`)
1. Read the signed source URLs from the video page's hydration data (`full_videos_app/h265/{id}_{2160|2880|3840}p.mp4`; use the highest available).
2. `ffmpeg -ss <t> -t 10 -i <url>`: seeking over HTTP range requests fetches only the segment, not the 9GB file.
3. Reproject with `v360=input=hequirect:in_stereo=sbs:output=flat:h_fov=100:v_fov=56:yaw=<y>:pitch=<p>:w=1920:h=1080` (`input=fisheye` for fisheye masters; `equirect` + mono for 360°). Pick yaw/pitch/start time per item by hand for the best composition, stored in `src/data/stage.json`.
4. Make the loop seamless with a 0.5s crossfade of tail into head; strip audio; encode H.264 (`-crf 22 -preset slow -movflags +faststart`) and AV1 (`libsvtav1 -crf 34`); extract the poster.
5. Output to `public/media/stage/{slug}.{mp4,webm,avif}`, committed (~30–40MB total, fine for Vercel).

`ffmpeg-static` is a dev-only tool used by the script, not an app dependency. **Fallback** if a source can't be fetched: tier 2 for that item (sharp cover, gentle settle) until a loop exists. The fallback is "fake" in the honest sense: a still presented well, never an upscaled blurry video.

**Why it matters for the write-up:** this is also a product recommendation. DeoVR should render 1080p flat preview versions on its servers. The prototype shows the payoff.

### Everything else
- Covers: `cover-app` (420w) for tiles and cards, `cover-desktop` (1200w) for the stage and quick view. `next/image` with `unoptimized` + explicit sizes; the CDN already serves right-sized JPEGs.
- `fetchpriority="high"` + preload for the first stage poster (LCP). The tier-1 video starts after first paint + idle, and never on Save-Data / reduced motion.
- Previews are never preloaded; mounted on intent; one at a time; unmounted on leave; paused when off-screen.
- Fallback: a dominant-colour placeholder from the snapshot, never a broken image.
- Attribution: README + footer note: media © DeoVR and its creators, used for a non-commercial prototype.

---

## 5. Animation strategy

- **CSS first.** Transitions on `transform`/`opacity` only. Tokens: `--ease-out: cubic-bezier(.2,.7,.2,1)`, `--dur-1: 150ms`, `--dur-2: 250ms`, `--dur-3: 450ms`.
- **Card focus**: scale 1.03 + image brightness 1.06 + 1px inner light outline, 250ms. No box-shadow glow.
- **Preview**: opacity crossfade from cover to video once `playing` fires (prevents black flashes).
- **Stage swap**: crossfade (old out ~180ms, new in ~450ms) + 1.5% scale settle on the incoming frame. Rapid focus changes debounce so the stage never strobes.
- **Filmstrip focus**: tile scale 1.04 + 2px light outline, 250ms; strip recentres with smooth scroll (instant under reduced motion).
- **Quick view**: View Transitions API (`document.startViewTransition`) to morph the card cover into the quick-view media where supported; fade/scale fallback. Fall back to `motion` only if needed.
- **Queue add**: count badge ticks + toast; no flying thumbnails.
- **Reduced motion** (`prefers-reduced-motion: reduce`): no autoplay previews, no scales, crossfades ≤ 150ms, no view-transition morph.
- **Headset view**: no lateral movement; fades and small scales only.

---

## 6. Responsive strategy

- Breakpoints per design doc §12. Grid via CSS grid `repeat(auto-fill, minmax(var(--card-min), 1fr))` with `--card-min` tokenised (desktop 300px, headset 420px), plus container queries on the card for its internal layout.
- Fluid type with `clamp()`; headset view multiplies the root scale.
- The discovery bar becomes a horizontally scrollable chip row with edge fades at < 1024px; the Immersion filter becomes a bottom sheet.
- Quick view: right side sheet ≥ 1024px, full-height bottom sheet < 1024px, centred large panel in headset view.
- Touch: no hover dependency. The preview starts on long-press / explicit play in quick view; no autoplay on mobile data.

---

## 7. Accessibility

- Landmarks: `header`, `nav`, `main`, `section` with headings, `footer`. Single `h1` (visually the stage title or a visually hidden "DeoVR – VR videos").
- Cards: one link (title) as the primary target with the whole card clickable via stretched-link pattern; secondary actions are real buttons with `aria-label`s. Signature chips carry text equivalents (`aria-label="360 degree, 3D, 8K, 60 frames per second, camera: still"`).
- Keyboard: full tab order; arrow-key roving within stage alternates and the grid; `/` → search; `Esc` closes dialogs; focus is restored to the originating card on close.
- `<dialog>` for quick view with `aria-labelledby`, inert background, focus trap.
- `aria-live="polite"` region for queue/toast and result counts after filtering.
- Contrast: AA minimum for all text; AAA for metadata in headset view. Comfort uses shape + label, never colour alone.
- Reduced motion and reduced data (`prefers-reduced-data` where supported, `navigator.connection.saveData`) disable autoplay.
- Alt text: cover `alt` is the video title; decorative imagery `alt=""`.

---

## 8. Performance

Budgets (homepage, desktop, cold load on Vercel):
- LCP < 2.0s (stage cover, preloaded, 1200w ≈ 80–150KB).
- CLS < 0.02 (explicit aspect ratios everywhere).
- INP < 150ms (filters operate on in-memory data; transitions don't block).
- JS < 120KB gz for the homepage (no heavy libs; `three` lazy and off the critical path).

Techniques: static generation; fonts via `next/font` (Inter + Archivo, subset, `display: swap`, variable); `content-visibility: auto` on below-fold chapters; previews mounted only on intent; `IntersectionObserver` pauses any preview that leaves the viewport; filtering memoised; image `decoding="async"`.

---

## 9. Implementation phases

Each phase ends with: run the app → screenshot desktop (1440), mobile (390) and headset view → name the 3 biggest weaknesses → fix them → commit.

| # | Phase | Output |
|---|---|---|
| 0 | **Data snapshot** ✅ | `scripts/snapshot.mjs`, `src/data/*.json`: 141 real videos, 86 channels, curated |
| 0b | **Direction exploration** ✅ | `explore/` A/B/C in plain HTML; B chosen (design doc §6) |
| 1 | **Foundation** | Next.js + TS + Tailwind v4 scaffold, fonts, tokens, lint, Vercel config |
| 2 | **Visual system** | Tokens, `Button`, `Chip`, `Icon`, `FovGlyph`, `ComfortMeter`, `ImmersionSignature`; hidden `/system` page |
| 3 | **Shell** | `TopBar` (transparent → solid), Library menu, footer, view-mode provider (+ UA detection), `HeadsetDock` |
| 4 | **Viewfinder** | `Viewfinder`, `Stage` (tier 2 stills), `StageInfo`, `ShelfTabs`, `Filmstrip`/`FilmTile` with in-tile previews; keyboard + dwell focus. **Spike: one tier-1 loop end to end** (`stage-loops.mjs`) to de-risk the media pipeline early |
| 5 | **Grid** | `ShelfGrid` below the viewfinder, `VideoCard`, sticky compact bar, `PreviewVideo` controller |
| 6 | **Discovery** | `ImmersionFilter` (strip + grid), URL state, result counts, empty states |
| 7 | **Quick view + queue** | Dialog, expanded signature, warnings, more-like-this, queue tray, toasts |
| 8 | **Stage loops** | All featured tier-1 loops produced, framed by hand, posters, AV1/H.264 |
| 9 | **Chapters** | Calm places, All the way around, Creators, Categories |
| 10 | **Motion** | Stage crossfade + debounce, tile focus, quick view transition, reduced-motion pass |
| 11 | **Responsive** | Tablet + mobile (stage as window + info below, swipeable strip, sheets) |
| 12 | **Headset view** | Targets, dock, dwell timing, thumbstick behaviour, contrast; real Quest Browser check if available |
| 13 | **Accessibility** | Keyboard map, screen-reader pass (debounced live region), axe audit |
| 14 | **Performance** | Lighthouse, bundle check, LCP (stage poster), video weight |
| 15 | **Polish** | Visual QA, copy pass, README + process write-up (≤ 300 words) |

### Definition of done
- Deployed on Vercel; public GitHub repo; README with run instructions, design summary, media attribution.
- Desktop, mobile and headset view reviewed against screenshots after every phase.
- Lighthouse ≥ 95 on Performance / Accessibility / Best Practices on desktop.
- Process description drafted (`docs/process.md`): tools, approach, biggest-impact changes, next steps.

### Prototype status (2026-10-06)
The working first pass now includes the static catalogue, stage and featured strip, URL-backed discovery filters, grid and editorial chapters, pre-flight quick view, locally saved headset queue, responsive headset mode, keyboard search/grid navigation and reduced-motion handling. Three real high-resolution loops are available; other featured items use their sharp cover. The broader component tree above remains the direction for follow-up refactoring, not a claim that every item has shipped.

`npm run typecheck` and `npm run build` pass. Route and media-file HTTP checks pass. A browser surface is not connected in this session, so desktop/mobile/headset screenshot review and visual critique remain outstanding. Vercel's deployment MCP is also not connected, so no preview deployment has been created or verified.
