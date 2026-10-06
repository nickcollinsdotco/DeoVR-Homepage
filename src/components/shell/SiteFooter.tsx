import { Icon } from "@/components/ui/Icons";

export default function SiteFooter() {
  return (
    <footer className="site-footer page-width">
      <span>DeoVR · A field guide to immersive video · <a href="/directions">Directions explored</a></span>
      <span>Catalogue and media by DeoVR creators · <a href="https://deovr.com/" target="_blank" rel="noreferrer">deovr.com <Icon name="external" width={12} height={12} /></a></span>
    </footer>
  );
}
