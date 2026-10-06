"use client";

import { useState } from "react";
import { useAppState } from "@/components/providers/AppProviders";
import { Icon } from "@/components/ui/Icons";
import LibraryMenu from "@/components/shell/LibraryMenu";

// Headset view navigation: labelled, ≥ 64px targets at a comfortable downward gaze,
// instead of a top-left menu you have to reach for with a controller ray.
export default function HeadsetDock({ onSearch, onOpenQueue }: { onSearch: () => void; onOpenQueue: () => void }) {
  const { queue, setView } = useAppState();
  const [libraryOpen, setLibraryOpen] = useState(false);

  return (
    <>
      <nav className="headset-dock" aria-label="Headset navigation">
        <button type="button" aria-current="true" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><Icon name="home" /><span className="dock-label">Home</span></button>
        <button type="button" onClick={onSearch}><Icon name="search" /><span className="dock-label">Search</span></button>
        <button type="button" onClick={onOpenQueue}><Icon name="queue" /><span className="dock-label">Queue</span>{queue.length > 0 && <span className="queue-count">{queue.length}</span>}</button>
        <button type="button" aria-expanded={libraryOpen} onClick={() => setLibraryOpen((open) => !open)}><Icon name="library" /><span className="dock-label">Library</span></button>
        <button type="button" onClick={() => setView("desktop")} aria-label="Switch to desktop view"><Icon name="headset" /><span className="dock-label">2D view</span></button>
      </nav>
      {libraryOpen && <div className="headset-library page-width"><LibraryMenu id="headset-library-menu" onNavigate={() => setLibraryOpen(false)} /></div>}
    </>
  );
}
