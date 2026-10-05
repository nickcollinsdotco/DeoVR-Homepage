import DiscoveryExperience from "@/components/DiscoveryExperience";
import videoSnapshot from "@/data/videos.json";
import { CHANNELS, type Video } from "@/lib/catalog";

export default function HomePage() {
  return <DiscoveryExperience videos={videoSnapshot as unknown as Video[]} channels={CHANNELS} />;
}
