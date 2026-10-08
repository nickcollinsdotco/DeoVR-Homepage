import type { Video } from "@/lib/catalog";
import { formatDuration } from "@/lib/format";

// Text only, no glyphs: a glyph next to the same word ("2D 2D", "8K 8K") just competes with it.
const comfortLabels: Record<string, string> = { still: "Still", gentle: "Gentle", moving: "Moving" };

export default function ImmersionSignature({ video, length = false, expanded = false }: { video: Video; length?: boolean; expanded?: boolean }) {
  const comfort = comfortLabels[video.comfort] ?? "Unknown";
  const fov = video.fov ? `${video.fov}°` : "Flat";
  const items = [
    { key: "fov", name: "Field of view", label: fov, spoken: video.fov ? `${video.fov} degree field of view` : "Flat video", detail: video.fov >= 360 ? "Look all the way around you." : video.fov ? "A wide view in front of you." : "A flat screen in front of you." },
    { key: "depth", name: "Depth", label: video.depth, spoken: video.depth === "3D" ? "Stereoscopic 3D" : "2D", detail: video.depth === "3D" ? "Stereoscopic depth." : "Monoscopic image." },
    { key: "clarity", name: "Clarity", label: `${video.clarity}${video.fps >= 50 ? ` · ${video.fps}fps` : ""}`, compact: `${video.clarity}${video.fps >= 50 ? ` ${video.fps}fps` : ""}`, spoken: `${video.clarity}${video.fps >= 50 ? `, ${video.fps} frames per second` : ""}`, detail: `Source resolution ${video.clarity}${video.fps ? ` at ${video.fps} frames per second` : ""}.` },
    // Compact rows separate facts with "·", so clarity uses a space; with no "Camera motion" heading, motion carries the noun.
    { key: "comfort", name: "Camera motion", label: comfort, compact: video.comfort in comfortLabels ? `${comfort} camera` : "Motion unknown", spoken: `Camera motion estimate: ${comfort}`, detail: `Camera motion estimate: ${comfort.toLowerCase()}. This is an estimate based on platform tags and warnings.` },
  ];

  if (expanded) {
    return (
      <dl className="signature-expanded">
        {items.map((item) => <div key={item.key} className={`signature-detail signature-${item.key}`}>
          <dt>{item.name}</dt>
          <dd>{item.label}<small>{item.detail}</small></dd>
        </div>)}
        <div className="signature-detail signature-length">
          <dt>Length</dt>
          <dd>{formatDuration(video.durationSec)}<small>Time in this experience.</small></dd>
        </div>
      </dl>
    );
  }

  return (
    <div className={`immersion-signature${length ? " has-length" : ""}`} role="group" aria-label={`${items.map((item) => item.spoken).join(", ")}${length ? `, ${formatDuration(video.durationSec)}` : ""}`}>
      {items.map((item) => <span key={item.key} className={`signature-item signature-item-${item.key}`} title={item.spoken} aria-hidden="true">{item.compact ?? item.label}</span>)}
      {length && <span className="signature-item signature-item-length" aria-hidden="true">{formatDuration(video.durationSec)}</span>}
    </div>
  );
}
