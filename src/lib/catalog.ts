import channelSnapshot from "@/data/channels.json";
import mediaSnapshot from "@/data/media.json";

export type Video = {
  id: string;
  slug: string;
  title: string;
  description: string;
  channel: string;
  cover: { sm: string; lg: string };
  preview: string;
  durationSec: number;
  fps: number;
  views: number;
  likes: number;
  comments: number;
  publishedAt: string;
  fov: number;
  depth: "2D" | "3D";
  clarity: string;
  comfort: "still" | "gentle" | "moving";
  flashing: boolean;
  premium: boolean;
  passthrough: boolean;
  categories: string[];
  intents: string[];
  feeds: Record<string, number | undefined>;
};

export type Channel = {
  slug: string;
  name: string;
  avatar: string;
  color: string;
  cover?: string;
  subscribers: number;
  videoCount: number;
};
export type Feed = "for-you" | "new" | "trending";

export type Filters = {
  feed: Feed;
  intent: string;
  query: string;
  fov: string;
  depth: string;
  clarity: string;
  comfort: string;
  length: string;
};

export const DEFAULT_FILTERS: Filters = {
  feed: "for-you",
  intent: "all",
  query: "",
  fov: "all",
  depth: "all",
  clarity: "all",
  comfort: "all",
  length: "all",
};

export const CHANNELS = channelSnapshot as unknown as Channel[];

export const FEATURED = [
  { slug: "5fy5b3", headline: "Copacabana, on foot", place: "Rio de Janeiro · Brazil", hook: "Walk from the boardwalk down to the waterline, with the whole beach turning around you." },
  { slug: "t2szbx", headline: "Above Mexico City", place: "Mexico City · Mexico", hook: "Rise over one of the world's largest cities as its streets open toward the horizon." },
  { slug: "3kqtes", headline: "Venice, side streets", place: "Venice · Italy", hook: "Eighteen minutes of canals, bridges and quiet corners, with the original city sound." },
  { slug: "w4fa5o", headline: "Beside the submarine", place: "Curaçao · Caribbean", hook: "Float beside a research submarine as it cruises a living Caribbean reef." },
  { slug: "ctdats", headline: "Victoria Falls & the Okavango", place: "Namibia · Botswana · Zambia", hook: "A family journey across southern Africa, in stereo 3D." },
  { slug: "asavt0", headline: "Over the Matterhorn glacier", place: "Zermatt · Switzerland", hook: "An FPV flight skims the ice beneath the peak." },
  { slug: "q37cfc", headline: "Fall to Earth", place: "Orbit → New York City", hook: "Ride a spacecraft from orbit down to a landing in New York, watching through the hatch." },
];

// 360° places for the "Where in the world" chapter (shown as little planets).
export const PLACES = [
  { slug: "jor1kn", place: "Elmina", country: "Ghana" },
  { slug: "c2h5rl", place: "Kobe", country: "Japan" },
  { slug: "0ycsdx", place: "Olsztyn", country: "Poland" },
  { slug: "33zik1", place: "Cape Coast", country: "Ghana" },
  { slug: "1rrlm5", place: "Copacabana", country: "Brazil" },
  { slug: "ixxr53", place: "Warmia", country: "Poland" },
];

export const INTENTS = [
  { value: "all", label: "All experiences" },
  { value: "travel", label: "Travel" },
  { value: "city", label: "City walks" },
  { value: "nature", label: "Nature & calm" },
  { value: "music", label: "Music & events" },
  { value: "adrenaline", label: "Adrenaline" },
  { value: "stories", label: "Stories & animation" },
  { value: "passthrough", label: "Passthrough" },
];

const channelBySlug = new Map(CHANNELS.map((channel) => [channel.slug, channel]));
const localMedia = mediaSnapshot as Record<string, { loop?: string; eq?: string }>;

export function featuredCopy(video: Video) {
  return FEATURED.find((item) => item.slug === video.slug);
}

export function channelFor(video: Video) {
  return channelBySlug.get(video.channel);
}

export function stageLoopFor(video: Video) {
  return localMedia[video.id]?.loop;
}

/** Self-hosted left-eye equirect still (see scripts/media.mjs). Absent for premium/flat videos. */
export function equirectFor(video: Video) {
  return video.fov >= 180 ? localMedia[video.id]?.eq : undefined;
}

export function getPlaces(videos: Video[]) {
  const bySlug = new Map(videos.map((video) => [video.slug, video]));
  return PLACES.flatMap((place) => {
    const video = bySlug.get(place.slug);
    return video && equirectFor(video) ? [{ ...place, video }] : [];
  });
}

export function getFeaturedVideos(videos: Video[]) {
  const bySlug = new Map(videos.map((video) => [video.slug, video]));
  return FEATURED.map(({ slug }) => bySlug.get(slug)).filter((video): video is Video => Boolean(video));
}

export function parseDate(value: string) {
  const local = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (local) {
    return new Date(Number(local[3]), Number(local[2]) - 1, Number(local[1]), Number(local[4] ?? 0), Number(local[5] ?? 0), Number(local[6] ?? 0));
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

const EMOJI = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}️‍]/gu;

export function cleanTitle(title: string) {
  return title
    .replace(EMOJI, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\b(VR\s?180|180°?|360°?|3D|2D|8K|7K|6K|5K|4K|60\s?FPS|HDR|VR)\b/gi, " ")
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

export function formatAge(value: string) {
  const days = Math.max(0, (Date.now() - parseDate(value).getTime()) / 86_400_000);
  if (days < 1) return "today";
  if (days < 7) return `${Math.floor(days)}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function clarityRank(value: string) {
  return Number.parseInt(value, 10) || 0;
}

export function filterCatalog(videos: Video[], filters: Filters) {
  const query = filters.query.trim().toLocaleLowerCase();
  const filtered = videos.filter((video) => {
    const channel = channelFor(video);
    if (query && !`${video.title} ${video.description} ${channel?.name ?? ""}`.toLocaleLowerCase().includes(query)) return false;
    if (filters.intent !== "all" && !video.intents.includes(filters.intent)) return false;
    if (filters.fov !== "all" && String(video.fov) !== filters.fov) return false;
    if (filters.depth !== "all" && video.depth !== filters.depth) return false;
    if (filters.clarity !== "all" && clarityRank(video.clarity) < Number(filters.clarity)) return false;
    if (filters.comfort !== "all" && video.comfort !== filters.comfort) return false;
    if (filters.length === "short" && video.durationSec >= 600) return false;
    if (filters.length === "medium" && (video.durationSec < 600 || video.durationSec > 1800)) return false;
    if (filters.length === "long" && video.durationSec <= 1800) return false;
    return true;
  });

  if (filters.feed === "new") {
    return filtered.sort((a, b) => parseDate(b.publishedAt).getTime() - parseDate(a.publishedAt).getTime());
  }
  if (filters.feed === "trending") {
    return filtered.sort((a, b) => (a.feeds.trending ?? Number.MAX_SAFE_INTEGER) - (b.feeds.trending ?? Number.MAX_SAFE_INTEGER));
  }
  return filtered.sort((a, b) => forYouScore(a) - forYouScore(b));
}

const PLACE_INTENTS = ["travel", "city", "nature"];
/** "For you" keeps DeoVR's home ordering but leads with places, which is what VR does best. */
function forYouScore(video: Video) {
  const rank = video.feeds.home ?? video.feeds["top-picks"] ?? 60;
  const place = video.intents.some((intent) => PLACE_INTENTS.includes(intent)) ? -18 : 0;
  const portal = equirectFor(video) ? -6 : 0;
  return rank + place + portal;
}

export function getSimilarVideos(video: Video, videos: Video[], limit = 4) {
  return videos
    .filter((candidate) => candidate.slug !== video.slug)
    .map((candidate) => ({
      candidate,
      score: (candidate.intents.some((intent) => video.intents.includes(intent)) ? 2 : 0)
        + (candidate.fov === video.fov ? 1 : 0)
        + (candidate.channel === video.channel ? 3 : 0),
    }))
    .sort((a, b) => b.score - a.score || b.candidate.views - a.candidate.views)
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

export function hasFilters(filters: Filters) {
  return filters.intent !== "all" || Boolean(filters.query) || filters.fov !== "all" || filters.depth !== "all" || filters.clarity !== "all" || filters.comfort !== "all" || filters.length !== "all";
}

export function filtersFromSearch(search: string): Filters {
  const params = new URLSearchParams(search);
  const feed = params.get("feed");
  return {
    feed: feed === "new" || feed === "trending" ? feed : "for-you",
    intent: params.get("intent") ?? "all",
    query: params.get("q") ?? "",
    fov: params.get("fov") ?? "all",
    depth: params.get("depth") ?? "all",
    clarity: params.get("clarity") ?? "all",
    comfort: params.get("comfort") ?? "all",
    length: params.get("length") ?? "all",
  };
}

export function writeFiltersToUrl(filters: Filters, mode: "push" | "replace" = "push") {
  const url = new URL(window.location.href);
  const values: Record<keyof Filters, string> = { ...filters };
  for (const [key, value] of Object.entries(values)) {
    const name = key === "query" ? "q" : key === "feed" ? "feed" : key;
    const fallback = key === "feed" ? "for-you" : key === "intent" || key === "fov" || key === "depth" || key === "clarity" || key === "comfort" || key === "length" ? "all" : "";
    if (value === fallback) url.searchParams.delete(name);
    else url.searchParams.set(name, value);
  }
  window.history[mode === "push" ? "pushState" : "replaceState"]({}, "", url);
}
