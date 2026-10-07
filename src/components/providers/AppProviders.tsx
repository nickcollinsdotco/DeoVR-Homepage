"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type QueueContextValue = {
  queue: string[];
  contains: (slug: string) => boolean;
  toggle: (slug: string) => void;
  addMany: (slugs: string[]) => void;
  remove: (slug: string) => void;
  clear: () => void;
  view: "desktop" | "headset";
  setView: (view: "desktop" | "headset") => void;
};

const QueueContext = createContext<QueueContextValue | null>(null);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<string[]>([]);
  const [view, setViewState] = useState<"desktop" | "headset">("desktop");
  const [queueReady, setQueueReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("deovr-headset-queue");
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        // Hydrate from localStorage after mount (static prerender has no storage). Merged, not
        // replaced: a queue handed over by link (?queue=) may already have been added.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (Array.isArray(parsed)) setQueue((items) => [...new Set([...parsed.filter((item): item is string => typeof item === "string"), ...items])]);
      }
    } catch {
      // Keep an empty in-memory queue when saved data cannot be read.
    }

    let initial: "desktop" | "headset" = "desktop";
    try {
      const forcedHeadset = new URLSearchParams(window.location.search).get("view") === "headset";
      const remembered = window.localStorage.getItem("deovr-view") === "headset";
      const ua = navigator.userAgent;
      const headsetBrowser = /OculusBrowser|Quest|PicoBrowser|Wolvic|visionOS/i.test(ua);
      initial = forcedHeadset || remembered || headsetBrowser ? "headset" : "desktop";
    } catch { /* The desktop view is the safe default when browser storage is restricted. */ }
    setViewState(initial);
    document.documentElement.dataset.view = initial;
    setQueueReady(true);
  }, []);

  useEffect(() => {
    if (!queueReady) return;
    try {
      window.localStorage.setItem("deovr-headset-queue", JSON.stringify(queue));
    } catch {
      // Queue remains available for this session when storage is restricted.
    }
  }, [queue, queueReady]);

  const setView = useCallback((next: "desktop" | "headset") => {
    setViewState(next);
    document.documentElement.dataset.view = next;
    try {
      window.localStorage.setItem("deovr-view", next);
    } catch {
      // The visible mode still changes when storage is restricted.
    }
    const url = new URL(window.location.href);
    if (next === "headset") url.searchParams.set("view", "headset");
    else url.searchParams.delete("view");
    window.history.replaceState({}, "", url);
  }, []);

  const value = useMemo<QueueContextValue>(() => ({
    queue,
    contains: (slug) => queue.includes(slug),
    toggle: (slug) => setQueue((items) => items.includes(slug) ? items.filter((item) => item !== slug) : [...items, slug]),
    addMany: (slugs) => setQueue((items) => [...new Set([...items, ...slugs])]),
    remove: (slug) => setQueue((items) => items.filter((item) => item !== slug)),
    clear: () => setQueue([]),
    view,
    setView,
  }), [queue, view, setView]);

  return <QueueContext.Provider value={value}>{children}</QueueContext.Provider>;
}

export function useAppState() {
  const value = useContext(QueueContext);
  if (!value) throw new Error("useAppState must be used inside AppProviders");
  return value;
}
