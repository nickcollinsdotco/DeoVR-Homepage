// Directions D and E (spatial spikes): data helpers, Immersion Signature markup, and the
// equirect projection shader. Exploration code; the production version is src/lib/immersive/.
import * as THREE from 'three';

export const DATA = window.DEOVR;
// Self-hosted media from scripts/media.mjs: every non-premium immersive video has a still;
// a few featured videos also have a short stage loop.
const LOOPS = new Set(['123847', '96490', '137356', '62471', '133898', '18774', '131156']);
export const channels = Object.fromEntries(DATA.channels.map((c) => [c.slug, c]));
export const videos = DATA.videos.map((v) => ({ ...v, eq: v.fov >= 180 && !v.premium ? `/media/eq/${v.id}.jpg` : undefined, loop: LOOPS.has(v.id) ? `/media/loop/${v.id}.mp4` : undefined, ch: channels[v.channel] }));
export const byId = Object.fromEntries(videos.map((v) => [v.id, v]));

// ---------- formatting ----------
export const dur = (s) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = String(s % 60).padStart(2, '0'); return h ? `${h}:${String(m).padStart(2, '0')}:${x}` : `${m}:${x}`; };
export const count = (n) => n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K' : String(n);
export const ago = (iso) => { const d = (Date.now() - new Date(iso)) / 864e5; return d < 1 ? 'today' : d < 7 ? `${Math.floor(d)}d ago` : d < 60 ? `${Math.floor(d / 7)}w ago` : d < 730 ? `${Math.floor(d / 30)}mo ago` : `${Math.floor(d / 365)}y ago`; };
const EMOJI = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}️]/gu;
const SPEC = /\b(\d{1,2}K|VR ?180|VR ?360|VR|180°?|360°?|190°?|3D|2D|\d{2,3} ?FPS|HDR|HD|UHD|SBS)\b/gi;
export function cleanTitle(t) {
  let s = t.replace(EMOJI, '').replace(/[[(][^\])]*[\])]/g, ' ');
  const head = s.split(/\s[|–—]\s|\s\|\s?/)[0];
  if (head.replace(SPEC, '').trim().length > 12) s = head;
  return s.replace(SPEC, '').replace(/\s{2,}/g, ' ').replace(/^[\s,.:\-–|]+|[\s,.:\-–|]+$/g, '').trim() || t;
}

// ---------- Immersion Signature ----------
export function fovGlyph(fov, size = 16) {
  const c = size / 2, r = size / 2 - 1.5;
  if (fov >= 360) return `<svg class="fov" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="${c}" cy="${c}" r="1.6" fill="currentColor"/><path class="wedge" d="M${c} ${c}L${c - r * 0.5} ${c - r * 0.87}A${r} ${r} 0 0 1 ${c + r * 0.5} ${c - r * 0.87}Z" fill="currentColor" opacity=".45"/></svg>`;
  if (fov >= 180) return `<svg class="fov" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><path d="M${c - r} ${c + 2}A${r} ${r} 0 0 1 ${c + r} ${c + 2}" fill="none" stroke="currentColor" stroke-width="1.6"/><line x1="${c - r - 0.5}" y1="${c + 2}" x2="${c + r + 0.5}" y2="${c + 2}" stroke="currentColor" stroke-width="1.6" opacity=".4"/><circle cx="${c}" cy="${c + 2}" r="1.6" fill="currentColor"/><path class="wedge" d="M${c} ${c + 2}L${c - r * 0.5} ${c + 2 - r * 0.87}A${r} ${r} 0 0 1 ${c + r * 0.5} ${c + 2 - r * 0.87}Z" fill="currentColor" opacity=".45"/></svg>`;
  return `<svg class="fov" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><rect x="1.5" y="${c - 4}" width="${size - 3}" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;
}
const COMFORT = { still: [1, 'Still'], gentle: [2, 'Gentle'], moving: [3, 'Moving'] };
export function comfortMeter(c) {
  const [n, label] = COMFORT[c] ?? COMFORT.still;
  return `<span class="comfort" data-level="${c}"><span class="dots" aria-hidden="true">${[1, 2, 3].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>${label}</span>`;
}
export const fovLabel = (f) => (f >= 360 ? '360°' : f >= 180 ? '180°' : 'Flat');
export function signature(v, { length = true } = {}) {
  const fps = v.fps >= 50 ? `<span class="fps">${Math.round(v.fps)}</span>` : '';
  const aria = `${fovLabel(v.fov)}, ${v.depth}, ${v.clarity}${v.fps >= 50 ? ' ' + Math.round(v.fps) + ' frames per second' : ''}, camera ${v.comfort}${length ? ', ' + dur(v.durationSec) : ''}`;
  return `<span class="sig" aria-label="${aria}">
    <span class="sig-fov">${fovGlyph(v.fov)}${fovLabel(v.fov)}</span>
    <span>${v.depth}</span>
    <span>${v.clarity}${fps}</span>
    ${comfortMeter(v.comfort)}
    ${length ? `<span class="len">${dur(v.durationSec)}</span>` : ''}
  </span>`;
}

// ---------- equirect projection ----------
// One full-screen-quad shader renders any equirect source (180 or 360) as either a rectilinear
// "window" (yaw/pitch/vfov) or a stereographic little planet, and morphs between the two.
// A second texture slot allows a crossfade between worlds.
const VERT = /* glsl */ `out vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;
const FRAG = /* glsl */ `
precision highp float;
in vec2 vUv; out vec4 outColor;
uniform sampler2D uMapA, uMapB; uniform float uHalfA, uHalfB, uMix;
uniform float uYaw, uPitch, uVfov, uAspect, uMorph, uPlanet, uSpin, uFade, uVignette, uCut, uRadius;
uniform vec2 uOffset, uSize;
uniform vec3 uBg;
const float PI = 3.14159265359;
vec3 look(vec3 d, float yaw, float pitch){
  float cp = cos(pitch), sp = sin(pitch);
  d = vec3(d.x, d.y*cp - d.z*sp, d.y*sp + d.z*cp);
  float cy = cos(yaw), sy = sin(yaw);
  return vec3(d.x*cy - d.z*sy, d.y, d.x*sy + d.z*cy);
}
vec3 sampleEq(sampler2D map, float half180, vec3 d){
  float lon = atan(d.x, -d.z), lat = asin(clamp(d.y, -1., 1.));
  float span = half180 > .5 ? PI : 2.*PI;
  vec2 uv = vec2(lon/span + .5, lat/PI + .5);
  vec2 uv2 = vec2(fract(uv.x + .5), uv.y);
  vec2 dx = dFdx(uv), dy = dFdy(uv), dx2 = dFdx(uv2), dy2 = dFdy(uv2);
  if (dot(dx2,dx2) + dot(dy2,dy2) < dot(dx,dx) + dot(dy,dy)) { dx = dx2; dy = dy2; }
  vec3 c = textureGrad(map, uv, dx, dy).rgb;
  float m = half180 > .5 ? smoothstep(PI*.5, PI*.5 - .025, abs(lon)) : 1.;
  return mix(uBg, c, m);
}
void main(){
  vec2 p = (vUv*2. - 1.) * vec2(uAspect, 1.);
  float t = tan(uVfov*.5);
  vec3 dr = look(normalize(vec3(p.x*t, p.y*t, -1.)), uYaw, uPitch);
  vec2 q = (p + uOffset) * uPlanet; float r2 = dot(q, q);
  vec3 dp = look(vec3(2.*q.x, r2 - 1., -2.*q.y) / (1. + r2), uSpin, 0.);
  vec3 d = normalize(mix(dr, dp, uMorph));
  vec3 c = sampleEq(uMapA, uHalfA, d);
  if (uMix > 0.) c = mix(c, sampleEq(uMapB, uHalfB, d), uMix);
  // little-planet silhouette: cut the sky above uCut so the shape reads as sphere / dome
  float sky = mix(1., smoothstep(uCut + .025, uCut - .025, dp.y), smoothstep(.35, 1., uMorph));
  float v = 1. - uVignette * smoothstep(.55, 1.45, length(vUv*2. - 1.));
  c = mix(uBg, c * v, sky);
  // rounded-rect mask in pixels (cards draw behind the DOM, so corners are clipped here)
  vec2 h = uSize * .5, pp = abs(vUv * uSize - h) - (h - uRadius);
  float sdf = length(max(pp, 0.)) + min(max(pp.x, pp.y), 0.) - uRadius;
  float a = uRadius > 0. ? clamp(.5 - sdf, 0., 1.) : 1.;
  outColor = vec4(mix(uBg, c, uFade), a * max(uFade, step(.001, uMorph)));
}`;

export const BG = new THREE.Color().setRGB(0.082, 0.075, 0.07); // matches --ground, sRGB-ish

export function makeEqMaterial() {
  return new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG, blending: THREE.NoBlending, depthTest: false,
    uniforms: {
      uMapA: { value: null }, uMapB: { value: null }, uHalfA: { value: 1 }, uHalfB: { value: 1 }, uMix: { value: 0 },
      uYaw: { value: 0 }, uPitch: { value: 0 }, uVfov: { value: 1.2 }, uAspect: { value: 1 },
      uMorph: { value: 0 }, uPlanet: { value: 1.4 }, uSpin: { value: 0 }, uFade: { value: 1 }, uVignette: { value: 0 },
      uCut: { value: 0.35 }, uRadius: { value: 0 }, uOffset: { value: new THREE.Vector2() }, uSize: { value: new THREE.Vector2(1, 1) },
      uBg: { value: new THREE.Vector3(BG.r, BG.g, BG.b) },
    },
  });
}

export function makeRenderer(canvas, { alpha = true } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha, antialias: false, premultipliedAlpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace; // pass sRGB texels straight through
  renderer.autoClear = false;
  const material = makeEqMaterial();
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  return { renderer, material, scene, camera, u: material.uniforms };
}

const texCache = new Map();
const loader = new THREE.TextureLoader();
export function eqTexture(v) {
  if (!v?.eq) return null;
  let t = texCache.get(v.id);
  if (!t) {
    t = loader.load(v.eq);
    t.colorSpace = THREE.NoColorSpace;
    t.wrapS = v.fov >= 360 ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
    t.anisotropy = 4;
    texCache.set(v.id, t);
  }
  return t;
}
export function videoTexture(el) {
  const t = new THREE.VideoTexture(el);
  t.colorSpace = THREE.NoColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.generateMipmaps = false;
  t.minFilter = THREE.LinearFilter;
  return t;
}
export const isReady = (t) => !!t && (t.isVideoTexture ? t.image.readyState >= 2 : !!t.image?.complete && t.image.naturalWidth > 0);

// damped value helper
export const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
