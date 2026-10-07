"use client";

import { useEffect, useRef, useState } from "react";
import type { Texture } from "three";
import { Icon } from "@/components/ui/Icons";

type Source = { key: string; full: boolean; still?: string; loop?: string };
type OrientationPermission = { requestPermission?: () => Promise<string> };

// The stage's living media: a real 360°/180° world you can drag to look around. Switching
// featured items crossfades the world itself. "Step inside" FLIPs the world to the full viewport.
// On phones, "Tilt to look" turns the device into a window onto the world (device orientation).
export default function WorldStage({ source, inside, title, watchHref, onExit }: { source: Source; inside: boolean; title: string; watchHref: string; onExit: () => void }) {
  const worldRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wedgeRef = useRef<SVGPathElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const api = useRef<{ setSource: (s: Source) => void; nudge: (dyaw: number, dpitch: number) => void; tilt: (on: boolean) => void; enterVR: () => Promise<void> } | null>(null);
  const [vr, setVr] = useState(false);
  const [tiltable, setTiltable] = useState(false);
  const [tilt, setTilt] = useState(false);
  const sourceRef = useRef(source);
  const insideRef = useRef(inside);

  useEffect(() => {
    const canvas = canvasRef.current, world = worldRef.current;
    if (!canvas || !world) return;
    let raf = 0, stopped = false;
    let cleanup = () => {};
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    void (async () => {
      const { createView, stillTexture, loopTexture, isReady, damp, enterVR, vrSupported } = await import("@/lib/immersive/equirect");
      void vrSupported().then((ok) => { if (!stopped) setVr(ok); });
      if (stopped) return;
      let view: ReturnType<typeof createView>;
      try { view = createView(canvas, { alpha: false }); } catch { return; }
      // Touch devices with a motion sensor; never in headset view (the headset already is the window).
      setTiltable(typeof DeviceOrientationEvent !== "undefined" && window.matchMedia("(pointer: coarse)").matches && document.documentElement.dataset.view !== "headset");
      const { renderer, u, fit, draw } = view;
      const videos = new Map<string, HTMLVideoElement>();

      type Layer = { s: Source; t: Texture };
      const texFor = (s: Source): Texture | null => {
        if (s.loop && !reduced) {
          let el = videos.get(s.key);
          if (!el) {
            el = Object.assign(document.createElement("video"), { src: s.loop, muted: true, loop: true, playsInline: true, preload: "auto" });
            videos.set(s.key, el);
          }
          void el.play().catch(() => {});
          return loopTexture(el);
        }
        return s.still ? stillTexture(s.still, s.full) : null;
      };
      const st = { cur: null as Layer | null, next: null as Layer | null, mix: 0, fade: 0, yaw: 0, pitch: 0, tyaw: 0, tpitch: 0, vyaw: 0, vfov: 1.15, idle: 0, drag: null as null | { x: number; y: number }, tilt: false };
      // Crossfades are interruptible: a new world arriving mid-fade continues from what is on
      // screen (the dominant layer stays, the fainter one is swapped) instead of restarting.
      const setSource = (s: Source) => {
        const t = texFor(s);
        if (!t) return;
        if (!st.cur) { st.cur = { s, t }; return; }
        if (st.next?.s.key === s.key || (!st.next && st.cur.s.key === s.key)) return;
        if (!st.next) { st.next = { s, t }; st.mix = 0; return; }
        if (st.cur.s.key === s.key) { [st.cur, st.next] = [st.next, st.cur]; st.mix = 1 - st.mix; return; }
        if (st.mix > 0.5) { st.cur = st.next; st.mix = 1 - st.mix; }
        st.next = { s, t };
      };
      setSource(sourceRef.current);

      // 180° worlds: stop the view edge at the hemisphere's rim, whatever the viewport aspect
      const limit = (s: Source) => {
        if (s.full) return Infinity;
        const hfov = 2 * Math.atan(Math.tan(st.vfov / 2) * (canvas.clientWidth / Math.max(1, canvas.clientHeight)));
        return Math.max(0, Math.PI / 2 - hfov / 2 - 0.02);
      };
      const onDown = (e: PointerEvent) => { st.drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); };
      const onMove = (e: PointerEvent) => {
        if (!st.drag) return;
        const k = st.vfov / canvas.clientHeight;
        st.tyaw -= (e.clientX - st.drag.x) * k; st.tpitch += (e.clientY - st.drag.y) * k;
        st.vyaw = -(e.clientX - st.drag.x) * k * 50;
        st.drag = { x: e.clientX, y: e.clientY }; st.idle = 0;
      };
      const onUp = () => { st.drag = null; };
      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerup", onUp);
      canvas.addEventListener("pointercancel", onUp);

      // Tilt: where the phone's back camera points (W3C device frame: x east, y north, z up), applied
      // as deltas, so it composes with dragging and the view doesn't jump to the phone's heading.
      let aim: { yaw: number; pitch: number } | null = null;
      let heard: ReturnType<typeof setTimeout> | undefined;
      const onOrient = (e: DeviceOrientationEvent) => {
        if (e.alpha == null || e.beta == null || e.gamma == null) return;
        clearTimeout(heard);
        const r = Math.PI / 180, ca = Math.cos(e.alpha * r), sa = Math.sin(e.alpha * r), cb = Math.cos(e.beta * r), sb = Math.sin(e.beta * r), cg = Math.cos(e.gamma * r), sg = Math.sin(e.gamma * r);
        const fx = -ca * sg - sa * sb * cg, fy = -sa * sg + ca * sb * cg, fz = -cb * cg;
        if (Math.abs(fz) > 0.97) { aim = null; return; } // pointing straight up/down: heading is undefined
        const next = { yaw: Math.atan2(fx, fy), pitch: Math.asin(fz) };
        if (aim) {
          const d = next.yaw - aim.yaw;
          st.tyaw += d - 2 * Math.PI * Math.round(d / (2 * Math.PI));
          st.tpitch += next.pitch - aim.pitch;
        }
        aim = next; st.vyaw = 0; st.idle = 0;
      };
      const tilt = (on: boolean) => {
        st.tilt = on; aim = null; clearTimeout(heard);
        window.removeEventListener("deviceorientation", onOrient);
        if (!on) return;
        window.addEventListener("deviceorientation", onOrient);
        heard = setTimeout(() => { tilt(false); if (!stopped) setTilt(false); }, 1500); // no sensor after all
      };

      // Don't render (or decode the loop) while the stage is scrolled out of view.
      let visible = true;
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        const el = st.cur && videos.get(st.cur.s.key);
        if (el) void (visible ? el.play().catch(() => {}) : el.pause());
      });
      io.observe(world);

      let last = performance.now();
      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        const w = canvas.clientWidth, h = canvas.clientHeight;
        if (!st.cur || w < 2 || (!visible && !insideRef.current)) return;
        fit(w, h);
        if (st.next && isReady(st.next.t)) {
          st.mix = damp(st.mix, 1, reduced ? 40 : 3.2, dt);
          if (st.mix > 0.995) {
            videos.forEach((el, key) => { if (key !== st.next!.s.key) el.pause(); });
            st.cur = st.next; st.next = null; st.mix = 0;
          }
        }
        if (isReady(st.cur.t)) st.fade = damp(st.fade, 1, 3, dt);
        if (!st.drag) {
          st.tyaw += st.vyaw * dt; st.vyaw = damp(st.vyaw, 0, 3, dt); st.idle += dt;
          // A slow idle drift says "this is 360°". Never in headset view (lateral motion → vection).
          const headset = document.documentElement.dataset.view === "headset";
          if (st.idle > 2.5 && !reduced && !headset && st.cur.s.full && !insideRef.current) st.tyaw += dt * 0.03;
        }
        const L = Math.min(limit(st.cur.s), st.next ? limit(st.next.s) : Infinity);
        st.tyaw = Math.max(-L, Math.min(L, st.tyaw));
        st.tpitch = Math.max(-0.85, Math.min(0.85, st.tpitch));
        const follow = st.tilt ? 22 : 9; // tilt tracks the hand closely; drag keeps its momentum feel
        st.yaw = damp(st.yaw, st.tyaw, follow, dt);
        st.pitch = damp(st.pitch, st.tpitch, follow, dt);
        const wide = insideRef.current ? (st.cur.s.full ? 1.55 : 1.3) : 1.15;
        st.vfov = damp(st.vfov, wide, 4, dt);
        u.uMapA.value = st.cur.t; u.uHalfA.value = st.cur.s.full ? 0 : 1;
        u.uMapB.value = st.next?.t ?? st.cur.t; u.uHalfB.value = (st.next?.s ?? st.cur.s).full ? 0 : 1; u.uMix.value = st.next ? st.mix : 0;
        u.uYaw.value = st.yaw; u.uPitch.value = st.pitch; u.uVfov.value = st.vfov; u.uAspect.value = w / h;
        u.uFade.value = st.fade; u.uMorph.value = 0; u.uRadius.value = 0; u.uVignette.value = insideRef.current ? 0.15 : 0.3; u.uSize.value.set(w, h);
        renderer.setViewport(0, 0, w, h);
        draw();
        const fadeShown = st.fade.toFixed(3); // write only on change: the variable restyles the subtree
        if (world.style.getPropertyValue("--world") !== fadeShown) world.style.setProperty("--world", fadeShown);
        const wedge = wedgeRef.current;
        if (wedge) {
          const deg = (st.yaw * 180) / Math.PI;
          wedge.style.transform = `rotate(${st.cur.s.full ? deg : Math.max(-90, Math.min(90, deg))}deg)`;
        }
      };
      raf = requestAnimationFrame(frame);

      api.current = {
        setSource,
        nudge: (dy, dp) => { st.tyaw += dy; st.tpitch += dp; st.idle = 0; },
        tilt,
        enterVR: async () => {
          const layer = st.next ?? st.cur;
          if (!layer) return;
          cancelAnimationFrame(raf);
          try { await enterVR(renderer, layer.t, layer.s.full); } catch { /* session refused: stay in 2D */ }
          if (!stopped) raf = requestAnimationFrame(frame);
        },
      };
      cleanup = () => {
        io.disconnect();
        tilt(false);
        canvas.removeEventListener("pointerdown", onDown);
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerup", onUp);
        canvas.removeEventListener("pointercancel", onUp);
        videos.forEach((el) => { el.pause(); el.removeAttribute("src"); el.load(); });
        view.dispose();
      };
    })();

    return () => { stopped = true; cancelAnimationFrame(raf); cleanup(); api.current = null; };
  }, []);

  useEffect(() => { sourceRef.current = source; api.current?.setSource(source); }, [source]);

  // Step inside: the world is laid out full-viewport, then FLIPped from its slot with transform +
  // clip-path only (no layout properties), so the canvas keeps one drawing-buffer size throughout.
  useEffect(() => {
    insideRef.current = inside;
    const world = worldRef.current;
    if (!world) return;
    const slot = world.parentElement!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const slotPose = () => {
      const r = slot.getBoundingClientRect(), W = window.innerWidth, H = window.innerHeight;
      const s = Math.max(r.width / W, r.height / H);
      const dx = (W * s - r.width) / 2, dy = (H * s - r.height) / 2;
      return { transform: `translate(${r.left - dx}px, ${r.top - dy}px) scale(${s})`, clipPath: `inset(${dy / s}px ${dx / s}px round ${8 / s}px)` };
    };
    const fullPose = { transform: "none", clipPath: "inset(0px 0px round 0px)" };

    if (inside) {
      world.classList.remove("is-landing");
      world.classList.add("is-inside");
      Object.assign(world.style, slotPose());
      document.documentElement.classList.add("world-open");
      const frame = requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!reduced) world.classList.add("is-flying");
        Object.assign(world.style, fullPose);
        backRef.current?.focus({ preventScroll: true });
      }));
      const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onExit(); };
      window.addEventListener("keydown", onKey);
      return () => { cancelAnimationFrame(frame); window.removeEventListener("keydown", onKey); };
    }

    if (!world.classList.contains("is-inside")) return;
    document.documentElement.classList.remove("world-open");
    world.classList.remove("is-flying");
    if (!reduced) world.classList.add("is-landing");
    Object.assign(world.style, slotPose());
    const done = () => { world.classList.remove("is-inside", "is-landing"); world.removeAttribute("style"); };
    const t = setTimeout(done, reduced ? 0 : 320);
    return () => clearTimeout(t);
  }, [inside, onExit]);

  // iOS asks for motion access, and only from inside the tap itself (no awaits before the request).
  const toggleTilt = () => {
    if (tilt) { api.current?.tilt(false); setTilt(false); return; }
    const DOE = DeviceOrientationEvent as unknown as OrientationPermission;
    void (DOE.requestPermission ? DOE.requestPermission() : Promise.resolve("granted")).then((answer) => {
      if (answer === "denied") return; // anything else: listen, and fall back if no readings arrive
      api.current?.tilt(true); setTilt(true);
    }).catch(() => {});
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = 0.18;
    const map: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (!map[e.key]) return;
    e.preventDefault();
    api.current?.nudge(...map[e.key]);
  };

  return (
    <div className="world" ref={worldRef}>
      <canvas ref={canvasRef} className="world-canvas" tabIndex={0} aria-label={`${source.full ? "360" : "180"}-degree view of ${title}. Drag or use arrow keys to look around.`} onKeyDown={onKeyDown} />
      <Compass as={tiltable ? "button" : "div"} tilt={tilt} onClick={tiltable ? toggleTilt : undefined}>
        <svg viewBox="0 0 44 44" width="40" height="40" aria-hidden="true">
          {source.full
            ? <circle cx="22" cy="22" r="19" fill="none" stroke="currentColor" strokeWidth="2" />
            : <><path d="M3 26a19 19 0 0 1 38 0" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M2 26h40" stroke="currentColor" strokeWidth="2" opacity=".35" /></>}
          <path ref={wedgeRef} className="world-wedge" style={{ transformOrigin: source.full ? "22px 22px" : "22px 26px" }} d={source.full ? "M22 22L12.5 5.5A19 19 0 0 1 31.5 5.5Z" : "M22 26L12.5 9.5A19 19 0 0 1 31.5 9.5Z"} fill="currentColor" opacity=".5" />
          <circle cx="22" cy={source.full ? 22 : 26} r="2.5" fill="currentColor" />
        </svg>
        <span>{source.full ? "360°" : "180°"} · {tiltable ? (tilt ? "tilting" : "tilt to look") : "drag to look"}</span>
      </Compass>
      {inside && <div className="world-inside-ui">
        <p className="world-inside-title">{title}</p>
        <div className="world-inside-actions">
          <button ref={backRef} className="button button-secondary" type="button" onClick={onExit}><Icon name="close" />Step back <kbd>Esc</kbd></button>
          {vr && <button className="button button-primary" type="button" onClick={() => void api.current?.enterVR()}><Icon name="headset" />Enter VR</button>}
          <a className={vr ? "button button-secondary" : "button button-primary"} href={watchHref} target="_blank" rel="noreferrer"><Icon name="play" />Watch in DeoVR</a>
        </div>
      </div>}
    </div>
  );
}

// The heading compass; on phones it doubles as the tilt toggle.
function Compass({ as, tilt, onClick, children }: { as: "div" | "button"; tilt: boolean; onClick?: () => void; children: React.ReactNode }) {
  if (as === "div") return <div className="world-compass" aria-hidden="true">{children}</div>;
  return <button type="button" className="world-compass is-tilt" aria-pressed={tilt} aria-label="Tilt your phone to look around" onClick={onClick}>{children}</button>;
}
