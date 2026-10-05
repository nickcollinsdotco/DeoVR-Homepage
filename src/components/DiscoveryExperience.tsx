"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { Channel, Feed, Filters, Video } from "@/lib/catalog";
import { DEFAULT_FILTERS, FEATURED, INTENTS, channelFor, cleanTitle, filterCatalog, filtersFromSearch, formatCount, formatDuration, getPlaces, getSimilarVideos, hasFilters, writeFiltersToUrl } from "@/lib/catalog";
import { useAppState } from "@/components/AppProviders";
import { DeoLogo, Icon } from "@/components/Icons";
import ImmersionSignature from "@/components/ImmersionSignature";
import QuickView from "@/components/QuickView";
import QueueTray from "@/components/QueueTray";
import Stage from "@/components/Stage";
import VideoCard from "@/components/VideoCard";
import PortalCanvas from "@/components/immersive/PortalCanvas";
import PlacesChapter from "@/components/immersive/PlacesChapter";

const FILTER_GROUPS = [
  { key: "fov", label: "Field of view", options: [["180", "180°"], ["360", "360°"]] },
  { key: "depth", label: "Depth", options: [["3D", "3D"], ["2D", "2D"]] },
  { key: "clarity", label: "Clarity", options: [["8", "8K+"], ["6", "6K+"], ["4", "4K+"]] },
  { key: "comfort", label: "Camera motion estimate", options: [["still", "Still"], ["gentle", "Gentle"], ["moving", "Moving"]] },
  { key: "length", label: "Length", options: [["short", "Under 10 min"], ["medium", "10–30 min"], ["long", "30+ min"]] },
] as const;

type FilterKey = "intent" | "fov" | "depth" | "clarity" | "comfort" | "length";
type ActivePreview = { kind: "stage" | "tile"; slug: string } | null;

function external(path: string) {
  return `https://deovr.com${path}`;
}

function activeFilterLabel(key: FilterKey, value: string) {
  if (key === "intent") return INTENTS.find((item) => item.value === value)?.label ?? value;
  if (key === "fov") return `${value}°`;
  if (key === "depth") return value;
  if (key === "clarity") return `${value}K+`;
  if (key === "comfort") return `Camera: ${value}`;
  if (key === "length") return value === "short" ? "Under 10 min" : value === "medium" ? "10–30 min" : "30+ min";
  return value;
}

export default function DiscoveryExperience({ videos, channels }: { videos: Video[]; channels: Channel[] }) {
  const { queue, view, setView, toggle } = useAppState();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filtersLoaded, setFiltersLoaded] = useState(false);
  const [quickVideo, setQuickVideo] = useState<Video | null>(null);
  const [stageVideo, setStageVideo] = useState<Video | null>(() => videos.find((video) => video.slug === FEATURED[0]?.slug) ?? videos[0] ?? null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [activePreview, setActivePreview] = useState<ActivePreview>(null);
  const [visibleCount, setVisibleCount] = useState(24);
  const [toast, setToast] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const headsetSearchRef = useRef<HTMLInputElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const quickRef = useRef<HTMLDialogElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const matching = useMemo(() => filterCatalog(videos, filters), [videos, filters]);
  const shown = matching.slice(0, visibleCount);
  const previewSlug = activePreview?.kind === "tile" ? activePreview.slug : null;
  const clean = !hasFilters(filters);
  const activeFacetCount = [filters.fov, filters.depth, filters.clarity, filters.comfort, filters.length].filter((value) => value !== "all").length;

  useEffect(() => {
    const initial = filtersFromSearch(window.location.search);
    setFilters(initial);
    const initialSlug = new URLSearchParams(window.location.search).get("v");
    if (initialSlug) setQuickVideo(videos.find((video) => video.slug === initialSlug) ?? null);
    setFiltersLoaded(true);

    const onPopState = () => {
      setFilters(filtersFromSearch(window.location.search));
      const slug = new URLSearchParams(window.location.search).get("v");
      setQuickVideo(videos.find((video) => video.slug === slug) ?? null);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [videos]);

  useEffect(() => {
    if (!filterOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) setFilterOpen(false);
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") setFilterOpen(false); };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("pointerdown", onPointerDown); document.removeEventListener("keydown", onKeyDown); };
  }, [filterOpen]);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key === "/" && !target?.matches("input, textarea, select, [contenteditable='true']")) {
        event.preventDefault();
        (view === "headset" ? headsetSearchRef.current : searchRef.current)?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [view]);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);
  useEffect(() => { setVisibleCount(24); }, [filters]);

  const changeFilters = useCallback((patch: Partial<Filters>, historyMode: "push" | "replace" = "push") => {
    const next = { ...filters, ...patch };
    setFilters(next);
    writeFiltersToUrl(next, historyMode);
  }, [filters]);

  const announce = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3000);
  }, []);

  const previewTile = useCallback((slug: string | null) => setActivePreview(slug ? { kind: "tile", slug } : null), []);

  const openQuickView = useCallback((video: Video) => {
    setActivePreview(null);
    setQuickVideo(video);
    const url = new URL(window.location.href);
    url.searchParams.set("v", video.slug);
    window.history.pushState({}, "", url);
  }, []);

  const closeQuickView = useCallback(() => {
    setQuickVideo(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("v");
    window.history.replaceState({}, "", url);
  }, []);

  const clearFacets = () => changeFilters({ fov: "all", depth: "all", clarity: "all", comfort: "all", length: "all" });
  const clearAllFilters = () => changeFilters({ ...DEFAULT_FILTERS, feed: filters.feed });
  const activeTags: { key: FilterKey | "query"; label: string }[] = [];
  if (filters.query) activeTags.push({ key: "query", label: `Search: ${filters.query}` });
  if (filters.intent !== "all") activeTags.push({ key: "intent", label: activeFilterLabel("intent", filters.intent) });
  for (const key of ["fov", "depth", "clarity", "comfort", "length"] as const) {
    if (filters[key] !== "all") activeTags.push({ key, label: activeFilterLabel(key, filters[key]) });
  }
  const removeTag = (key: FilterKey | "query") => {
    if (key === "query") changeFilters({ query: "" });
    else if (key === "intent") changeFilters({ intent: "all" });
    else if (key === "fov") changeFilters({ fov: "all" });
    else if (key === "depth") changeFilters({ depth: "all" });
    else if (key === "clarity") changeFilters({ clarity: "all" });
    else if (key === "comfort") changeFilters({ comfort: "all" });
    else changeFilters({ length: "all" });
  };

  const categorySamples = useMemo(() => {
    const top = new Map<string, Video>();
    for (const video of videos) {
      if (!top.has(video.channel)) top.set(video.channel, video);
    }
    return channels
      .filter((channel) => top.has(channel.slug))
      .sort((a, b) => b.subscribers - a.subscribers)
      .slice(0, 4);
  }, [channels, videos]);

  const isPlace = (video: Video) => video.intents.some((intent) => intent === "travel" || intent === "nature" || intent === "city");
  const calmVideos = useMemo(() => videos.filter((video) => video.comfort === "still" && video.durationSec < 1500 && isPlace(video) && !FEATURED.some((item) => item.slug === video.slug)).sort((a, b) => b.views - a.views).slice(0, 4), [videos]);
  const sharpVideos = useMemo(() => videos.filter((video) => video.clarity === "8K" && video.depth === "3D" && isPlace(video) && !calmVideos.includes(video)).sort((a, b) => b.views - a.views).slice(0, 4), [videos, calmVideos]);
  const places = useMemo(() => getPlaces(videos), [videos]);

  const handleGridKeys = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const card = target.closest<HTMLElement>("[data-video-slug]");
    if (!card) return;
    if (event.key.toLocaleLowerCase() === "q") {
      event.preventDefault();
      toggle(card.dataset.videoSlug ?? "");
      announce(queue.includes(card.dataset.videoSlug ?? "") ? "Removed from your headset queue." : "Added to headset queue.");
      return;
    }
    if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(event.key)) return;
    const cards = Array.from(document.querySelectorAll<HTMLElement>(".video-grid [data-video-slug]"));
    const current = cards.indexOf(card);
    if (current < 0) return;
    event.preventDefault();
    const columns = Math.max(1, getComputedStyle(event.currentTarget).gridTemplateColumns.split(" ").length);
    const offsets: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns, ArrowUp: -columns };
    const next = cards[Math.min(cards.length - 1, Math.max(0, current + offsets[event.key]))];
    next?.querySelector<HTMLButtonElement>(".card-open-media")?.focus();
  };

  if (!stageVideo) return <main className="page-width empty-state"><h1>DeoVR</h1><p>The video library is not available right now.</p></main>;

  return (
    <>
      <PortalCanvas />
      <a className="skip-link" href="#discover">Skip to videos</a>
      <header className="site-topbar">
        <div className="topbar-inner page-width">
          <a className="brand-link" href="#top" aria-label="DeoVR home"><DeoLogo /></a>
          <nav className="primary-nav" aria-label="Primary navigation">
            <a href="#discover" aria-current="page">Videos</a>
            <a href={external("/photos")} target="_blank" rel="noreferrer">Photos</a>
            <a href={external("/channels")} target="_blank" rel="noreferrer">Channels</a>
            <a href={external("/categories/passthrough-vr")} target="_blank" rel="noreferrer">Passthrough</a>
            <a href={external("/videos/premium")} target="_blank" rel="noreferrer">Premium</a>
          </nav>
          <form className="top-search" role="search" onSubmit={(event) => { event.preventDefault(); searchRef.current?.blur(); document.getElementById("discover")?.scrollIntoView({ behavior: "smooth" }); }}>
            <button className="search-icon-button" type="button" aria-label="Open search" onClick={() => searchRef.current?.focus()}><Icon name="search" /></button>
            <label className="sr-only" htmlFor="site-search">Search places, creators, and videos</label>
            <input ref={searchRef} id="site-search" type="search" value={filters.query} placeholder="Search places, creators, moments" onChange={(event) => changeFilters({ query: event.target.value }, "replace")} />
            <kbd aria-hidden="true">/</kbd>
          </form>
          <div className="top-actions">
            <button className="button button-quiet queue-trigger" type="button" onClick={() => setQueueOpen(true)} aria-label={`Open headset queue, ${queue.length} ${queue.length === 1 ? "video" : "videos"}`}><Icon name="queue" /><span className="action-label">Queue</span>{queue.length > 0 && <span className="queue-count">{queue.length}</span>}</button>
            <button className="button button-quiet view-button" type="button" aria-label={view === "headset" ? "Switch to desktop view" : "Switch to headset view"} aria-pressed={view === "headset"} onClick={() => setView(view === "headset" ? "desktop" : "headset")}><Icon name="headset" /><span className="action-label">Headset view</span></button>
            <div className="top-library">
              <button className="button button-quiet library-trigger" type="button" aria-expanded={libraryOpen} aria-controls="library-menu" onClick={() => setLibraryOpen((open) => !open)}><Icon name="library" /><span className="action-label">Library</span></button>
              {libraryOpen && <LibraryMenu id="library-menu" onNavigate={() => setLibraryOpen(false)} />}
            </div>
            <button className="button button-quiet mobile-menu-trigger" type="button" aria-expanded={mobileNavOpen} aria-controls="mobile-navigation" aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"} onClick={() => setMobileNavOpen((open) => !open)}><Icon name={mobileNavOpen ? "close" : "menu"} /></button>
          </div>
        </div>
        {mobileNavOpen && <nav className="mobile-nav page-width" id="mobile-navigation" aria-label="Mobile navigation">
          <a href="#discover" onClick={() => setMobileNavOpen(false)}>Videos</a><a href={external("/photos")} target="_blank" rel="noreferrer">Photos</a><a href={external("/channels")} target="_blank" rel="noreferrer">Channels</a><a href={external("/categories/passthrough-vr")} target="_blank" rel="noreferrer">Passthrough</a><a href={external("/videos/premium")} target="_blank" rel="noreferrer">Premium</a><button type="button" onClick={() => setLibraryOpen((open) => !open)}>{libraryOpen ? "Back to navigation" : "Your library"}</button>
          {libraryOpen && <LibraryMenu id="mobile-library-menu" onNavigate={() => { setLibraryOpen(false); setMobileNavOpen(false); }} />}
        </nav>}
      </header>

      <main id="top">
        <Stage videos={videos} selected={stageVideo} onSelect={(video) => { setActivePreview(null); setStageVideo(video); }} onOpen={openQuickView} onFeedback={announce} />

        <section className="discovery-shell" id="discover" aria-label="Discover videos">
          <form className="headset-search-shell page-width" role="search" onSubmit={(event) => { event.preventDefault(); headsetSearchRef.current?.blur(); }}>
            <Icon name="search" />
            <label className="sr-only" htmlFor="headset-search">Search places, creators, and videos</label>
            <input ref={headsetSearchRef} id="headset-search" type="search" value={filters.query} placeholder="Search places, creators, moments" onChange={(event) => changeFilters({ query: event.target.value }, "replace")} />
            <kbd aria-hidden="true">Enter to search</kbd>
          </form>
          <div className="page-width discovery-bar">
            <div className="feed-tabs" role="group" aria-label="Sort videos">
              {([["for-you", "For you"], ["new", "New"], ["trending", "Trending"]] as [Feed, string][]).map(([feed, label]) => <button key={feed} type="button" aria-pressed={filters.feed === feed} className="feed-tab" onClick={() => changeFilters({ feed })}>{label}</button>)}
            </div>
            <span className="bar-divider" aria-hidden="true" />
            <div className="intent-list" role="group" aria-label="Browse by subject">
              {INTENTS.map((intent) => <button key={intent.value} type="button" className="chip" aria-pressed={filters.intent === intent.value} onClick={() => changeFilters({ intent: intent.value })}>{intent.label}</button>)}
            </div>
            <div className="immersion-filter" ref={filterRef}>
              <button className="button button-outline immersion-trigger" type="button" aria-expanded={filterOpen} aria-controls="immersion-options" onClick={() => setFilterOpen((open) => !open)}><Icon name="sliders" />Immersion {activeFacetCount > 0 && <span className="filter-count">{activeFacetCount}</span>}</button>
              {filterOpen && <div className="filter-popover" id="immersion-options" role="dialog" aria-label="Filter by immersion">
                {FILTER_GROUPS.map((group) => <fieldset key={group.key} className="filter-group">
                  <legend className="filter-group-label">{group.label}</legend>
                  <div className="filter-options">
                    {group.options.map(([value, label]) => <button key={value} type="button" className="chip" aria-pressed={filters[group.key] === value} onClick={() => changeFilters({ [group.key]: filters[group.key] === value ? "all" : value })}>{label}</button>)}
                  </div>
                </fieldset>)}
                <div className="filter-foot"><span>{matching.length} videos match</span><button className="button button-quiet" type="button" onClick={clearFacets}>Clear facets</button></div>
              </div>}
            </div>
            <span className="results-count" aria-live="polite">{filtersLoaded ? `${matching.length.toLocaleString()} videos` : ""}</span>
          </div>
          {activeTags.length > 0 && <div className="page-width active-filters" aria-label="Active filters">
            {activeTags.map(({ key, label }) => <span className="active-filter" key={key}><span>{label}</span><button type="button" aria-label={`Remove ${label} filter`} onClick={() => removeTag(key)}><Icon name="close" /></button></span>)}
            <button className="clear-filter" type="button" onClick={clearAllFilters}>Clear all</button>
          </div>}
        </section>

        <section className="feed-section page-width" aria-labelledby="feed-title">
          <div className="feed-heading">
            <div><h2 id="feed-title">{filters.query ? `Results for “${filters.query}”` : filters.intent !== "all" ? INTENTS.find((item) => item.value === filters.intent)?.label : filters.feed === "new" ? "Just added" : filters.feed === "trending" ? "Trending now" : "Find your next window"}</h2>
              <p>{clean ? "A few places worth stepping into." : `${matching.length.toLocaleString()} ${matching.length === 1 ? "experience" : "experiences"} match your view.`}</p>
            </div>
            {clean && <span className="eyebrow">{videos.length.toLocaleString()} experiences</span>}
          </div>

          {matching.length === 0 ? <div className="video-grid"><div className="empty-state"><Icon name="search" /><h2>No windows found</h2><p>Try a different place, format, or camera-motion estimate. The best discoveries can take a different route.</p><button className="button button-secondary" type="button" onClick={clearAllFilters}>Clear filters</button></div></div> : <div className="video-grid" onKeyDown={handleGridKeys}>
            {shown.slice(0, clean ? 8 : shown.length).map((video) => <div data-video-slug={video.slug} key={video.slug}><VideoCard video={video} previewActive={previewSlug === video.slug} onOpen={openQuickView} onPreview={previewTile} onFeedback={announce} />{previewSlug === video.slug && <span className="sr-only" aria-live="polite">Previewing {cleanTitle(video.title)}</span>}</div>)}

            {clean && calmVideos.length > 0 && <EditorialChapter title="A quieter kind of somewhere" description="Still-camera experiences for when you want to slow down." action="Find calm places" onAction={() => changeFilters({ intent: "nature", comfort: "still" })} videos={calmVideos} previewSlug={previewSlug} onOpen={openQuickView} onPreview={previewTile} onFeedback={announce} />}

            {shown.slice(clean ? 8 : shown.length, clean ? 16 : shown.length).map((video) => <div data-video-slug={video.slug} key={video.slug}><VideoCard video={video} previewActive={previewSlug === video.slug} onOpen={openQuickView} onPreview={previewTile} onFeedback={announce} /></div>)}

            {clean && <PlacesChapter places={places} onOpen={openQuickView} />}

            {shown.slice(clean ? 16 : shown.length, visibleCount).map((video) => <div data-video-slug={video.slug} key={video.slug}><VideoCard video={video} previewActive={previewSlug === video.slug} onOpen={openQuickView} onPreview={previewTile} onFeedback={announce} />{previewSlug === video.slug && <span className="sr-only" aria-live="polite">Previewing {cleanTitle(video.title)}</span>}</div>)}

            {clean && sharpVideos.length > 0 && <EditorialChapter title="Look closer" description="High-resolution stereo views where fine detail earns the extra clarity." action="Explore 8K 3D" onAction={() => changeFilters({ clarity: "8", depth: "3D" })} videos={sharpVideos} previewSlug={previewSlug} onOpen={openQuickView} onPreview={previewTile} onFeedback={announce} />}
          </div>}

          {matching.length > visibleCount && <div className="load-more"><button className="button button-secondary" type="button" onClick={() => setVisibleCount((count) => count + 24)}>Show more experiences <Icon name="arrow" /></button></div>}
        </section>

        {clean && <>
          <section className="creator-section page-width" aria-labelledby="creator-title">
            <h2 id="creator-title">Made by people who take you places</h2>
            <p className="section-intro">A few voices from the DeoVR community.</p>
            <div className="creator-grid">
              {categorySamples.map((channel) => <a className="creator-card" href={external(`/channel/${channel.slug}`)} key={channel.slug} target="_blank" rel="noreferrer">
                <span className="creator-avatar"><Image src={channel.avatar} alt="" width={56} height={56} sizes="44px" unoptimized /></span>
                <span className="creator-card-copy"><strong>{channel.name}</strong><span>{formatCount(channel.subscribers)} followers · {channel.videoCount} videos</span></span>
                <Icon name="external" width={16} height={16} />
              </a>)}
            </div>
          </section>
          <section className="category-section page-width" aria-labelledby="category-title">
            <h2 id="category-title">Choose a direction</h2>
            <p className="section-intro">Start with what you want to see. Refine by how you want it to feel.</p>
            <div className="category-grid">
              {INTENTS.filter((intent) => intent.value !== "all").map((intent, index) => <button className={`category-tile category-tone-${index}`} key={intent.value} type="button" onClick={() => { changeFilters({ intent: intent.value }); document.getElementById("discover")?.scrollIntoView({ behavior: "smooth" }); }}>{intent.label}</button>)}
            </div>
          </section>
        </>}
      </main>

      <footer className="site-footer page-width"><span>DeoVR · A field guide to immersive video</span><span>Video previews and catalogue content by DeoVR creators · <a href="https://deovr.com/" target="_blank" rel="noreferrer">deovr.com <Icon name="external" width={12} height={12} /></a></span></footer>

      <HeadsetDock onHome={() => window.scrollTo({ top: 0, behavior: "smooth" })} onSearch={() => { document.getElementById("discover")?.scrollIntoView({ behavior: "smooth" }); headsetSearchRef.current?.focus(); }} onQueue={() => setQueueOpen(true)} onLibrary={() => setLibraryOpen((open) => !open)} onDesktop={() => setView("desktop")} queueCount={queue.length} libraryOpen={libraryOpen} />
      {view === "headset" && libraryOpen && <div className="headset-library page-width"><LibraryMenu id="headset-library-menu" onNavigate={() => setLibraryOpen(false)} /></div>}
      <QuickView video={quickVideo} videos={videos} onClose={closeQuickView} onOpenVideo={openQuickView} onFeedback={announce} />
      <QueueTray videos={videos} open={queueOpen} onClose={() => setQueueOpen(false)} onFeedback={announce} />
      {toast && <div className="queue-feedback" role="status" aria-live="polite">{toast}</div>}
    </>
  );
}

function LibraryMenu({ id, onNavigate }: { id: string; onNavigate: () => void }) {
  const items = [
    ["My Subscriptions", "/my-subscriptions"], ["Liked", "/liked"], ["Watch History", "/history"], ["My Playlists", "/my-playlists"], ["Upload", "/upload"], ["DriveAI", "/driveai"],
  ];
  return <div className="library-popover" id={id} role="navigation" aria-label="Your DeoVR library">{items.map(([label, path]) => <a key={label} href={external(path)} target="_blank" rel="noreferrer" onClick={onNavigate}>{label}</a>)}</div>;
}

function HeadsetDock({ onHome, onSearch, onQueue, onLibrary, onDesktop, queueCount, libraryOpen }: { onHome: () => void; onSearch: () => void; onQueue: () => void; onLibrary: () => void; onDesktop: () => void; queueCount: number; libraryOpen: boolean }) {
  return <nav className="headset-dock" aria-label="Headset navigation">
    <button type="button" aria-current="true" onClick={onHome}><Icon name="home" /><span className="dock-label">Home</span></button>
    <button type="button" onClick={onSearch}><Icon name="search" /><span className="dock-label">Search</span></button>
    <button type="button" onClick={onQueue}><Icon name="queue" /><span className="dock-label">Queue</span>{queueCount > 0 && <span className="queue-count">{queueCount}</span>}</button>
    <button type="button" aria-expanded={libraryOpen} onClick={onLibrary}><Icon name="library" /><span className="dock-label">Library</span></button>
    <button type="button" onClick={onDesktop} aria-label="Switch to desktop view"><Icon name="headset" /><span className="dock-label">2D view</span></button>
  </nav>;
}

function EditorialChapter({ title, description, action, onAction, videos, previewSlug, onOpen, onPreview, onFeedback }: { title: string; description: string; action: string; onAction: () => void; videos: Video[]; previewSlug: string | null; onOpen: (video: Video) => void; onPreview: (slug: string | null) => void; onFeedback: (message: string) => void }) {
  return <section className="editorial-chapter" aria-label={title}>
    <div className="chapter-heading"><div><h2>{title}</h2><p>{description}</p></div><button className="chapter-link" type="button" onClick={onAction}>{action}<Icon name="arrow" /></button></div>
    <div className="chapter-cards">{videos.map((video) => <div data-video-slug={video.slug} key={video.slug}><VideoCard video={video} previewActive={previewSlug === video.slug} onOpen={onOpen} onPreview={onPreview} onFeedback={onFeedback} /></div>)}</div>
  </section>;
}
