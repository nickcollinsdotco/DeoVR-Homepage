import type { Video } from "@/lib/catalog";
import { formatDuration } from "@/lib/catalog";

function FieldOfViewGlyph({ fov }: { fov: number }) {
  if (!fov) return <svg viewBox="0 0 20 20"><path d="M4 6.5h12" /><circle cx="10" cy="14" r="1.5" fill="currentColor" /></svg>;
  if (fov >= 360) return <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7" /><circle cx="10" cy="10" r="1.5" fill="currentColor" /></svg>;
  return <svg viewBox="0 0 20 20"><path d="M3 10a7 7 0 0 1 14 0" /><circle cx="10" cy="10" r="1.5" fill="currentColor" /></svg>;
}

function ComfortGlyph({ comfort }: { comfort: string }) {
  const bars = comfort === "still" ? 1 : comfort === "gentle" ? 2 : 3;
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      {[0, 1, 2].map((index) => <rect key={index} x={3 + index * 5.5} y={12 - index * 3.5} width="3.4" height={5 + index * 3.5} rx="1" opacity={index < bars ? 1 : 0.25} fill="currentColor" />)}
    </svg>
  );
}

const comfortLabels: Record<string, string> = { still: "Still", gentle: "Gentle", moving: "Moving" };

export default function ImmersionSignature({ video, length = false, expanded = false }: { video: Video; length?: boolean; expanded?: boolean }) {
  const comfort = comfortLabels[video.comfort] ?? "Unknown";
  const fov = video.fov ? `${video.fov}°` : "Flat";
  const items = [
    { key: "fov", label: fov, spoken: video.fov ? `${video.fov} degree field of view` : "Flat video", icon: <FieldOfViewGlyph fov={video.fov} />, detail: video.fov >= 360 ? "Look all the way around you." : video.fov ? "A wide view in front of you." : "A flat screen in front of you." },
    { key: "depth", label: video.depth, spoken: video.depth === "3D" ? "Stereoscopic 3D" : "2D", icon: <span className="sig-depth-glyph">{video.depth}</span>, detail: video.depth === "3D" ? "Stereoscopic depth." : "Monoscopic image." },
    { key: "clarity", label: `${video.clarity}${video.fps >= 50 ? ` · ${video.fps}fps` : ""}`, spoken: `${video.clarity}${video.fps >= 50 ? `, ${video.fps} frames per second` : ""}`, icon: <span className="sig-resolution-glyph">{video.clarity}</span>, detail: `Source resolution ${video.clarity}${video.fps ? ` at ${video.fps} frames per second` : ""}.` },
    { key: "comfort", label: comfort, spoken: `Camera motion estimate: ${comfort}`, icon: <ComfortGlyph comfort={video.comfort} />, detail: `Camera motion estimate: ${comfort.toLowerCase()}. This is an estimate based on platform tags and warnings.` },
  ];

  if (expanded) {
    return (
      <dl className="signature-expanded">
        {items.map((item) => <div key={item.key} className={`signature-detail signature-${item.key}`}>
          <dt>{item.icon}<span>{item.key === "fov" ? "Field of view" : item.key === "depth" ? "Depth" : item.key === "clarity" ? "Clarity" : "Camera motion"}</span></dt>
          <dd>{item.label}<small>{item.detail}</small></dd>
        </div>)}
        <div className="signature-detail signature-length">
          <dt><span className="length-symbol">◷</span><span>Length</span></dt>
          <dd>{formatDuration(video.durationSec)}<small>Time in this experience.</small></dd>
        </div>
      </dl>
    );
  }

  return (
    <div className={`immersion-signature${length ? " has-length" : ""}`} role="group" aria-label={`${items.map((item) => item.spoken).join(", ")}${length ? `, ${formatDuration(video.durationSec)}` : ""}`}>
      {items.map((item) => <span key={item.key} className={`signature-item signature-item-${item.key}`} title={item.spoken}>
        <span className="signature-icon">{item.icon}</span><span>{item.label}</span>
      </span>)}
      {length && <span className="signature-item signature-item-length"><span className="signature-icon"><span className="length-symbol">◷</span></span><span>{formatDuration(video.durationSec)}</span></span>}
    </div>
  );
}
