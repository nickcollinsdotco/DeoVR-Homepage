// Equirect projection engine. Loaded lazily (dynamic import) so three.js never touches first paint.
//
// One full-screen-quad shader renders any equirectangular source, 180° or 360°, as either a
// rectilinear "window" (yaw / pitch / vertical FOV) or a stereographic little planet, and morphs
// between the two. A second texture slot crossfades between worlds.
import * as THREE from "three";

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
  // pick the derivative that doesn't jump at the longitude seam, so mipmapping stays seamless
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
  // little-planet silhouette: cut the sky above uCut so the shape reads as sphere (360) or dome (180)
  float sky = mix(1., smoothstep(uCut + .006, uCut - .006, dp.y), smoothstep(.35, 1., uMorph));
  float v = 1. - uVignette * smoothstep(.55, 1.45, length(vUv*2. - 1.));
  c = mix(uBg, c * v, sky);
  // rounded-rect mask in device pixels (portals draw behind the DOM, so corners are clipped here)
  vec2 h = uSize * .5, pp = abs(vUv * uSize - h) - (h - uRadius);
  float sdf = length(max(pp, 0.)) + min(max(pp.x, pp.y), 0.) - uRadius;
  float a = uRadius > 0. ? clamp(.5 - sdf, 0., 1.) : 1.;
  outColor = vec4(mix(uBg, c, uFade), a * max(uFade, step(.001, uMorph)));
}`;

export type EqUniforms = {
  uMapA: { value: THREE.Texture | null }; uMapB: { value: THREE.Texture | null };
  uHalfA: { value: number }; uHalfB: { value: number }; uMix: { value: number };
  uYaw: { value: number }; uPitch: { value: number }; uVfov: { value: number }; uAspect: { value: number };
  uMorph: { value: number }; uPlanet: { value: number }; uSpin: { value: number }; uFade: { value: number };
  uVignette: { value: number }; uCut: { value: number }; uRadius: { value: number };
  uOffset: { value: THREE.Vector2 }; uSize: { value: THREE.Vector2 }; uBg: { value: THREE.Vector3 };
};

// sRGB triplets of the page tokens (shader output is not colour-managed; texels pass straight through)
export const GROUND = new THREE.Vector3(0.071, 0.067, 0.063);
export const SURFACE = new THREE.Vector3(0.106, 0.1, 0.094);

export function createView(canvas: HTMLCanvasElement, { alpha = true } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha, antialias: false, premultipliedAlpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.autoClear = false;
  const material = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG, blending: THREE.NoBlending, depthTest: false,
    uniforms: {
      uMapA: { value: null }, uMapB: { value: null }, uHalfA: { value: 1 }, uHalfB: { value: 1 }, uMix: { value: 0 },
      uYaw: { value: 0 }, uPitch: { value: 0 }, uVfov: { value: 1.2 }, uAspect: { value: 1 },
      uMorph: { value: 0 }, uPlanet: { value: 1.4 }, uSpin: { value: 0 }, uFade: { value: 1 }, uVignette: { value: 0 },
      uCut: { value: 0.45 }, uRadius: { value: 0 }, uOffset: { value: new THREE.Vector2() }, uSize: { value: new THREE.Vector2(1, 1) },
      uBg: { value: GROUND.clone() },
    },
  });
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const u = material.uniforms as unknown as EqUniforms;
  const fit = (w: number, h: number) => {
    const pr = renderer.getPixelRatio();
    if (renderer.domElement.width !== Math.round(w * pr) || renderer.domElement.height !== Math.round(h * pr)) renderer.setSize(w, h, false);
  };
  const draw = () => renderer.render(scene, camera);
  const dispose = () => { material.dispose(); renderer.dispose(); };
  return { renderer, u, fit, draw, dispose };
}

const stills = new Map<string, THREE.Texture>();
const loader = new THREE.TextureLoader();
export function stillTexture(src: string, full: boolean) {
  let t = stills.get(src);
  if (!t) {
    t = loader.load(src);
    t.colorSpace = THREE.NoColorSpace;
    t.wrapS = full ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
    t.anisotropy = 4;
    stills.set(src, t);
  }
  return t;
}

export function loopTexture(el: HTMLVideoElement) {
  const t = new THREE.VideoTexture(el);
  t.colorSpace = THREE.NoColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.generateMipmaps = false;
  t.minFilter = THREE.LinearFilter;
  return t;
}

export function isReady(t: THREE.Texture | null | undefined) {
  if (!t) return false;
  const img = t.image as HTMLImageElement | HTMLVideoElement | undefined;
  if (!img) return false;
  if ("readyState" in img && img instanceof HTMLVideoElement) return img.readyState >= 2;
  return (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0;
}

export const damp = (a: number, b: number, k: number, dt: number) => a + (b - a) * (1 - Math.exp(-k * dt));

/**
 * WebXR: wrap the current world around the viewer (sphere for 360°, dome for 180°) on the same
 * renderer. Mono (left eye) preview; full stereo playback stays in the DeoVR player.
 * Resolves when the session ends.
 */
export async function enterVR(renderer: THREE.WebGLRenderer, texture: THREE.Texture, full: boolean) {
  const xr = (navigator as Navigator & { xr?: XRSystem }).xr;
  if (!xr) return;
  const session = await xr.requestSession("immersive-vr", { optionalFeatures: ["local-floor"] });
  const scene = new THREE.Scene();
  const geometry = full
    ? new THREE.SphereGeometry(50, 96, 48)
    : new THREE.SphereGeometry(50, 64, 48, Math.PI / 2, Math.PI);
  geometry.scale(-1, 1, 1);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: texture }));
  mesh.rotation.y = -Math.PI / 2; // image centre straight ahead (-z)
  scene.add(mesh);
  const camera = new THREE.PerspectiveCamera(80, 1, 0.1, 200);
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType("local");
  await renderer.xr.setSession(session);
  renderer.setAnimationLoop(() => renderer.render(scene, camera));
  await new Promise<void>((resolve) => session.addEventListener("end", () => resolve(), { once: true }));
  renderer.setAnimationLoop(null);
  renderer.xr.enabled = false;
  geometry.dispose();
  (mesh.material as THREE.Material).dispose();
}

export async function vrSupported() {
  const xr = (navigator as Navigator & { xr?: XRSystem }).xr;
  try { return !!xr && await xr.isSessionSupported("immersive-vr"); } catch { return false; }
}
