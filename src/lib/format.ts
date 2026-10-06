// Display formatting for catalogue values.

const EMOJI = /[\p{Extended_Pictographic}\p{Regional_Indicator}\p{Variation_Selector}\p{Join_Control}]/gu;

// One format token: 360°, VR180, 3D180, 8K, 60FPS, HDR… (trailing degree sign optional).
const SPEC = String.raw`(?:VR\s?(?:180|360)|3D\s?180|180|190|360|3D|2D|\d{1,2}K|\d{2,3}\s?FPS|HDR|UHD|VR)°?`;
const EDGE = String.raw`(?![\p{L}\p{N}])`;
/** Two or more specs in a row ("in 360° VR 8K"), with an optional leading "in"/"at". */
const SPEC_RUN = new RegExp(String.raw`(?:\s+(?:in|at)(?=\s))?\s*(?<![\p{L}\p{N}])${SPEC}(?:[\s·/,+-]*${SPEC})+${EDGE}`, "giu");
/** Brackets that hold nothing but specs: "(8K 3D VR180 Video)", "【180° VR】". */
const SPEC_GROUP = new RegExp(String.raw`[\[(（【]\s*(?:${SPEC}|video|[\s·/,|+-])*[\])）】]`, "giu");
const SPEC_START = new RegExp(String.raw`^\s*${SPEC}${EDGE}`, "iu");
/** A single trailing spec, unless it is the object of "of" ("The Power of VR"). */
const SPEC_END = new RegExp(String.raw`(?:\s+(?:in|at))?(?<!\bof)\s+${SPEC}\s*$`, "iu");

/**
 * Creators put format specs, emoji and series tags in titles because the UI never showed them.
 * The Immersion Signature shows specs now, so titles can be about the place. Runs of specs go
 * anywhere; a single spec only at the edges, so "Urban Pulse in 360° Immersion" keeps its meaning.
 */
export function cleanTitle(title: string) {
  let text = title
    .replace(EMOJI, " ")
    .replace(/°(?=\p{L})/gu, "° ")
    .replace(SPEC_GROUP, " ")
    .replace(SPEC_RUN, " ")
    .split(/\s[|｜]\s/)[0];
  for (let pass = 0; pass < 2; pass++) text = text.replace(SPEC_START, "").replace(SPEC_END, "");
  const cleaned = text
    .replace(/[\s/·,]+(?=[\])）】])/g, "")
    .replace(/\s+([,.:!?])/g, "$1")
    .replace(/^[\s,|｜·•:–—-]+|[\s,|｜·•:–—-]+$/g, "")
    .replace(/\s+(?:in|at)$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return cleaned.length >= 3 ? cleaned : title;
}

export function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = String(seconds % 60).padStart(2, "0");
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${remainder}` : `${minutes}:${remainder}`;
}

export function formatCount(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(value);
}

export function formatAge(iso: string) {
  const days = Math.max(0, (Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return "today";
  if (days < 7) return `${Math.floor(days)}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
