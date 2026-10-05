#!/usr/bin/env node
// Pulls a snapshot of real DeoVR catalogue data into src/data/*.json (and explore/data.js).
// DeoVR server-renders its data as seroval/Solid hydration scripts; we evaluate those in a
// sandbox instead of scraping the DOM. Run manually; output is committed.
//
//   node scripts/snapshot.mjs [--limit 120]

import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(import.meta.dirname, '..');
const BASE = 'https://deovr.com';
const LIMIT = Number(process.argv[process.argv.indexOf('--limit') + 1]) || 180;
const UA = 'Mozilla/5.0 (DeoVR redesign prototype snapshot)';

// Listing pages and the feed/shelf they represent.
const SOURCES = [
  ['/', 'home'],
  ['/videos/trending?period=monthly', 'trending'],
  ['/videos?sort=mostRecentPublish', 'new'],
  ['/categories/top-picks-vr', 'top-picks'],
  ['/categories/travel-vr', 'cat:travel'],
  ['/categories/city-vr', 'cat:city'],
  ['/categories/nature-vr', 'cat:nature'],
  ['/categories/music-vr', 'cat:music'],
  ['/categories/live-concert-vr', 'cat:live-concert'],
  ['/categories/drone-vr', 'cat:drone'],
  ['/categories/passthrough-vr', 'cat:passthrough'],
  ['/categories/8k-vr', 'cat:8k'],
  ['/categories/relaxation-vr', 'cat:relaxation'],
  ['/categories/story-vr', 'cat:story'],
];

// Subject facet → DeoVR category slugs (without the -vr suffix).
const INTENTS = {
  travel: ['travel', 'travel-nature', 'guided-tour', 'exploration-reality', 'if-you-were-here', 'lifestyle-vlog'],
  city: ['city', 'architecture', 'museum', 'trains'],
  nature: ['nature', 'sea', 'animals', 'relaxation', 'timelapse', 'yoga', 'asmr', 'diving'],
  music: ['music', 'live-concert', 'live-performance', 'dance', 'celebration', 'theater', 'show', 'dance-carnival', 'ballet', 'party'],
  adrenaline: ['extreme', 'adventure-sports', 'quadcopter', 'cars', 'motorcycles', 'airplane', 'helicopter', 'sport'],
  stories: ['cinematic-expression', 'cgi', 'anime', 'gameplay', 'horror', 'cosplay', 'role-playing-games', 'ai-generated'],
  passthrough: ['passthrough', 'passthrough-ai'],
};
// Creators tag generously, so DeoVR's own `extreme-motion` warning is the only "moving" signal.
// Camera-platform categories without that warning read as "gentle"; everything else "still".
const GENTLE = new Set(['drone', 'quadcopter', 'cars', 'motorcycles', 'airplane', 'helicopter', 'boat', 'yacht', 'ship', 'trains', 'adventure-sports']);

// Stage picks: clean, cinematic covers that span field of view, subject and comfort.
const FEATURED = ['q37cfc', 'w4fa5o', 'ctdats', 'lwpscf', 'w5u3r6', 'asavt0', 'c5qqmq'];
const EXCLUDE = new Set(['twerk']);
const MAX_PER_CHANNEL = 3;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  for (let i = 0; i < 3; i++) {
    const res = await fetch(BASE + url, { headers: { 'user-agent': UA } });
    if (res.ok) return res.text();
    await sleep(800 * (i + 1));
  }
  throw new Error(`GET ${url} failed`);
}

function hydrate(html) {
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).filter((s) => s.includes('$R'));
  const ctx = { _$HY: { r: {} }, $R: [] };
  ctx.self = ctx;
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const s of scripts) {
    try { vm.runInContext(s, ctx, { timeout: 2000 }); } catch { /* non-data scripts */ }
  }
  return ctx;
}

function collect(root, pred) {
  const out = [];
  const seen = new Set();
  const walk = (o, d) => {
    if (!o || typeof o !== 'object' || d > 14 || seen.has(o)) return;
    seen.add(o);
    if (pred(o)) out.push(o);
    for (const k in o) walk(o[k], d + 1);
  };
  walk(root, 0);
  return out;
}

const isVideo = (o) => o.shortLink && o.projectionParams && o.title && o.mediaType === 'video';

function catSlugs(categories = []) {
  // "35;180°;180-vr;0;0" → "180"
  return categories.map((c) => c.split(';')[2]?.replace(/-vr$/, '')).filter(Boolean);
}

function clarity(cats, maxP) {
  const tiers = [['8k', 3840], ['7k', 3360], ['6k', 2880], ['5k', 2560], ['4k', 2160]];
  for (const [t, h] of tiers) if (cats.includes(t) || maxP >= h) return { label: t.toUpperCase(), height: h };
  return { label: 'HD', height: maxP || 1080 };
}

function comfort(cats, labels, title) {
  if (labels.includes('extreme-motion') || /\b(fpv|drone|flight|flying|driving|drive|ride|roller ?coaster|paraglid\w*|skydiv\w*)\b/i.test(title)) return 'moving';
  if (cats.some((c) => GENTLE.has(c)) || /\b(walk(ing)?( tour)?|stroll|boat|cruise)\b/i.test(title)) return 'gentle';
  return 'still';
}

function clean(s = '') {
  return s.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n').trim();
}

async function main() {
  const listed = new Map(); // id → { item, feeds: {feed: rank} }
  for (const [url, feed] of SOURCES) {
    try {
      const ctx = hydrate(await get(url));
      const items = collect([ctx._$HY.r, ctx.$R], isVideo);
      items.forEach((it, i) => {
        const e = listed.get(it.id) ?? { item: it, feeds: {} };
        e.feeds[feed] = Math.min(e.feeds[feed] ?? Infinity, i);
        listed.set(it.id, e);
      });
      console.log(`${feed.padEnd(16)} ${items.length} items`);
    } catch (e) {
      console.warn(`skip ${url}: ${e.message}`);
    }
    await sleep(300);
  }

  // Featured picks are pinned so the stage stays stable while DeoVR's feeds rotate.
  for (const [i, slug] of FEATURED.entries()) {
    const hit = [...listed.values()].find((e) => e.item.shortLink === slug);
    if (hit) { hit.feeds.featured = i; continue; }
    try {
      const ctx = hydrate(await get('/' + slug));
      const item = collect([ctx._$HY.r, ctx.$R], (o) => o.shortLink === slug && o.categories)[0];
      if (item) listed.set(item.id, { item, feeds: { featured: i } });
    } catch (e) {
      console.warn(`skip featured ${slug}: ${e.message}`);
    }
  }

  // Featured first, then items that appear in several shelves, then by views.
  const ranked = [...listed.values()]
    .filter((e) => e.item.visibility === 'public' && e.item.videoParams?.duration)
    .sort((a, b) => (a.feeds.featured ?? 99) - (b.feeds.featured ?? 99) || Object.keys(b.feeds).length - Object.keys(a.feeds).length || b.item.quantity.views - a.item.quantity.views)
    .slice(0, LIMIT);

  const videos = [];
  const channels = new Map();
  const queue = [...ranked];
  const worker = async () => {
    while (queue.length) {
      const { item, feeds } = queue.shift();
      try {
        const html = await get('/' + item.shortLink);
        const ctx = hydrate(html);
        const full = collect([ctx._$HY.r, ctx.$R], (o) => String(o.id) === String(item.id) && o.categories)[0] ?? item;
        const cats = catSlugs(full.categories);
        const heights = [...html.matchAll(new RegExp(`${item.id}_(\\d{3,4})p\\.mp4`, 'g'))].map((m) => +m[1]);
        const maxP = Math.max(0, ...heights.filter((h) => h > 300));
        const labels = full.labels ?? item.labels ?? [];
        const pp = full.projectionParams;
        const ch = full.channel ?? item.channel;
        const coverLg = full.assets?.thumbnailImage?.includes('cover-desktop') ? full.assets.thumbnailImage : undefined;

        videos.push({
          id: String(item.id),
          slug: item.shortLink,
          title: item.title.trim(),
          description: clean(full.description).slice(0, 600),
          channel: ch.label,
          cover: { sm: item.assets.thumbnailImage, lg: coverLg },
          preview: item.assets.thumbnailVideoPreview,
          durationSec: item.videoParams.duration,
          fps: full.videoParams?.fps ?? item.videoParams.fps,
          views: item.quantity.views,
          likes: item.quantity.likes,
          comments: item.quantity.comments ?? 0,
          publishedAt: new Date(item.date * 1000).toISOString(),
          fov: cats.includes('flat') && !cats.some((c) => /^(180|190|200|360)$/.test(c)) ? 0 : pp.viewAngle, // degrees; 0 = flat
          depth: pp.format === 0 ? '2D' : '3D',
          clarity: clarity(cats, maxP).label,
          comfort: comfort(cats, labels, item.title),
          flashing: labels.includes('extreme-flashingLights'),
          premium: Boolean(full.isPremium),
          passthrough: cats.some((c) => c.startsWith('passthrough')),
          camera: full.videoParams?.cameraType?.name,
          categories: cats,
          intents: Object.entries(INTENTS).filter(([, s]) => s.some((c) => cats.includes(c))).map(([k]) => k),
          feeds,
        });

        if (!channels.has(ch.label)) {
          channels.set(ch.label, {
            slug: ch.label,
            name: ch.name ?? ch.title,
            avatar: ch.thumbnailImage ?? ch.logo,
            color: ch.assets?.logo?.color ?? ch.logoColor,
            cover: ch.assets?.cover?.desktop,
            subscribers: ch.quantities?.subscribers,
            videoCount: ch.quantities?.videos,
          });
        }
        process.stdout.write('.');
      } catch (e) {
        console.warn(`\nskip ${item.shortLink}: ${e.message}`);
      }
      await sleep(250);
    }
  };
  await Promise.all(Array.from({ length: 5 }, worker));

  // Editorial curation, as a homepage editor would do it: no single channel dominates, and
  // categories that aren't representative of the logged-out homepage are left out.
  const perChannel = new Map();
  const curated = videos
    .sort((a, b) => Object.keys(b.feeds).length - Object.keys(a.feeds).length || b.views - a.views)
    .filter((v) => !v.categories.some((c) => EXCLUDE.has(c)))
    .filter((v) => {
      if (v.feeds.featured !== undefined) return true;
      const n = (perChannel.get(v.channel) ?? 0) + 1;
      perChannel.set(v.channel, n);
      return n <= MAX_PER_CHANNEL;
    })
    .sort((a, b) => (a.feeds.home ?? 999) - (b.feeds.home ?? 999));
  const used = new Set(curated.map((v) => v.channel));
  const data = { generatedAt: new Date().toISOString(), source: BASE, videos: curated, channels: [...channels.values()].filter((c) => used.has(c.slug)) };
  videos.length = 0;
  videos.push(...curated);

  await fs.mkdir(path.join(ROOT, 'src/data'), { recursive: true });
  await fs.writeFile(path.join(ROOT, 'src/data/videos.json'), JSON.stringify(videos, null, 2));
  await fs.writeFile(path.join(ROOT, 'src/data/channels.json'), JSON.stringify(data.channels, null, 2));
  await fs.mkdir(path.join(ROOT, 'explore'), { recursive: true });
  await fs.writeFile(path.join(ROOT, 'explore/data.js'), `// Generated by scripts/snapshot.mjs — do not edit.\nwindow.DEOVR = ${JSON.stringify(data)};\n`);
  console.log(`\n${videos.length} videos, ${data.channels.length} channels written.`);
}

main();
