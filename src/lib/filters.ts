// Discovery state (feed + facets) and its mirror in the URL, so every view is shareable.
import type { Video } from "@/lib/catalog";
import { channelFor, equirectFor } from "@/lib/catalog";
import { PLACE_INTENTS } from "@/data/curation";

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

export type FacetKey = "fov" | "depth" | "clarity" | "comfort" | "length";

export const DEFAULT_FILTERS: Filters = { feed: "for-you", intent: "all", query: "", fov: "all", depth: "all", clarity: "all", comfort: "all", length: "all" };

export const FACETS: { key: FacetKey; label: string; options: [string, string][] }[] = [
  { key: "fov", label: "Field of view", options: [["180", "180°"], ["360", "360°"]] },
  { key: "depth", label: "Depth", options: [["3D", "3D"], ["2D", "2D"]] },
  { key: "clarity", label: "Clarity", options: [["8", "8K+"], ["6", "6K+"], ["4", "4K+"]] },
  { key: "comfort", label: "Camera motion estimate", options: [["still", "Still"], ["gentle", "Gentle"], ["moving", "Moving"]] },
  { key: "length", label: "Length", options: [["short", "Under 10 min"], ["medium", "10–30 min"], ["long", "30+ min"]] },
];

const FACET_KEYS = FACETS.map((facet) => facet.key);

export function hasFilters(filters: Filters) {
  return filters.intent !== "all" || Boolean(filters.query) || FACET_KEYS.some((key) => filters[key] !== "all");
}

export function activeFacetCount(filters: Filters) {
  return FACET_KEYS.filter((key) => filters[key] !== "all").length;
}

export function facetLabel(key: FacetKey, value: string) {
  return FACETS.find((facet) => facet.key === key)?.options.find(([option]) => option === value)?.[1] ?? value;
}

const clarityRank = (value: string) => Number.parseInt(value, 10) || 0;

export function filterCatalog(videos: Video[], filters: Filters) {
  const query = filters.query.trim().toLocaleLowerCase();
  const matches = videos.filter((video) => {
    if (query && !`${video.title} ${video.description} ${channelFor(video)?.name ?? ""}`.toLocaleLowerCase().includes(query)) return false;
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

  if (filters.feed === "new") return matches.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  if (filters.feed === "trending") return matches.sort((a, b) => (a.feeds.trending ?? Infinity) - (b.feeds.trending ?? Infinity));
  return matches.sort((a, b) => forYouScore(a) - forYouScore(b));
}

/** "For you" keeps DeoVR's home ordering but leads with places, which is what VR does best. */
function forYouScore(video: Video) {
  const rank = video.feeds.home ?? video.feeds["top-picks"] ?? 60;
  const place = video.intents.some((intent) => PLACE_INTENTS.includes(intent)) ? -18 : 0;
  const portal = equirectFor(video) ? -6 : 0;
  return rank + place + portal;
}

// ---------- URL mirror ----------

const PARAM: Record<keyof Filters, string> = { feed: "feed", intent: "intent", query: "q", fov: "fov", depth: "depth", clarity: "clarity", comfort: "comfort", length: "length" };

export function filtersFromSearch(search: string): Filters {
  const params = new URLSearchParams(search);
  const feed = params.get("feed");
  const read = (key: keyof Filters) => params.get(PARAM[key]) ?? DEFAULT_FILTERS[key];
  return {
    feed: feed === "new" || feed === "trending" ? feed : "for-you",
    intent: read("intent"), query: read("query"),
    fov: read("fov"), depth: read("depth"), clarity: read("clarity"), comfort: read("comfort"), length: read("length"),
  };
}

export function writeFiltersToUrl(filters: Filters, mode: "push" | "replace" = "push") {
  const url = new URL(window.location.href);
  for (const key of Object.keys(PARAM) as (keyof Filters)[]) {
    if (filters[key] === DEFAULT_FILTERS[key]) url.searchParams.delete(PARAM[key]);
    else url.searchParams.set(PARAM[key], filters[key]);
  }
  window.history[mode === "push" ? "pushState" : "replaceState"]({}, "", url);
}
