"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Video } from "@/lib/catalog";
import { channelFor, FEATURED, featuredCopy, formatDuration, getFeaturedVideos, stageLoopFor } from "@/lib/catalog";
import { useAppState } from "@/components/AppProviders";
import ImmersionSignature from "@/components/ImmersionSignature";
import { DeoMark, Icon } from "@/components/Icons";

export default function Stage({
  videos,
  selected,
  previewActive,
  onSelect,
  onOpen,
  onPreview,
  onFeedback,
}: {
  videos: Video[];
  selected: Video;
  previewActive: boolean;
  onSelect: (video: Video) => void;
  onOpen: (video: Video) => void;
  onPreview: (slug: string | null) => void;
  onFeedback: (message: string) => void;
}) {
  const { contains, toggle } = useAppState();
  const [playing, setPlaying] = useState(false);
  const dwellTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alternateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alternates = useMemo(() => getFeaturedVideos(videos), [videos]);
  const copy = featuredCopy(selected);
  const stageLoop = stageLoopFor(selected);
  const channel = channelFor(selected);
  const queued = contains(selected.slug);

  useEffect(() => setPlaying(false), [selected.slug]);
  useEffect(() => () => {
    if (dwellTimer.current) clearTimeout(dwellTimer.current);
    if (alternateTimer.current) clearTimeout(alternateTimer.current);
  }, []);

  const startDwell = () => {
    if (!stageLoop) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (dwellTimer.current) clearTimeout(dwellTimer.current);
    dwellTimer.current = setTimeout(() => onPreview(selected.slug), 350);
  };
  const stopDwell = () => {
    if (dwellTimer.current) clearTimeout(dwellTimer.current);
    dwellTimer.current = null;
    setPlaying(false);
    onPreview(null);
  };

  return (
    <section className="stage-section page-width" aria-labelledby="stage-title">
      <div className="stage-layout" id="stage-featured-panel" role="tabpanel" aria-labelledby={`stage-alt-${selected.slug}`}>
        <div className="stage-media" data-preview-host onPointerEnter={startDwell} onPointerLeave={stopDwell} onFocusCapture={startDwell} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) stopDwell(); }}>
          <Image
            key={selected.slug}
            src={selected.cover.lg || selected.cover.sm}
            alt=""
            fill
            sizes="(min-width: 1120px) 65vw, 94vw"
            priority
            unoptimized
          />
          {previewActive && stageLoop && <video
            key={`stage-${selected.slug}`}
            className={playing ? "is-playing" : ""}
            src={stageLoop}
            muted
            playsInline
            loop
            autoPlay
            preload="none"
            aria-hidden="true"
            onPlaying={() => setPlaying(true)}
            onError={() => setPlaying(false)}
          />}
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
          </div>
          <div className="stage-actions">
            <a className="button button-primary" href={`https://deovr.com/${selected.slug}`} target="_blank" rel="noreferrer"><Icon name="play" />Watch in DeoVR</a>
            <button className="button button-outline" type="button" aria-pressed={queued} onClick={() => {
              toggle(selected.slug);
              onFeedback(queued ? "Removed from your headset queue." : "Added to headset queue.");
            }}><Icon name={queued ? "check" : "queue"} />{queued ? "Queued" : "Headset queue"}</button>
            <button className="button button-quiet" type="button" onClick={() => onOpen(selected)}>Details</button>
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
            onFocus={() => {
              onSelect(video);
              onPreview(stageLoopFor(video) && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? video.slug : null);
            }}
            onBlur={() => onPreview(null)}
            onPointerEnter={() => {
              if (alternateTimer.current) clearTimeout(alternateTimer.current);
              alternateTimer.current = setTimeout(() => {
                onSelect(video);
                onPreview(stageLoopFor(video) ? video.slug : null);
              }, 220);
            }}
            onPointerLeave={() => {
              if (alternateTimer.current) clearTimeout(alternateTimer.current);
              alternateTimer.current = null;
              onPreview(null);
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
