"use client";

import type { RefObject } from "react";
import type { FacetKey, Feed, Filters } from "@/lib/filters";
import { DEFAULT_FILTERS, facetLabel } from "@/lib/filters";
import { INTENTS } from "@/data/curation";
import { Icon } from "@/components/ui/Icons";
import ImmersionFilter from "@/components/discovery/ImmersionFilter";

const FEEDS: [Feed, string][] = [["for-you", "For you"], ["new", "New"], ["trending", "Trending"]];

// An easy first session: a still camera (the biggest comfort factor), 180° so everything is in
// front of you, and short. A shortcut into the Immersion filter, not a separate mode.
const FIRST_TIME = { comfort: "still", fov: "180", length: "short" } as const;

// Two orthogonal facets: *where / what* (intent chips) and *how it feels* (Immersion filter).
export default function DiscoveryBar({ filters, resultCount, ready, onChange, onFeedback, headsetSearchRef }: {
  filters: Filters;
  resultCount: number;
  ready: boolean;
  onChange: (patch: Partial<Filters>, history?: "push" | "replace") => void;
  onFeedback: (message: string) => void;
  headsetSearchRef: RefObject<HTMLInputElement | null>;
}) {
  const active: { key: "query" | "intent" | FacetKey; label: string }[] = [];
  if (filters.query) active.push({ key: "query", label: `Search: ${filters.query}` });
  if (filters.intent !== "all") active.push({ key: "intent", label: INTENTS.find((item) => item.value === filters.intent)?.label ?? filters.intent });
  for (const key of ["fov", "depth", "clarity", "comfort", "length"] as const) {
    if (filters[key] !== "all") active.push({ key, label: key === "comfort" ? `Camera: ${facetLabel(key, filters[key])}` : facetLabel(key, filters[key]) });
  }

  const firstTime = (Object.keys(FIRST_TIME) as (keyof typeof FIRST_TIME)[]).every((key) => filters[key] === FIRST_TIME[key]);
  const toggleFirstTime = () => {
    if (firstTime) { onChange({ comfort: "all", fov: "all", length: "all" }); return; }
    onChange(FIRST_TIME);
    onFeedback("Easy first sessions: still camera, 180° in front of you, under 10 minutes.");
  };

  return (
    <section className="discovery-shell" id="discover" aria-label="Discover videos">
      {/* Headset view has no top bar, so search lives here. */}
      <form className="headset-search-shell page-width" role="search" onSubmit={(event) => { event.preventDefault(); headsetSearchRef.current?.blur(); }}>
        <Icon name="search" />
        <label className="sr-only" htmlFor="headset-search">Search places, creators, and videos</label>
        <input ref={headsetSearchRef} id="headset-search" type="search" value={filters.query} placeholder="Search places, creators, moments" onChange={(event) => onChange({ query: event.target.value }, "replace")} />
        <kbd aria-hidden="true">Enter to search</kbd>
      </form>
      <div className="page-width discovery-bar">
        <div className="feed-tabs" role="group" aria-label="Sort videos">
          {FEEDS.map(([feed, label]) => <button key={feed} type="button" aria-pressed={filters.feed === feed} className="feed-tab" onClick={() => onChange({ feed })}>{label}</button>)}
        </div>
        <span className="bar-divider" aria-hidden="true" />
        <div className="intent-list" role="group" aria-label="Browse by subject">
          {INTENTS.map((intent) => <button key={intent.value} type="button" className="chip" aria-pressed={filters.intent === intent.value} onClick={() => onChange({ intent: intent.value })}>{intent.label}</button>)}
        </div>
        <div className="discovery-how">
          <button type="button" className="chip" aria-pressed={firstTime} onClick={toggleFirstTime}>New to VR?</button>
          <ImmersionFilter filters={filters} resultCount={resultCount} onChange={onChange} />
        </div>
        <span className="results-count" aria-live="polite">{ready ? `${resultCount.toLocaleString()} videos` : ""}</span>
      </div>
      {active.length > 0 && <div className="page-width active-filters" aria-label="Active filters">
        {active.map(({ key, label }) => <span className="active-filter" key={key}>
          <span>{label}</span>
          <button type="button" aria-label={`Remove ${label} filter`} onClick={() => onChange({ [key]: DEFAULT_FILTERS[key] })}><Icon name="close" /></button>
        </span>)}
        <button className="clear-filter" type="button" onClick={() => onChange({ ...DEFAULT_FILTERS, feed: filters.feed })}>Clear all</button>
      </div>}
    </section>
  );
}
