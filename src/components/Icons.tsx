import type { ReactNode, SVGProps } from "react";

type IconName = "search" | "queue" | "headset" | "library" | "home" | "close" | "play" | "plus" | "check" | "sliders" | "arrow" | "external" | "clock" | "heart" | "more" | "globe" | "layers" | "spark" | "menu" | "bookmark" | "chevron" | "warning";

const paths: Record<IconName, ReactNode> = {
  search: <><circle cx="10.8" cy="10.8" r="6.6" /><path d="m16 16 4.2 4.2" /></>,
  queue: <><path d="M4 6h11M4 11h11M4 16h6" /><path d="M17 14v6m-3-3h6" /></>,
  headset: <><path d="M3 10a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-3l-1.5-2a3 3 0 0 0-5 0L7 17H6a3 3 0 0 1-3-3z" /><path d="M7 11v2m10-2v2" /></>,
  library: <><rect x="4" y="4" width="6" height="16" rx="1" /><rect x="13" y="4" width="7" height="16" rx="1" /></>,
  home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  play: <path d="M8 5.7v12.6a1 1 0 0 0 1.5.86l10.1-6.3a1 1 0 0 0 0-1.72L9.5 4.84A1 1 0 0 0 8 5.7Z" fill="currentColor" stroke="none" />,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  sliders: <><path d="M4 7h9m4 0h3M4 17h3m4 0h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></>,
  arrow: <><path d="M4 12h15M13 6l6 6-6 6" /></>,
  external: <><path d="M14 4h6v6m-1-5-9 9" /><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  heart: <path d="M20.8 8.7c0 4-8.8 10-8.8 10s-8.8-6-8.8-10a4.7 4.7 0 0 1 8.8-2.2 4.7 4.7 0 0 1 8.8 2.2Z" />,
  more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3.5 12h17M12 3c2.3 2.5 3.3 5.5 3.3 9s-1 6.5-3.3 9c-2.3-2.5-3.3-5.5-3.3-9S9.7 5.5 12 3Z" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
  spark: <><path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z" /><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" /></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  bookmark: <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4V4.5Z" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  warning: <><path d="M12 3 2.8 19h18.4L12 3Z" /><path d="M12 9v4m0 3h.01" /></>,
};

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}

export function DeoMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="deo-mark">
      <defs><linearGradient id="deo-gradient" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#4f95ff" /><stop offset=".55" stopColor="#fd4488" /><stop offset="1" stopColor="#ff6854" /></linearGradient></defs>
      <path d="M6.2 3.6c-.9-.6-2.2 0-2.2 1.1v14.6c0 1.1 1.3 1.7 2.2 1.1l11.3-7.3c.8-.5.8-1.7 0-2.2z" fill="url(#deo-gradient)" />
    </svg>
  );
}

export function DeoLogo() {
  return <span className="deo-logo"><DeoMark /><span>DeoVR</span></span>;
}
