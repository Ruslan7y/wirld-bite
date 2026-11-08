/* World Bite — app logic */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = {
  get(k, d) { try { const v = localStorage.getItem('wb_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('wb_' + k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem('wb_' + k); } catch (e) {} }
};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const guessLang = () => { const n = (navigator.language || 'tr').slice(0, 2); return I18N[n] ? n : 'en'; };

let lang = store.get('lang', guessLang());
const t = (k, o) => { let s = I18N[lang][k] ?? I18N.en[k] ?? k; if (o && typeof s === 'string') s = s.replace(/\{(\w+)\}/g, (_, x) => o[x]); return s; };
const cl = () => (lang === 'az' ? 'tr' : lang === 'ru' ? 'en' : lang); // recipe text language
const flag = code => code.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));
let _dn = null;
const cname = code => { try { if (!_dn || _dn.l !== lang) _dn = { l: lang, d: new Intl.DisplayNames([lang], { type: 'region' }) }; return _dn.d.of(code) || code; } catch (e) { return code; } };
const byCode = Object.fromEntries(COUNTRIES.map(c => [c.code, c]));
const recipeById = Object.fromEntries(RECIPES.map(r => [r.id, r]));

/* ---------- icons ---------- */
const I = {
  explore: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg>',
  travel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8 3.6 4.5 7.1 4.5c2 0 3.6 1.1 4.9 2.8 1.3-1.7 2.9-2.8 4.9-2.8 3.5 0 5.6 3.5 4.4 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"/></svg>',
  locate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
  chev: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="m9 6 6 6-6 6"/></svg>',
  mail: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  lock: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
  user: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  palette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.4 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2" fill="currentColor"/><circle cx="10.5" cy="7.5" r="1.2" fill="currentColor"/><circle cx="15" cy="7.5" r="1.2" fill="currentColor"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
  replay: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 4h4v16h-4M10 17l5-5-5-5M15 12H3"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
  google: '<svg viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#1877F2"/><path fill="#fff" d="M13.4 21v-7h2.4l.4-2.8h-2.8V9.4c0-.8.2-1.4 1.4-1.4h1.5V5.5c-.3 0-1.1-.1-2.2-.1-2.2 0-3.6 1.3-3.6 3.7v2.1H8.1V14h2.4v7z"/></svg>'
};

/* ---------- Logo (globe + plate + orbiting plane) ---------- */
let _lid = 0;
function logoSVG(anim) {
  const id = 'l' + (++_lid);
  const blobs = x => `<path transform="translate(${x} 0)" d="M48 66c8-10 22-10 30-3 6 6 2 14-5 16-7 2-6 10-12 13-8 3-15-4-15-13 0-5 0-9 2-13zM96 52c6-4 16-3 20 3 3 5-2 9-7 9-4 0-6 5-11 4-5-2-6-12-2-16zM92 104c7-5 18-3 24 3 7 7 6 18-1 25-6 6-14 6-17-1-3-6-2-11-6-15-3-4-4-9 0-12zM140 84c6-3 13 0 15 6 2 7-3 13-9 13-7 0-11-6-10-12 0-3 2-6 4-7zM60 120c6-2 12 2 12 8 0 7-6 11-11 9-5-2-6-8-5-12 1-3 2-4 4-5z"/>`;
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs>
  <radialGradient id="${id}g" cx="38%" cy="32%" r="78%"><stop offset="0" stop-color="#5BCBF5"/><stop offset=".55" stop-color="#1E6BD6"/><stop offset="1" stop-color="#12366E"/></radialGradient>
  <linearGradient id="${id}o" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#1E6BD6"/><stop offset="1" stop-color="#2BD4A4"/></linearGradient>
  <clipPath id="${id}c"><circle cx="100" cy="100" r="64"/></clipPath></defs>
  <circle cx="100" cy="100" r="64" fill="url(#${id}g)"/>
  <g clip-path="url(#${id}c)">
    <g class="${anim ? 'spin-surface' : ''}" fill="#3DBE7A" opacity=".88">${blobs(0)}${blobs(150)}</g>
    <g fill="none" stroke="#fff" stroke-opacity=".32" stroke-width="1.6"><ellipse cx="100" cy="100" rx="64" ry="22"/><ellipse cx="100" cy="100" rx="64" ry="46"/><path d="M36 100h128M100 36v128"/><ellipse cx="100" cy="100" rx="24" ry="64"/><ellipse cx="100" cy="100" rx="48" ry="64"/></g>
  </g>
  <circle cx="100" cy="100" r="29" fill="#fff"/><circle cx="100" cy="100" r="25" fill="#F08A24"/><circle cx="100" cy="100" r="19" fill="#FDBA4D"/>
  <circle cx="92" cy="94" r="2.6" fill="#E5484D"/><circle cx="107" cy="92" r="2.2" fill="#3DBE7A"/><circle cx="95" cy="107" r="2" fill="#3DBE7A"/><circle cx="108" cy="106" r="2.4" fill="#E5484D"/><circle cx="101" cy="99" r="1.6" fill="#B45309"/>
  <path d="M100 86v28M96 86v8a4 4 0 0 0 8 0v-8" stroke="#12366E" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <circle cx="124" cy="80" r="7" style="fill:var(--bg)"/><circle cx="118" cy="75" r="5" style="fill:var(--bg)"/><circle cx="128" cy="88" r="4.5" style="fill:var(--bg)"/>
  <g class="${anim ? 'orbit-rot' : ''}">
    <path d="M29 141A82 82 0 0 1 152.7 37.2" stroke="url(#${id}o)" stroke-width="7" fill="none" stroke-linecap="round"/>
    <g transform="translate(159 44) rotate(40) scale(1.35)" fill="#1E6BD6"><path d="M-9-1.2h13l5 1.2-5 1.2h-13z"/><path d="M-1-1 -5-9h3l7 8zM-1 1-5 9h3l7-8zM-9-1-11.5-5h2.4L-6-1zM-9 1-11.5 5h2.4L-6 1z"/></g>
  </g></svg>`;
}

/* ---------- theme ---------- */
const SWATCHES = ['#1E6BD6', '#0E9384', '#D97706', '#E0482F', '#4D7C0F', '#7C5CDB', '#D6336C', '#374151'];
function applyTheme() {
  const c = store.get('color', SWATCHES[0]), dark = store.get('dark', false);
  document.documentElement.style.setProperty('--p', c);
  document.documentElement.classList.toggle('dark', !!dark);
  const bg = dark ? '#0F141B' : '#F6F7F9';
  $('meta[name=theme-color]').setAttribute('content', bg);
  try { window.Android && Android.setBars(bg, !!dark); } catch (e) {}
}

/* ---------- toast & sheet ---------- */
let toastT;
function toast(msg) { const el = $('#toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 1900); }
function openSheet(html, mount) {
  const s = $('#sheet'); s.innerHTML = '<div class="grab"></div>' + html; s.scrollTop = 0;
  $('#sheet-wrap').classList.add('open'); mount && mount(s);
}
function closeSheet() { $('#sheet-wrap').classList.remove('open'); }
const sheetOpen = () => $('#sheet-wrap').classList.contains('open');
$('#sheet-bg').onclick = closeSheet;

/* ---------- Wikipedia photos & descriptions ---------- */
const wikiMem = {}, wikiPending = {}, wikiQ = []; let wikiActive = 0;
function wikiCached(title, l) { const k = title + '|' + l; if (wikiMem[k]) return wikiMem[k]; const v = store.get('w:' + k, null); if (v) wikiMem[k] = v; return v; }
function wikiGet(title, l) {
  const k = title + '|' + l, c = wikiCached(title, l);
  if (c) return Promise.resolve(c);
  if (wikiPending[k]) return wikiPending[k];
  return (wikiPending[k] = new Promise(res => { wikiQ.push({ title, l, k, res }); pump(); }));
}
function pump() {
  while (wikiActive < 4 && wikiQ.length) {
    const j = wikiQ.shift(); wikiActive++;
    fetchWiki(j.title, j.l).then(v => { wikiMem[j.k] = v; store.set('w:' + j.k, v); j.res(v); })
      .catch(() => { delete wikiPending[j.k]; j.res(null); })
      .finally(() => { wikiActive--; pump(); });
  }
}
async function fetchWiki(title, l) {
  let host = 'en', tt = title;
  if (l !== 'en') {
    const r = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=langlinks&lllang=${l}&redirects=1&titles=${encodeURIComponent(title)}&format=json&origin=*`).then(r => r.json());
    const p = r.query && r.query.pages && Object.values(r.query.pages)[0];
    const ll = p && p.langlinks && p.langlinks[0];
    if (ll) { host = l; tt = ll['*']; } else { const en = await wikiGet(title, 'en'); if (!en) throw 0; return Object.assign({}, en, { fb: 1 }); }
  }
  const s = await fetch(`https://${host}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(tt.replace(/ /g, '_'))}`).then(r => { if (!r.ok) throw 0; return r.json(); });
  const oi = s.originalimage;
  return { title: s.title, extract: s.extract || '', img: s.thumbnail ? s.thumbnail.source : null, big: oi && oi.width <= 1600 ? oi.source : (s.thumbnail ? s.thumbnail.source : null) };
}
function photo(key, wiki, emoji, big) { return `<div class="ph loading" data-key="${esc(key)}" data-wiki="${esc(wiki || '')}" data-big="${big ? 1 : ''}"><span class="em">${emoji}</span></div>`; }
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); loadPhoto(e.target); } }), { rootMargin: '200px' });
function hydrate(root) { $$('.ph[data-wiki]:not([data-done])', root).forEach(el => { el.dataset.done = 1; io.observe(el); }); }
async function loadPhoto(el) {
  const local = (typeof LOCAL_PHOTOS !== 'undefined') && LOCAL_PHOTOS[el.dataset.key];
  let src = local || null;
  if (!src && el.dataset.wiki) { const w = await wikiGet(el.dataset.wiki, 'en'); src = w && (el.dataset.big ? w.big : w.img); }
  if (!src) { el.classList.remove('loading'); return; }
  const img = new Image(); img.alt = ''; img.decoding = 'async';
  img.onload = () => { img.classList.add('ok'); el.classList.remove('loading'); const h = el.closest('.hero'); if (h && !local) h.classList.add('has-img'); };
  img.onerror = () => { img.remove(); el.classList.remove('loading'); };
  img.src = src; el.appendChild(img);
}

/* ---------- names ---------- */
function dishName(c) {
  if (lang === 'tr' || lang === 'az' || /cuisine|Cyrtosperma/.test(c.wiki)) return c.dish;
  if (lang === 'ru') { const w = wikiCached(c.wiki, 'ru'); if (w && !w.fb && w.title) return w.title; }
  return c.wiki.replace(/ \(.*\)$/, '');
}
const recName = r => r.name[cl()] || r.name.en;

/* ---------- favourites & popularity ---------- */
const fav = () => store.get('fav', { dishes: [], recipes: [], rests: [] });
const setFav = f => store.set('fav', f);
const isFav = (type, id) => type === 'rests' ? fav().rests.some(r => r.id === id) : fav()[type].includes(id);
function toggleFav(type, id, obj) {
  const f = fav(); let on;
  if (type === 'rests') { const i = f.rests.findIndex(r => r.id === id); on = i < 0; on ? f.rests.unshift(obj) : f.rests.splice(i, 1); }
  else { const i = f[type].indexOf(id); on = i < 0; on ? f[type].unshift(id) : f[type].splice(i, 1); }
  setFav(f);
  if (type !== 'rests') { const likes = store.get('likes', {}); const key = type === 'recipes' ? recipeById[id].country : id; on ? (likes[key] = Date.now()) : delete likes[key]; store.set('likes', likes); }
  toast(on ? t('saved') : t('removed'));
  return on;
}
function heartBtn(type, id, cls = 'heart') { return `<button class="${cls} ${isFav(type, id) ? 'on' : ''}" data-fav="${type}" data-id="${esc(id)}">${I.heart}</button>`; }
document.addEventListener('click', e => {
  const b = e.target.closest('[data-fav]'); if (!b || b.dataset.fav === 'rests') return;
  e.stopPropagation();
  const on = toggleFav(b.dataset.fav, b.dataset.id);
  $$(`[data-fav="${b.dataset.fav}"][data-id="${CSS.escape(b.dataset.id)}"]`).forEach(x => { x.classList.toggle('on', on); x.classList.remove('beat'); void x.offsetWidth; x.classList.add('beat'); });
  if (state.tab === 'list') renderList();
  if (state.tab === 'explore') renderPopular();
}, true);

const FAMOUS = ['IT', 'JP', 'TR', 'MX', 'FR', 'IN', 'AZ', 'CN', 'TH', 'ES', 'GR', 'KR', 'US', 'VN', 'LB', 'GE', 'MA', 'PE', 'BR', 'UZ', 'IR', 'HU'];
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function periodKey(p) { const d = new Date(); if (p === 'd') return d.toISOString().slice(0, 10); const j = new Date(d.getFullYear(), 0, 1); return d.getFullYear() + 'w' + Math.ceil(((d - j) / 864e5 + j.getDay() + 1) / 7); }
function popScore(c, p) {
  const d = p === 'd', base = hash(c.code + periodKey(p)) % (d ? 420 : 2600) + (FAMOUS.includes(c.code) ? (d ? 380 : 2200) : 0);
  const ts = store.get('likes', {})[c.code];
  return base + (ts && Date.now() - ts < (d ? 864e5 : 6048e5) ? (d ? 800 : 5000) : 0);
}
const fmtN = n => n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'k' : String(n);

/* ---------- state & navigation ---------- */
const state = { tab: 'explore', pop: store.get('pop', 'd'), cat: 'all', cont: 'all', q: '', tmode: 'near', city: store.get('city', ''), coords: null, cuisine: '', trip: '', results: [], resLabel: '' };
const stack = [];
let lastPush = 0, lastBackAtRoot = 0;
function pushPage(html, mount, cls) {
  const now = Date.now();
  if (now - lastPush < 450) return null; // ignore accidental double taps
  lastPush = now;
  const el = document.createElement('div'); el.className = 'page' + (cls ? ' ' + cls : ''); el.innerHTML = html;
  $('#overlays').appendChild(el); stack.push(el); hydrate(el); mount && mount(el);
  $$('[data-back]', el).forEach(b => b.onclick = back);
  return el;
}
function back() {
  if (sheetOpen()) { closeSheet(); return true; }
  if (stack.length) { const el = stack.pop(); if (el._onClose) el._onClose(); el.classList.add('out'); setTimeout(() => el.remove(), 240); return true; }
  if ($('#main').classList.contains('show') && state.tab !== 'explore') { setTab('explore'); return true; }
  if ($('#main').classList.contains('show')) {
    const v = $('#v-explore');
    if (state.q) { state.q = ''; renderExplore(); return true; }
    if (v.scrollTop > 200) { v.scrollTo({ top: 0, behavior: 'smooth' }); return true; }
    if (Date.now() - lastBackAtRoot > 2000) { lastBackAtRoot = Date.now(); toast(t('pressAgain')); return true; }
    return false;
  }
  if ($('#onboarding').classList.contains('show') && ob.i > 0) { obGo(ob.i - 1); return true; }
  return false;
}
window.WB = { back };
function show(id) { $$('.screen').forEach(s => s.classList.toggle('show', s.id === id)); }

/* ================= SPLASH ================= */
function runSplash() {
  $('#splashLogo').innerHTML = logoSVG(true);
  let i = 0;
  $('#splashWord').innerHTML = ['WORLD', 'BITE'].map(w => `<span class="w">${[...w].map(ch => `<span class="ch" style="animation-delay:${(1.15 + (i++) * 0.12).toFixed(2)}s">${ch}</span>`).join('')}</span>`).join('');
  $('#splashTag').textContent = t('tagline');
  setTimeout(next, 3000);
  function next() {
    if (!store.get('onboarded', false)) renderOnboarding();
    else if (!store.get('session', null)) renderAuth();
    else enterApp();
  }
}

/* ================= ONBOARDING ================= */
const ob = { i: 0 };
const OB = [
  { big: '🌍', orbs: ['🍣', '🥐', '🌮', '🥘'] },
  { big: '👩‍🍳', orbs: ['🥕', '⏱️', '🧂', '🍳'] },
  { big: '📍', orbs: ['🍽️', '✈️', '🗺️', '⭐'] },
  { big: '❤️', orbs: ['🎨', '📖', '🔖', '🍰'] }
];
const ORB_POS = [[-6, 18], [78, -4], [86, 70], [4, 80]];
function renderOnboarding() {
  ob.i = 0;
  $('#onboarding').innerHTML = `
    <div class="ob-top"><div class="mini">${logoSVG(false)}World Bite</div><button class="ob-skip" id="obSkip">${t('skip')}</button></div>
    <div class="ob-viewport"><div class="ob-track" id="obTrack">${OB.map((s, n) => `
      <div class="ob-slide ${n === 0 ? 'cur' : ''}">
        <div class="ob-art"><span class="big">${s.big}</span>${s.orbs.map((o, k) => `<span class="orb" style="left:${ORB_POS[k][0]}%;top:${ORB_POS[k][1]}%;animation-delay:${-k * 0.7}s">${o}</span>`).join('')}</div>
        <h2>${t('ob' + (n + 1) + 't')}</h2><p>${t('ob' + (n + 1) + 'd')}</p>
      </div>`).join('')}</div></div>
    <div class="ob-bottom"><div class="dots" id="obDots">${OB.map((_, n) => `<i class="${n === 0 ? 'on' : ''}"></i>`).join('')}</div>
      <button class="btn primary" id="obNext">${t('next')}</button></div>`;
  show('onboarding');
  $('#obNext').onclick = () => ob.i < 3 ? obGo(ob.i + 1) : finishOb();
  $('#obSkip').onclick = finishOb;
  let sx = null;
  const vp = $('.ob-viewport');
  vp.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
  vp.addEventListener('touchend', e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (dx < -50 && ob.i < 3) obGo(ob.i + 1); if (dx > 50 && ob.i > 0) obGo(ob.i - 1); sx = null; });
}
function obGo(i) {
  ob.i = i;
  $('#obTrack').style.transform = `translateX(-${i * 25}%)`;
  $$('#obDots i').forEach((d, n) => d.classList.toggle('on', n === i));
  $$('.ob-slide').forEach((s, n) => s.classList.toggle('cur', n === i));
  $('#obNext').textContent = i === 3 ? t('start') : t('next');
}
function finishOb() { store.set('onboarded', true); store.get('session', null) ? enterApp() : renderAuth(); }

/* ================= AUTH (demo, stored locally) ================= */
let authMode = 'login';
async function sha(s) {
  try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
  catch (e) { return 'h' + hash(s); }
}
function renderAuth() {
  $('#auth').innerHTML = `
    <div class="auth-head">${logoSVG(false)}<h1>WORLD BITE</h1><p>${t('tagline')}</p></div>
    <div class="seg" id="authSeg"><span class="knob"></span><button data-m="login">${t('login')}</button><button data-m="register">${t('register')}</button></div>
    <div id="authBody"></div>`;
  show('auth');
  $$('#authSeg button').forEach(b => b.onclick = () => { authMode = b.dataset.m; drawAuth(); });
  drawAuth();
}
function moveKnob(seg) { const on = $('button.on', seg), k = $('.knob', seg); if (on && k) { k.style.left = on.offsetLeft + 'px'; k.style.width = on.offsetWidth + 'px'; } }
function drawAuth() {
  const seg = $('#authSeg');
  $$('button', seg).forEach(b => b.classList.toggle('on', b.dataset.m === authMode));
  requestAnimationFrame(() => moveKnob(seg));
  const reg = authMode === 'register';
  $('#authBody').innerHTML = `<div class="auth-card">
    <button class="social" data-p="google">${I.google}${t('withGoogle')}</button>
    <button class="social" data-p="facebook">${I.facebook}${t('withFacebook')}</button>
    <div class="divider">${t('or')}</div>
    ${reg ? `<div class="field"><span class="ic">${I.user}</span><input id="aName" placeholder="${t('name')}" autocomplete="name"></div>` : ''}
    <div class="field"><span class="ic">${I.mail}</span><input id="aEmail" type="email" placeholder="${t('email')}" autocomplete="email"></div>
    <div class="field"><span class="ic">${I.lock}</span><input id="aPw" type="password" placeholder="${t('password')}" autocomplete="${reg ? 'new-password' : 'current-password'}"></div>
    <div class="err" id="aErr"></div>
    <button class="btn primary block" id="aGo">${reg ? t('register') : t('login')}</button>
    <p class="small-note">${reg ? t('haveAccount') : t('noAccount')} <b style="color:var(--p)" id="aSwitch">${reg ? t('login') : t('register')}</b></p>
    <p class="small-note">${t('demoAuth')}</p></div>`;
  $('#aSwitch').onclick = () => { authMode = reg ? 'login' : 'register'; drawAuth(); };
  $$('.social').forEach(b => b.onclick = () => socialAuth(b.dataset.p));
  $('#aGo').onclick = submitAuth;
  $('#aPw').onkeydown = e => { if (e.key === 'Enter') submitAuth(); };
}
async function submitAuth() {
  const reg = authMode === 'register', err = $('#aErr');
  const name = reg ? $('#aName').value.trim() : '', email = $('#aEmail').value.trim().toLowerCase(), pw = $('#aPw').value;
  if (!email || !pw || (reg && !name)) return err.textContent = t('fillAll');
  if (pw.length < 6) return err.textContent = t('pwShort');
  const users = store.get('users', []), h = await sha(email + ':' + pw);
  if (reg) {
    if (users.some(u => u.email === email)) return err.textContent = t('exists');
    const u = { name, email, pw: h, provider: 'email' }; users.push(u); store.set('users', users); login(u);
  } else {
    const u = users.find(u => u.email === email && u.pw === h);
    if (!u) return err.textContent = t('wrongLogin');
    login(u);
  }
}
function socialAuth(p) {
  const pname = p === 'google' ? 'Gmail' : 'Facebook';
  openSheet(`<h2>${p === 'google' ? I.google.replace('<svg', '<svg width="22" height="22" style="vertical-align:-4px;margin-right:8px"') : I.facebook.replace('<svg', '<svg width="22" height="22" style="vertical-align:-4px;margin-right:8px"')}${pname}</h2>
    <p class="sub">${t('continueAs', { p: pname })} · ${t('demoAuth')}</p>
    <div style="display:flex;flex-direction:column;gap:12px">
      <div class="field"><span class="ic">${I.user}</span><input id="sName" placeholder="${t('name')}"></div>
      <div class="field"><span class="ic">${I.mail}</span><input id="sEmail" type="email" placeholder="${p === 'google' ? 'ad@gmail.com' : t('email')}"></div>
      <div class="err" id="sErr"></div>
      <button class="btn primary block" id="sGo">${t('cont')}</button></div>`, () => {
    $('#sGo').onclick = () => {
      const name = $('#sName').value.trim(), email = $('#sEmail').value.trim().toLowerCase();
      if (!name || !email) return $('#sErr').textContent = t('fillAll');
      closeSheet(); login({ name, email, provider: p });
    };
  });
}
function login(u) { store.set('session', { name: u.name, email: u.email, provider: u.provider }); enterApp(); }

/* ================= MAIN APP ================= */
const TABS = ['explore', 'travel', 'list', 'settings'];
function enterApp() {
  $('#tabbar').innerHTML = TABS.map(k => `<button data-tab="${k}">${I[k]}<span>${t('tab' + k[0].toUpperCase() + k.slice(1))}</span></button>`).join('');
  $$('#tabbar button').forEach(b => b.onclick = () => setTab(b.dataset.tab));
  show('main');
  renderExplore(); renderTravel(); renderList(); renderSettings();
  setTab(state.tab);
}
function setTab(k) {
  state.tab = k;
  $$('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === k));
  $$('.view').forEach(v => v.classList.toggle('on', v.id === 'v-' + k));
  if (k === 'list') renderList();
  if (k === 'travel' && map) setTimeout(() => map.invalidateSize(), 60);
  const v = $('#v-' + k); hydrate(v); requestAnimationFrame(() => $$('.seg', v).forEach(moveKnob));
}
const session = () => store.get('session', { name: '?' });

/* ---------- EXPLORE ---------- */
function renderExplore() {
  const s = session();
  $('#v-explore').innerHTML = `
    <div class="top"><div><div class="hi">${esc(t('hello', { n: s.name.split(' ')[0] }))} 👋</div><h1>${t('exploreTitle')}</h1></div><div class="avatar">${esc(s.name[0] || '?').toUpperCase()}</div></div>
    <label class="search">${I.search}<input id="exQ" placeholder="${t('searchExplore')}" value="${esc(state.q)}" autocomplete="off"><button class="x ${state.q ? '' : 'hide'}" id="exX">×</button></label>
    <div id="exSearch"></div>
    <div id="exHome">
      <div id="dotd"></div>
      <div class="sec"><h2>🔥 ${t('popular')}</h2><div class="mini-seg" id="popSeg"><button data-p="d">${t('daily')}</button><button data-p="w">${t('weekly')}</button></div></div>
      <div class="hscroll" id="popList"></div>
      <div class="sec"><h2>👩‍🍳 ${t('featured')}</h2><small>${RECIPES.length}</small></div>
      <div class="hscroll">${RECIPES.map((r, i) => recipeCard(r, i)).join('')}</div>
      <div class="sec"><h2>🌍 ${t('allCountries')}</h2><small id="cCount"></small></div>
      <div class="chips" id="catChips"></div>
      <div class="chips" id="contChips" style="margin-top:8px"></div>
      <div class="grid" id="cGrid" style="margin-top:14px"></div>
      <p class="note" style="text-align:center;margin-top:18px">${t('demoPop')}</p>
    </div>`;
  const q = $('#exQ');
  q.oninput = () => { state.q = q.value; $('#exX').classList.toggle('hide', !state.q); drawSearch(); };
  $('#exX').onclick = () => { q.value = state.q = ''; $('#exX').classList.add('hide'); drawSearch(); };
  $$('#popSeg button').forEach(b => b.onclick = () => { state.pop = b.dataset.p; store.set('pop', state.pop); renderPopular(); });
  renderDotd(); renderPopular(); drawChips(); drawGrid(); drawSearch();
}
function countryCard(c, i) {
  return `<div class="ccard" role="button" data-open="c:${c.code}" style="animation-delay:${Math.min(i, 12) * 0.03}s">
    ${photo(c.code, c.wiki, c.emoji)}<span class="flag">${flag(c.code)}</span>${heartBtn('dishes', c.code)}
    <div class="b"><h3>${esc(cname(c.code))}</h3><p>${esc(dishName(c))}</p><div class="badges"><span class="badge">★ ${t(c.strength)}</span><span class="badge soft">⏱ ${fmtTime(sigOf(c.code).t)}</span></div></div></div>`;
}
function recipeCard(r, i) {
  return `<button class="rcard" data-open="r:${r.id}" style="animation-delay:${i * 0.04}s">${photo(r.id, r.wiki, r.e)}
    <div class="b"><small>${flag(r.country)} ${esc(cname(r.country))}</small><h3>${esc(recName(r))}</h3><small>⏱ ${r.t} ${t('min')} · ${t(r.d)}</small><span class="badge">${t(r.cat)}</span></div></button>`;
}
function renderDotd() {
  const d = new Date(), idx = hash(d.toISOString().slice(0, 10) + 'dotd') % COUNTRIES.length, c = COUNTRIES[idx], rc = sigOf(c.code);
  $('#dotd').innerHTML = `<div class="dotd" role="button" data-open="c:${c.code}">${photo(c.code, c.wiki, c.emoji, true)}
    <div class="dotd-shade"></div><span class="dotd-tag">✨ ${t('dishOfDay')}</span>${heartBtn('dishes', c.code)}
    <div class="dotd-b"><small>${flag(c.code)} ${esc(cname(c.code))}</small><h2>${esc(dishName(c))}</h2><span>⏱ ${fmtTime(rc.t)} · 📊 ${t(rc.d)} · ${t(c.cat)}</span></div></div>`;
  hydrate($('#dotd'));
}
function renderPopular() {
  const el = $('#popList'); if (!el) return;
  $$('#popSeg button').forEach(b => b.classList.toggle('on', b.dataset.p === state.pop));
  const top = COUNTRIES.map(c => ({ c, s: popScore(c, state.pop) })).sort((a, b) => b.s - a.s).slice(0, 10);
  el.innerHTML = top.map(({ c, s }, i) => `<div class="pcard" role="button" data-open="c:${c.code}" style="animation-delay:${i * 0.05}s">
    ${photo(c.code, c.wiki, c.emoji)}<span class="rank">#${i + 1}</span>${heartBtn('dishes', c.code)}
    <div class="b"><h3>${esc(dishName(c))}</h3><div class="m"><span>${flag(c.code)} ${esc(cname(c.code))}</span><span><b>♥</b> ${fmtN(s)}</span></div></div></div>`).join('');
  el.scrollLeft = 0; hydrate(el);
}
function drawChips() {
  $('#catChips').innerHTML = ['all', 'k', 'a', 's', 't'].map(k => `<button class="chip ${state.cat === k ? 'on' : ''}" data-cat="${k}">${k === 'all' ? t('all') : { k: '☕ ', a: '🍲 ', s: '🥟 ', t: '🍰 ' }[k] + t(k)}</button>`).join('');
  $('#contChips').innerHTML = ['all', ...CONTINENTS].map(k => `<button class="chip ${state.cont === k ? 'on' : ''}" data-cont="${k}">${k === 'all' ? '🌐 ' + t('all') : t(k)}</button>`).join('');
  $$('#catChips .chip').forEach(b => b.onclick = () => { state.cat = b.dataset.cat; drawChips(); drawGrid(); });
  $$('#contChips .chip').forEach(b => b.onclick = () => { state.cont = b.dataset.cont; drawChips(); drawGrid(); });
}
function drawGrid() {
  const list = COUNTRIES.filter(c => (state.cat === 'all' || c.strength === state.cat) && (state.cont === 'all' || c.cont === state.cont))
    .sort((a, b) => cname(a.code).localeCompare(cname(b.code), lang));
  $('#cCount').textContent = t('countriesN', { n: list.length });
  $('#cGrid').innerHTML = list.map(countryCard).join('') || `<div class="empty" style="grid-column:1/-1"><span class="e">🍽️</span>${t('noResults')}</div>`;
  hydrate($('#cGrid'));
}
const norm = s => String(s).toLocaleLowerCase(lang).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');
function drawSearch() {
  const q = norm(state.q.trim());
  $('#exHome').classList.toggle('hide', !!q);
  const box = $('#exSearch');
  if (!q) { box.innerHTML = ''; return; }
  const cs = COUNTRIES.filter(c => [cname(c.code), c.dish, c.wiki, c.code, c.story, ...(sigOf(c.code).ing)].some(x => norm(x).includes(q)));
  const rs = RECIPES.filter(r => [r.name.tr, r.name.en, r.local, cname(r.country), ...r.ing.tr, ...r.ing.en].some(x => norm(x).includes(q)));
  box.innerHTML = (rs.length ? `<div class="sec"><h2>${t('recipes')}</h2><small>${rs.length}</small></div><div class="hscroll">${rs.map(recipeCard).join('')}</div>` : '') +
    (cs.length ? `<div class="sec"><h2>${t('allCountries')}</h2><small>${t('countriesN', { n: cs.length })}</small></div><div class="grid">${cs.map(countryCard).join('')}</div>` : '') +
    (!cs.length && !rs.length ? `<div class="empty"><span class="e">🔍</span>${t('noResults')}</div>` : '');
  hydrate(box);
}
// Opening detail pages is handled by ONE global listener (prevents duplicate pages)
document.addEventListener('click', e => {
  const b = e.target.closest('[data-open]'); if (!b || e.target.closest('[data-fav]')) return;
  const [k, id] = b.dataset.open.split(':');
  k === 'c' ? openCountry(id) : openRecipe(id);
});

/* ---------- Recipes: shared helpers ---------- */
function sigOf(code) {
  if (code === 'AZ') { const r = recipeById['az-main'], l = cl(); return { t: r.t, s: r.s, d: r.d, ing: r.ing[l], st: r.st[l], tr: false }; }
  const g = SIG[code]; return g ? Object.assign({ tr: true }, g) : null;
}
function recipeHTML(rc, title) {
  return `<div class="info-row" style="margin-top:14px"><span class="pill p">⏱ ${fmtTime(rc.t)}</span><span class="pill">👥 ${rc.s} ${t('servings')}</span><span class="pill">📊 ${t(rc.d)}</span></div>
    ${rc.tr && (lang === 'en' || lang === 'ru') ? `<p class="note">${t('sigLangNote')}</p>` : ''}
    <button class="btn primary block cook-btn" data-cook>👩‍🍳 ${t('startCooking')}</button>
    <div class="prog"><i class="rProg"></i></div>
    <div class="block"><h3>🧺 ${t('ingredients')} <small class="cnt">${rc.ing.length}</small></h3><ul class="ing">${rc.ing.map(x => `<li><span class="box">✓</span><span>${esc(x)}</span></li>`).join('')}</ul><p class="note">👆 ${t('tapHint')}</p></div>
    <div class="block" style="animation-delay:.08s"><h3>🔥 ${t('steps')} <small class="cnt">${rc.st.length}</small></h3><ol class="steps">${rc.st.map((x, i) => `<li><span class="n">${i + 1}</span><span>${esc(x)}</span></li>`).join('')}</ol></div>`;
}
function bindRecipe(el, rc, name) {
  const upd = () => { const all = $$('.ing li,.steps li', el), d = all.filter(x => x.classList.contains('done')); $$('.rProg', el).forEach(p => p.style.width = (d.length / all.length * 100) + '%'); };
  $$('.ing li,.steps li', el).forEach(li => li.onclick = () => { li.classList.toggle('done'); upd(); });
  $$('[data-cook]', el).forEach(b => b.onclick = () => cookMode(rc, name));
}
function fmtTime(m) {
  if (m >= 1440) return Math.round(m / 1440) + ' ' + t('days');
  if (m >= 120) return (Math.round(m / 30) / 2).toString().replace('.5', ',5') + ' ' + t('hours2');
  return m + ' ' + t('min');
}
function share(title, text) {
  const msg = `${title}\n${text}\n\n— World Bite 🌍🍽️`;
  try { if (window.Android && Android.share) { Android.share(msg); return; } } catch (e) {}
  if (navigator.share) { navigator.share({ title, text: msg }).catch(() => {}); return; }
  try { navigator.clipboard.writeText(msg).then(() => toast(t('copied'))); } catch (e) {}
}
function shareRecipe(name, country, rc) {
  share(`${name} (${country})`, `${t('ingredients')}:\n• ${rc.ing.join('\n• ')}\n\n${t('steps')}:\n${rc.st.map((x, i) => (i + 1) + '. ' + x).join('\n')}`);
}
function keepAwake(on) { try { window.Android && Android.keepAwake && Android.keepAwake(!!on); } catch (e) {} }

/* ---------- Cook mode: one big step at a time ---------- */
function cookMode(rc, name) {
  let i = 0; const n = rc.st.length;
  const el = pushPage(`
    <div class="cook-top"><button class="round" data-back>✕</button><div class="cook-title">${esc(name)}</div><button class="round" id="ckIng">🧺</button></div>
    <div class="cook-bar"><i id="ckBar"></i></div>
    <div class="cook-stage" id="ckStage"></div>
    <div class="cook-nav"><button class="btn line" id="ckPrev">← ${t('prev')}</button><button class="btn primary" id="ckNext">${t('nextStep')} →</button></div>`, el => {
    const draw = () => {
      const done = i >= n;
      $('#ckBar', el).style.width = (Math.min(i + 1, n) / n * 100) + '%';
      $('#ckStage', el).innerHTML = done
        ? `<div class="cook-card fin"><div class="big">🎉</div><h2>${t('bonApp')}</h2><p>${t('bonAppD')}</p></div>`
        : `<div class="cook-card"><div class="cook-n">${t('stepOf', { i: i + 1, n })}</div><p>${esc(rc.st[i])}</p></div>`;
      $('#ckPrev', el).style.visibility = i === 0 ? 'hidden' : 'visible';
      $('#ckNext', el).textContent = done ? t('finish') + ' ✓' : (i === n - 1 ? t('finish') + ' 🎉' : t('nextStep') + ' →');
    };
    $('#ckNext', el).onclick = () => { if (i >= n) { back(); return; } i++; draw(); };
    $('#ckPrev', el).onclick = () => { if (i > 0) { i--; draw(); } };
    $('#ckIng', el).onclick = () => openSheet(`<h2>🧺 ${t('ingredients')}</h2><p class="sub">${esc(name)}</p><ul class="ing">${rc.ing.map(x => `<li><span class="box">✓</span><span>${esc(x)}</span></li>`).join('')}</ul>`, s => $$('.ing li', s).forEach(li => li.onclick = () => li.classList.toggle('done')));
    let sx = null;
    el.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
    el.addEventListener('touchend', e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (dx < -60 && i < n) { i++; draw(); } if (dx > 60 && i > 0) { i--; draw(); } sx = null; });
    draw();
  }, 'cook');
  if (el) { keepAwake(true); el._onClose = () => keepAwake(false); }
}

/* ---------- Country detail ---------- */
function openCountry(code) {
  const c = byCode[code]; const sig = sigOf(code);
  const others = RECIPES.filter(r => r.country === code && !(code === 'AZ' && r.id === 'az-main'));
  const storyLang = lang === 'tr' || lang === 'az';
  pushPage(`
    <div class="hero">${photo(c.code, c.wiki, c.emoji, true)}
      <div class="bar"><button class="round" data-back>${I.back}</button><span class="bar-r"><button class="round" id="shareBtn">${I.share}</button>${heartBtn('dishes', c.code, 'round')}</span></div>
      <span class="credit">${t('photoCredit')}</span></div>
    <div class="dbody">
      <div class="country"><span class="f">${flag(c.code)}</span>${esc(cname(c.code))} · ${t(c.cont)}</div>
      <h1>${esc(dishName(c))}</h1>
      <div class="info-row"><span class="pill p">★ ${t('strongAt')}: ${t(c.strength)}</span><span class="pill">${c.emoji} ${t(c.cat)}</span></div>
      ${storyLang ? `<div class="block"><h3>📜 ${t('story')}</h3><p>${esc(c.story)}</p></div>` : ''}
      <div class="block" id="wikiBlock" style="animation-delay:.08s"><h3>📖 ${storyLang ? t('about') : t('story')}</h3><div class="sk"></div><div class="sk" style="width:80%"></div><div class="sk" style="width:60%"></div></div>
      ${sig ? `<div class="sec" style="margin-bottom:0"><h2>📝 ${t('recipe')}</h2></div>${recipeHTML(sig)}` : ''}
      ${others.length ? `<div class="sec"><h2>👩‍🍳 ${t('moreRecipes')}</h2><small>${others.length}</small></div><div class="hscroll">${others.map(recipeCard).join('')}</div>` : ''}
      <button class="btn primary block cta" id="goEat">📍 ${t('whereEat')}</button>
    </div>`, el => {
    if (sig) bindRecipe(el, sig, dishName(c));
    $('#shareBtn', el).onclick = () => sig ? shareRecipe(dishName(c), cname(c.code), sig) : share(dishName(c), c.story);
    $('#goEat', el).onclick = () => { state.tmode = 'near'; state.cuisine = code; state.trip = code; while (stack.length) back(); setTab('travel'); renderTravel(); };
    wikiGet(c.wiki, lang).then(w => {
      const b = $('#wikiBlock', el); if (!b) return;
      const txt = w && w.extract ? w.extract : (storyLang ? '' : c.story);
      if (!txt) { b.remove(); return; }
      b.innerHTML = `<h3>📖 ${storyLang ? t('about') : t('story')}</h3><p>${esc(txt)}</p>${w ? `<p class="note">Wikipedia · CC BY-SA</p>` : ''}`;
      if (lang === 'ru' && w && !w.fb && w.title) $('h1', el).textContent = w.title;
    });
  });
}

/* ---------- Recipe detail ---------- */
function openRecipe(id) {
  const r = recipeById[id], l = cl(), rc = { t: r.t, s: r.s, d: r.d, ing: r.ing[l], st: r.st[l], tr: false };
  pushPage(`
    <div class="hero">${photo(r.id, r.wiki, r.e, true)}
      <div class="bar"><button class="round" data-back>${I.back}</button><span class="bar-r"><button class="round" id="shareBtn">${I.share}</button>${heartBtn('recipes', r.id, 'round')}</span></div>
      <span class="credit">${t('photoCredit')}</span></div>
    <div class="dbody">
      <div class="country"><span class="f">${flag(r.country)}</span>${esc(cname(r.country))} · <i>${esc(r.local)}</i></div>
      <h1>${esc(recName(r))}</h1>
      <p style="color:var(--muted);margin-bottom:12px">${esc(r.desc[l])}</p>
      <div class="info-row"><span class="pill">${t(r.cat)}</span><span class="pill">🌍 ${esc(r.local)}</span></div>
      ${t('recipeLangNote') ? `<p class="note">${t('recipeLangNote')}</p>` : ''}
      ${recipeHTML(rc)}
      <button class="btn ghost block cta" id="goEat">📍 ${t('whereEat')}</button>
    </div>`, el => {
    bindRecipe(el, rc, recName(r));
    $('#shareBtn', el).onclick = () => shareRecipe(recName(r), cname(r.country), rc);
    $('#goEat', el).onclick = () => { state.tmode = 'near'; state.cuisine = r.country; state.trip = r.country; while (stack.length) back(); setTab('travel'); renderTravel(); };
  });
}

/* ---------- TRAVEL: restaurants inside the app (OpenStreetMap) ---------- */
let map = null, markers = null;
function renderTravel() {
  const near = state.tmode === 'near';
  const cc = near ? state.cuisine : state.trip, c = cc && byCode[cc];
  $('#v-travel').innerHTML = `
    <div class="top"><div><div class="hi">✈️ World Bite</div><h1>${t('travelTitle')}</h1></div></div>
    <div class="seg mode" id="tSeg"><span class="knob"></span><button data-m="near">📍 ${t('nearMe')}</button><button data-m="trip">✈️ ${t('tripTo')}</button></div>
    <p class="hint">${near ? t('nearHint') : t('travelHint')}</p>
    ${near ? `<div class="trow"><label class="search">${I.search}<input id="tCity" placeholder="${t('searchCity')}" value="${esc(state.coords ? '📍 ' + t('nearMe') : state.city)}" autocomplete="off"></label><button class="icon-btn" id="tLoc" title="${t('useLocation')}">${I.locate}</button></div>` : ''}
    <button class="select" id="tPick" style="margin-top:10px"><span>${c ? flag(c.code) + ' ' + esc(cname(c.code)) : (near ? '🍽️ ' + t('anyCuisine') : '🌍 ' + t('chooseCountry'))}</span><small>${near ? t('cuisine') : ''}</small>${I.chev}</button>
    <button class="btn primary block" id="tFind" style="margin-top:12px">${I.search.replace('<svg', '<svg width="20" height="20"')}${t('find')}</button>
    <div id="tStatus"></div>
    <div id="map" class="${state.results.length ? '' : 'hide'}"></div>
    <div id="tRes"></div>`;
  const seg = $('#tSeg');
  $$('button', seg).forEach(b => { b.classList.toggle('on', b.dataset.m === state.tmode); b.onclick = () => { state.tmode = b.dataset.m; state.results = []; renderTravel(); }; });
  requestAnimationFrame(() => moveKnob(seg));
  if (near) {
    const ci = $('#tCity');
    ci.onfocus = () => { if (state.coords) { state.coords = null; ci.value = state.city; } };
    ci.oninput = () => { state.city = ci.value; store.set('city', state.city); };
    ci.onkeydown = e => { if (e.key === 'Enter') { ci.blur(); findRestaurants(); } };
    $('#tLoc').onclick = useLocation;
  }
  $('#tPick').onclick = () => pickCountry(near, code => { near ? (state.cuisine = code) : (state.trip = code); state.results = []; renderTravel(); });
  $('#tFind').onclick = () => findRestaurants();
  map = null;
  if (state.results.length) drawResults(state.results, state.resLabel, state.center);
}
function pickCountry(allowAny, cb) {
  const list = COUNTRIES.slice().sort((a, b) => cname(a.code).localeCompare(cname(b.code), lang));
  openSheet(`<h2>${allowAny ? t('cuisine') : t('chooseCountry')}</h2>
    <label class="search" style="margin-top:10px">${I.search}<input id="pkQ" placeholder="${t('searchExplore')}" autocomplete="off"></label>
    <div class="pick-list" id="pkL"></div>`, s => {
    const draw = () => {
      const q = norm($('#pkQ', s).value.trim());
      $('#pkL', s).innerHTML = (allowAny && !q ? `<button data-c=""><span class="f">🍽️</span>${t('anyCuisine')}</button>` : '') +
        list.filter(c => !q || norm(cname(c.code)).includes(q) || norm(c.dish).includes(q)).map(c => `<button data-c="${c.code}"><span class="f">${flag(c.code)}</span>${esc(cname(c.code))}<small>${esc(dishName(c))}</small></button>`).join('');
    };
    draw();
    $('#pkQ', s).oninput = draw;
    $('#pkL', s).onclick = e => { const b = e.target.closest('[data-c]'); if (b) { closeSheet(); cb(b.dataset.c); } };
  });
}
function setStatus(html) { const s = $('#tStatus'); if (s) s.innerHTML = html ? `<div class="status">${html}</div>` : ''; }
function useLocation() {
  if (!navigator.geolocation) return toast(t('locErr'));
  setStatus(`<span class="spinner"></span>${t('locating')}`);
  navigator.geolocation.getCurrentPosition(p => {
    state.coords = { lat: p.coords.latitude, lon: p.coords.longitude };
    const ci = $('#tCity'); if (ci) ci.value = '📍 ' + t('nearMe');
    findRestaurants();
  }, () => { setStatus(''); toast(t('locErr')); }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 });
}
async function geocode(q, cc) {
  const u = `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=${lang}${cc ? '&countrycodes=' + cc.toLowerCase() : ''}&q=${encodeURIComponent(q)}`;
  const r = await fetch(u).then(r => r.json());
  if (!r.length) throw new Error('nf');
  return { lat: +r[0].lat, lon: +r[0].lon, name: r[0].display_name.split(',')[0] };
}
async function overpass(lat, lon, radius, cuisine) {
  const f = cuisine ? `["cuisine"~"${cuisine}",i]` : '';
  const q = `[out:json][timeout:25];nwr["amenity"="restaurant"]["name"]${f}(around:${radius},${lat},${lon});out center tags 120;`;
  const r = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  if (!r.ok) throw new Error('op');
  return (await r.json()).elements;
}
function dist(a, b) { const R = 6371, dLa = (b.lat - a.lat) * Math.PI / 180, dLo = (b.lon - a.lon) * Math.PI / 180; const x = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); }
function toRest(el, center, localTag) {
  const g = el.tags || {}, lat = el.lat ?? (el.center && el.center.lat), lon = el.lon ?? (el.center && el.center.lon);
  let web = g.website || g['contact:website'] || g.url || '';
  if (web && !/^https?:\/\//i.test(web)) web = 'https://' + web;
  const cuisine = (g.cuisine || '').replace(/_/g, ' ').split(';').map(s => s.trim()).filter(Boolean);
  const local = !!localTag && (cuisine.some(x => x.includes(localTag.replace(/_/g, ' '))) || cuisine.some(x => /regional|local|traditional/.test(x)));
  const addr = [[g['addr:street'], g['addr:housenumber']].filter(Boolean).join(' '), g['addr:city']].filter(Boolean).join(', ');
  return { id: el.type[0] + el.id, name: g.name, lat, lon, cuisine, web, phone: g.phone || g['contact:phone'] || '', hours: g.opening_hours || '', addr, local, km: center ? dist(center, { lat, lon }) : 0 };
}
async function findRestaurants(all) {
  const near = state.tmode === 'near';
  const cc = near ? state.cuisine : state.trip, c = cc && byCode[cc];
  if (!near && !c) return pickCountry(false, code => { state.trip = code; renderTravel(); findRestaurants(); });
  setStatus(`<span class="spinner"></span>${t('searching')}`);
  try {
    let center;
    if (near) {
      if (state.coords) center = state.coords;
      else { if (!state.city.trim()) { setStatus(''); $('#tCity').focus(); return; } center = await geocode(state.city); }
    } else center = await geocode(c.city, c.code);
    let els, label;
    if (near) {
      const tag = !all && c ? c.cuisine : '';
      els = await overpass(center.lat, center.lon, tag ? 20000 : 3000, tag);
      label = tag ? `${flag(c.code)} ${cname(c.code)}` : t('anyCuisine');
    } else {
      els = await overpass(center.lat, center.lon, 5000, '');
      label = `${flag(c.code)} ${c.city}`;
    }
    let list = els.map(e => toRest(e, center, near ? '' : c.cuisine)).filter(r => r.name && r.lat);
    list.sort((a, b) => (b.local * 4 + !!b.web * 2 + !!b.hours + !!b.phone) - (a.local * 4 + !!a.web * 2 + !!a.hours + !!a.phone) || a.km - b.km);
    list = list.slice(0, 60);
    state.results = list; state.resLabel = label; state.center = center;
    if (!list.length) {
      setStatus('');
      $('#map').classList.add('hide');
      $('#tRes').innerHTML = `<div class="empty"><span class="e">🍽️</span>${t('none')}<br><br>${near && c && !all ? `<button class="btn ghost" id="tAll">${t('showAll')}</button>` : ''}</div>`;
      const a = $('#tAll'); if (a) a.onclick = () => findRestaurants(true);
      return;
    }
    drawResults(list, label, center);
  } catch (e) { setStatus(''); $('#tRes').innerHTML = `<div class="empty"><span class="e">📡</span>${t('netErr')}</div>`; }
}
function drawResults(list, label, center) {
  setStatus(`✅ ${t('found', { n: list.length })} · ${esc(label)} <span style="margin-left:auto;font-size:11px">${t('dataOsm')}</span>`);
  $('#map').classList.remove('hide');
  $('#tRes').innerHTML = list.map((r, i) => restRow(r, i)).join('') + `<p class="note" style="text-align:center;margin-top:12px">⭐ ${t('ratingSoon')}</p>`;
  $('#tRes').onclick = e => {
    const h = e.target.closest('[data-rfav]');
    if (h) { const r = list.find(x => x.id === h.dataset.rfav); const on = toggleFav('rests', r.id, r); h.classList.toggle('on', on); return; }
    const b = e.target.closest('[data-rest]'); if (b) openRest(list.find(x => x.id === b.dataset.rest));
  };
  setTimeout(() => {
    if (typeof L === 'undefined') return;
    if (!map) {
      map = L.map('map', { zoomControl: false, attributionControl: true });
      L.tileLayer(`https://{s}.basemaps.cartocdn.com/${store.get('dark', false) ? 'dark_all' : 'rastertiles/voyager'}/{z}/{x}/{y}{r}.png`, { maxZoom: 19, subdomains: 'abcd', attribution: '© OpenStreetMap © CARTO' }).addTo(map);
    }
    if (markers) markers.remove();
    markers = L.layerGroup().addTo(map);
    const pts = [];
    if (center) { L.marker([center.lat, center.lon], { icon: L.divIcon({ className: '', html: '<div class="wb-pin me"></div>', iconSize: [16, 16] }) }).addTo(markers); pts.push([center.lat, center.lon]); }
    list.forEach(r => { pts.push([r.lat, r.lon]); L.marker([r.lat, r.lon], { icon: L.divIcon({ className: '', html: '<div class="wb-pin"></div>', iconSize: [16, 16] }) }).on('click', () => openRest(r)).addTo(markers); });
    map.invalidateSize();
    map.fitBounds(pts, { padding: [24, 24], maxZoom: 15 });
  }, 50);
}
function restRow(r, i) {
  return `<div class="rest" data-rest="${r.id}" style="animation-delay:${Math.min(i, 10) * 0.03}s"><div class="ico">${r.local ? '⭐' : '🍽️'}</div>
    <div class="b"><h3>${esc(r.name)}</h3><small>${esc(r.cuisine.join(', ') || r.addr || '')}${r.km ? ' · ' + r.km.toFixed(1) + ' km' : ''}</small>
    <div class="tags">${r.local ? `<span>${t('localFood')}</span>` : ''}${r.web ? `<span>🌐 ${t('hasSite')}</span>` : ''}${r.hours ? '<span>🕒</span>' : ''}${r.phone ? '<span>📞</span>' : ''}</div></div>
    <button class="heart ${isFav('rests', r.id) ? 'on' : ''}" data-rfav="${r.id}">${I.heart}</button></div>`;
}
function openRest(r) {
  const dir = `https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lon}`;
  openSheet(`<h2>${esc(r.name)}</h2><p class="sub">${esc(r.cuisine.join(' · ') || '🍽️')}${r.km ? ' · ' + r.km.toFixed(1) + ' km' : ''}</p>
    ${r.addr ? `<div class="kv"><span class="k">📍</span><div><small>${t('addr')}</small>${esc(r.addr)}</div></div>` : ''}
    ${r.hours ? `<div class="kv"><span class="k">🕒</span><div><small>${t('hours')}</small>${esc(r.hours)}</div></div>` : ''}
    ${r.phone ? `<div class="kv"><span class="k">📞</span><div><small>${t('call')}</small>${esc(r.phone)}</div></div>` : ''}
    ${r.web ? `<div class="kv"><span class="k">🌐</span><div><small>Web</small>${esc(r.web.replace(/^https?:\/\//, ''))}</div></div>` : `<p class="note" style="margin-top:12px">${t('noSite')}</p>`}
    <div class="mini-map" id="rMap"></div>
    <div class="btn-row">
      ${r.web ? `<a class="btn primary" href="${esc(r.web)}" target="_blank" rel="noopener">🌐 ${t('website')}</a>` : ''}
      <a class="btn ${r.web ? 'ghost' : 'primary'}" href="${dir}" target="_blank" rel="noopener">🧭 ${t('directions')}</a>
    </div>
    <div class="btn-row">${r.phone ? `<a class="btn line" href="tel:${esc(r.phone.split(';')[0].replace(/\s/g, ''))}">📞 ${t('call')}</a>` : ''}
      <button class="btn line" id="rFav">${isFav('rests', r.id) ? '❤️' : '🤍'} ${t('myList')}</button></div>`, s => {
    $('#rFav', s).onclick = () => { const on = toggleFav('rests', r.id, r); $('#rFav', s).innerHTML = `${on ? '❤️' : '🤍'} ${t('myList')}`; const h = $(`[data-rfav="${r.id}"]`); if (h) h.classList.toggle('on', on); if (state.tab === 'list') renderList(); };
    setTimeout(() => {
      if (typeof L === 'undefined') return;
      const m = L.map($('#rMap', s), { zoomControl: false, attributionControl: false, dragging: true }).setView([r.lat, r.lon], 16);
      L.tileLayer(`https://{s}.basemaps.cartocdn.com/${store.get('dark', false) ? 'dark_all' : 'rastertiles/voyager'}/{z}/{x}/{y}{r}.png`, { subdomains: 'abcd' }).addTo(m);
      L.marker([r.lat, r.lon], { icon: L.divIcon({ className: '', html: '<div class="wb-pin"></div>', iconSize: [16, 16] }) }).addTo(m);
      setTimeout(() => m.invalidateSize(), 400);
    }, 80);
  });
}

/* ---------- MY LIST ---------- */
let listTab = 'recipes';
function renderList() {
  const f = fav();
  const v = $('#v-list');
  v.innerHTML = `<div class="top"><div><div class="hi">🔖 World Bite</div><h1>${t('myList')}</h1></div></div>
    <div class="seg list-seg" id="lSeg"><span class="knob"></span><button data-m="recipes">🍲 ${t('savedRecipes')} (${f.dishes.length + f.recipes.length})</button><button data-m="rests">🍽️ ${t('savedRest')} (${f.rests.length})</button></div>
    <div id="lBody"></div>`;
  const seg = $('#lSeg');
  $$('button', seg).forEach(b => { b.classList.toggle('on', b.dataset.m === listTab); b.onclick = () => { listTab = b.dataset.m; renderList(); }; });
  requestAnimationFrame(() => moveKnob(seg));
  const body = $('#lBody');
  if (listTab === 'recipes') {
    const items = [...f.recipes.map(id => recipeById[id] && { type: 'recipes', id, open: 'r:' + id, ph: photo(id, recipeById[id].wiki, recipeById[id].e), name: recName(recipeById[id]), sub: `${flag(recipeById[id].country)} ${cname(recipeById[id].country)} · ${t(recipeById[id].cat)}` }),
      ...f.dishes.map(code => byCode[code] && { type: 'dishes', id: code, open: 'c:' + code, ph: photo(code, byCode[code].wiki, byCode[code].emoji), name: dishName(byCode[code]), sub: `${flag(code)} ${cname(code)} · ${t('signature')}` })].filter(Boolean);
    body.innerHTML = items.length ? items.map((x, i) => `<button class="saved-item" data-open="${x.open}" style="animation-delay:${i * 0.04}s">${x.ph}<div class="b"><h3>${esc(x.name)}</h3><small>${esc(x.sub)}</small></div><span class="rm" data-fav="${x.type}" data-id="${x.id}">${I.heart}</span></button>`).join('')
      : `<div class="empty"><span class="e">🍲</span>${t('emptyRecipes')}</div>`;
    hydrate(body);
  } else {
    body.innerHTML = f.rests.length ? f.rests.map((r, i) => `<div class="saved-item" data-r="${r.id}" style="animation-delay:${i * 0.04}s"><div class="ph" style="border-radius:14px"><span class="em">🍽️</span></div><div class="b"><h3>${esc(r.name)}</h3><small>${esc(r.cuisine.join(', ') || r.addr || '')}</small></div><button class="rm" data-rm="${r.id}">${I.heart}</button></div>`).join('')
      : `<div class="empty"><span class="e">🍽️</span>${t('emptyRest')}</div>`;
    body.onclick = e => {
      const rm = e.target.closest('[data-rm]'); const ff = fav();
      if (rm) { const r = ff.rests.find(x => x.id === rm.dataset.rm); toggleFav('rests', r.id, r); renderList(); return; }
      const it = e.target.closest('[data-r]'); if (it) openRest(ff.rests.find(x => x.id === it.dataset.r));
    };
  }
}

/* ---------- SETTINGS ---------- */
function renderSettings() {
  const s = session(), color = store.get('color', SWATCHES[0]), dark = store.get('dark', false);
  $('#v-settings').innerHTML = `<div class="top"><div><div class="hi">⚙️ World Bite</div><h1>${t('settings')}</h1></div></div>
    <div class="profile"><div class="avatar">${esc((s.name[0] || '?').toUpperCase())}</div><div><h3>${esc(s.name)}</h3><small>${esc(s.email || '')} · ${t('provider')[s.provider] || ''}</small></div></div>
    <div class="group"><h4>${t('themeColor')}</h4><div class="swatches">${SWATCHES.map(c => `<button class="sw ${c.toLowerCase() === color.toLowerCase() ? 'on' : ''}" data-c="${c}" style="background:${c}"></button>`).join('')}
      <label class="sw customsw ${SWATCHES.map(x => x.toLowerCase()).includes(color.toLowerCase()) ? '' : 'on'}" title="${t('custom')}"><input type="color" id="cc" value="${color}"></label></div>
      <div class="row" id="darkRow"><span class="ri">${I.moon}</span><span class="lbl">${t('darkMode')}</span><span class="toggle ${dark ? 'on' : ''}" style="flex:none"></span></div></div>
    <div class="group"><h4>${t('language')}</h4><div class="langs">${[['tr', 'Türkçe'], ['az', 'Azərbaycan'], ['en', 'English'], ['ru', 'Русский']].map(([k, n]) => `<button data-l="${k}" class="${k === lang ? 'on' : ''}">${n}</button>`).join('')}</div></div>
    <div class="group"><h4>${t('account')}</h4>
      <button class="row" id="sIntro"><span class="ri">${I.replay}</span><span class="lbl">${t('replayIntro')}</span>${I.chev}</button>
      <button class="row" id="sCache"><span class="ri">${I.trash}</span><span class="lbl">${t('clearCache')}</span>${I.chev}</button>
      <button class="row danger" id="sOut"><span class="ri">${I.logout}</span><span class="lbl">${t('logout')}</span></button></div>
    <div class="group"><h4>${t('about2')}</h4><div class="row"><span class="ri">${I.info}</span><span class="lbl">World Bite</span><small>${t('version')} 1.1.0</small></div><p class="credits">${t('credits')}</p></div>`;
  $$('.sw[data-c]').forEach(b => b.onclick = () => { store.set('color', b.dataset.c); applyTheme(); renderSettings(); });
  $('#cc').oninput = e => { store.set('color', e.target.value); applyTheme(); };
  $('#cc').onchange = () => renderSettings();
  $('#darkRow').onclick = () => { store.set('dark', !store.get('dark', false)); applyTheme(); renderSettings(); if (map) { map = null; } state.results.length && renderTravel(); };
  $$('.langs button').forEach(b => b.onclick = () => { lang = b.dataset.l; store.set('lang', lang); document.documentElement.lang = lang; enterApp(); setTab('settings'); });
  $('#sIntro').onclick = () => { stack.length = 0; $('#overlays').innerHTML = ''; renderOnboarding(); };
  $('#sCache').onclick = () => { try { Object.keys(localStorage).filter(k => k.startsWith('wb_w:')).forEach(k => localStorage.removeItem(k)); } catch (e) {} for (const k in wikiMem) delete wikiMem[k]; toast(t('cleared')); };
  $('#sOut').onclick = () => { store.del('session'); authMode = 'login'; renderAuth(); };
}

/* ---------- boot ---------- */
document.documentElement.lang = lang;
applyTheme();
window.addEventListener('resize', () => $$('.seg').forEach(moveKnob));
runSplash();
})();
