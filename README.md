# DeoVR Homepage: Redesign Prototype

A design-challenge prototype that reimagines the deovr.com homepage as a dark, VR-aware video discovery experience.

- Design direction: [`docs/design-direction.md`](docs/design-direction.md)
- Implementation plan: [`docs/implementation-plan.md`](docs/implementation-plan.md)
- Process summary: [`docs/process.md`](docs/process.md)
- Current-site audit screenshots: [`docs/research/`](docs/research/)
- Direction explorations (plain HTML, no build): serve the repo root (e.g. `python -m http.server`) and open `/explore/portals.html` or `/explore/insideout.html`
- Data snapshot: `node scripts/snapshot.mjs` → `src/data/*.json` + `explore/data.js`
- Immersive media: `node scripts/media.mjs` → `public/media/eq/*.jpg` (equirect stills) + `public/media/loop/*.mp4` (stage loops) + `src/data/media.json`

## What's in it
- **A world, not a hero banner.** The featured stage is a real 360°/180° scene you can drag to look around. Alternates crossfade the world; *Step inside* goes full screen; *Enter VR* (WebXR, e.g. Quest Browser) wraps it around you.
- **Portal cards.** Hover or focus a card and it turns into a window into that place.
- **Where in the world.** 360° places as little planets that unwrap when you point at them.
- **Immersion Signature** on every card (field of view, depth, clarity, comfort estimate, length), pre-flight quick view, URL-driven filters, headset queue, and a headset view (`?view=headset`).

Built with Next.js 16, React 19, TypeScript, Tailwind v4 and three.js (lazy-loaded, off the critical path).

Run locally: `npm install`, then `npm run dev`. Checks: `npm run typecheck`, `npm run lint`, `npm run build`.

Media and catalogue data belong to DeoVR and its creators and are used only for this non-commercial design prototype.
