"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Video } from "@/lib/catalog";
import { channelFor, equirectFor, featuredCopy, getFeaturedVideos, stageLoopFor } from "@/lib/catalog";
import { FEATURED } from "@/data/curation";
import { formatDuration } from "@/lib/format";
import { useAppState } from "@/components/providers/AppProviders";
import ImmersionSignature from "@/components/video/ImmersionSignature";
import { DeoMark, Icon } from "@/components/ui/Icons";
import WorldStage from "@/components/immersive/WorldStage";

export default function Stage({
  selected,
  onSelect,
  onOpen,
  onFeedback,
}: {
  selected: Video;
  onSelect: (video: Video) => void;
  onOpen: (video: Video) => void;
  onFeedback: (message: string) => void;
}) {
  const { contains, toggle } = useAppState();
  const [inside, setInside] = useState(false);
  const stepInRef = useRef<HTMLButtonElement>(null);
  const alternateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alternates = useMemo(() => getFeaturedVideos(), []);
  const copy = featuredCopy(selected);
  const channel = channelFor(selected);
  const queued = contains(selected.slug);
  const still = equirectFor(selected);
  const source = useMemo(() => ({ key: selected.slug, full: selected.fov >= 360, still, loop: stageLoopFor(selected) }), [selected, still]);
  const exit = useCallback(() => { setInside(false); stepInRef.current?.focus({ preventScroll: true }); }, []);

  useEffect(() => () => { if (alternateTimer.current) clearTimeout(alternateTimer.current); }, []);

  return (
    <section className="stage-section page-width" aria-labelledby="stage-title">
      <div className="stage-layout" id="stage-featured-panel" role="tabpanel" aria-labelledby={`stage-alt-${selected.slug}`}>
        <div className="stage-media">
          <Image
            key={selected.slug}
            src={selected.cover.lg || selected.cover.sm}
            alt=""
            fill
            sizes="(min-width: 1120px) 65vw, 94vw"
            priority
            unoptimized
          />
          {still && <WorldStage source={source} inside={inside} title={copy?.headline ?? selected.title} watchHref={`https://deovr.com/${selected.slug}`} onExit={exit} />}
          <div className="stage-scrim" />
          <div className="stage-index"><span className="stage-index-mark"><DeoMark /></span><span>Experience no. {String(Math.max(1, FEATURED.findIndex((item) => item.slug === selected.slug) + 1)).padStart(2, "0")}</span></div>
          <div className="stage-media-foot">
            <span className="stage-media-place">{copy?.place ?? channel?.name ?? "A DeoVR experience"}</span>
            <span className="stage-runtime">{formatDuration(selected.durationSec)}</span>
          </div>
        </div>

        <div className="stage-info" aria-live="polite">
          <span className="eyebrow"><i className="eyebrow-dot" />Featured experience</span>
          <p className="stage-place">{copy?.place ?? "Selected for DeoVR"}</p>
          <h1 className="stage-title" id="stage-title">{copy?.headline ?? selected.title}</h1>
          <p className="stage-hook">{copy?.hook ?? selected.description.split("\n")[0] ?? "Step into a new point of view."}</p>
          <ImmersionSignature video={selected} length />
          <div className="stage-channel">
            {channel?.avatar && <Image src={channel.avatar} alt="" width={30} height={30} className="avatar" unoptimized />}
            <span>{channel?.name ?? selected.channel}</span>
            <span aria-hidden="true">·</span>
            <button className="stage-details" type="button" onClick={() => onOpen(selected)}>Details</button>
          </div>
          <div className="stage-actions">
            {still
              ? <button ref={stepInRef} className="button button-primary" type="button" onClick={() => setInside(true)}><Icon name="headset" />Step inside</button>
              : <a className="button button-primary" href={`https://deovr.com/${selected.slug}`} target="_blank" rel="noreferrer"><Icon name="play" />Watch in VR</a>}
            {still && <a className="button button-outline" href={`https://deovr.com/${selected.slug}`} target="_blank" rel="noreferrer"><Icon name="play" />Watch in VR</a>}
            <button className="button button-outline button-icon" type="button" aria-pressed={queued} title={queued ? "In your headset queue" : "Add to headset queue"} onClick={() => {
              toggle(selected.slug);
              onFeedback(queued ? "Removed from your headset queue." : "Added to headset queue.");
            }}><Icon name={queued ? "check" : "queue"} /><span className="sr-only">{queued ? "Queued" : "Add to headset queue"}</span></button>
          </div>
        </div>
      </div>

      <div className="stage-alternates" role="tablist" aria-label="Featured experiences">
        {alternates.map((video, index) => {
          const alternate = featuredCopy(video);
          return <button
            key={video.slug}
            className="alternate"
            type="button"
            role="tab"
            tabIndex={selected.slug === video.slug ? 0 : -1}
            aria-selected={selected.slug === video.slug}
            aria-current={selected.slug === video.slug ? "true" : undefined}
            aria-controls="stage-featured-panel"
            onClick={() => onSelect(video)}
            onFocus={() => onSelect(video)}
            onPointerEnter={() => {
              if (alternateTimer.current) clearTimeout(alternateTimer.current);
              alternateTimer.current = setTimeout(() => onSelect(video), 220);
            }}
            onPointerLeave={() => {
              if (alternateTimer.current) clearTimeout(alternateTimer.current);
              alternateTimer.current = null;
            }}
            onKeyDown={(event) => {
              if (!["ArrowRight", "ArrowLeft"].includes(event.key)) return;
              event.preventDefault();
              const nextIndex = (index + (event.key === "ArrowRight" ? 1 : alternates.length - 1)) % alternates.length;
              const next = alternates[nextIndex];
              onSelect(next);
              document.getElementById(`stage-alt-${next.slug}`)?.focus();
            }}
            id={`stage-alt-${video.slug}`}
          >
            <span className="alternate-media"><Image src={video.cover.sm} alt="" fill sizes="(min-width: 1120px) 13vw, 34vw" unoptimized /></span>
            <span className="alternate-title">{alternate?.headline ?? video.title}</span>
            <span className="alternate-format">{video.fov ? `${video.fov}°` : "Flat"} · {video.depth} · {video.clarity}</span>
          </button>;
        })}
      </div>
    </section>
  );
}
