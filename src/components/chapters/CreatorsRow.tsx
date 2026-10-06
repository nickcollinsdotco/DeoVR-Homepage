import Image from "next/image";
import { deovrUrl, getPlaceCreators } from "@/lib/catalog";
import { formatCount } from "@/lib/format";
import { Icon } from "@/components/ui/Icons";

// Keeps DeoVR's community feel: real creators, not a studio catalogue.
export default function CreatorsRow() {
  const creators = getPlaceCreators();
  return (
    <section className="creator-section page-width" aria-labelledby="creator-title">
      <h2 id="creator-title">Made by people who take you places</h2>
      <p className="section-intro">A few voices from the DeoVR community.</p>
      <div className="creator-grid">
        {creators.map((channel) => <a className="creator-card" href={deovrUrl(`/channel/${channel.slug}`)} key={channel.slug} target="_blank" rel="noreferrer">
          <span className="creator-avatar"><Image src={channel.avatar} alt="" width={56} height={56} sizes="44px" unoptimized /></span>
          <span className="creator-card-copy"><strong>{channel.name}</strong><span>{formatCount(channel.subscribers)} followers · {channel.videoCount} videos</span></span>
          <Icon name="external" width={16} height={16} />
        </a>)}
      </div>
    </section>
  );
}
