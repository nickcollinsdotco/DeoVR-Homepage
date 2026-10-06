"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Video } from "@/lib/catalog";
import { VIDEOS, getFeaturedVideos } from "@/lib/catalog";
import type { Filters } from "@/lib/filters";
import { DEFAULT_FILTERS, filterCatalog, filtersFromSearch, writeFiltersToUrl } from "@/lib/filters";
import { useAppState } from "@/components/providers/AppProviders";
import TopBar from "@/components/shell/TopBar";
import HeadsetDock from "@/components/shell/HeadsetDock";
import SiteFooter from "@/components/shell/SiteFooter";
import Stage from "@/components/stage/Stage";
import DiscoveryBar from "@/components/discovery/DiscoveryBar";
import Feed from "@/components/discovery/Feed";
import CreatorsRow from "@/components/chapters/CreatorsRow";
import QuickView from "@/components/quickview/QuickView";
import QueueTray from "@/components/queue/QueueTray";
import PortalCanvas from "@/components/immersive/PortalCanvas";

const bySlug = (slug: string | null) => (slug ? VIDEOS.find((video) => video.slug === slug) ?? null : null);

// Page-level state: filters and quick view mirror the URL (?feed, ?intent, ?fov…, ?v=slug);
// the queue and view mode live in AppProviders.
export default function HomePage() {
  const { view } = useAppState();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [ready, setReady] = useState(false);
  const [stageVideo, setStageVideo] = useState<Video>(() => getFeaturedVideos()[0] ?? VIDEOS[0]);
  const [quickVideo, setQuickVideo] = useState<Video | null>(null);
  const [queueOpen, setQueueOpen] = useState(false);
  const [toast, setToast] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const headsetSearchRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const matching = useMemo(() => filterCatalog(VIDEOS, filters), [filters]);

  // The page is statically prerendered; read URL state once mounted, and on back/forward.
  useEffect(() => {
    const sync = () => {
      setFilters(filtersFromSearch(window.location.search));
      setQuickVideo(bySlug(new URLSearchParams(window.location.search).get("v")));
      setReady(true);
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  // "/" focuses search, wherever it lives in the current view mode.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || (event.target as HTMLElement | null)?.matches("input, textarea, select, [contenteditable='true']")) return;
      event.preventDefault();
      (view === "headset" ? headsetSearchRef : searchRef).current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [view]);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const changeFilters = useCallback((patch: Partial<Filters>, history: "push" | "replace" = "push") => {
    setFilters((current) => {
      const next = { ...current, ...patch };
      writeFiltersToUrl(next, history);
      return next;
    });
  }, []);

  const announce = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3000);
  }, []);

  const openQuickView = useCallback((video: Video) => {
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

  const focusSearch = () => {
    document.getElementById("discover")?.scrollIntoView({ behavior: "smooth" });
    headsetSearchRef.current?.focus();
  };

  return (
    <>
      <PortalCanvas />
      <a className="skip-link" href="#discover">Skip to videos</a>
      <TopBar query={filters.query} onQuery={(query) => changeFilters({ query }, "replace")} searchRef={searchRef} onOpenQueue={() => setQueueOpen(true)} />
      <main id="top">
        <Stage selected={stageVideo} onSelect={setStageVideo} onOpen={openQuickView} onFeedback={announce} />
        <DiscoveryBar filters={filters} resultCount={matching.length} ready={ready} onChange={changeFilters} headsetSearchRef={headsetSearchRef} />
        <Feed key={JSON.stringify(filters)} videos={matching} filters={filters} onChange={changeFilters} onOpen={openQuickView} onFeedback={announce} />
        <CreatorsRow />
      </main>
      <SiteFooter />
      <HeadsetDock onSearch={focusSearch} onOpenQueue={() => setQueueOpen(true)} />
      <QuickView video={quickVideo} onClose={closeQuickView} onOpenVideo={openQuickView} onFeedback={announce} />
      <QueueTray open={queueOpen} onClose={() => setQueueOpen(false)} onFeedback={announce} />
      {toast && <div className="queue-feedback" role="status" aria-live="polite">{toast}</div>}
    </>
  );
}
