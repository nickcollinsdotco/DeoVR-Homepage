"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Video } from "@/lib/catalog";
import { channelFor, cleanTitle, formatCount, getSimilarVideos, stageLoopFor } from "@/lib/catalog";
import { useAppState } from "@/components/AppProviders";
import ImmersionSignature from "@/components/ImmersionSignature";
import { Icon } from "@/components/Icons";

export default function QuickView({
  video,
  videos,
  onClose,
  onOpenVideo,
  onFeedback,
}: {
  video: Video | null;
  videos: Video[];
  onClose: () => void;
  onOpenVideo: (video: Video) => void;
  onFeedback: (message: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [previewing, setPreviewing] = useState(false);
  const [playing, setPlaying] = useState(false);
  const { contains, toggle } = useAppState();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (video) {
      if (!dialog.open) {
        try { dialog.showModal(); } catch { /* Already in a browser-managed open state. */ }
      }
      setPreviewing(Boolean(stageLoopFor(video) && !window.matchMedia("(prefers-reduced-motion: reduce)").matches));
    } else if (dialog.open) {
      dialog.close();
    }
    setPlaying(false);
  }, [video]);

  if (!video) return <dialog ref={dialogRef} className="quickview-dialog" aria-label="Video details" />;

  const channel = channelFor(video);
  const queued = contains(video.slug);
  const similar = getSimilarVideos(video, videos, 4);

  return (
    <dialog
      ref={dialogRef}
      className="quickview-dialog"
      aria-labelledby="quickview-title"
      onClose={onClose}
      onCancel={(event) => { event.preventDefault(); dialogRef.current?.close(); }}
      onClick={(event) => { if (event.target === event.currentTarget) dialogRef.current?.close(); }}
    >
      <div className="quickview-media">
        <Image src={video.cover.lg || video.cover.sm} alt="" fill sizes="(min-width: 1000px) 960px, 100vw" unoptimized />
        {previewing && stageLoopFor(video) && <video key={video.slug} className={playing ? "is-playing" : ""} src={stageLoopFor(video)} muted autoPlay playsInline loop preload="none" aria-hidden="true" onPlaying={() => setPlaying(true)} onError={() => setPlaying(false)} />}
        <button className="quickview-close" type="button" onClick={() => dialogRef.current?.close()} aria-label="Close video details"><Icon name="close" /></button>
      </div>
      <div className="quickview-body">
        <div>
          <span className="eyebrow"><i className="eyebrow-dot" />Before you step in</span>
          <h2 className="quickview-title" id="quickview-title">{cleanTitle(video.title)}</h2>
          <p className="quickview-subtitle">{channel?.name ?? video.channel} <span aria-hidden="true">·</span> {formatCount(video.views)} views</p>
        </div>
        <ImmersionSignature video={video} expanded />
        {(video.comfort === "moving" || video.flashing) && <div className="motion-note" role="note">
          <Icon name="warning" />
          <span>{video.flashing ? "This video is tagged with flashing lights." : "Camera motion is estimated as moving from platform tags. Personal comfort varies."} Preview before starting if you are sensitive to motion.</span>
        </div>}
        {video.description && <p className="quickview-description">{video.description}</p>}
        <div className="quickview-actions">
          <a className="button button-primary" href={`https://deovr.com/${video.slug}`} target="_blank" rel="noreferrer"><Icon name="play" />Watch in DeoVR</a>
          <button className="button button-outline" type="button" aria-pressed={queued} onClick={() => {
            toggle(video.slug);
            onFeedback(queued ? "Removed from your headset queue." : "Added to headset queue. Saved in this browser.");
          }}><Icon name={queued ? "check" : "queue"} />{queued ? "In your queue" : "Add to headset queue"}</button>
        </div>
        {similar.length > 0 && <section className="more-like" aria-labelledby="more-like-title">
          <h3 id="more-like-title">Continue somewhere similar</h3>
          <div className="more-like-grid">
            {similar.map((item) => <button key={item.slug} className="more-like-card" type="button" onClick={() => onOpenVideo(item)}>
              <Image src={item.cover.sm} alt="" width={320} height={192} sizes="(max-width: 640px) 45vw, 180px" unoptimized />
              <span>{cleanTitle(item.title)}</span>
            </button>)}
          </div>
        </section>}
      </div>
    </dialog>
  );
}
