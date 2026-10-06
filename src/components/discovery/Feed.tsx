"use client";

import { useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import type { Video } from "@/lib/catalog";
import { VIDEOS, getCalmPlaces, getSharpPlaces } from "@/lib/catalog";
import type { Filters } from "@/lib/filters";
import { DEFAULT_FILTERS, hasFilters } from "@/lib/filters";
import { cleanTitle } from "@/lib/format";
import { INTENTS } from "@/data/curation";
import { useAppState } from "@/components/providers/AppProviders";
import { Icon } from "@/components/ui/Icons";
import VideoCard from "@/components/video/VideoCard";
import EditorialChapter from "@/components/chapters/EditorialChapter";
import PlacesChapter from "@/components/chapters/PlacesChapter";

const PAGE = 24;
const ARROWS: Record<string, "next" | "prev" | "down" | "up"> = { ArrowRight: "next", ArrowLeft: "prev", ArrowDown: "down", ArrowUp: "up" };

function feedTitle(filters: Filters) {
  if (filters.query) return `Results for “${filters.query}”`;
  if (filters.intent !== "all") return INTENTS.find((item) => item.value === filters.intent)?.label;
  if (filters.feed === "new") return "Just added";
  if (filters.feed === "trending") return "Trending now";
  return "Find your next window";
}

// The grid. With no filters applied, editorial chapters break it every two rows.
// Remount (via `key`) whenever filters change, which resets paging and the active preview.
export default function Feed({ videos, filters, onChange, onOpen, onFeedback }: {
  videos: Video[];
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onOpen: (video: Video) => void;
  onFeedback: (message: string) => void;
}) {
  const { contains, toggle } = useAppState();
  const [visible, setVisible] = useState(PAGE);
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const clean = !hasFilters(filters);
  const calm = useMemo(() => getCalmPlaces(), []);
  const sharp = useMemo(() => getSharpPlaces(calm), [calm]);
  const shown = videos.slice(0, visible);

  const card = (video: Video) => (
    <div data-video-slug={video.slug} key={video.slug}>
      <VideoCard video={video} previewActive={previewSlug === video.slug} onOpen={onOpen} onPreview={setPreviewSlug} onFeedback={onFeedback} />
      {previewSlug === video.slug && <span className="sr-only" aria-live="polite">Previewing {cleanTitle(video.title)}</span>}
    </div>
  );

  // Arrow keys move between cards; Q queues the focused card for the headset.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const host = (event.target as HTMLElement).closest<HTMLElement>("[data-video-slug]");
    const slug = host?.dataset.videoSlug;
    if (!host || !slug) return;
    if (event.key.toLowerCase() === "q") {
      event.preventDefault();
      onFeedback(contains(slug) ? "Removed from your headset queue." : "Added to headset queue.");
      toggle(slug);
      return;
    }
    const direction = ARROWS[event.key];
    if (!direction) return;
    event.preventDefault();
    const cards = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(":scope > [data-video-slug]"));
    const columns = Math.max(1, getComputedStyle(event.currentTarget).gridTemplateColumns.split(" ").length);
    const step = { next: 1, prev: -1, down: columns, up: -columns }[direction];
    const target = cards[Math.min(cards.length - 1, Math.max(0, cards.indexOf(host) + step))];
    target?.querySelector<HTMLButtonElement>(".card-open-media")?.focus();
  };

  return (
    <section className="feed-section page-width" aria-labelledby="feed-title">
      <div className="feed-heading">
        <div>
          <h2 id="feed-title">{feedTitle(filters)}</h2>
          <p>{clean ? "A few places worth stepping into." : `${videos.length.toLocaleString()} ${videos.length === 1 ? "experience" : "experiences"} match your view.`}</p>
        </div>
        {clean && <span className="eyebrow">{VIDEOS.length.toLocaleString()} experiences</span>}
      </div>

      {videos.length === 0
        ? <div className="video-grid"><div className="empty-state">
            <Icon name="search" />
            <h2>No windows found</h2>
            <p>Try a different place, format, or camera-motion estimate. The best discoveries can take a different route.</p>
            <button className="button button-secondary" type="button" onClick={() => onChange({ ...DEFAULT_FILTERS, feed: filters.feed })}>Clear filters</button>
          </div></div>
        : <div className="video-grid" onKeyDown={onKeyDown}>
            {clean ? <>
              {shown.slice(0, 8).map(card)}
              <EditorialChapter title="A quieter kind of somewhere" description="Still-camera places for when you want to slow down." action="Find calm places" onAction={() => onChange({ comfort: "still" })}>
                {calm.map(card)}
              </EditorialChapter>
              {shown.slice(8, 16).map(card)}
              <PlacesChapter onOpen={onOpen} />
              {shown.slice(16).map(card)}
              <EditorialChapter title="Look closer" description="High-resolution stereo views where fine detail earns the extra clarity." action="Explore 8K 3D" onAction={() => onChange({ clarity: "8", depth: "3D" })}>
                {sharp.map(card)}
              </EditorialChapter>
            </> : shown.map(card)}
          </div>}

      {videos.length > visible && <div className="load-more">
        <button className="button button-secondary" type="button" onClick={() => setVisible((count) => count + PAGE)}>Show more experiences <Icon name="arrow" /></button>
      </div>}
    </section>
  );
}
