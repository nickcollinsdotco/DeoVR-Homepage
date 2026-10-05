#!/usr/bin/env node
// Extracts real equirectangular media from DeoVR's own full-length files:
//   public/media/eq/{id}.jpg     one left-eye equirect still per immersive video (portals)
//   public/media/loop/{id}.mp4   short silent stage loops for a few hand-picked videos
//   src/data/media.json          id → { eq, loop?, stereo }
// DeoVR serves full files via signed URLs that expire in 24h, so we self-host small derivatives.
// Run manually after scripts/snapshot.mjs; output is committed.
//
//   node scripts/media.mjs [--loops id,id,id] [--force]

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import ffmpeg from 'ffmpeg-static';

const run = promisify(execFile);
const ROOT = path.resolve(import.meta.dirname, '..');
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
const FORCE = process.argv.includes('--force');
const LOOPS = (arg('--loops') ?? '123847,135389,96490,135979,137356').split(',');

const videos = JSON.parse(await fs.readFile(path.join(ROOT, 'src/data/videos.json'), 'utf8'));
const outFile = path.join(ROOT, 'src/data/media.json');
const media = JSON.parse(await fs.readFile(outFile, 'utf8').catch(() => '{}'));
await fs.mkdir(path.join(ROOT, 'public/media/eq'), { recursive: true });
await fs.mkdir(path.join(ROOT, 'public/media/loop'), { recursive: true });

async function source(id) {
  const res = await fetch(`https://deovr.com/deovr/video/id/${id}`, { headers: { 'user-agent': 'Mozilla/5.0 (DeoVR redesign prototype)' } });
  const j = await res.json();
  const enc = j.encodings?.find((e) => e.name === 'h264') ?? j.encodings?.find((e) => e.name === 'h264_30');
  const srcs = (enc?.videoSources ?? []).toSorted((a, b) => a.height - b.height);
  return { j, low: srcs[0], mid: srcs.find((s) => s.width >= 2880) ?? srcs.at(-1) };
}

// Left eye only; 180 → square, 360 → 2:1.
function eyeCrop(stereo) {
  if (/^sbs/.test(stereo)) return 'crop=iw/2:ih:0:0';
  if (/^(tb|ou|ab)/.test(stereo)) return 'crop=iw:ih/2:0:0';
  return null;
}

async function still(v) {
  const file = `public/media/eq/${v.id}.jpg`;
  if (!FORCE && media[v.id]?.eq) return;
  const { j, low } = await source(v.id);
  if (!low) return console.warn('no source', v.id);
  const t = Math.round(Math.min(v.durationSec * 0.35, 90));
  const size = v.fov === 360 ? '2048:1024' : '1280:1280';
  const vf = [eyeCrop(j.stereoMode), `scale=${size}`].filter(Boolean).join(',');
  await run(ffmpeg, ['-y', '-loglevel', 'error', '-ss', String(t), '-i', low.url, '-frames:v', '1', '-vf', vf, '-q:v', '4', path.join(ROOT, file)], { timeout: 120000 });
  media[v.id] = { ...media[v.id], eq: '/' + file.replace('public/', ''), stereo: j.stereoMode, fov: v.fov };
  console.log('still', v.id, j.stereoMode, v.title.slice(0, 50));
}

async function loop(v) {
  const file = `public/media/loop/${v.id}.mp4`;
  if (!FORCE && media[v.id]?.loop) return;
  const { j, mid } = await source(v.id);
  const t = Math.round(Math.min(v.durationSec * 0.35, 90));
  const size = v.fov === 360 ? '2560:1280' : '1600:1600';
  const vf = [eyeCrop(j.stereoMode), `scale=${size}`, 'fps=30'].filter(Boolean).join(',');
  await run(ffmpeg, ['-y', '-loglevel', 'error', '-ss', String(t), '-i', mid.url, '-t', '10', '-an', '-vf', vf,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(ROOT, file)], { timeout: 600000 });
  media[v.id] = { ...media[v.id], loop: '/' + file.replace('public/', '') };
  console.log('loop', v.id, v.title.slice(0, 50));
}

async function pool(items, n, fn) {
  const q = [...items];
  await Promise.all(Array.from({ length: n }, async () => {
    for (let v; (v = q.shift()); ) await fn(v).catch((e) => console.warn('fail', v.id, e.message.slice(0, 120)));
  }));
}

const immersive = videos.filter((v) => v.fov >= 180);
await pool(immersive, 6, still);
await fs.writeFile(outFile, JSON.stringify(media, null, 2));
await pool(videos.filter((v) => LOOPS.includes(v.id)), 2, loop);
await fs.writeFile(outFile, JSON.stringify(media, null, 2));
console.log('done', Object.keys(media).length);
