import { deovrUrl } from "@/lib/catalog";

// Account destinations that used to fill a permanent sidebar; one click away instead.
const LIBRARY = [
  ["My Subscriptions", "/my-subscriptions"],
  ["Liked", "/liked"],
  ["Watch History", "/history"],
  ["My Playlists", "/my-playlists"],
  ["Upload", "/upload"],
  ["DriveAI", "/driveai"],
] as const;

export default function LibraryMenu({ id, onNavigate }: { id: string; onNavigate: () => void }) {
  return (
    <div className="library-popover" id={id} role="navigation" aria-label="Your DeoVR library">
      {LIBRARY.map(([label, path]) => <a key={label} href={deovrUrl(path)} target="_blank" rel="noreferrer" onClick={onNavigate}>{label}</a>)}
    </div>
  );
}
