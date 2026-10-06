// Editorial layer over the catalogue snapshot: what a homepage editor would choose and write.
// Every slug here is a real DeoVR video in src/data/videos.json.

export type Feature = { slug: string; headline: string; place: string; hook: string };

/** Featured stage, in order. Each has a self-hosted look-around loop (scripts/media.mjs). */
export const FEATURED: Feature[] = [
  { slug: "5fy5b3", headline: "Copacabana, on foot", place: "Rio de Janeiro · Brazil", hook: "Walk from the boardwalk down to the waterline, with the whole beach turning around you." },
  { slug: "t2szbx", headline: "Above Mexico City", place: "Mexico City · Mexico", hook: "Rise over one of the world's largest cities as its streets open toward the horizon." },
  { slug: "3kqtes", headline: "Venice, side streets", place: "Venice · Italy", hook: "Eighteen minutes of canals, bridges and quiet corners, with the original city sound." },
  { slug: "w4fa5o", headline: "Beside the submarine", place: "Curaçao · Caribbean", hook: "Float beside a research submarine as it cruises a living Caribbean reef." },
  { slug: "ctdats", headline: "Victoria Falls & the Okavango", place: "Namibia · Botswana · Zambia", hook: "A family journey across southern Africa, in stereo 3D." },
  { slug: "asavt0", headline: "Over the Matterhorn glacier", place: "Zermatt · Switzerland", hook: "An FPV flight skims the ice beneath the peak." },
  { slug: "q37cfc", headline: "Fall to Earth", place: "Orbit → New York City", hook: "Ride a spacecraft from orbit down to a landing in New York, watching through the hatch." },
];

/** 360° places for the "Where in the world" chapter, drawn as little planets. */
export const PLACES = [
  { slug: "jor1kn", place: "Elmina", country: "Ghana" },
  { slug: "c2h5rl", place: "Kobe", country: "Japan" },
  { slug: "0ycsdx", place: "Olsztyn", country: "Poland" },
  { slug: "33zik1", place: "Cape Coast", country: "Ghana" },
  { slug: "1rrlm5", place: "Copacabana", country: "Brazil" },
  { slug: "ixxr53", place: "Warmia", country: "Poland" },
];

/** Subject facet ("where / what"). Maps onto DeoVR categories in scripts/snapshot.mjs. */
export const INTENTS = [
  { value: "all", label: "All experiences" },
  { value: "travel", label: "Travel" },
  { value: "city", label: "City walks" },
  { value: "nature", label: "Nature & calm" },
  { value: "music", label: "Music & events" },
  { value: "adrenaline", label: "Adrenaline" },
  { value: "stories", label: "Stories & animation" },
  { value: "passthrough", label: "Passthrough" },
];

/** Intents that describe a place rather than a performance or a story. */
export const PLACE_INTENTS = ["travel", "city", "nature"];
