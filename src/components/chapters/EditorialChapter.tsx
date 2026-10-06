import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icons";

// A full-width break in the grid that teaches a facet by example ("calm", "sharp").
export default function EditorialChapter({ title, description, action, onAction, children }: { title: string; description: string; action: string; onAction: () => void; children: ReactNode }) {
  return (
    <section className="editorial-chapter" aria-label={title}>
      <div className="chapter-heading">
        <div><h2>{title}</h2><p>{description}</p></div>
        <button className="chapter-link" type="button" onClick={onAction}>{action}<Icon name="arrow" /></button>
      </div>
      <div className="chapter-cards">{children}</div>
    </section>
  );
}
