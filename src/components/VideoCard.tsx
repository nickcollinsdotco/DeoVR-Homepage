"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Video } from "@/lib/catalog";
import { channelFor, cleanTitle, formatAge, formatCount, formatDuration } from "@/lib/catalog";
import { useAppState } from "@/components/AppProviders";
import ImmersionSignature from "@/components/ImmersionSignature";
import { Icon } from "@/components/Icons";

export default function VideoCard({
  video,
  previewActive,
  onOpen,
  onPreview,
  onFeedback,
}: {
  video: Video;
  previewActive: boolean;
  onOpen: (video: Video) => void;
  onPreview: (slug: string | null) => void;
  onFeedback: (message: string) => void;
}) {
  const { contains, toggle, view } = useAppState();
  const [playing, setPlaying] = useState(false);
  const dwellTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channel = channelFor(video);
  const queued = contains(video.slug);

  useEffect(() => {
    if (!previewActive) setPlaying(false);
  }, [previewActive]);
  useEffect(() => () => { if (dwellTimer.current) clearTimeout(dwellTimer.current); }, []);

  const startDwell = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (dwellTimer.current) clearTimeout(dwellTimer.current);
    dwellTimer.current = setTimeout(() => onPreview(video.slug), view === "headset" ? 500 : 300);
  };
  const stopDwell = () => {
    if (dwellTimer.current) clearTimeout(dwellTimer.current);
    dwellTimer.current = null;
    setPlaying(false);
    onPreview(null);
  };

  return (
    <article className="video-card" onPointerEnter={startDwell} onPointerLeave={stopDwell} onFocusCapture={startDwell} onBlurCapture={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) stopDwell();
    }}>
      <div className="card-media" data-preview-host>
        <Image
          src={video.cover.sm}
          alt=""
          fill
          sizes="(min-width: 1680px) 22vw, (min-width: 1120px) 25vw, (min-width: 640px) 33vw, 92vw"
          unoptimized
        />
        {previewActive && video.preview && <video
          key={video.slug}
          className={playing ? "is-playing" : ""}
          src={video.preview}
          muted
          playsInline
          loop
          autoPlay
          preload="none"
          aria-hidden="true"
          onPlaying={() => setPlaying(true)}
          onError={() => setPlaying(false)}
        />}
        <button className="card-open-media" type="button" onClick={() => onOpen(video)} aria-label={`Quick view: ${cleanTitle(video.title)}`}>
          <span className="sr-only">View details</span>
        </button>
        {video.premium && <span className="premium-badge"><Icon name="spark" />Premium</span>}
        <span className="duration-badge">{formatDuration(video.durationSec)}</span>
        <button
          className="card-queue"
          type="button"
          aria-label={queued ? `Remove ${cleanTitle(video.title)} from headset queue` : `Add ${cleanTitle(video.title)} to headset queue`}
          aria-pressed={queued}
          onClick={() => {
            toggle(video.slug);
            onFeedback(queued ? "Removed from your headset queue." : "Added to headset queue.");
          }}
        ><Icon name={queued ? "check" : "queue"} /></button>
      </div>
      <div className="card-copy">
        <h3 className="card-title"><button type="button" onClick={() => onOpen(video)}>{cleanTitle(video.title)}</button></h3>
        <div className="card-channel">{channel?.name ?? video.channel} <span aria-hidden="true">·</span> {formatAge(video.publishedAt)}</div>
        <ImmersionSignature video={video} />
        <div className="card-stats" aria-label={`${formatCount(video.views)} views, ${formatCount(video.likes)} likes`}>
          <span>{formatCount(video.views)} views</span><span className="stat-sep" aria-hidden="true">·</span><span>{formatCount(video.likes)} likes</span>
        </div>
      </div>
    </article>
  );
}
