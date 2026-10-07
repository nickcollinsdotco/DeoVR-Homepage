# DeoVR Homepage: Redesign Prototype

A redesign of the [deovr.com](https://deovr.com) homepage as a dark, VR-aware discovery experience, built for the DeoVR / SLR design challenge.

**Live:** [deo-vr-homepage.vercel.app](https://deo-vr-homepage.vercel.app) · [headset view](https://deo-vr-homepage.vercel.app/?view=headset) · [directions explored](https://deo-vr-homepage.vercel.app/directions)

**Every VR video is a window to somewhere.** The homepage lets you look through it before you step in, and tells you what it will feel like: field of view, depth, clarity, comfort and length.

## What's in it

- **A world, not a hero banner.** The featured stage is a real 360°/180° scene you can drag to look around. Pointing at an alternate crossfades the world itself. *Step inside* takes it full screen; *Enter VR* (WebXR, e.g. Quest Browser) wraps it around you. On a phone, tap the compass and *tilt to look*.
- **Portal cards.** Hover, focus or dwell on an immersive card and it becomes a window you can look around in, without baked-in thumbnail text.
- **Where in the world.** 360° places drawn as little planets; the shape is the field of view. Point at one to unwrap it.
- **The Immersion Signature** on every card (field of view · depth · clarity · comfort estimate · length), a pre-flight quick view, URL-driven filters that separate *where* from *how it feels*, a **New to VR?** shortcut (still camera, 180°, under 10 minutes), a headset queue you can send to your headset by link, and a first-class **headset view** (`?view=headset`).
- **Directions explored** at [`/directions`](public/directions/): the five coded explorations behind the final design, previewable with limited functionality.

All media is real DeoVR content. Equirect stills and stage loops are extracted from DeoVR's own source files by `scripts/media.mjs` and self-hosted.

## Docs

| | |
|---|---|
| [`docs/design-direction.md`](docs/design-direction.md) | Audit, problem, directions, decisions (the why) |
| [`docs/implementation-plan.md`](docs/implementation-plan.md) | Architecture, media pipeline, rendering, build log (the how) |
| [`docs/process.md`](docs/process.md) | Process summary for the submission (≤ 300 words) |
| [`docs/research/`](docs/research/) | Screenshots of the current site |
| [`CLAUDE.md`](CLAUDE.md) | Rules for AI agents working in this repo |

## Run it

```bash
npm install
npm run dev        # http://localhost:3000 (also on your LAN, for a headset browser)
```

| Command | |
|---|---|
| `npm run build` | Static production build |
| `npm run typecheck` / `npm run lint` | Checks |
| `npm run data:snapshot` | Refresh the catalogue snapshot from deovr.com |
| `npm run data:media` | Re-extract equirect stills and stage loops (`--loops id,id`, `--only-loops`, `--force`) |

Built with Next.js 16, React 19, TypeScript, Tailwind v4 and three.js (lazy-loaded, off the critical path).

## Structure

```
src/app          layout, page, global styles entry
src/styles       CSS by area: tokens, shell, stage, cards, headset, immersive…
src/components   HomePage + shell / stage / discovery / chapters / video / quickview / queue / immersive / ui
src/lib          catalog, filters (URL state), format, immersive (shader, WebXR, portal registry)
src/data         catalogue snapshot + editorial curation
public/media     self-hosted equirect stills and loops
public/directions  coded explorations A–E
scripts          snapshot.mjs, media.mjs
```

---

Media and catalogue data belong to DeoVR and its creators and are used only for this non-commercial design prototype.
