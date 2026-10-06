// Typed access to the committed DeoVR catalogue snapshot (scripts/snapshot.mjs) and the
// self-hosted immersive media derived from it (scripts/media.mjs).
import videoSnapshot from "@/data/videos.json";
import channelSnapshot from "@/data/channels.json";
import mediaSnapshot from "@/data/media.json";
import { FEATURED, PLACES } from "@/data/curation";

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
  /** 0 = flat, 180, 190 (fisheye) or 360 */
  fov: number;
  depth: "2D" | "3D";
  clarity: string;
  /** Camera-motion estimate derived from DeoVR tags and warnings; label it as an estimate. */
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

export const VIDEOS = videoSnapshot as unknown as Video[];
export const CHANNELS = channelSnapshot as unknown as Channel[];

const channelBySlug = new Map(CHANNELS.map((channel) => [channel.slug, channel]));
const videoBySlug = new Map(VIDEOS.map((video) => [video.slug, video]));
const media = mediaSnapshot as Record<string, { eq?: string; loop?: string }>;

export const channelFor = (video: Video) => channelBySlug.get(video.channel);
export const featuredCopy = (video: Video) => FEATURED.find((item) => item.slug === video.slug);

/** Self-hosted left-eye equirect still. Absent for flat and premium videos (no source access). */
export const equirectFor = (video: Video) => (video.fov >= 180 ? media[video.id]?.eq : undefined);

/** Short self-hosted equirect loop, only for featured videos. */
export const stageLoopFor = (video: Video) => media[video.id]?.loop;

// Narrative and studio categories that can co-occur with "nature" or "travel" tags.
const NOT_A_PLACE = ["story", "lesson", "horror", "cgi", "anime", "gameplay", "cosplay", "ai-generated", "passthrough"];

/** A real place you'd go and stand in, rather than a story, performance or render. */
const isPlace = (video: Video) =>
  video.intents.some((intent) => intent === "travel" || intent === "nature" || intent === "city")
  && !video.intents.includes("stories")
  && !video.categories.some((category) => NOT_A_PLACE.includes(category));

export function getFeaturedVideos() {
  return FEATURED.flatMap(({ slug }) => videoBySlug.get(slug) ?? []);
}

export function getPlaces() {
  return PLACES.flatMap((place) => {
    const video = videoBySlug.get(place.slug);
    return video && equirectFor(video) ? [{ ...place, video }] : [];
  });
}

export function getSimilarVideos(video: Video, limit = 4) {
  return VIDEOS
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

/** Links out to the live DeoVR site for everything outside the homepage. */
export const deovrUrl = (path: string) => `https://deovr.com${path}`;

// ---------- Editorial chapters ----------

const byViews = (a: Video, b: Video) => b.views - a.views;
const isFeatured = (video: Video) => FEATURED.some((item) => item.slug === video.slug);

/** "A quieter kind of somewhere": still-camera places under 25 minutes. */
export function getCalmPlaces(limit = 4) {
  return VIDEOS.filter((video) => video.comfort === "still" && video.durationSec < 1500 && isPlace(video) && !isFeatured(video)).sort(byViews).slice(0, limit);
}

/** "Look closer": 8K stereo places, where clarity earns its keep. */
export function getSharpPlaces(exclude: Video[], limit = 4) {
  return VIDEOS.filter((video) => video.clarity === "8K" && video.depth === "3D" && isPlace(video) && !exclude.includes(video)).sort(byViews).slice(0, limit);
}

/** Creators whose catalogue includes places, most followed first. */
export function getPlaceCreators(limit = 4) {
  const withPlaces = new Set(VIDEOS.filter(isPlace).map((video) => video.channel));
  return CHANNELS.filter((channel) => withPlaces.has(channel.slug)).sort((a, b) => b.subscribers - a.subscribers).slice(0, limit);
}
