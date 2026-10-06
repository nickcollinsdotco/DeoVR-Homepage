// Display formatting for catalogue values.

const EMOJI = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}️‍]/gu;
const SPEC_TOKENS = /\b(VR\s?180|180°?|360°?|3D|2D|8K|7K|6K|5K|4K|60\s?FPS|HDR|VR)\b/gi;

/**
 * Creators put format specs, emoji and series tags in titles because the UI never showed them.
 * The Immersion Signature shows specs now, so titles can be about the place.
 */
export function cleanTitle(title: string) {
  return title
    .replace(EMOJI, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(SPEC_TOKENS, " ")
    .split(/\s[|｜]\s|\s[-–]\s(?=[A-Z0-9 ]+$)/)[0]
    .replace(/[\s,|｜·•-]+$/g, "")
    .replace(/^[\s,|｜·•-]+/, "")
    .replace(/\s{2,}/g, " ")
    .trim() || title;
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
