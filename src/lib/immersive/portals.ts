// Portal registry. Cards register their media element here; the PortalCanvas (one shared WebGL
// canvas fixed *behind* the page) draws every live portal into its card's rectangle. Cards never
// import three.js, so the grid stays cheap until the engine loads on idle.

export type PortalMode = "window" | "planet";

export type Portal = {
  el: HTMLElement;
  src: string;
  full: boolean; // 360° (true) or 180° (false)
  mode: PortalMode;
  active: boolean;
  auto: boolean; // keyboard/controller focus: no pointer, so the view sweeps gently by itself
  nx: number; // pointer position inside the card, -1..1
  ny: number;
  // animated state, owned by the engine
  fade: number; morph: number; yaw: number; pitch: number;
};

export const portals = new Map<string, Portal>();

export function registerPortal(key: string, el: HTMLElement, opts: { src: string; full: boolean; mode?: PortalMode }) {
  const mode = opts.mode ?? "window";
  portals.set(key, { el, src: opts.src, full: opts.full, mode, active: false, auto: false, nx: 0, ny: 0, fade: 0, morph: mode === "planet" ? 1 : 0, yaw: 0, pitch: 0 });
  return () => {
    if (portals.get(key)?.el === el) portals.delete(key);
    el.style.removeProperty("--portal");
    delete el.dataset.portal;
  };
}

export function setPortalActive(key: string, active: boolean, auto = false) {
  const p = portals.get(key);
  if (!p) return;
  p.active = active;
  p.auto = active && auto;
  if (!active) { p.nx = 0; p.ny = 0; }
}

function setPortalPointer(key: string, nx: number, ny: number) {
  const p = portals.get(key);
  if (!p) return;
  p.nx = Math.max(-1, Math.min(1, nx));
  p.ny = Math.max(-1, Math.min(1, ny));
  p.auto = false;
}

export function pointerToPortal(key: string, event: { clientX: number; clientY: number; currentTarget: EventTarget & Element }) {
  const r = event.currentTarget.getBoundingClientRect();
  setPortalPointer(key, ((event.clientX - r.left) / r.width) * 2 - 1, ((event.clientY - r.top) / r.height) * 2 - 1);
}
