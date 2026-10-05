# DeoVR Homepage: Redesign Prototype

A design-challenge prototype that reimagines the deovr.com homepage as a dark, VR-aware video discovery experience.

- Design direction: [`docs/design-direction.md`](docs/design-direction.md)
- Implementation plan: [`docs/implementation-plan.md`](docs/implementation-plan.md)
- Process summary: [`docs/process.md`](docs/process.md)
- Current-site audit screenshots: [`docs/research/`](docs/research/)
- Direction explorations (plain HTML, no build): open [`explore/index.html`](explore/index.html) in a browser
- Data snapshot: `node scripts/snapshot.mjs` → `src/data/*.json` + `explore/data.js`

Status: working prototype on branch `feat/deovr-spatial-cinema`. The static catalogue, discovery filters, featured stage, quick view, headset queue and responsive headset mode are implemented. `npm run typecheck` and `npm run build` pass. Desktop/mobile/headset screenshot review and Vercel preview are still pending.

Run locally with `npm install` followed by `npm run dev`. Production checks: `npm run typecheck` and `npm run build`.

Media and catalogue data belong to DeoVR and its creators and are used only for this non-commercial design prototype.
