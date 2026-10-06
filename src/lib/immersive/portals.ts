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
  nx: number; // pointer position inside the card, -1..1
  ny: number;
  // animated state, owned by the engine
  fade: number; morph: number; yaw: number; pitch: number;
  /** last --portal value written to the DOM, so the engine only writes on change */
  shown: number;
};

export const portals = new Map<string, Portal>();

// Bumped on every change the engine can't see by watching scroll and animation state.
let version = 0;
export const portalsVersion = () => version;

export function registerPortal(key: string, el: HTMLElement, opts: { src: string; full: boolean; mode?: PortalMode }) {
  const mode = opts.mode ?? "window";
  portals.set(key, { el, src: opts.src, full: opts.full, mode, active: false, nx: 0, ny: 0, fade: 0, morph: mode === "planet" ? 1 : 0, yaw: 0, pitch: 0, shown: -1 });
  version++;
  return () => {
    if (portals.get(key)?.el === el) portals.delete(key);
    el.style.removeProperty("--portal");
    delete el.dataset.portal;
    version++;
  };
}

/** Focus and pointer both open a portal. Focus alone holds a still, forward view (no motion). */
export function setPortalActive(key: string, active: boolean) {
  const p = portals.get(key);
  if (!p) return;
  p.active = active;
  if (!active) { p.nx = 0; p.ny = 0; }
  version++;
}

export function pointerToPortal(key: string, event: { clientX: number; clientY: number; currentTarget: EventTarget & Element }) {
  const p = portals.get(key);
  if (!p) return;
  const r = event.currentTarget.getBoundingClientRect();
  p.nx = Math.max(-1, Math.min(1, ((event.clientX - r.left) / r.width) * 2 - 1));
  p.ny = Math.max(-1, Math.min(1, ((event.clientY - r.top) / r.height) * 2 - 1));
  version++;
}
