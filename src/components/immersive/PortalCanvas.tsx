"use client";

import { useEffect, useRef } from "react";
import type { Portal } from "@/lib/immersive/portals";
import { portals, portalsVersion } from "@/lib/immersive/portals";

// One fixed, full-viewport canvas behind the page. It draws every visible portal into its card's
// rectangle; the card's cover fades out (via --portal) to reveal it. Cards without an equirect
// still never register, so they keep the flat hover preview.
export default function PortalCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let raf = 0;
    let stopped = false;
    let cleanup = () => {};
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const start = async () => {
      const { createView, stillTexture, isReady, damp, GROUND, SURFACE } = await import("@/lib/immersive/equirect");
      if (stopped) return;
      let view: ReturnType<typeof createView>;
      try { view = createView(canvas); } catch { return; } // no WebGL: covers + flat previews remain
      const { renderer, u, fit, draw } = view;
      let last = performance.now();
      let drawnAt = 0;
      let drawnKey = "";
      const settled = (a: number, b: number) => Math.abs(a - b) < 0.001;

      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        const W = window.innerWidth, H = window.innerHeight, pr = renderer.getPixelRatio();
        const k = reduced.matches ? 60 : 1;

        // 1. Advance every portal near the viewport. Open at a deliberate pace, close faster.
        let moving = false;
        const visible: { p: Portal; r: DOMRect; tex: ReturnType<typeof stillTexture> }[] = [];
        for (const p of portals.values()) {
          const r = p.el.getBoundingClientRect();
          if (r.bottom < -400 || r.top > H + 400 || r.width < 2) continue; // only fetch stills near the viewport
          const tex = stillTexture(p.src, p.full);
          const ready = isReady(tex);
          const planet = p.mode === "planet";
          const fadeTo = p.active && ready ? 1 : 0;
          const morphTo = planet && !p.active ? 1 : 0;
          const range = p.full ? Math.PI * 0.95 : Math.PI / 2 - 0.62;
          const yawTo = p.nx * range, pitchTo = -p.ny * 0.38;
          p.fade = damp(p.fade, fadeTo, (fadeTo > p.fade ? 9 : 16) * k, dt);
          p.morph = damp(p.morph, morphTo, (morphTo < p.morph ? 5 : 9) * k, dt);
          p.yaw = damp(p.yaw, yawTo, 6, dt); // pointer-follow with momentum, not a rigid 1:1
          p.pitch = damp(p.pitch, pitchTo, 6, dt);
          moving ||= !ready || !settled(p.fade, fadeTo) || !settled(p.morph, morphTo) || !settled(p.yaw, yawTo) || !settled(p.pitch, pitchTo);

          const show = planet ? ready : p.fade > 0.004;
          const cover = Math.round((planet ? (ready ? 1 : 0) : p.fade) * 1000) / 1000;
          // Write to the DOM only on change: a CSS variable recalculates the card's subtree.
          if (cover !== p.shown) { p.el.style.setProperty("--portal", String(cover)); p.shown = cover; }
          if (show !== "portal" in p.el.dataset) { if (show) p.el.dataset.portal = ""; else delete p.el.dataset.portal; }
          if (show && r.bottom > 0 && r.top < H) visible.push({ p, r, tex });
        }

        // 2. Redraw only when something moved: animation, scroll, resize or a registry change.
        //    A slow safety redraw catches layout shifts nothing announces (e.g. a font swap).
        const key = `${window.scrollX},${window.scrollY},${W},${H},${portalsVersion()}`;
        if (!moving && key === drawnKey && now - drawnAt < 500) return;
        drawnKey = key;
        drawnAt = now;

        fit(W, H);
        renderer.setScissorTest(false);
        renderer.setClearColor(0x000000, 0);
        renderer.clear();
        renderer.setScissorTest(true);
        for (const { p, r, tex } of visible) {
          const planet = p.mode === "planet";
          renderer.setViewport(r.left, H - r.bottom, r.width, r.height);
          renderer.setScissor(r.left, H - r.bottom, r.width, r.height);
          u.uMapA.value = tex;
          u.uHalfA.value = p.full ? 0 : 1;
          u.uMix.value = 0;
          u.uYaw.value = p.yaw;
          u.uPitch.value = p.pitch;
          u.uVfov.value = 1.25;
          u.uAspect.value = r.width / r.height;
          u.uMorph.value = planet ? p.morph : 0;
          u.uFade.value = planet ? 1 : p.fade;
          u.uPlanet.value = p.full ? 1.85 : 1.2;
          u.uOffset.value.set(0, p.full ? 0 : 0.72);
          u.uCut.value = p.full ? 0.45 : 0.5;
          u.uBg.value.copy(planet ? SURFACE : GROUND);
          u.uRadius.value = 8 * pr;
          u.uSize.value.set(r.width * pr, r.height * pr);
          u.uVignette.value = 0;
          draw();
        }
      };
      raf = requestAnimationFrame(frame);
      cleanup = () => view.dispose();
    };

    // Load the engine once the page is idle, so first hover is instant but LCP is untouched.
    const idle = typeof window.requestIdleCallback === "function"
      ? window.requestIdleCallback(() => void start(), { timeout: 2500 })
      : setTimeout(() => void start(), 1200) as unknown as number;

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle); else clearTimeout(idle);
      cleanup();
    };
  }, []);

  return <canvas ref={ref} className="portal-canvas" aria-hidden="true" />;
}
