"use client";

import { useEffect, useRef, useState } from "react";
import type { Filters } from "@/lib/filters";
import { FACETS, activeFacetCount } from "@/lib/filters";
import { Icon } from "@/components/ui/Icons";

// The "how it feels" facet: field of view, depth, clarity, comfort, length. Applies instantly.
export default function ImmersionFilter({ filters, resultCount, onChange }: { filters: Filters; resultCount: number; onChange: (patch: Partial<Filters>) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const count = activeFacetCount(filters);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("pointerdown", onPointerDown); document.removeEventListener("keydown", onKeyDown); };
  }, [open]);

  return (
    <div className="immersion-filter" ref={ref}>
      <button className="button button-outline immersion-trigger" type="button" aria-expanded={open} aria-controls="immersion-options" onClick={() => setOpen((value) => !value)}>
        <Icon name="sliders" />Immersion {count > 0 && <span className="filter-count">{count}</span>}
      </button>
      {open && <div className="filter-popover" id="immersion-options" role="dialog" aria-label="Filter by immersion">
        {FACETS.map((facet) => <fieldset key={facet.key} className="filter-group">
          <legend className="filter-group-label">{facet.label}</legend>
          <div className="filter-options">
            {facet.options.map(([value, label]) => <button key={value} type="button" className="chip" aria-pressed={filters[facet.key] === value} onClick={() => onChange({ [facet.key]: filters[facet.key] === value ? "all" : value })}>{label}</button>)}
          </div>
        </fieldset>)}
        <div className="filter-foot">
          <span>{resultCount} videos match</span>
          <button className="button button-quiet" type="button" onClick={() => onChange({ fov: "all", depth: "all", clarity: "all", comfort: "all", length: "all" })}>Clear facets</button>
        </div>
      </div>}
    </div>
  );
}
