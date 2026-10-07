"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { Video } from "@/lib/catalog";
import { VIDEOS, channelFor } from "@/lib/catalog";
import { cleanTitle, formatDuration } from "@/lib/format";
import { useAppState } from "@/components/providers/AppProviders";
import { Icon } from "@/components/ui/Icons";

export default function QueueTray({
  open,
  onClose,
  onFeedback,
}: {
  open: boolean;
  onClose: () => void;
  onFeedback: (message: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { queue, remove, clear, view } = useAppState();
  const queuedVideos = queue.map((slug) => VIDEOS.find((video) => video.slug === slug)).filter((video): video is Video => Boolean(video));
  const totalSeconds = queuedVideos.reduce((sum, video) => sum + video.durationSec, 0);
  // Handoff without an account: a short link that opens this queue in headset view. Commas stay
  // literal (valid in a query) so the link is short enough to type on a headset keyboard.
  const handoff = typeof window === "undefined" ? "" : `${window.location.origin}/?view=headset&queue=${queuedVideos.map((video) => video.slug).join(",")}`;
  const copyHandoff = () => {
    void navigator.clipboard?.writeText(handoff)
      .then(() => onFeedback("Link copied. Open it in your headset's browser."))
      .catch(() => onFeedback("Couldn't copy. Select the link and copy it instead."));
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      try { dialog.showModal(); } catch { /* Keep the tray usable if a browser already owns the dialog. */ }
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog className="queue-dialog" ref={dialogRef} aria-labelledby="queue-title" onClose={onClose} onCancel={(event) => { event.preventDefault(); dialogRef.current?.close(); }} onClick={(event) => { if (event.target === event.currentTarget) dialogRef.current?.close(); }}>
      <div className="queue-heading">
        <div><span className="eyebrow">Ready for your headset</span><h2 id="queue-title">Your queue <span className="queue-count">{queuedVideos.length}</span></h2></div>
        <button className="icon-close" type="button" aria-label="Close headset queue" onClick={() => dialogRef.current?.close()}><Icon name="close" /></button>
      </div>
      <div className="queue-content">
        {queuedVideos.length === 0 ? <div className="queue-empty"><Icon name="queue" /><p>Your next place is waiting. Add a video and it will appear here.</p></div> : <>
          <div className="queue-items">
            {queuedVideos.map((video, index) => {
              const channel = channelFor(video);
              return <div className="queue-item" key={video.slug}>
                <Image src={video.cover.sm} alt="" width={176} height={106} sizes="88px" unoptimized />
                <div className="queue-item-copy"><strong>{index + 1}. {cleanTitle(video.title)}</strong><span>{channel?.name ?? video.channel} · {formatDuration(video.durationSec)}</span></div>
                <button className="queue-remove" type="button" aria-label={`Remove ${cleanTitle(video.title)} from queue`} onClick={() => { remove(video.slug); onFeedback("Removed from your headset queue."); }}><Icon name="close" /></button>
              </div>;
            })}
          </div>
          <div className="queue-total"><span>{queuedVideos.length} {queuedVideos.length === 1 ? "experience" : "experiences"}</span><span>{formatDuration(totalSeconds)} total</span></div>
        </>}
        {queuedVideos.length > 0 && view === "desktop" && <div className="queue-handoff">
          <span className="eyebrow">Send to your headset</span>
          <p>Open this link in your headset&apos;s browser and the queue is there, in headset view.</p>
          <div className="queue-handoff-row">
            <code>{handoff.replace(/^https?:\/\//, "")}</code>
            <button className="button button-outline" type="button" onClick={copyHandoff}><Icon name="link" />Copy link</button>
          </div>
        </div>}
        <p className="queue-disclaimer">This prototype saves your queue in this browser and hands it over by link. It is not synced to a DeoVR account.</p>
        {queuedVideos.length > 0 && <div className="queue-actions">
          <button className="button button-quiet" type="button" onClick={() => { clear(); onFeedback("Your headset queue is clear."); }}>Clear queue</button>
          <a className="button button-primary" href="https://deovr.com/" target="_blank" rel="noreferrer"><Icon name="headset" />Open DeoVR</a>
        </div>}
      </div>
    </dialog>
  );
}
