# DeoVR Homepage: Design Direction

Codename: **Viewfinder**
Status: implemented. Structure from round 1 (§6), spatial layer from round 2 (§14). All five explorations are previewable at `/directions` (`public/directions/`).
Last updated: 2026-10-06

---

## 1. The brief, restated

Redesign the deovr.com homepage into a modern, premium, immersive video *discovery* experience. Dark mode. Desktop **and** VR headset users as first-class. Keep it recognisably DeoVR. Ship a working coded prototype, not static screens.

Our reading of the brief: the grid and discovery are the product. The hero, the chrome, and the visual polish only matter to the extent that they help someone pick the next video.

---

## 2. What exists today (audit of deovr.com, 5 Oct 2026)

Screenshots: `docs/research/`.

### Structure
- Left sidebar (~230px, always open on desktop): Videos, Photos, Premium Content, Channels, Passthrough, DriveAI, Categories, All Playlists / My Subscriptions, Liked, Watch History, My Playlists / "Get DeoVR App".
- Top bar: hamburger, logo, centred search ("I'm looking for…"), Premium crown, Upload, Sign in.
- Feed header: "VR Videos" + `For You · New · Trending` pills + Feed Settings.
- A promo carousel (currently an app-download ad, "DeoVR Studio is Live") sharing row one with two video cards.
- Uniform 4-column grid of 5:3 thumbnails. Then "Top picks", a horizontal Categories strip, "Trending This Month", "Show more", footer.
- Card: thumbnail with duration, crown/flame icon badges, Watch Later / More on hover; avatar, title (1 line, truncated), channel · age, views · comments · likes.
- Hover plays a muted ~14-second preview (`/preview/14x1/{id}_300p.mp4`).

### What works (keep)
1. **The content.** The thumbnails are rich, colourful, and very varied: Antarctica, Sichuan opera, tiger sharks, Kathmandu by rickshaw, cosplay, FF7 machinima. The imagery should carry the visuals.
2. **Hover previews.** They already exist and they're the right idea. They're just underused.
3. **For You / New / Trending.** A clear, familiar feed model. Keep it.
4. **Creator identity.** Channel avatars and names give it a community / UGC feel, which sets it apart from studio-catalogue VR apps.
5. **"Play in VR" and comfort warnings** on the video page ("Flashing lights warning", "Motion warning"). The data exists. The homepage doesn't use it.

### What fails (product behaviour, not just looks)
1. **It's a YouTube clone in light mode.** The layout, card anatomy and sidebar all copy YouTube conventions. Nothing on the page says *immersive*. In a headset, a white page is a glare panel a few centimetres from your eyes.
2. **The information that matters for VR is missing from the UI, so creators burn it into thumbnails.** Look at the thumbnails: "VR180 3D 8K", "360°", "8K 3D", "180 / 3D" in the art, plus "[VR180 3D 8K]" in titles. That's creators working around the interface. Projection (180°/360°), stereo (3D/2D), resolution and frame rate all live in the data model (`projectionParams.viewAngle`, `resolution`, `fps`) but never appear on a card.
3. **The taxonomy mixes *what* with *how*.** `/categories` lists ~110 flat categories where `8k-vr`, `60-fps-vr`, `180-vr`, `mv-hevc-vr` and `10bit-vr` sit next to `city-vr`, `yoga-vr` and `cooking-vr`. People clearly want to filter by format, and the IA puts that in the wrong place.
4. **The hero is an ad.** The most valuable pixels on the page sell the app instead of showing an experience. Carousel arrows and dots hide the other slides.
5. **Repetition and low signal.** "Top picks" and "Trending This Month" open with the same two videos. Titles truncate to one line ("ANTARCTICA EXPEDITIO…"). Unlabelled crown/flame badges. Every card weighs the same, so nothing reads as the best thing to watch.
6. **Comfort is invisible.** A drone flyover, a rally car POV and a seated café scene look identical in the grid. In VR, camera motion is the biggest cause of a bad session (nausea). The video page has a "Motion warning", but you only see it after you've chosen.
7. **The chrome eats the content.** The sidebar takes ~16% of a 1440 viewport for links most visitors rarely use. Upload (a creator action) is a primary button for everyone.
8. **It ignores the headset.** Small targets (32px pills, 24px icon buttons), hover-only actions, tiny metadata text, and nav pinned to the top-left corner, which is the worst place to reach with a controller ray or your neck.

---

## 3. Problem definition

> Choosing a VR video costs more than choosing a flat one, and the page gives you less information to choose with.

A YouTube click costs a second and is easy to undo. A VR session means putting on the headset, adjusting it, settling in, often 10–30 minutes of full attention, and a real risk of discomfort. The *decision* carries more weight, so the information before the choice needs to be better.

The current homepage handles VR video like flat video and leaves the important questions unanswered:

- **Where will I be?** (place, subject)
- **How immersive is it?** (360° vs 180°, 3D vs 2D)
- **Will it look good in my headset?** (8K vs 4K, 60fps)
- **Will it feel OK?** (static tripod vs moving camera vs drone)
- **How long?**

---

## 4. Key user insights

1. **VR video is mostly about places.** The catalogue is dominated by travel, cities, nature, events and walking tours. People aren't choosing "a video", they're choosing *somewhere to be*. Discovery should let people browse by destination and by feeling, not only by recency.
2. **Format is a quality signal, not a technical detail.** Enthusiasts actively look for 8K / 3D / 180. They use it to judge whether something is worth their time (see the creator workaround in §2.2).
3. **Comfort is a filter people need and don't have.** "Calm, still camera, under 10 minutes" is a real intent (first-timers, evenings, sensitive users). "Fast, moving, adrenaline" is another.
4. **People curate on desktop and consume in the headset.** Browsing and reading are much easier on a laptop or phone. Watching happens in the headset. The existing "Watch Later" and "Play in VR" are rough versions of a desktop-to-headset handoff that the UI never frames as one.
5. **In a headset, reading is expensive and pointing is imprecise.** Text is less sharp (~20–25 pixels per degree), a controller ray jitters, hover is unreliable, and turning your head to reach a top corner is tiring. Headset UI needs fewer, larger, more spaced-out decisions.

### The user's primary job
**"Find something worth putting the headset on for, and be confident it will be good before I commit."**

### What makes someone explore another video?
- A preview that shows *what it's like to be there*, not just a title card.
- Seeing that adjacent content exists at a glance ("more like this", other places, the same creator).
- Low-risk browsing: previews, quick view and a queue let people collect options without committing.

### What should disappear from attention
Upload, footer links, account plumbing, feed settings, carousel controls, view/comment counts as primary data (they matter for social proof, so they stay, but secondary).

### What "premium" means here
Not gold or glass. It means **confidence and calm**: the content gets the space, metadata is precise and consistent, interactions respond immediately and feel solid, nothing is cluttered, and every visible element earns its place. Think a good cinema foyer or a Criterion shelf, not a nightclub.

---

## 5. Three directions explored

### Direction A: "Marquee" (cinematic streaming service)

| | |
|---|---|
| **Concept** | Present DeoVR like a premium streaming service: full-bleed autoplay hero, horizontal themed rails, editorial curation. |
| **Thesis** | Curation and cinema-grade presentation signal quality. |
| **IA** | Hero → rails ("Top picks", "Trending", "Travel", "Music & events", …) → categories. |
| **Navigation** | Transparent top bar over the hero; profile/library menu. |
| **Discovery model** | Browse horizontally by curated theme; little user-driven filtering. |
| **Hero** | Full-viewport looping preview with large title and Play. |
| **Visual language** | Deep black, big cinematic type, edge-to-edge imagery. |
| **Typography** | Calm, confident grotesk display face for titles, neutral sans for UI. |
| **Interaction** | Hover-expand cards, rail scrolling with arrows. |
| **Motion** | Slow crossfades, hero parallax. |
| **Desktop** | Strong. Familiar, polished. |
| **VR** | Medium. Rails work with a thumbstick, but hover-expand and small arrows are fragile under a ray pointer. |
| **Responsive** | Rails collapse well onto mobile. |
| **Tech** | Simple. Mostly layout and media. |
| **Risks** | Reads as a Netflix clone. Rails hide volume (DeoVR has a huge UGC catalogue, and rails show ~5 items each). Doesn't fix the VR-specific decision problem. Feels like a studio catalogue rather than a creator community. |
| **Why it might stand out** | Instant visual upgrade. But reviewers have seen it a hundred times. |

### Direction B: "Viewfinder" (focus-driven 10-foot UI)

| | |
|---|---|
| **Concept** | The homepage as a viewfinder. A large *stage* shows the focused video playing; a filmstrip below holds the options. Whatever has focus fills the stage with its preview and specs. One interaction model across desktop, TV and headset. |
| **Thesis** | Previewing *is* discovering. Show one thing well at a time. |
| **IA** | Stage (focused item) → filmstrip (current feed) → feed switcher (For you / New / Trending / categories). |
| **Navigation** | Console-style: arrow keys, thumbstick, focus moves; minimal top chrome. |
| **Discovery model** | Sequential, preview-led browsing. |
| **Hero** | There is no separate hero; the stage *is* the page. |
| **Visual language** | Near-black theatre, all light from the content, very little chrome. |
| **Typography** | Large titles, few sizes, spec line in small caps. |
| **Interaction** | Focus = preview. Strong, tactile selection states. |
| **Motion** | Stage crossfades on focus change; the filmstrip glides. |
| **Desktop** | Weak to medium. Low information density frustrates mouse users who want to scan 30 items. |
| **VR** | Excellent. Large targets, one decision at a time, works with thumbstick and ray. |
| **Responsive** | Hard on mobile; the stage and filmstrip compete for height. |
| **Tech** | Heavier: focus management, media orchestration, more bandwidth. |
| **Risks** | Kills the grid, which the brief explicitly emphasises. Hides breadth. Feels like a TV app on desktop. |
| **Why it might stand out** | Very immersive and VR-native. But it solves the headset at the expense of the desktop majority. |

### Direction C: "Field Guide" (immersion-aware discovery)

| | |
|---|---|
| **Concept** | Keep the grid, which is how people scan a huge UGC catalogue, and make it *VR-aware*. Every card shows the experience's **Immersion Signature** (field of view, depth, clarity, comfort). Discovery runs on two orthogonal facets, *what/where* (subject, place) and *how it feels* (format, comfort, length), instead of one flat list of 110 categories. |
| **Thesis** | Better pre-commitment information → more confident choices → more sessions. Make the questions VR viewers actually ask answerable at a glance. |
| **IA** | Featured stage → sticky discovery bar (feed + intents + format/comfort) → grid with editorial "chapters" → destinations → channels. |
| **Navigation** | Slim top bar; library in a menu; bottom dock in headset view. |
| **Discovery model** | Scan a grid, refine by intent and format, preview on hover/focus, quick view for the full pre-flight details, queue for the headset. |
| **Hero** | A featured *experience*, not an ad, with visible alternates instead of a hidden carousel. |
| **Visual language** | Editorial dark: warm near-black, content-led colour, a precise spec system, one accent. |
| **Typography** | Display face for places and features; Inter for UI (continuity with DeoVR, good at low PPD). |
| **Interaction** | Hover/focus previews, quick view, queue-to-headset, filters stored in the URL. |
| **Motion** | Purposeful: preview fades, quick-view transition, queue feedback. |
| **Desktop** | Strong. Dense enough to scan, rich enough to decide. |
| **VR** | Strong *if* we design a real headset mode (density, targets, dock, focus previews). |
| **Responsive** | Grid collapses naturally; facets become a scrollable chip row plus a sheet. |
| **Tech** | Moderate. Static data, URL state, media orchestration. |
| **Risks** | Can turn into a filter-heavy utility UI; needs editorial composition to feel premium, not database-like. Signature glyphs must be learnable without a legend. |
| **Why it might stand out** | It uses DeoVR's own data to fix a problem DeoVR's own creators are visibly working around. It shows product thinking, not just styling. |

### Comparison

Scored 1–5.

| Criterion | A Marquee | B Viewfinder | C Field Guide |
|---|---|---|---|
| Product quality | 3 | 3 | **5** |
| Differentiation | 2 | 4 | **4** |
| Fit with DeoVR (UGC, huge catalogue, grid) | 2 | 2 | **5** |
| Video discovery quality | 3 | 3 | **5** |
| VR relevance | 2 | **5** | 4 |
| Visual impact | **5** | 4 | 3 → 4 with B's stage |
| Feasibility | **5** | 3 | 4 |
| Shows product-design thinking | 2 | 4 | **5** |
| **Total** | 24 | 28 | **35 → 36** |

*Paper scores, before prototyping. Testing all three in code (`/directions`) changed the call: C was the most useful but felt safe, and B's weaknesses turned out to be fixable (see §6).*

---

## 6. Chosen direction: **Viewfinder** (B, with C's discovery layer)

*Revised 2026-10-06 after testing all three as coded prototypes (`/directions`, A–C).*

**Direction B "Viewfinder"** supplies the featured stage and a focusable strip of featured experiences. From **C "Field Guide"** we keep what makes the choice informed: the Immersion Signature, separating *what to see* from *how it feels*, quick view, the headset queue, and the grid as the main way to scan the catalogue.

Why the change: in the prototypes C was the most useful but felt safe. It read as a very good catalogue rather than a new way to choose VR video. B is the only direction where browsing itself feels immersive, and it's natively right for the headset (one decision at a time, large targets, focus-driven). The prototypes showed B's two weaknesses clearly, and both can be fixed:

| B weakness (seen in prototype) | Fix |
|---|---|
| 300p previews are blurry at stage size | Tiered media: self-hosted HQ loops for featured items; sharp cover on stage + preview inside the tile for everything else (§7, implementation plan §4) |
| No grid. Low breadth on desktop, and the brief asks for "a strong focus on the video grid" | Scroll past the viewfinder into a grid of the active shelf, with the Immersion filter. Focus-first on top, breadth below. |
| Feels like a TV app on desktop | Mouse dwell focuses tiles, scroll wheel and click work normally, keyboard arrows are an enhancement rather than a requirement |

Why not A: the most striking first screen and the weakest product answer. Below the hero it's rows of context-free thumbnails, with the same videos repeated across rows.
Why not C: kept as the discovery layer, not the lead.

### Product thesis

> **Every VR video is a window to somewhere. The homepage *is* a window: point at something and you're already looking through it. Before you commit, it tells you what it will feel like on the other side.**

### Design principles

1. **Focus previews with intent.** Focus on a featured alternate updates the stage; focus on a grid card previews inside that card. The viewer never runs two previews at once.
2. **Content is the colour.** UI chrome is neutral and quiet; the footage provides the richness. One accent, used for intent, never decoration.
3. **Answer the VR questions at a glance.** Field of view, depth, clarity, comfort and length, in the same place and the same form, every time.
4. **A clear first choice, breadth right below.** The featured experience gives one video room; the grid keeps the broader catalogue easy to scan.
5. **Separate *where* from *how*.** Shelves are subjects and places; the Immersion filter is format and comfort.
6. **Desktop curates, headset consumes.** The headset queue is first-class.
7. **Design for the ray, not the cursor.** Dwell, not hover; big targets; nothing in the corners.
8. **Never show a blurry frame.** If we don't have sharp motion, show a sharp still.

---

## 7. Information architecture

### Global navigation
**Top bar (desktop)**: DeoVR logo · primary nav (`Videos` `Photos` `Channels` `Passthrough` `Premium`) · search · **Headset queue** (count) · headset-view toggle · library menu.
- Moved into the avatar/Library menu: My Subscriptions, Liked, Watch History, My Playlists, Upload, DriveAI, All Playlists.
- Removed: the persistent sidebar.

**Bottom dock (headset view)**: Home · Search · Queue · Library · 2D view. Large, labelled, bottom-centre, with a persistent way back to desktop mode. It is a solid full-width band and the only fixed control layer in headset view: the discovery bar scrolls with the page, so controls never stack under a controller ray.

### Homepage, top to bottom

1. **Featured stage**: a real 360°/180° world you can drag to look around (self-hosted equirect loop for every featured item), with place, title, hook, Immersion Signature and **Step inside**, **Watch in VR**, **Queue** and **Details**. See §14.
2. **Featured strip**: seven direct alternates instead of a hidden carousel. Pointer dwell or keyboard focus crossfades the stage world to that place; controller-sized targets in headset mode.
3. **Where in the world**: 360° places drawn as little planets; point at one to unwrap it. It sits straight under the stage, not buried in the grid, because it's the quickest "try it" moment on the page. On phones it's one swipeable row so it doesn't push the grid down.
4. **Discovery bar**: **For you / New / Trending**, subject chips and one Immersion filter for field of view, depth, clarity, camera-motion estimate and length. **New to VR?** is a one-tap shortcut into that filter (still camera, 180°, under 10 minutes): the easiest possible first session, for the person most likely to bounce. It leads the chip row (not beside Immersion) so the phone bar stays two rows: feed tabs + Immersion, then chips. Filter state is linkable in the URL.
5. **Discovery grid**: real videos, creator, social proof and the compact Immersion Signature. Dwell/focus turns an immersive card into a look-around portal (flat and premium videos play DeoVR's preview clip instead); selecting a card opens quick view instead of navigating away.
6. **Editorial chapters** at whole-row breaks in the grid: "A quieter kind of somewhere" (still-camera places) and "Look closer" (8K stereo). Then **creators to follow** and a compact footer.

### Quick view (pre-flight)
The dialog is deep-linkable with `?v=<id>`. It opens on the same look-around world as the stage when an equirect source exists; otherwise it holds on the sharp cover. It includes creator, expanded Immersion Signature, comfort/flashing warnings, description, **Watch in DeoVR** / **Queue**, and more like this.

### Headset queue
A tray listing queued videos, with total runtime. **Send to your headset**: the tray shows a short link (`/?view=headset&queue=slug,slug`), short enough to type on a headset keyboard, that opens the same queue in headset view on the other device. This is the desktop-curates/headset-consumes handoff (§4.4) without needing an account. The UI says the queue is saved in this browser and handed over by link, not synced to an account.

---

## 8. The Immersion Signature

DeoVR's distinctive design asset is a compact, consistent, language-light description of *what an experience will feel like*. It's driven by real DeoVR data (`projectionParams.viewAngle`, stereo format, `resolution`, fps, motion/flashing warnings).

| Facet | Shown as | Values |
|---|---|---|
| Field of view | Label, emphasised (brightest item) | 180°, 360°, Flat |
| Depth | `3D` / `2D` | stereo vs mono |
| Clarity | `8K` / `6K` / `5K` / `4K` (+ `60fps` when ≥ 50; `8K 60fps` on compact rows) | from source resolution |
| Comfort | Word (`Still camera` on compact rows, labelled "Camera motion" in quick view) | Still · Gentle · Moving (+ flashing-light flag) |
| Length | `12:40` | duration |

Rules: **text only, no glyphs**, and same order everywhere. On cards and the stage it's one line of plain values separated by `·`; in quick view each item expands with a one-line plain-language explanation; in headset view the text grows.

Glyphs were tried first (an arc for field of view, `2D`/`8K` badges, motion bars), but most just repeated their own label ("2D 2D", "8K 8K") and competed with it. Without real icons for every facet, consistent text reads cleaner than a mix.

---

## 9. Visual language

### Mood
Editorial, cinematic and calm. Content-led. Restrained chrome. Think of dark cinema lobbies, film-festival programmes and premium photography books. **Not**: purple/blue AI gradients, glassmorphism, neon glow, gold, floating 3D objects, Vision Pro cosplay.

### Colour
- **Ground**: warm-neutral near-black, never `#000`. On OLED headsets pure black smears and on LCD it looks grey anyway, and pure black/white pairs cause halation. Surfaces step up in small lightness increments (OKLCH L ≈ 0.15 → 0.19 → 0.23 → 0.28).
- **Text**: off-white (L ≈ 0.94) for primary, two muted steps for secondary/tertiary. Body text never below ~4.5:1 contrast. Metadata in headset view ≥ 7:1.
- **Accent**: DeoVR's existing pink (`#FF5E99` / DeoVR gradient midpoint `#FD4488`), tuned for dark ground. Used only for the primary CTA, active/selected states, and the queue indicator. The blue→pink→orange brand gradient appears **only in the logo mark**.
- **Signal colours** (sparingly, comfort/warnings only): a calm green-teal for "Still", amber for "Moving"/flashing warnings.
- **Imagery treatment**: no colour overlays on thumbnails. Scrims only where text sits on imagery, built from the ground colour rather than black.

### Typography
- **UI/body: Inter.** Continuity with DeoVR, excellent hinting and legibility in a low-PPD headset, tabular numerals (`tnum`) for durations and counts. Weights 400/500/600 only; no thin weights (they shimmer in a headset).
- **Display: Instrument Sans 600.** Used for stage titles, place names and chapter headings, tracked slightly tighter than default (-0.02em, the `--display-tracking` token) but never cramped. It's clean, confident and a little wide: a calm, grown-up film-title feel that is clearly distinct from Inter without fighting it. Archivo was used first, condensed, heavy and tightly tracked, and it read cramped and immature. It lost a side-by-side against Inter Tight, Geist, Schibsted Grotesk, Hanken, Host, Funnel, Familjen, Onest and Fraunces. Sparingly: only at large sizes.
- Spec labels: Inter 500, small caps feel via uppercase + +4% tracking at ≥ 11px desktop / ≥ 15px headset.
- Scale (desktop): 12 / 14 / 16 / 20 / 28 / 40 / 64 / 88. Headset view: the whole scale × ~1.3, minimum 16px.

### Shape, space, depth
- Radii: small and consistent. 8px cards, 999px for chips/buttons only. No giant rounded slabs.
- Spacing: 4px base; generous section spacing (96–128px) so chapters breathe.
- Depth from **light and scale, not shadows and blur**: a focused card scales 1.0 → 1.03, its image brightens slightly and a thin 1–2px light outline appears. Blur is limited to the sticky bar (subtle) and the overlay behind dialogs.

---

## 10. Interaction principles

1. **Focus previews with intent.** Pointer dwell or keyboard focus on a featured alternate changes the stage. A short delay keeps the stage from thrashing when someone sweeps the pointer across the strip. A focused grid card previews in place. A single shared preview owner prevents simultaneous video playback.
2. **Every hover affordance has a focus and tap equivalent.** Hover, keyboard focus, controller focus and tap all reach the same states.
3. **Click the focused tile or a grid card → quick view, not a page change.** Browsing context is kept; Esc/back closes it; URL deep links work.
4. **Watch in DeoVR is always one action away** from the stage, quick view and the queue.
5. **Filters are direct manipulation**: toggles that apply immediately, with a result count and an easy reset. No "Apply" step on desktop.
6. **Feedback is immediate and specific**: "Added to headset queue · 3 videos · 47 min".
7. **Keyboard**: ←/→ move along the featured strip; in the grid, arrows move between cards. Enter opens quick view, `Q` queues the focused item, `/` focuses search. Tab order stays logical throughout.

### Motion principles
- 150–250ms ease-out for UI state; 400–600ms for stage swaps and quick view.
- Stage swaps are crossfades (old frame out, new frame in), never slides, so even rapid browsing doesn't sweep the eye sideways.
- Motion explains continuity (the card expanding into quick view, the stage crossfading), never decorates.
- No parallax, no scroll-jacking, no looping UI animation.
- `prefers-reduced-motion`: no autoplay previews (poster + explicit play), no scale on focus, crossfades only.
- Headset view: no large lateral motion (vection), so transitions are fades and small scales only.

---

## 11. VR / headset considerations

Headset view is a real mode, not a breakpoint. It's enabled automatically for headset browsers (Meta Quest Browser / `OculusBrowser`, Pico, Wolvic, visionOS Safari heuristics), and manually through the **Headset view** toggle (persisted, also `?view=headset`) so desktop reviewers can see it.

| Concern | Desktop convention we drop | Headset view behaviour |
|---|---|---|
| Target size | 24–32px icon buttons | ≥ 64px targets, ≥ 16px spacing between targets |
| Hover | Hover reveals actions/info | Nothing is hover-only; signature and key actions always visible |
| Previews | Hover dwell | Focus/pointer dwell 500ms; a clear "previewing" state |
| Navigation placement | Top-left hamburger, sidebar | Bottom-centre dock with labelled buttons (comfortable downward gaze; no reaching for corners) |
| Density | 4–6 columns | Viewfinder is the primary surface; filmstrip tiles ~1.3× larger; grid max 3 columns |
| Text | 12–14px metadata | Minimum 16px; metadata 18px; body 20px; no thin weights; higher contrast |
| Focus state | Thin browser outline | 3px off-white ring + 4px offset + slight scale; visible from a distance |
| Reading | Descriptions inline | Plain-language spec explanations in quick view; long text deferred |
| Scrolling | Free scroll | Thumbstick left/right moves along the filmstrip; vertical scroll snaps from viewfinder to grid rows |
| Motion | Parallax, slide-ins | Fades and small scales only; no lateral sweeps (vection/nausea) |
| Primary action | "Play" opens a page | **Watch in VR** launches immersive playback directly |
| Comfort | Warnings after choosing | Comfort shown up front; "Comfort: Still" filter |

Comfortable reading distance: the Quest browser places a ~1280–1600 CSS px wide panel at ~1.5m. At that distance 16px body text sits at the legibility floor, so headset view sets a 20px base.

Browsing while immersed: the queue means you can stay in the headset and step from one video to the next without coming back to search. The "More like this" rows in quick view support continuing from where you are.

---

## 12. Responsive principles

| Width | Layout |
|---|---|
| ≥ 1280 | Viewfinder fills the first viewport (stage + tray); grid 4–5 cols below; max content width 1760 |
| 1024–1279 | Viewfinder unchanged; info block narrows; grid 3 cols; primary nav condenses |
| 640–1023 | Stage shrinks to ~60vh; shelf tabs scroll horizontally; grid 2 cols; Immersion filter as a sheet |
| < 640 | Stage becomes a 5:3 window with the info block below it (no overlay); filmstrip stays swipeable; grid 1 col; quick view as a bottom sheet |

The grid is container-query driven where possible; type scales with `clamp()`; touch devices never depend on hover (previews start on scroll-into-view only when the user opts in, since data costs matter on mobile).

---

## 13. What we're deliberately *not* doing
- No WebXR *lobby*. A 3D spatial homepage would impress for ten seconds and slow down every choice after that. Headset view stays a 2D panel optimised for the way headset browsers render the web. WebXR appears only as an opt-in "Enter VR" on a chosen world (see §14).
- No redesign of the video player or watch page. Quick view covers the pre-watch decision, which is the discovery problem.
- No fabricated personalisation. "For you" is presented as the existing algorithmic feed; we don't invent AI features.

---

## 14. Revision (6 Oct 2026): Window, made literal

After the foundation above, we prototyped two WebGL spikes (`/directions` D and E) and changed one rule: **3D is allowed when it shows the content's real geometry, never as decoration.** DeoVR serves full equirectangular source files, so the homepage can show what being there looks like instead of a flat thumbnail.

What changed:
- **Real media.** `scripts/media.mjs` extracts a left-eye equirect still per immersive video and short stage loops from DeoVR's own files, self-hosted (signed source URLs expire after 24h).
- **Stage = a world.** The featured item is a draggable 180°/360° view with a heading compass. Alternates crossfade the world itself (from the Inside-out spike). "Step inside" expands it to the viewport; "Enter VR" (WebXR, when supported) wraps it around the viewer.
- **Phones are windows too.** On touch devices the compass becomes a **Tilt to look** toggle: device orientation turns the view, so the phone is a magic window onto the place (the same idea as the headset, in your hand). Opt-in (iOS asks for motion access on the tap), composes with dragging, and switches itself off if no sensor readings arrive.
- **Portal cards.** Hover, focus or controller dwell turns a card into a look-around window, drawn by one shared canvas behind the page. Flat or premium items keep DeoVR's preview clip.
- **Where in the world.** 360° places drawn as little planets; the silhouette *is* the field of view. Pointing at one unwraps it.
- **Quick view** gets the same look-around world: pre-flight means seeing the place, not just reading specs.
- **Curation.** "For you" keeps DeoVR's ordering but leads with places; chapters are place-led.

Unchanged: the grid, the Immersion Signature, quick view as the decision point, headset view, one accent, content as the colour. Motion stays user-driven (a slow idle drift on 360° stages is the only exception and is disabled under reduced motion).
