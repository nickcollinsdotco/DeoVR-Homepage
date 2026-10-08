"use client";

import Image from "next/image";
import { useEffect, useId, useRef } from "react";
import type { Video } from "@/lib/catalog";
import { equirectFor, getPlaces } from "@/lib/catalog";
import { formatDuration } from "@/lib/format";
import { pointerToPortal, registerPortal, setPortalActive } from "@/lib/immersive/portals";
import { useAppState } from "@/components/providers/AppProviders";

type Place = { place: string; country: string; video: Video };

// 360° places drawn as little planets: the silhouette *is* the field of view. Point at one and it
// unwraps into a window you can look around in; select it for the full quick view. It sits right
// under the stage (not inside the grid): the most immediate taste of "every video is a place".
export default function PlacesChapter({ onOpen }: { onOpen: (video: Video) => void }) {
  const places = getPlaces();
  if (places.length < 3) return null;
  return (
    <section className="places-chapter page-width" aria-labelledby="places-title">
      <div className="chapter-heading">
        <div>
          <h2 id="places-title">Where in the world</h2>
          <p>Each sphere is a whole place, seen all the way around. Point at one to unwrap it.</p>
        </div>
      </div>
      <ul className="places-grid">
        {places.map((place) => <PlanetCard key={place.video.slug} {...place} onOpen={onOpen} />)}
      </ul>
    </section>
  );
}

function PlanetCard({ place, country, video, onOpen }: Place & { onOpen: (video: Video) => void }) {
  const { view } = useAppState();
  const key = useId();
  const ref = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const still = equirectFor(video)!;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return registerPortal(key, el, { src: still, full: true, mode: "planet" });
  }, [key, still]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const enter = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setPortalActive(key, true), view === "headset" ? 400 : 120);
  };
  const leave = () => {
    if (timer.current) clearTimeout(timer.current);
    setPortalActive(key, false);
  };

  return (
    <li className="planet-card">
      <button
        ref={ref}
        type="button"
        className="planet-media"
        aria-label={`${place}, ${country}: 360-degree place. Open quick view.`}
        onPointerEnter={enter}
        onPointerLeave={leave}
        onPointerMove={(event) => pointerToPortal(key, event)}
        onFocus={enter}
        onBlur={leave}
        onClick={() => onOpen(video)}
      >
        <Image src={video.cover.sm} alt="" fill sizes="(min-width: 1120px) 16vw, 45vw" unoptimized />
      </button>
      <p className="planet-place">{place}</p>
      <p className="planet-meta"><span>{country}</span><span aria-hidden="true">·</span><span>{video.clarity}</span><span aria-hidden="true">·</span><span>{formatDuration(video.durationSec)}</span></p>
    </li>
  );
}
