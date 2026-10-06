"use client";

import { useState } from "react";
import type { RefObject } from "react";
import { deovrUrl } from "@/lib/catalog";
import { useAppState } from "@/components/providers/AppProviders";
import { DeoLogo, Icon } from "@/components/ui/Icons";
import LibraryMenu from "@/components/shell/LibraryMenu";

const PRIMARY_NAV = [
  ["Photos", "/photos"],
  ["Channels", "/channels"],
  ["Passthrough", "/categories/passthrough-vr"],
  ["Premium", "/videos/premium"],
] as const;

// Desktop chrome. Hidden in headset view, where HeadsetDock takes over.
export default function TopBar({ query, onQuery, searchRef, onOpenQueue }: { query: string; onQuery: (query: string) => void; searchRef: RefObject<HTMLInputElement | null>; onOpenQueue: () => void }) {
  const { queue, view, setView } = useAppState();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="site-topbar">
      <div className="topbar-inner page-width">
        <a className="brand-link" href="#top" aria-label="DeoVR home"><DeoLogo /></a>
        <nav className="primary-nav" aria-label="Primary navigation">
          <a href="#discover" aria-current="page">Videos</a>
          {PRIMARY_NAV.map(([label, path]) => <a key={label} href={deovrUrl(path)} target="_blank" rel="noreferrer">{label}</a>)}
        </nav>
        <form className="top-search" role="search" onSubmit={(event) => { event.preventDefault(); searchRef.current?.blur(); document.getElementById("discover")?.scrollIntoView({ behavior: "smooth" }); }}>
          <button className="search-icon-button" type="button" aria-label="Open search" onClick={() => searchRef.current?.focus()}><Icon name="search" /></button>
          <label className="sr-only" htmlFor="site-search">Search places, creators, and videos</label>
          <input ref={searchRef} id="site-search" type="search" value={query} placeholder="Search places, creators, moments" onChange={(event) => onQuery(event.target.value)} />
          <kbd aria-hidden="true">/</kbd>
        </form>
        <div className="top-actions">
          <button className="button button-quiet queue-trigger" type="button" onClick={onOpenQueue} aria-label={`Open headset queue, ${queue.length} ${queue.length === 1 ? "video" : "videos"}`}>
            <Icon name="queue" /><span className="action-label">Queue</span>{queue.length > 0 && <span className="queue-count">{queue.length}</span>}
          </button>
          <button className="button button-quiet view-button" type="button" aria-label={view === "headset" ? "Switch to desktop view" : "Switch to headset view"} aria-pressed={view === "headset"} onClick={() => setView(view === "headset" ? "desktop" : "headset")}>
            <Icon name="headset" /><span className="action-label">Headset view</span>
          </button>
          <div className="top-library">
            <button className="button button-quiet library-trigger" type="button" aria-expanded={libraryOpen} aria-controls="library-menu" onClick={() => setLibraryOpen((open) => !open)}><Icon name="library" /><span className="action-label">Library</span></button>
            {libraryOpen && <LibraryMenu id="library-menu" onNavigate={() => setLibraryOpen(false)} />}
          </div>
          <button className="button button-quiet mobile-menu-trigger" type="button" aria-expanded={mobileNavOpen} aria-controls="mobile-navigation" aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"} onClick={() => setMobileNavOpen((open) => !open)}>
            <Icon name={mobileNavOpen ? "close" : "menu"} />
          </button>
        </div>
      </div>
      {mobileNavOpen && <nav className="mobile-nav page-width" id="mobile-navigation" aria-label="Mobile navigation">
        <a href="#discover" onClick={() => setMobileNavOpen(false)}>Videos</a>
        {PRIMARY_NAV.map(([label, path]) => <a key={label} href={deovrUrl(path)} target="_blank" rel="noreferrer">{label}</a>)}
        <button type="button" onClick={() => setLibraryOpen((open) => !open)}>{libraryOpen ? "Back to navigation" : "Your library"}</button>
        {libraryOpen && <LibraryMenu id="mobile-library-menu" onNavigate={() => { setLibraryOpen(false); setMobileNavOpen(false); }} />}
      </nav>}
    </header>
  );
}
