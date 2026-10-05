# Process

**Tools.** Claude Code for strategy, prototyping and the build, with Codex producing a parallel baseline that I folded in. Playwright for screenshot reviews at desktop, mobile and headset sizes. No Figma: every direction was explored as working code.

**Approach.** I started by auditing deovr.com. The biggest problem wasn't visual. Choosing a VR video costs more than choosing a flat one (headset on, twenty minutes of attention, a real chance of motion sickness), yet the page gives you less to decide with. Creators bake "8K 3D 180°" into their thumbnails because the UI never shows it.

So the thesis became: every VR video is a window to somewhere, and the homepage should let you look through it before you step in. I built two throwaway WebGL spikes (portals inside a grid, and standing inside the world itself) and merged the strongest parts of each.

**What had the biggest impact.**
1. Real 360° and 180° media on the homepage. A script extracts a left-eye equirectangular still for each video from DeoVR's own source files, plus short loops for the featured stage. Hover a card and it becomes a window you can look around in.
2. The featured stage is a world you can drag. "Step inside" takes it full screen, and on a Quest, "Enter VR" wraps it around you with WebXR.
3. "Where in the world": 360° places shown as little planets, so the shape itself tells you the field of view.
4. The Immersion Signature (field of view, depth, clarity, comfort, length) on every card, and a headset view with large targets and a bottom dock.

**With more time.** Stereo 3D previews in WebXR, comfort data set by creators rather than estimated from tags, sessions with real viewers on Quest, and a performance pass on the initial bundle.
