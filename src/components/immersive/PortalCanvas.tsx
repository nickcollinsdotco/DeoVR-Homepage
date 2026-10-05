"use client";

import { useEffect, useRef } from "react";
import { portals } from "@/lib/immersive/portals";

// One fixed, full-viewport canvas behind the page. Each frame it draws every visible portal into
// its card's rectangle; the card's cover fades out (via --portal) to reveal it. Cards without an
// equirect still never register, so they keep the flat hover preview.
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

      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        const W = window.innerWidth, H = window.innerHeight, pr = renderer.getPixelRatio();
        fit(W, H);
        renderer.setScissorTest(false);
        renderer.setClearColor(0x000000, 0);
        renderer.clear();
        renderer.setScissorTest(true);
        const k = reduced.matches ? 60 : 1;
        for (const p of portals.values()) {
          const r = p.el.getBoundingClientRect();
          // only fetch stills for cards near the viewport
          if (r.bottom < -400 || r.top > H + 400 || r.width < 2) continue;
          const tex = stillTexture(p.src, p.full);
          const ready = isReady(tex);
          const planet = p.mode === "planet";
          p.fade = damp(p.fade, p.active && ready ? 1 : 0, 9 * k, dt);
          p.morph = damp(p.morph, planet && !p.active ? 1 : 0, 5 * k, dt);
          const range = p.full ? Math.PI * 0.95 : Math.PI / 2 - 0.62;
          const sweep = p.auto && !reduced.matches ? Math.sin(now / 2600) * 0.7 : 0;
          p.yaw = damp(p.yaw, (p.auto ? sweep : p.nx) * range, 6, dt);
          p.pitch = damp(p.pitch, -p.ny * 0.38, 6, dt);
          const show = planet ? ready : p.fade > 0.004;
          const cover = planet ? (ready ? 1 : 0) : p.fade;
          p.el.style.setProperty("--portal", cover.toFixed(3));
          if (show) p.el.dataset.portal = ""; else delete p.el.dataset.portal;
          if (!show || r.bottom < 0 || r.top > H) continue;
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
