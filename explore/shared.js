// Shared helpers for the direction explorations. Plain browser JS, no build step.
(() => {
  const D = window.DEOVR;
  const channels = new Map(D.channels.map((c) => [c.slug, c]));
  const videos = D.videos;
  const bySlug = new Map(videos.map((v) => [v.slug, v]));

  // Editorial layer: headlines a homepage editor would write for the stage picks
  // (DeoVR's own banners do the same, e.g. "Clouds over Wudang Mountain").
  const EDIT = {
    q37cfc: { headline: 'Fall to Earth', place: 'Orbit → New York City', hook: 'Ride a spacecraft from orbit down to a landing in New York, watching through the hatch.' },
    w4fa5o: { headline: 'Beside the submarine', place: 'Curaçao, Caribbean', hook: 'Feet away from a research submarine as it cruises a Caribbean reef.' },
    ctdats: { headline: 'Victoria Falls & the Okavango', place: 'Namibia · Botswana · Zambia', hook: 'A family journey across southern Africa, in stereo 3D.' },
    lwpscf: { headline: 'Manhattan, dusk', place: 'New York City', hook: 'A 14K timelapse as the skyline turns from day to night.' },
    w5u3r6: { headline: 'Breakfast with elephants', place: 'Chiang Mai, Thailand', hook: 'Stand among the herd at a sanctuary, with all 360° to look around.' },
    asavt0: { headline: 'Over the Matterhorn glacier', place: 'Zermatt, Switzerland', hook: 'An FPV drone skims the ice beneath the peak.' },
    c5qqmq: { headline: 'Outsider, live', place: 'Tbilisi, Georgia', hook: 'Pexsacmeli’s halftime show at RKENA 3, from the front of the stage.' },
  };
  const featured = videos
    .filter((v) => v.feeds.featured !== undefined)
    .sort((a, b) => a.feeds.featured - b.feeds.featured)
    .map((v) => ({ ...v, ...EDIT[v.slug] }));

  // ---------- formatting ----------
  const dur = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = String(s % 60).padStart(2, '0');
    return h ? `${h}:${String(m).padStart(2, '0')}:${r}` : `${m}:${r}`;
  };
  const count = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + 'K' : String(n)).replace('.0', '');
  const age = (iso) => {
    const d = (Date.now() - new Date(iso)) / 864e5;
    if (d < 1) return 'today';
    if (d < 7) return `${Math.floor(d)}d ago`;
    if (d < 30) return `${Math.floor(d / 7)}w ago`;
    if (d < 365) return `${Math.floor(d / 30)}mo ago`;
    return `${Math.floor(d / 365)}y ago`;
  };
  const esc = (s = '') => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  // Creator titles are often "[VR180 3D 8K] Title | more | tags" — the signature now carries that, so trim it.
  const cleanTitle = (t) => t
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\b(VR ?180|180°?|360°?|3D|2D|8K|6K|5K|4K|60 ?FPS|HDR|VR)\b/gi, ' ')
    .split(/\s[|｜]\s|\s[-–]\s(?=[A-Z0-9 ]+$)/)[0]
    .replace(/[\s,|｜·•-]+$/g, '').replace(/^[\s,|｜·•-]+/, '').replace(/\s{2,}/g, ' ').trim() || t;

  // ---------- icons ----------
  const icon = {
    headset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 9.5A2.5 2.5 0 0 1 5.5 7h13A2.5 2.5 0 0 1 21 9.5v5a2.5 2.5 0 0 1-2.5 2.5h-3l-1.8-2.2a2 2 0 0 0-3.4 0L8.5 17h-3A2.5 2.5 0 0 1 3 14.5z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    queue: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 6h12M4 11h12M4 16h7"/><path d="M17 14v6M14 17h6"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z"/></svg>',
    library: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="4" y="4" width="6" height="16" rx="1"/><rect x="13" y="4" width="7" height="16" rx="1"/></svg>',
    sliders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17h.01" stroke-linecap="round"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
  };
  const logo = `<span class="logo"><svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset=".05" stop-color="#4F95FF"/><stop offset=".55" stop-color="#FD4488"/><stop offset=".95" stop-color="#FF6854"/></linearGradient></defs><path d="M6.2 3.6c-.9-.6-2.2 0-2.2 1.1v14.6c0 1.1 1.3 1.7 2.2 1.1l11.3-7.3c.8-.5.8-1.7 0-2.2z" fill="url(#lg)"/></svg>DeoVR</span>`;

  // Field-of-view glyph: the viewer is the dot; the arc is how much of the world surrounds you.
  // Forward is up. 360 → full ring, 180 → half ring, 0 → a flat screen.
  function fovGlyph(fov) {
    if (!fov) return '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 6.5h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="10" cy="14" r="1.6" fill="currentColor"/></svg>';
    if (fov >= 360) return '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="10" cy="10" r="1.6" fill="currentColor"/></svg>';
    const r = 7, a = (Math.min(fov, 359) / 2) * (Math.PI / 180);
    const x1 = 10 - r * Math.sin(a), y1 = 10 - r * Math.cos(a), x2 = 10 + r * Math.sin(a);
    const large = fov > 180 ? 1 : 0;
    return `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y1.toFixed(2)}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="10" cy="10" r="1.6" fill="currentColor"/></svg>`;
  }
  // Comfort: 1–3 bars; more bars = more camera motion.
  function comfortGlyph(c) {
    const n = { still: 1, gentle: 2, moving: 3 }[c];
    return `<svg viewBox="0 0 20 20" aria-hidden="true">${[0, 1, 2].map((i) => `<rect x="${3 + i * 5.5}" y="${12 - i * 3.5}" width="3.4" height="${5 + i * 3.5}" rx="1" fill="currentColor" opacity="${i < n ? 1 : 0.25}"/>`).join('')}</svg>`;
  }
  const COMFORT = {
    still: ['Still camera', 'Comfortable for everyone'],
    gentle: ['Gentle motion', 'Slow, steady camera movement'],
    moving: ['Moving camera', 'Flight, driving or fast movement'],
  };
  const fovLabel = (f) => (f ? `${f}°` : 'Flat');
  const fovExplain = (f) => (!f ? 'A flat screen floating in front of you' : f >= 360 ? 'Look all the way around you' : f > 180 ? 'Wider than your natural view' : 'Everything in front of you, edge to edge');

  function signature(v, { length = false } = {}) {
    const fps = v.fps >= 50 ? ` · ${v.fps}fps` : '';
    const label = `${fovLabel(v.fov)}, ${v.depth}, ${v.clarity}${v.fps >= 50 ? `, ${v.fps} frames per second` : ''}, ${COMFORT[v.comfort][0]}`;
    return `<div class="sig" role="img" aria-label="${label}">
      <span class="sig-item sig-strong">${fovGlyph(v.fov)}${fovLabel(v.fov)}</span>
      <span class="sig-item">${v.depth}</span>
      <span class="sig-item tnum">${v.clarity}${fps}</span>
      <span class="sig-item sig-comfort" data-c="${v.comfort}">${comfortGlyph(v.comfort)}${COMFORT[v.comfort][0].split(' ')[0]}</span>
      ${length ? `<span class="sig-item tnum">${dur(v.durationSec)}</span>` : ''}
    </div>`;
  }

  function signatureExpanded(v) {
    return `<dl class="sig-x">
      <div><dt>${fovGlyph(v.fov)}Field of view</dt><dd>${fovLabel(v.fov)}<small>${fovExplain(v.fov)}</small></dd></div>
      <div><dt>Depth</dt><dd>${v.depth === '3D' ? 'Stereo 3D' : '2D'}<small>${v.depth === '3D' ? 'Real depth: near things feel near' : 'No depth; flat inside the sphere'}</small></dd></div>
      <div><dt>Clarity</dt><dd class="tnum">${v.clarity} · ${v.fps}fps<small>${v.clarity === '8K' ? 'Sharpest available on Quest 3' : 'Sharp on most headsets'}</small></dd></div>
      <div><dt>${comfortGlyph(v.comfort)}Camera</dt><dd>${COMFORT[v.comfort][0]}<small>${COMFORT[v.comfort][1]} · estimate</small></dd></div>
    </dl>`;
  }

  // ---------- previews: dwell, one at a time ----------
  let active = null, timer = null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function startPreview(media) {
    if (reduced || !media || active === media) return;
    stopPreview();
    const src = media.dataset.preview;
    if (!src) return;
    const v = document.createElement('video');
    Object.assign(v, { muted: true, loop: true, playsInline: true, autoplay: true, preload: 'auto', src });
    v.setAttribute('aria-hidden', 'true');
    v.addEventListener('playing', () => v.classList.add('is-playing'), { once: true });
    media.append(v);
    active = media;
  }
  function stopPreview() {
    if (!active) return;
    active.querySelector('video')?.remove();
    active = null;
  }
  function bindPreviews(root = document) {
    const dwell = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dwell')) || 300;
    const enter = (e) => {
      const host = e.target.closest?.('[data-preview-host]');
      if (!host) return;
      clearTimeout(timer);
      timer = setTimeout(() => startPreview(host.matches('.media[data-preview]') ? host : host.querySelector('.media[data-preview]')), dwell());
    };
    const leave = (e) => {
      const host = e.target.closest?.('[data-preview-host]');
      if (!host || host.contains(e.relatedTarget)) return;
      clearTimeout(timer);
      if (active && host.contains(active)) stopPreview();
    };
    root.addEventListener('pointerover', enter);
    root.addEventListener('pointerout', leave);
    root.addEventListener('focusin', enter);
    root.addEventListener('focusout', leave);
  }

  // ---------- queue + toast ----------
  const queue = new Set(JSON.parse(localStorage.getItem('deovr-queue') || '[]'));
  const listeners = new Set();
  function toggleQueue(slug) {
    queue.has(slug) ? queue.delete(slug) : queue.add(slug);
    localStorage.setItem('deovr-queue', JSON.stringify([...queue]));
    const mins = Math.round([...queue].reduce((s, q) => s + (bySlug.get(q)?.durationSec || 0), 0) / 60);
    toast(queue.has(slug) ? `Added to headset queue · ${queue.size} video${queue.size > 1 ? 's' : ''} · ${mins} min` : 'Removed from headset queue');
    listeners.forEach((fn) => fn(queue));
  }
  let toastEl;
  function toast(msg) {
    toastEl ??= Object.assign(document.body.appendChild(document.createElement('div')), { className: 'toast', role: 'status' });
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  // ---------- quick view ----------
  let dlg, lastFocus;
  function quickView(slug) {
    const v = bySlug.get(slug);
    if (!v) return;
    const c = channels.get(v.channel) || {};
    const e = EDIT[slug] || {};
    lastFocus = document.activeElement;
    dlg ??= document.body.appendChild(Object.assign(document.createElement('dialog'), { className: 'qv' }));
    dlg.setAttribute('aria-labelledby', 'qv-title');
    const queued = queue.has(slug);
    dlg.innerHTML = `
      <button class="icon-btn qv-close" data-close aria-label="Close">${icon.close}</button>
      <div class="media qv-media" data-preview="${v.preview}">
        <img src="${v.cover.lg || v.cover.sm}" alt="">
      </div>
      <div class="qv-body">
        <div>
          ${e.place ? `<div style="color:var(--text-2);font-size:.85rem;margin-bottom:.35rem">${esc(e.place)}</div>` : ''}
          <h2 class="qv-title" id="qv-title">${esc(e.headline || cleanTitle(v.title))}</h2>
          <div class="qv-orig">${esc(v.title)}</div>
        </div>
        <div class="qv-row">
          <button class="btn btn-primary">${icon.headset}Watch in VR</button>
          <button class="btn btn-secondary" data-queue="${slug}">${queued ? icon.check + 'In headset queue' : icon.plus + 'Add to headset queue'}</button>
          <span style="color:var(--text-3);font-size:.875rem" class="tnum">${dur(v.durationSec)} · ${count(v.views)} views · ${age(v.publishedAt)}</span>
        </div>
        ${signatureExpanded(v)}
        ${v.flashing ? `<div class="qv-warn">${icon.warn}<span>Contains flashing lights</span></div>` : ''}
        <div class="qv-creator"><img class="avatar" src="${c.avatar || ''}" alt="">${esc(c.name || v.channel)}<span>${c.subscribers ? count(c.subscribers) + ' subscribers' : ''}</span></div>
        ${v.description ? `<p class="qv-desc">${esc(v.description)}</p>` : ''}
        <p class="qv-note">Camera comfort is estimated from DeoVR motion warnings and tags.</p>
      </div>`;
    dlg.showModal();
    setTimeout(() => startPreview(dlg.querySelector('.media')), 200);
    dlg.onclick = (ev) => {
      if (ev.target === dlg || ev.target.closest('[data-close]')) dlg.close();
      const q = ev.target.closest('[data-queue]');
      if (q) { toggleQueue(q.dataset.queue); q.innerHTML = queue.has(slug) ? icon.check + 'In headset queue' : icon.plus + 'Add to headset queue'; }
    };
    dlg.onclose = () => { stopPreview(); lastFocus?.focus?.(); };
  }

  // ---------- view mode + exploration toolbar ----------
  const params = new URLSearchParams(location.search);
  const headsetUA = /OculusBrowser|Quest|Pico|Wolvic/i.test(navigator.userAgent);
  const view = params.get('view') || (headsetUA ? 'headset' : localStorage.getItem('deovr-view')) || 'desktop';
  document.documentElement.dataset.view = view;
  function setView(v) {
    localStorage.setItem('deovr-view', v);
    const u = new URL(location.href);
    u.searchParams.set('view', v);
    location.href = u.toString();
  }
  function toolbar(current) {
    const t = document.createElement('nav');
    t.className = 'xtool';
    t.setAttribute('aria-label', 'Exploration switcher');
    const q = `?view=${view}`;
    t.innerHTML = `
      <a href="a-marquee.html${q}" ${current === 'a' ? 'aria-current="true"' : ''} title="A — Marquee">A</a>
      <a href="b-viewfinder.html${q}" ${current === 'b' ? 'aria-current="true"' : ''} title="B — Viewfinder">B</a>
      <a href="c-field-guide.html${q}" ${current === 'c' ? 'aria-current="true"' : ''} title="C — Field Guide">C</a>
      <hr>
      <button data-v="desktop" ${view === 'desktop' ? 'aria-current="true"' : ''} title="Desktop view">PC</button>
      <button data-v="headset" ${view === 'headset' ? 'aria-current="true"' : ''} title="Headset view">VR</button>`;
    t.addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) setView(b.dataset.v); });
    document.body.append(t);
  }

  window.X = { videos, featured, channels, bySlug, EDIT, dur, count, age, esc, cleanTitle, icon, logo, fovGlyph, comfortGlyph, COMFORT, fovLabel, signature, signatureExpanded, bindPreviews, startPreview, stopPreview, queue, toggleQueue, onQueue: (fn) => listeners.add(fn), toast, quickView, view, toolbar };
})();
