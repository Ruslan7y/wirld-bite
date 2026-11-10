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
  pantry: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10h18l-2 10H5z"/><path d="m8 10 3-6M16 10l-3-6"/><path d="M9 14v3M15 14v3M12 14v3"/></svg>',
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
const fav = () => Object.assign({ dishes: [], recipes: [], rests: [], cdishes: [] }, store.get('fav', {}));
const setFav = f => store.set('fav', f);
const isFav = (type, id) => type === 'rests' ? fav().rests.some(r => r.id === id) : fav()[type].includes(id);
function toggleFav(type, id, obj) {
  const f = fav(); let on;
  if (type === 'rests') { const i = f.rests.findIndex(r => r.id === id); on = i < 0; on ? f.rests.unshift(obj) : f.rests.splice(i, 1); }
  else { const i = f[type].indexOf(id); on = i < 0; on ? f[type].unshift(id) : f[type].splice(i, 1); }
  setFav(f);
  if (type !== 'rests') { const likes = store.get('likes', {}); const key = type === 'recipes' ? recipeById[id].country : type === 'cdishes' ? (CITY_DISHES.find(d => d.id === id) || {}).code : id; on ? (likes[key] = Date.now()) : delete likes[key]; store.set('likes', likes); }
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
const state = { view: store.get('exView', 'list'), sort: store.get('sort', 'az'), tab: 'explore', pop: store.get('pop', 'd'), cat: 'all', cont: 'all', q: '', tmode: 'near', city: store.get('city', ''), coords: null, cuisine: '', trip: '', results: [], resLabel: '' };
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
  { const w = labWin(); if (w) { try { if (w.LAB && w.LAB.back) { w.LAB.back(); return true; } } catch (e) { } closeLab(); return true; } }
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
window.WB = Object.assign(window.WB || {}, { back });
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
    ${reg ? `<div class="field"><span class="ic">${I.user}</span><input id="aName" placeholder="${t('name')}" autocomplete="name"></div>
    <div class="field"><span class="ic">🎂</span><input id="aAge" type="number" inputmode="numeric" min="5" max="120" placeholder="${t('age')}"></div>` : ''}
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
  const age = reg ? parseInt($('#aAge').value, 10) : 0;
  const name = reg ? $('#aName').value.trim() : '', email = $('#aEmail').value.trim().toLowerCase(), pw = $('#aPw').value;
  if (!email || !pw || (reg && !name)) return err.textContent = t('fillAll');
  if (pw.length < 6) return err.textContent = t('pwShort');
  if (reg && !(age >= 5 && age <= 120)) return err.textContent = t('ageErr');
  const users = store.get('users', []), h = await sha(email + ':' + pw);
  if (reg) {
    if (users.some(u => u.email === email)) return err.textContent = t('exists');
    const u = { name, email, pw: h, provider: 'email', age }; users.push(u); store.set('users', users); login(u);
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
      <div class="field"><span class="ic">🎂</span><input id="sAge" type="number" inputmode="numeric" min="5" max="120" placeholder="${t('age')}"></div>
      <div class="err" id="sErr"></div>
      <button class="btn primary block" id="sGo">${t('cont')}</button></div>`, () => {
    $('#sGo').onclick = () => {
      const name = $('#sName').value.trim(), email = $('#sEmail').value.trim().toLowerCase(), age = parseInt($('#sAge').value, 10);
      if (!name || !email) return $('#sErr').textContent = t('fillAll');
      if (!(age >= 5 && age <= 120)) return $('#sErr').textContent = t('ageErr');
      closeSheet(); login({ name, email, provider: p, age });
    };
  });
}
function login(u) { store.set('session', { name: u.name, email: u.email, provider: u.provider, age: u.age || 0 }); enterApp(); }
function askAge(force) {
  const s = store.get('session', null); if (!s || (s.age && !force)) return;
  openSheet(`<div class="chef-row">${['aylin', 'zeynep', 'leyla'].map(id => `<div class="chef-mini">${chefSVG(id, 'happy')}</div>`).join('')}</div>
    <h2>🎂 ${t('ageAsk')}</h2><p class="sub">${t('ageWhy')}</p>
    <div class="field"><span class="ic">🎂</span><input id="agIn" type="number" inputmode="numeric" min="5" max="120" placeholder="${t('age')}" value="${s.age || ''}"></div>
    <div class="err" id="agErr"></div>
    <div class="btn-row"><button class="btn line" id="agLater">${t('later')}</button><button class="btn primary" id="agOk">${t('cont')}</button></div>`, sh => {
    $('#agLater', sh).onclick = () => { store.set('ageSkipped', true); closeSheet(); };
    $('#agOk', sh).onclick = () => {
      const a = parseInt($('#agIn', sh).value, 10); if (!(a >= 5 && a <= 120)) return $('#agErr', sh).textContent = t('ageErr');
      const ss = store.get('session', {}); ss.age = a; store.set('session', ss); closeSheet();
      const ch = CHEFS[currentChef()]; toast(`${ch.name[lang] || ch.name.tr} 👩‍🍳`); renderSettings();
    };
  });
}
function currentChef(code) { const c = code && byCode[code]; return chefFor(store.get('chefMode', 'age'), (store.get('session', {}) || {}).age, code, c && c.cont, hash(String(code) + new Date().toDateString())); }

/* ================= MAIN APP ================= */
const TABS = ['explore', 'travel', 'pantry', 'list', 'settings'];
function enterApp() {
  $('#tabbar').innerHTML = TABS.map(k => `<button data-tab="${k}">${I[k]}<span>${t('tab' + k[0].toUpperCase() + k.slice(1))}</span></button>`).join('');
  $$('#tabbar button').forEach(b => b.onclick = () => setTab(b.dataset.tab));
  show('main'); setTimeout(offerLabResume, 1200);
  renderExplore(); renderTravel(); renderPantry(); renderList(); renderSettings();
  setTab(state.tab);
  if (!store.get('ageSkipped', false)) setTimeout(() => askAge(), 3800);
}
function setTab(k) {
  state.tab = k;
  $$('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === k));
  $$('.view').forEach(v => v.classList.toggle('on', v.id === 'v-' + k));
  if (k === 'list') renderList();
  if (k === 'travel' && map) setTimeout(mapResize, 60);
  if (k === 'pantry') renderPantry();
  const v = $('#v-' + k); hydrate(v); requestAnimationFrame(() => $$('.seg', v).forEach(moveKnob));
}
const session = () => store.get('session', { name: '?' });

/* ---------- EXPLORE ---------- */
function renderExplore() {
  const s = session();
  $('#v-explore').innerHTML = `
    <div class="top"><div><div class="hi">${esc(t('hello', { n: s.name.split(' ')[0] }))} 👋</div><h1>${t('exploreTitle')}</h1></div><div class="avatar">${esc(s.name[0] || '?').toUpperCase()}</div></div>
    <label class="search">${I.search}<input id="exQ" placeholder="${t('searchExplore')}" value="${esc(state.q)}" autocomplete="off"><button class="x ${state.q ? '' : 'hide'}" id="exX">×</button></label>
    <div class="seg view-seg" id="exView"><span class="knob"></span><button data-v="list">📋 ${t('listView')}</button><button data-v="map">🗺️ ${t('mapView')}</button></div>
    <div id="exSearch"></div>
    <div id="exMap" class="${state.view === 'map' ? 'fade-in' : 'hide'}"><div class="wm-wrap" id="wmWrap"><div id="wmap"></div>
      <div class="wm-hint" id="wmHint">👆 ${t('tapCountry')}</div><div class="wm-card" id="wmCard"></div></div></div>
    <div id="exHome" class="${state.view === 'map' ? 'hide' : ''}">
      <div id="dotd"></div>
      <div class="sec"><h2>🔥 ${t('popular')}</h2><div class="mini-seg" id="popSeg"><button data-p="d">${t('daily')}</button><button data-p="w">${t('weekly')}</button></div></div>
      <div class="hscroll" id="popList"></div>
      <div class="sec"><h2>👩‍🍳 ${t('featured')}</h2><small>${RECIPES.length}</small></div>
      <div class="hscroll">${RECIPES.map((r, i) => recipeCard(r, i)).join('')}</div>
      <div class="sec"><h2>🌍 ${t('allCountries')}</h2><small id="cCount"></small></div>
      <div class="chips" id="catChips"></div>
      <div class="chips" id="contChips" style="margin-top:8px"></div>
      <div class="chips" id="dietChips" style="margin-top:8px"></div>
      <div class="chips sort" id="sortChips" style="margin-top:8px"></div>
      <div class="grid" id="cGrid" style="margin-top:14px"></div>
      <p class="note" style="text-align:center;margin-top:18px">${t('demoPop')}</p>
    </div>`;
  const q = $('#exQ');
  q.oninput = () => { state.q = q.value; $('#exX').classList.toggle('hide', !state.q); drawSearch(); };
  $('#exX').onclick = () => { q.value = state.q = ''; $('#exX').classList.add('hide'); drawSearch(); };
  $$('#popSeg button').forEach(b => b.onclick = () => { state.pop = b.dataset.p; store.set('pop', state.pop); renderPopular(); });
  $$('#exView button').forEach(b => { b.classList.toggle('on', b.dataset.v === state.view); b.onclick = () => setView(b.dataset.v); });
  renderDotd(); renderPopular(); drawChips(); drawGrid(); drawSearch();
  if (state.view === 'map') setTimeout(() => setView('map', true), 30);
}
function setView(v, force) {
  if (v === 'map' && !WorldMap.supported()) { toast(t('mapNoGL')); v = 'list'; }
  if (state.view === v && !force) return;
  state.view = v; store.set('exView', v);
  $$('#exView button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  const home = $('#exHome'), mp = $('#exMap');
  if (v === 'map') {
    home.classList.add('hide'); mp.classList.remove('hide'); mp.classList.remove('fade-in'); void mp.offsetWidth; mp.classList.add('fade-in');
    if (!WorldMap.ready || force) WorldMap.mount($('#wmap'), { cooked: Object.keys(passport()), rich: Object.keys(CITIES_BY_CODE), citiesOf: code => CITIES_BY_CODE[code] || [], onCountry: wmCountry, onCity: c => openCity(c), onClear: wmClear });
    else setTimeout(() => WorldMap.resize(), 50);
  } else {
    mp.classList.add('hide'); home.classList.remove('hide'); home.classList.remove('fade-in'); void home.offsetWidth; home.classList.add('fade-in');
    if (!state.q) home.classList.remove('hide');
  }
  drawSearch();
}
function wmCountry(code) {
  const c = byCode[code]; const card = $('#wmCard'), hint = $('#wmHint'); if (!card) return;
  hint && hint.classList.add('hide');
  if (!c) { card.innerHTML = `<div class="wm-in"><b>${flag(code)} ${esc(cname(code))}</b><p class="note">${t('noCountryData')}</p></div>`; card.classList.add('show'); return; }
  const cities = CITIES_BY_CODE[code] || [];
  card.innerHTML = `<div class="wm-in">
    <div class="wm-head"><span class="f">${flag(code)}</span><div><b>${esc(cname(code))}</b><small>${t(c.cont)} · ★ ${t(c.strength)}</small></div><button class="round sm" id="wmX">✕</button></div>
    <div class="wm-sig" role="button" data-open="c:${code}">${photo(code, c.wiki, c.emoji)}<div><small>${t('signature')}</small><b>${esc(dishName(c))}</b><small>⏱ ${fmtTime(sigOf(code).t)} · 🔥 ${kcalOf(code)} kcal</small></div><span class="go">›</span></div>
    ${cities.length ? `<small class="wm-sub">🏙️ ${t('citiesN', { n: cities.length })}</small><div class="wm-cities">${cities.map((ct, i) => `<button class="chip" data-city="${ct.id}" style="animation-delay:${i * 0.06}s">${esc(ct.name)} <small>${ct.dishes.length}</small></button>`).join('')}</div>` : `<small class="wm-sub">${t('noCityYet')}</small>`}
  </div>`;
  card.classList.remove('show'); void card.offsetWidth; card.classList.add('show');
  hydrate(card);
  $('#wmX').onclick = () => WorldMap.clear();
  $$('[data-city]', card).forEach(b => b.onclick = () => { const ct = CITIES.find(x => x.id === b.dataset.city); WorldMap.focusCity(ct); openCity(ct); });
}
function wmClear() { const card = $('#wmCard'); if (card) card.classList.remove('show'); const h = $('#wmHint'); h && h.classList.remove('hide'); }
const cityDishById = Object.fromEntries(CITY_DISHES.map(d => [d.id, d]));
const cityById = Object.fromEntries(CITIES.map(c => [c.id, c]));
function openCity(ct) {
  openSheet(`<div class="city-head"><span class="f">${flag(ct.code)}</span><div><h2>${esc(ct.name)}</h2><p class="sub">${esc(ct.region)} · ${esc(cname(ct.code))}</p></div></div>
    <div class="city-dishes">${ct.dishes.map((d, i) => `<div class="cdish" role="button" data-cd="${d.id}" style="animation-delay:${i * 0.08}s">${photo(d.id, d.wiki, d.emoji)}
      <div class="b"><b>${esc(d.name)}</b><span class="badge">${t(d.cat)}</span><p>${esc(d.desc)}</p></div></div>`).join('')}</div>
    <div class="btn-row"><button class="btn ghost" id="ctEat">📍 ${t('whereEat')}</button><button class="btn line" id="ctCountry">${flag(ct.code)} ${t('countryPage')}</button></div>`, s => {
    hydrate(s);
    $$('[data-cd]', s).forEach(b => b.onclick = () => { closeSheet(); openCityDish(cityDishById[b.dataset.cd]); });
    $('#ctEat', s).onclick = () => { closeSheet(); state.tmode = 'trip'; state.trip = ct.code; state.results = []; setTab('travel'); renderTravel(); findRestaurants(); };
    $('#ctCountry', s).onclick = () => { closeSheet(); openCountry(ct.code); };
  });
}
function matchRecipeFor(d) {
  const sig = byCode[d.code];
  if (sig && sig.wiki === d.wiki) return { kind: 'c', id: d.code };
  const r = RECIPES.find(r => r.wiki === d.wiki || norm(recName(r)) === norm(d.name));
  return r ? { kind: 'r', id: r.id } : null;
}
function openCityDish(d) {
  const ct = cityById[d.city], m = matchRecipeFor(d), cached = store.get('cdr:' + d.id, null);
  pushPage(`
    <div class="hero">${photo(d.id, d.wiki, d.emoji, true)}
      <div class="bar"><button class="round" data-back>${I.back}</button><span class="bar-r">${heartBtn('cdishes', d.id, 'round')}</span></div>
      <span class="credit">${t('photoCredit')}</span></div>
    <div class="dbody">
      <div class="country"><span class="f">${flag(d.code)}</span>${esc(ct.name)} · ${esc(cname(d.code))}</div>
      <h1>${esc(d.name)}</h1>
      <div class="info-row"><span class="pill p">${d.emoji} ${t(d.cat)}</span><span class="pill">🏙️ ${esc(ct.region)}</span></div>
      <div class="block"><h3>📜 ${t('story')}</h3><p>${esc(d.desc)}</p></div>
      <div class="block" id="cdWiki" style="animation-delay:.08s"><h3>📖 ${t('about')}</h3><div class="sk"></div><div class="sk" style="width:70%"></div></div>
      <div id="cdRecipe"></div>
      <button class="btn ghost block cta" id="cdEat">📍 ${t('whereEat')}</button>
    </div>`, el => {
    const box = $('#cdRecipe', el);
    const showAi = r => { box.innerHTML = `<div class="sec" style="margin-bottom:0"><h2>📝 ${t('recipe')}</h2><small>✨ Gemini</small></div>` + recipeHTML(aiToRc(r)); bindRecipe(box, aiToRc(r), d.name, { emoji: d.emoji, country: flag(d.code) + ' ' + ct.name, wiki: d.wiki, key: d.id, code: d.code }); };
    if (m) box.innerHTML = `<button class="btn primary block cta" id="cdOpen">📝 ${t('seeRecipe')}</button>`;
    else if (cached) showAi(cached);
    else box.innerHTML = gemKey() ? `<button class="btn primary block cta" id="cdGen">✨ ${t('genRecipe')}</button>` : `<p class="note" style="margin-top:14px">💡 ${t('noRecipeKey')}</p>`;
    const o = $('#cdOpen', el); if (o) o.onclick = () => m.kind === 'c' ? openCountry(m.id) : openRecipe(m.id);
    const g = $('#cdGen', el); if (g) g.onclick = async () => {
      box.innerHTML = `<div class="ai-wait"><div class="ai-orb">✨</div><p>${t('aiWorking')}</p></div>`;
      try {
        const prompt = `Write the authentic home recipe for "${d.name}" from ${ct.name}, ${cname(d.code)} (${d.desc}). Write everything in ${LANG_NAME[lang]}. Reply ONLY with JSON: {"name":string,"emoji":string,"cuisine":string,"time_min":number,"servings":number,"difficulty":"easy"|"medium"|"hard","ingredients":[string with amount],"steps":[string],"kcal_per_serving":number,"protein_g":number,"carbs_g":number,"fat_g":number,"fiber_g":number,"tip":string,"serving":string}. Each step = one clear action starting with the verb, include time and the expected consistency. Last step = how it is traditionally served.`;
        const j = await gemini({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } }, 45000);
        const r = gemJSON(gemText(j)); store.set('cdr:' + d.id, r); showAi(r);
      } catch (e) { box.innerHTML = `<p class="note">⚠️ ${t('aiErr')}</p>`; }
    };
    $('#cdEat', el).onclick = () => { state.tmode = 'trip'; state.trip = d.code; state.results = []; while (stack.length) back(); setTab('travel'); renderTravel(); findRestaurants(); };
    wikiGet(d.wiki, lang).then(w => { const b = $('#cdWiki', el); if (!b) return; if (!w || !w.extract) { b.remove(); return; } b.innerHTML = `<h3>📖 ${t('about')}</h3><p>${esc(w.extract)}</p><p class="note">Wikipedia · CC BY-SA</p>`; });
  });
}
function aiToRc(r) { return { t: r.time_min || 30, s: r.servings || 4, d: r.difficulty || 'medium', ing: r.ingredients || [], st: r.steps || [], tr: false, ai: true, n: { kcal: Math.round(r.kcal_per_serving || 0), protein: Math.round(r.protein_g || 0), carbs: Math.round(r.carbs_g || 0), fat: Math.round(r.fat_g || 0), fiber: r.fiber_g } }; }
function countryCard(c, i) {
  return `<div class="ccard" role="button" data-open="c:${c.code}" style="animation-delay:${Math.min(i, 12) * 0.03}s">
    ${photo(c.code, c.wiki, c.emoji)}<span class="flag">${flag(c.code)}</span>${heartBtn('dishes', c.code)}
    <div class="b"><h3>${esc(cname(c.code))}</h3><p>${esc(dishName(c))}</p><div class="badges"><span class="badge">★ ${t(c.strength)}</span><span class="badge soft">🔥 ${kcalOf(c.code)}</span>${(d => ['veg', 'vegan', 'gf'].filter(k => d[k]).slice(-1).map(k => `<span class="badge soft">${DIET_ICON[k]}</span>`).join(''))(dietTags(sigOf(c.code).ing, 'dc' + c.code))}</div></div></div>`;
}
function recipeCard(r, i) {
  return `<button class="rcard" data-open="r:${r.id}" style="animation-delay:${i * 0.04}s">${photo(r.id, r.wiki, r.e)}
    <div class="b"><small>${flag(r.country)} ${esc(cname(r.country))}</small><h3>${esc(recName(r))}</h3><small>⏱ ${r.t} ${t('min')} · ${t(r.d)}</small><span class="badge">${t(r.cat)}</span></div></button>`;
}
function renderDotd() {
  const d = new Date(), idx = hash(d.toISOString().slice(0, 10) + 'dotd') % COUNTRIES.length, c = COUNTRIES[idx], rc = sigOf(c.code);
  $('#dotd').innerHTML = `<div class="dotd" role="button" data-open="c:${c.code}">${photo(c.code, c.wiki, c.emoji, true)}
    <div class="dotd-shade"></div><span class="dotd-tag">✨ ${t('dishOfDay')}</span>${heartBtn('dishes', c.code)}
    <div class="dotd-b"><small>${flag(c.code)} ${esc(cname(c.code))}</small><h2>${esc(dishName(c))}</h2><span>⏱ ${fmtTime(rc.t)} · 🔥 ${kcalOf(c.code)} kcal · 📊 ${t(rc.d)}</span></div></div>
    ${questCard()}
    <div class="menu-cta" role="button" id="menuCta"><span>🍽️</span><div><b>${t('menuTitle')}</b><small>${t('menuCta')}</small></div><span class="go">›</span></div>`;
  hydrate($('#dotd'));
  $('#menuCta').onclick = () => openMenu();
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
  $('#dietChips').innerHTML = DIETS.map(k => `<button class="chip ${store.get('diet', []).includes(k) ? 'on' : ''}" data-dk="${k}">${DIET_ICON[k]} ${t('diet_' + k)}</button>`).join('');
  $$('#dietChips .chip').forEach(b => b.onclick = () => { toggleDiet(b.dataset.dk); drawChips(); drawGrid(); });
  const SORTS = { az: 'sortAZ', cont: 'sortCont', pop: 'sortPop', kcal: 'sortKcal', time: 'sortTime' };
  $('#sortChips').innerHTML = `<span class="sort-l">↕ ${t('sortBy')}</span>` + Object.keys(SORTS).map(k => `<button class="chip ${state.sort === k ? 'on' : ''}" data-sort="${k}">${t(SORTS[k])}</button>`).join('');
  $$('#sortChips .chip').forEach(b => b.onclick = () => { state.sort = b.dataset.sort; store.set('sort', state.sort); drawChips(); drawGrid(); });
  $('#contChips').innerHTML = ['all', ...CONTINENTS].map(k => `<button class="chip ${state.cont === k ? 'on' : ''}" data-cont="${k}">${k === 'all' ? '🌐 ' + t('all') : t(k)}</button>`).join('');
  $$('#catChips .chip').forEach(b => b.onclick = () => { state.cat = b.dataset.cat; drawChips(); drawGrid(); });
  $$('#contChips .chip').forEach(b => b.onclick = () => { state.cont = b.dataset.cont; drawChips(); drawGrid(); });
}
function drawGrid() {
  const az = (a, b) => cname(a.code).localeCompare(cname(b.code), lang);
  const cmp = { az, cont: az, pop: (a, b) => popScore(b, 'w') - popScore(a, 'w'), kcal: (a, b) => kcalOf(a.code) - kcalOf(b.code), time: (a, b) => sigOf(a.code).t - sigOf(b.code).t }[state.sort] || az;
  const dp = store.get('diet', []);
  const list = COUNTRIES.filter(c => (state.cat === 'all' || c.strength === state.cat) && (state.cont === 'all' || c.cont === state.cont) && (!dp.length || (d => dp.every(k => d[k]))(dietTags(sigOf(c.code).ing, 'dc' + c.code)))).sort(cmp);
  $('#cCount').textContent = t('countriesN', { n: list.length });
  let html;
  if (state.sort === 'cont') html = CONTINENTS.map(ct => { const g = list.filter(c => c.cont === ct); return g.length ? `<h3 class="grp">${t(ct)} <small>${g.length}</small></h3>` + g.map(countryCard).join('') : ''; }).join('');
  else html = list.map(countryCard).join('');
  $('#cGrid').innerHTML = html || `<div class="empty" style="grid-column:1/-1"><span class="e">🍽️</span>${t('noResults')}</div>`;
  hydrate($('#cGrid'));
}
const norm = s => String(s).toLocaleLowerCase(lang).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');
function drawSearch() {
  const q = norm(state.q.trim());
  $('#exHome').classList.toggle('hide', !!q || state.view === 'map');
  $('#exMap').classList.toggle('hide', !!q || state.view !== 'map');
  const box = $('#exSearch');
  if (!q) { box.innerHTML = ''; if (state.view === 'map') setTimeout(() => WorldMap.resize(), 30); return; }
  const cts = CITIES.filter(c => [c.name, c.region, cname(c.code)].some(x => norm(x).includes(q)));
  const cds = CITY_DISHES.filter(d => [d.name, d.wiki, d.desc].some(x => norm(x).includes(q)));
  const cs = COUNTRIES.filter(c => [cname(c.code), c.dish, c.wiki, c.code, c.story, ...(sigOf(c.code).ing)].some(x => norm(x).includes(q)));
  const rs = RECIPES.filter(r => [r.name.tr, r.name.en, r.local, cname(r.country), ...r.ing.tr, ...r.ing.en].some(x => norm(x).includes(q)));
  box.innerHTML = (cts.length ? `<div class="sec"><h2>🏙️ ${t('cities')}</h2><small>${cts.length}</small></div><div class="city-list">${cts.slice(0, 20).map((c, i) => `<button class="city-card" data-cityid="${c.id}" style="animation-delay:${i * 0.03}s"><span class="f">${flag(c.code)}</span><div><b>${esc(c.name)}</b><small>${esc(c.region)} · ${esc(cname(c.code))}</small></div><span class="n">${c.dishes.length} 🍲</span></button>`).join('')}</div>` : '') +
    (cds.length ? `<div class="sec"><h2>🍲 ${t('dishes')}</h2><small>${cds.length}</small></div>${cds.slice(0, 20).map((d, i) => `<div class="saved-item" role="button" data-cdid="${d.id}" style="animation-delay:${i * 0.03}s">${photo(d.id, d.wiki, d.emoji)}<div class="b"><h3>${esc(d.name)}</h3><small>${flag(d.code)} ${esc(cityById[d.city].name)} · ${esc(cname(d.code))}</small></div></div>`).join('')}` : '') +
    (rs.length ? `<div class="sec"><h2>${t('recipes')}</h2><small>${rs.length}</small></div><div class="hscroll">${rs.map(recipeCard).join('')}</div>` : '') +
    (cs.length ? `<div class="sec"><h2>${t('allCountries')}</h2><small>${t('countriesN', { n: cs.length })}</small></div><div class="grid">${cs.map(countryCard).join('')}</div>` : '') +
    (!cs.length && !rs.length && !cts.length && !cds.length ? `<div class="empty"><span class="e">🔍</span>${t('noResults')}</div>` : '');
  hydrate(box);
  $$('[data-cityid]', box).forEach(b => b.onclick = () => { const ct = cityById[b.dataset.cityid]; if (state.view === 'map') { clearQ(); WorldMap.select(ct.code); setTimeout(() => WorldMap.focusCity(ct), 1400); } openCity(ct); });
  $$('[data-cdid]', box).forEach(b => b.onclick = () => openCityDish(cityDishById[b.dataset.cdid]));
  if (state.view === 'map') $$('.ccard', box).forEach(b => { b.addEventListener('click', e => { if (e.target.closest('[data-fav]')) return; e.stopImmediatePropagation(); const code = b.dataset.open.split(':')[1]; clearQ(); WorldMap.select(code); }, true); });
}
function clearQ() { state.q = ''; const q = $('#exQ'); if (q) q.value = ''; $('#exX') && $('#exX').classList.add('hide'); drawSearch(); }
// Opening detail pages is handled by ONE global listener (prevents duplicate pages)
document.addEventListener('click', e => {
  const b = e.target.closest('[data-open]'); if (!b || e.target.closest('[data-fav]')) return;
  const [k, id] = b.dataset.open.split(':');
  k === 'c' ? openCountry(id) : k === 'd' ? openCityDish(cityDishById[id]) : openRecipe(id);
});

/* ---------- Recipes: shared helpers ---------- */
function kcalOf(code) { const rc = sigOf(code); return rc ? estimateNutrition(rc.ing, rc.s, 'c' + code).kcal : '?'; }
function sigOf(code) {
  if (code === 'AZ') { const r = recipeById['az-main'], l = cl(); return { t: r.t, s: r.s, d: r.d, ing: r.ing[l], st: r.st[l], tr: false }; }
  const g = SIG[code]; return g ? Object.assign({ tr: true }, g) : null;
}
function nutriHTML(n, ai) {
  const tot = n.protein * 4 + n.carbs * 4 + n.fat * 9 || 1, pct = v => Math.round(v / tot * 100), day = Math.round(n.kcal / 2000 * 100);
  const C = 2 * Math.PI * 34, seg = (v, off, col) => `<circle cx="40" cy="40" r="34" stroke="${col}" stroke-dasharray="${C * v / 100} ${C}" stroke-dashoffset="${-C * off / 100}"/>`;
  const pP = pct(n.protein * 4), pC = pct(n.carbs * 4), pF = 100 - pP - pC;
  return `<div class="block nutri"><h3>🔥 ${t('nutrition')} <small class="cnt">${t('perServing')}</small></h3>
    <div class="nrow"><div class="nring"><svg viewBox="0 0 80 80">${seg(pP, 0, '#3B82F6')}${seg(pC, pP, '#F59E0B')}${seg(pF, pP + pC, '#EF4444')}</svg><div><b>${n.kcal}</b><small>kcal</small></div></div>
      <div class="nbars">
        <div><span>🥩 ${t('protein')}</span><b>${n.protein} g</b><i style="--w:${pP}%;--c:#3B82F6"></i></div>
        <div><span>🍞 ${t('carbs')}</span><b>${n.carbs} g</b><i style="--w:${pC}%;--c:#F59E0B"></i></div>
        <div><span>🧈 ${t('fat')}</span><b>${n.fat} g</b><i style="--w:${pF}%;--c:#EF4444"></i></div>
        ${n.fiber != null ? `<div><span>🌾 ${t('fiber')}</span><b>${Math.round(n.fiber)} g</b></div>` : ''}</div></div>
    <p class="note">⚡ ${t('kcalDaily', { p: day })} · ${ai ? t('aiEstimate') : t('estimate')}</p></div>`;
}
function recipeHTML(rc, title) {
  const n = rc.n || estimateNutrition(rc.ing, rc.s, rc.key);
  const dt = dietTags(rc.ing, rc.key ? 'd' + rc.key : null);
  rc.cur = rc.cur || rc.s;
  return nutriHTML(n, rc.ai) + dietHTML(dt) + `<div class="info-row" style="margin-top:14px"><span class="pill p">⏱ ${fmtTime(rc.t)}</span><span class="pill">📊 ${t(rc.d)}</span></div>
    <div class="serv"><span>👥 ${t('servingsFor')}</span><button data-sv="-1" aria-label="-">−</button><b class="svn">${rc.cur}</b><button data-sv="1" aria-label="+">+</button></div>
    ${rc.tr && (lang === 'en' || lang === 'ru') ? `<p class="note">${t('sigLangNote')}</p>` : ''}
    <button class="btn primary block cook-btn" data-cook>👩‍🍳 ${t('startCooking')}</button>
    <div class="prog"><i class="rProg"></i></div>
    <div class="block"><h3>🧺 ${t('ingredients')} <small class="cnt">${rc.ing.length}</small></h3><ul class="ing">${rc.ing.map(x => `<li><span class="box">✓</span><span class="it">${esc(scaleLine(x, rc.cur / rc.s))}</span></li>`).join('')}</ul><p class="note">👆 ${t('tapHint')}</p>
      <button class="btn line block shop-btn" data-shop>🛒 ${t('addMissing')}</button>
      ${rc.cat !== 't' && rc.key && /^[cr]/.test(rc.key) ? `<button class="btn ghost block shop-btn" data-menu>➕ ${t('addSide')}</button>` : ''}</div>
    <div class="block" style="animation-delay:.08s"><h3>🔥 ${t('steps')} <small class="cnt">${rc.st.length}</small></h3><ol class="steps">${rc.st.map((x, i) => `<li><span class="n">${i + 1}</span><span>${esc(x)}</span></li>`).join('')}</ol></div>`;
}
function saveScore(key, final, earned) {
  const g = store.get('gstats', { total: 0, best: {}, games: 0 });
  const newBest = !g.best[key] || final > g.best[key];
  if (newBest) g.best[key] = final;
  g.total += earned; g.games++; store.set('gstats', g);
  return Object.assign({ newBest }, rankInfo(g.total));
}
function rankInfo(total) {
  let i = 0; CHEF_RANKS.forEach((r, k) => { if (total >= r[0]) i = k; });
  const nx = CHEF_RANKS[i + 1];
  return { total, rankName: t(CHEF_RANKS[i][1]), next: nx ? t(nx[1]) : '', progress: nx ? Math.round((total - CHEF_RANKS[i][0]) / (nx[0] - CHEF_RANKS[i][0]) * 100) : 100 };
}
function dietHTML(d) {
  const prefs = store.get('diet', []), ok = DIETS.filter(k => d[k]), bad = prefs.filter(k => !d[k]);
  if (!ok.length && !bad.length) return '';
  return `<div class="diet-row">${bad.map(k => `<span class="dtag warn">⚠️ ${t('dietWarn_' + k)}</span>`).join('')}${ok.map(k => `<span class="dtag">${DIET_ICON[k]} ${t('diet_' + k)}</span>`).join('')}</div>`;
}
function openKitchen(rc, name, extra) {
  extra = extra || {};
  // the 3D cooking scene (lab/chef.html) reads this recipe and plays every step
  window.WB_LAB_RECIPE = { name, ing: rc.ing.map(l => scaleLine(l, (rc.cur || rc.s) / rc.s)), st: rc.st.slice(), s: rc.cur || rc.s, time: rc.t, key: rc.key || name, code: extra.code || '', country: extra.country || '' };
  let chef = 'carla'; try { chef = localStorage.getItem('labChef') || 'carla'; } catch (e) { }
  openLab(`lab/chef.html?wb=1&chef=${chef}`);
}
// menu: main dish + side cooked together in the 3D kitchen (the side is made while the main dish waits)
function openKitchenMenu(m, sd) {
  const src = x => ({ name: x.name, ing: x.ing.slice(), st: x.st.slice(), s: x.s, time: x.tot || x.t || 30, key: x.key, country: x.country || '' });
  window.WB_LAB_RECIPE = Object.assign(src(m), { side: src(sd) });
  let chef = 'carla'; try { chef = localStorage.getItem('labChef') || 'carla'; } catch (e) { }
  openLab(`lab/chef.html?wb=1&chef=${chef}`);
}
/* ---------- 3D cooking scene overlay ---------- */
let labFrame = null;
function openLab(url) {
  if (!labFrame) {
    labFrame = document.createElement('iframe'); labFrame.id = 'labFrame'; labFrame.setAttribute('allow', 'autoplay; microphone');
    labFrame.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0;z-index:9999;background:#140f0c;display:none';
    document.body.appendChild(labFrame);
  }
  labFrame.src = url; labFrame.style.display = 'block'; keepAwake(true);
}
function closeLab() { if (!labFrame) return; labFrame.style.display = 'none'; labFrame.src = 'about:blank'; keepAwake(false); try { Android && Android.stopSpeak && Android.stopSpeak(); } catch (e) { } }
const labWin = () => labFrame && labFrame.style.display !== 'none' ? labFrame.contentWindow : null;
window.WB_LAB_CLOSE = closeLab; window.__labWin = labWin;
// native callbacks arrive in this (top) window: pass them to the scene
window.LAB_TTS_DONE = id => { const w = labWin(); w && w.LAB_TTS_DONE && w.LAB_TTS_DONE(id); };
window.LAB_ALARM_FIRED = id => { const w = labWin(); w && w.LAB_ALARM_FIRED && w.LAB_ALARM_FIRED(id); };
window.LAB_PAUSE = () => { const w = labWin(); w && w.LAB && w.LAB.pause && w.LAB.pause(); };
function labResumeInfo() {
  try {
    const p = JSON.parse(localStorage.getItem('lab_progress') || 'null'), r = JSON.parse(localStorage.getItem('lab_wb_recipe') || 'null');
    if (p && r && p.r === 'wb-' + (r.key || r.name) && p.step > 0 && Date.now() - p.at < 6 * 3600e3) return { p, r };
  } catch (e) { }
  return null;
}
function offerLabResume() {
  const info = labResumeInfo(); if (!info) return;
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(env(safe-area-inset-bottom) + 84px);z-index:900;background:var(--p,#ff7a45);color:#fff;border-radius:16px;padding:12px 14px;display:flex;align-items:center;gap:10px;box-shadow:0 10px 30px rgba(0,0,0,.25);font:600 14px system-ui';
  bar.innerHTML = `<span style="font-size:22px">👩‍🍳</span><span style="flex:1">${esc(info.r.name)} · ${lang === 'en' ? 'continue where you left off' : lang === 'ru' ? 'продолжить с места остановки' : lang === 'az' ? 'qaldığın yerdən davam et' : 'kaldığın yerden devam et'}</span><b style="font-size:18px">▶</b><span data-x style="opacity:.8;padding:0 4px">✕</span>`;
  bar.onclick = e => { bar.remove(); if (e.target.dataset.x !== undefined) return; window.WB_LAB_RECIPE = info.r; openLab(`lab/chef.html?wb=1&chef=${info.p.chef}&resume=1`); };
  document.body.appendChild(bar); setTimeout(() => bar.remove(), 20000);
}
function bindRecipe(el, rc, name, extra) {
  const upd = () => { const all = $$('.ing li,.steps li', el), d = all.filter(x => x.classList.contains('done')); $$('.rProg', el).forEach(p => p.style.width = (d.length / all.length * 100) + '%'); };
  $$('.ing li,.steps li', el).forEach(li => li.onclick = () => { li.classList.toggle('done'); upd(); });
  $$('[data-cook]', el).forEach(b => b.onclick = () => openKitchen(rc, name, extra));
  const its = $$('.ing li .it', el);
  const setS = v => { rc.cur = Math.max(1, Math.min(60, v)); const f = rc.cur / rc.s; its.forEach((x, i) => { x.textContent = scaleLine(rc.ing[i], f); x.classList.remove('flash'); void x.offsetWidth; x.classList.add('flash'); }); $$('.svn', el).forEach(x => x.textContent = rc.cur); };
  $$('[data-sv]', el).forEach(b => b.onclick = () => setS(rc.cur + (+b.dataset.sv)));
  $$('[data-menu]', el).forEach(b => b.onclick = () => openMenu(rc.key));
  $$('[data-shop]', el).forEach(b => b.onclick = () => { const n = addToShop(rc.ing.map(l => scaleLine(l, rc.cur / rc.s)), name); toast(n ? t('shopAdded', { n }) : t('shopNone')); });
}
/* ---------- shopping list ---------- */
const shop = () => store.get('shop', []);
function ingInfo(text) {
  const low = norm(text); let best = null;
  for (const it of INGREDIENTS) for (const w of [it.name.tr, it.name[lang], it.name.en, ...it.words]) { const nw = norm(w); if (nw.length >= 2 && low.includes(nw) && (!best || nw.length > best.len)) best = { it, len: nw.length }; }
  return best ? best.it : null;
}
function pantryStems(items) {
  const out = [];
  (items || pantry()).forEach(x => {
    if (x[0] === '#') { const it = ING_BY_ID[x.slice(1)]; if (it) [it.name.tr, ...it.words].forEach(w => out.push(stemOf(w))); }
    else out.push(stemOf(x));
  });
  return out.filter(Boolean);
}
function addToShop(lines, src) {
  const have = pantryStems(), list = shop(); let n = 0;
  for (const p of needParts(lines)) {
    const key = norm(shortIng(p)); if (!key) continue;
    if (have.some(st => norm(p).includes(st))) continue;
    if (list.some(x => !x.done && norm(shortIng(x.text)) === key)) continue;
    const info = ingInfo(p);
    list.push({ id: 's' + Date.now().toString(36) + n, text: p.replace(/^[^:]{2,22}:\s*/, ''), cat: info ? info.cat : 'other', emoji: info ? info.emoji : ingEmoji(p), src: src || '', done: false }); n++;
  }
  store.set('shop', list); return n;
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
    if (sig) { sig.key = 'c' + code; bindRecipe(el, sig, dishName(c), { emoji: c.emoji, country: flag(c.code) + ' ' + cname(c.code), wiki: c.wiki, key: c.code, code }); }
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
    rc.key = 'r' + r.id; bindRecipe(el, rc, recName(r), { emoji: r.e, country: flag(r.country) + ' ' + cname(r.country), wiki: r.wiki, key: r.id, code: r.country });
    $('#shareBtn', el).onclick = () => shareRecipe(recName(r), cname(r.country), rc);
    $('#goEat', el).onclick = () => { state.tmode = 'near'; state.cuisine = r.country; state.trip = r.country; while (stack.length) back(); setTab('travel'); renderTravel(); };
  });
}

/* ---------- TRAVEL: location first, fast search, vector map, Gemini + Google Maps ---------- */
let map = null, mapKind = '', mapMarkers = [];
const LOC_TTL = 30 * 60e3, CACHE_TTL = 3 * 864e5;
function mapResize() { try { mapKind === 'gl' ? map.resize() : map && map.invalidateSize(); } catch (e) {} }
const gemKey = () => (store.get('gemKey', '') || '').trim();
const gemModel = () => (store.get('gemModel', '') || '').trim() || 'gemini-flash-latest';
function ago(ts) { const m = Math.round((Date.now() - ts) / 6e4); return m < 1 ? t('justNow') : m < 60 ? t('minAgo', { n: m }) : m < 1440 ? t('hrAgo', { n: Math.round(m / 60) }) : t('dayAgo', { n: Math.round(m / 1440) }); }

function renderTravel() {
  const near = state.tmode === 'near';
  const cc = near ? state.cuisine : state.trip, c = cc && byCode[cc];
  if (!state.coords) { const l = store.get('lastLoc', null); if (l && Date.now() - l.ts < 7 * 864e5) state.coords = { lat: l.lat, lon: l.lon }; }
  const hasLoc = !!state.coords || !!state.city.trim();
  const recent = store.get('recent', []);
  const src = gemKey() ? `<span class="src g">⭐ ${t('sourceGoogle')}</span>` : `<span class="src">🗺️ ${t('sourceOsm')}</span>`;
  $('#v-travel').innerHTML = `
    <div class="top"><div><div class="hi">✈️ World Bite</div><h1>${t('travelTitle')}</h1></div>${src}</div>
    <div class="seg mode" id="tSeg"><span class="knob"></span><button data-m="near">📍 ${t('nearMe')}</button><button data-m="trip">✈️ ${t('tripTo')}</button></div>
    ${near && !hasLoc && !state.cityMode ? `
      <div class="loc-card"><div class="loc-pulse"><span>📍</span></div><h2>${t('locTitle')}</h2><p>${t('locText')}</p>
        <button class="btn primary block" id="tLocBig">📍 ${t('locBtn')}</button><button class="link" id="tCityMode">${t('orCity')}</button></div>` : `
    ${near ? `<div class="trow">
        ${state.coords && !state.cityMode ? `<button class="loc-pill" id="tLocPill">📍 <b>${t('myLocation')}</b><small>${t('change')}</small></button>`
        : `<label class="search">${I.search}<input id="tCity" placeholder="${t('searchCity')}" value="${esc(state.city)}" autocomplete="off"></label>`}
        <button class="icon-btn" id="tLoc" title="${t('useLocation')}">${I.locate}</button></div>` : ''}
    <button class="select" id="tPick" style="margin-top:10px"><span>${c ? flag(c.code) + ' ' + esc(cname(c.code)) : (near ? '🍽️ ' + t('anyCuisine') : '🌍 ' + t('chooseCountry'))}</span><small>${near ? t('cuisine') : ''}</small>${I.chev}</button>
    <button class="btn primary block" id="tFind" style="margin-top:12px">${I.search.replace('<svg', '<svg width="20" height="20"')}${t('find')}</button>`}
    ${!gemKey() ? `<p class="hint small">💡 ${t('addKeyHint')}</p>` : ''}
    ${recent.length ? `<div class="chips recent" style="margin-top:12px">${recent.slice(0, 8).map((r, i) => `<button class="chip" data-rc="${i}">🕘 ${esc(r.label)}</button>`).join('')}</div>` : ''}
    <div id="tStatus"></div>
    <div class="map-wrap ${state.results.length ? '' : 'hide'}" id="mapWrap"><div id="map"></div>
      <div class="map-btns"><button class="round" id="mFull">⤢</button><button class="round" id="mMe">${I.locate}</button></div></div>
    <div id="tRes"></div>`;
  const seg = $('#tSeg');
  $$('button', seg).forEach(b => { b.classList.toggle('on', b.dataset.m === state.tmode); b.onclick = () => { state.tmode = b.dataset.m; state.results = []; renderTravel(); }; });
  const big = $('#tLocBig'); if (big) big.onclick = useLocation;
  const cm = $('#tCityMode'); if (cm) cm.onclick = () => { state.cityMode = true; renderTravel(); setTimeout(() => $('#tCity') && $('#tCity').focus(), 50); };
  const pill = $('#tLocPill'); if (pill) pill.onclick = () => { state.cityMode = true; renderTravel(); setTimeout(() => $('#tCity') && $('#tCity').focus(), 50); };
  const ci = $('#tCity');
  if (ci) {
    ci.oninput = () => { state.city = ci.value; store.set('city', state.city); };
    ci.onkeydown = e => { if (e.key === 'Enter') { ci.blur(); state.coords = null; findRestaurants(); } };
  }
  const loc = $('#tLoc'); if (loc) loc.onclick = () => { state.cityMode = false; useLocation(); };
  const pk = $('#tPick'); if (pk) pk.onclick = () => pickCountry(near, code => { near ? (state.cuisine = code) : (state.trip = code); state.results = []; renderTravel(); findRestaurants(); });
  const fd = $('#tFind'); if (fd) fd.onclick = () => { if (near && state.cityMode && state.city.trim()) state.coords = null; findRestaurants(); };
  $$('[data-rc]').forEach(b => b.onclick = () => { const r = recent[+b.dataset.rc]; const hit = store.get('rc:' + r.key, null); if (hit) { state.results = hit.list; state.resLabel = r.label; state.center = hit.center; state.src = hit.src; renderTravel(); setStatus(`🕘 ${esc(r.label)} · ${t('cachedAgo', { t: ago(hit.ts) })}`); } });
  $('#mFull').onclick = () => { $('#mapWrap').classList.toggle('full'); setTimeout(mapResize, 320); };
  $('#mMe').onclick = () => { const p = state.center; if (!p || !map) return; mapKind === 'gl' ? map.flyTo({ center: [p.lon, p.lat], zoom: 14 }) : map.setView([p.lat, p.lon], 14); };
  map = null;
  if (state.results.length) drawResults(state.results, state.resLabel, state.center);
  // location first: if we already have a recent location and nothing on screen, search right away
  if (near && state.coords && !state.results.length && !state.autoSearched) { state.autoSearched = true; findRestaurants(); }
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
  const ok = p => {
    state.coords = { lat: p.coords.latitude, lon: p.coords.longitude }; state.cityMode = false;
    store.set('lastLoc', { lat: state.coords.lat, lon: state.coords.lon, ts: Date.now() });
    state.results = []; state.autoSearched = true; renderTravel(); findRestaurants();
  };
  // fast coarse fix first (cached up to 10 min), precise only if needed
  navigator.geolocation.getCurrentPosition(ok, () => navigator.geolocation.getCurrentPosition(ok, () => { setStatus(''); toast(t('locErr')); state.cityMode = true; renderTravel(); }, { enableHighAccuracy: true, timeout: 15000 }), { enableHighAccuracy: false, timeout: 6000, maximumAge: 600000 });
}

/* fastest-wins helpers */
function raceFetch(urls, opts, parse, ms = 12000) {
  const ctrls = urls.map(() => new AbortController());
  const timer = setTimeout(() => ctrls.forEach(c => c.abort()), ms);
  return Promise.any(urls.map((u, i) => fetch(u, Object.assign({ signal: ctrls[i].signal }, opts)).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(parse).then(v => { ctrls.forEach((c, j) => j !== i && c.abort()); return v; })))
    .finally(() => clearTimeout(timer));
}
async function geocode(q, cc) {
  const key = 'geo:' + (cc || '') + ':' + norm(q), hit = store.get(key, null);
  if (hit) return hit;
  const res = await raceFetch([
    `https://photon.komoot.io/api/?limit=1&q=${encodeURIComponent(q + (cc ? ' ' + cname(cc) : ''))}`,
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=${lang}${cc ? '&countrycodes=' + cc.toLowerCase() : ''}&q=${encodeURIComponent(q)}`
  ], {}, j => {
    if (Array.isArray(j)) { if (!j.length) throw 0; return { lat: +j[0].lat, lon: +j[0].lon, name: j[0].display_name.split(',')[0] }; }
    const f = j.features && j.features[0]; if (!f) throw 0; return { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0], name: f.properties.name };
  }, 9000);
  store.set(key, res); return res;
}
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
function overpass(lat, lon, radius, cuisine) {
  const f = cuisine ? `["cuisine"~"${cuisine}",i]` : '';
  const q = `[out:json][timeout:12];(node["amenity"="restaurant"]["name"]${f}(around:${radius},${lat},${lon});way["amenity"="restaurant"]["name"]${f}(around:${radius},${lat},${lon}););out center tags qt 80;`;
  return raceFetch(OVERPASS, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }, j => j.elements, 14000);
}
function dist(a, b) { const R = 6371, dLa = (b.lat - a.lat) * Math.PI / 180, dLo = (b.lon - a.lon) * Math.PI / 180; const x = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); }
function toRest(el, center, localTag) {
  const g = el.tags || {}, lat = el.lat ?? (el.center && el.center.lat), lon = el.lon ?? (el.center && el.center.lon);
  let web = g.website || g['contact:website'] || g.url || '';
  if (web && !/^https?:\/\//i.test(web)) web = 'https://' + web;
  const cuisine = (g.cuisine || '').replace(/_/g, ' ').split(';').map(s => s.trim()).filter(Boolean);
  const local = !!localTag && (cuisine.some(x => x.includes(localTag.replace(/_/g, ' '))) || cuisine.some(x => /regional|local|traditional/.test(x)));
  const addr = [[g['addr:street'], g['addr:housenumber']].filter(Boolean).join(' '), g['addr:city']].filter(Boolean).join(', ');
  return { id: el.type[0] + el.id, name: g.name, lat, lon, cuisine, web, phone: g.phone || g['contact:phone'] || '', hours: g.opening_hours || '', addr, local, km: center ? dist(center, { lat, lon }) : 0, src: 'osm' };
}

/* Gemini + Grounding with Google Maps: top-rated places with ratings, reviews, price */
const LANG_NAME = { tr: 'Turkish', az: 'Azerbaijani', en: 'English', ru: 'Russian' };
async function gemini(body, ms = 30000) {
  const ctrl = new AbortController(), tm = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(gemModel())}:generateContent`, { method: 'POST', signal: ctrl.signal, headers: { 'Content-Type': 'application/json', 'x-goog-api-key': gemKey() }, body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok) throw new Error((j.error && j.error.message) || r.status);
    return j;
  } finally { clearTimeout(tm); }
}
const gemText = j => ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || []).map(p => p.text || '').join('');
function gemJSON(txt) { const m = txt.match(/```(?:json)?\s*([\s\S]*?)```/); const s = (m ? m[1] : txt).trim(); const a = s.indexOf('['), o = s.indexOf('{'); const start = a >= 0 && (o < 0 || a < o) ? a : o; const end = Math.max(s.lastIndexOf(']'), s.lastIndexOf('}')); return JSON.parse(s.slice(start, end + 1)); }
async function geminiPlaces(center, cuisineName, placeLabel) {
  const what = cuisineName ? `restaurants serving ${cuisineName} cuisine` : 'restaurants with great local/traditional food';
  const where = center ? 'near my current location' : `in ${placeLabel}`;
  const prompt = `Using Google Maps, find the 10 best-rated ${what} ${where}. Reply ONLY with a JSON array (no prose, no markdown). Each item: {"name":string,"rating":number|null,"reviews":number|null,"price":string|null,"address":string,"lat":number,"lng":number,"website":string|null,"phone":string|null,"open_now":boolean|null,"summary":string}. "summary" = one short sentence in ${LANG_NAME[lang]} about why it is good. Sort by rating, highest first.`;
  const body = { contents: [{ role: 'user', parts: [{ text: prompt }] }], tools: [{ googleMaps: {} }] };
  if (center) body.toolConfig = { retrievalConfig: { latLng: { latitude: center.lat, longitude: center.lon }, languageCode: lang } };
  const j = await gemini(body);
  const arr = gemJSON(gemText(j));
  const chunks = ((j.candidates[0].groundingMetadata || {}).groundingChunks || []).map(c => c.maps).filter(Boolean);
  return arr.filter(x => x && x.name).map((x, i) => {
    const ch = chunks.find(c => c.title && (norm(c.title).includes(norm(x.name)) || norm(x.name).includes(norm(c.title))));
    let web = x.website || ''; if (web && !/^https?:\/\//i.test(web)) web = 'https://' + web;
    const lat = +x.lat || null, lon = +x.lng || +x.lon || null;
    return { id: 'g' + hash(x.name + (x.address || '')), name: x.name, lat, lon, cuisine: cuisineName ? [cuisineName] : [], web, phone: x.phone || '', hours: '', addr: x.address || '', rating: x.rating, reviews: x.reviews, price: x.price, open: x.open_now, summary: x.summary || '', maps: ch ? ch.uri : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(x.name + ' ' + (x.address || ''))}`, local: true, km: center && lat ? dist(center, { lat, lon }) : 0, src: 'google' };
  });
}

async function findRestaurants(all) {
  const near = state.tmode === 'near';
  const cc = near ? state.cuisine : state.trip, c = cc && byCode[cc];
  if (!near && !c) return pickCountry(false, code => { state.trip = code; renderTravel(); findRestaurants(); });
  if (near && !state.coords && !state.city.trim()) { useLocation(); return; }
  const useG = !!gemKey() && !all;
  setStatus(`<span class="spinner"></span>${useG ? t('searchingG') : t('searching')}`);
  $('#tRes').innerHTML = Array.from({ length: 4 }, () => `<div class="rest skel"><div class="ico"></div><div class="b"><div class="sk"></div><div class="sk" style="width:60%"></div></div></div>`).join('');
  try {
    let center, label;
    if (near) {
      if (state.coords && !state.cityMode) { center = state.coords; label = t('myLocation'); }
      else { center = await geocode(state.city); label = center.name || state.city; }
    } else { center = await geocode(c.city, c.code); label = c.city; }
    const tag = near ? (!all && c ? c.cuisine : '') : '';
    const key = [useG ? 'g' : 'o', state.tmode, center.lat.toFixed(2), center.lon.toFixed(2), near ? (all ? '*' : cc || '*') : cc].join(':');
    const fullLabel = (c ? flag(c.code) + ' ' + (near ? cname(c.code) + ' · ' : '') : '') + label;
    const cached = store.get('rc:' + key, null);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      state.results = cached.list; state.resLabel = fullLabel; state.center = center; state.src = cached.src;
      drawResults(cached.list, fullLabel, center, cached.ts);
      if (Date.now() - cached.ts < 6 * 3600e3) return; // fresh enough: instant, no network
    }
    let list = [], src = 'osm';
    if (useG) {
      try { list = await geminiPlaces(center, c && near ? cuisineEn(c) : '', near ? (state.cityMode ? state.city : '') : `${c.city}, ${cname(c.code)}`); src = 'google'; }
      catch (e) { toast(t('gemFallback')); }
    }
    if (!list.length) {
      const els = near ? await overpass(center.lat, center.lon, tag ? 15000 : 2500, tag) : await overpass(center.lat, center.lon, 4000, '');
      list = els.map(e => toRest(e, center, near ? '' : c.cuisine)).filter(r => r.name && r.lat);
      list.sort((a, b) => (b.local * 4 + !!b.web * 2 + !!b.hours + !!b.phone) - (a.local * 4 + !!a.web * 2 + !!a.hours + !!a.phone) || a.km - b.km);
      list = list.slice(0, 50); src = 'osm';
    }
    state.results = list; state.resLabel = fullLabel; state.center = center; state.src = src;
    if (!list.length) {
      setStatus('');
      $('#mapWrap').classList.add('hide');
      $('#tRes').innerHTML = `<div class="empty"><span class="e">🍽️</span>${t('none')}<br><br>${near && c && !all ? `<button class="btn ghost" id="tAll">${t('showAll')}</button>` : ''}</div>`;
      const a = $('#tAll'); if (a) a.onclick = () => findRestaurants(true);
      return;
    }
    // everything found stays on the phone: cache + recent searches
    store.set('rc:' + key, { ts: Date.now(), list, center, src });
    const rec = store.get('recent', []).filter(r => r.key !== key); rec.unshift({ key, label: fullLabel.replace(/^\S+\s/, (m) => m), ts: Date.now() }); store.set('recent', rec.slice(0, 12));
    drawResults(list, fullLabel, center);
  } catch (e) {
    if (state.results.length) return;
    setStatus(''); $('#tRes').innerHTML = `<div class="empty"><span class="e">📡</span>${t('netErr')}</div>`;
  }
}
function drawResults(list, label, center, cachedTs) {
  const g = list[0] && list[0].src === 'google';
  setStatus(`✅ ${t('found', { n: list.length })} · ${esc(label)}${cachedTs ? ` · <i>${t('cachedAgo', { t: ago(cachedTs) })}</i>` : ''}<span style="margin-left:auto;font-size:11px">${g ? 'Google Maps' : t('dataOsm')}</span>`);
  $('#mapWrap').classList.remove('hide');
  $('#tRes').innerHTML = list.map((r, i) => restRow(r, i)).join('') + (g ? '' : `<p class="note" style="text-align:center;margin-top:12px">⭐ ${t('ratingSoon')}</p>`);
  $('#tRes').onclick = e => {
    const h = e.target.closest('[data-rfav]');
    if (h) { const r = list.find(x => x.id === h.dataset.rfav); const on = toggleFav('rests', r.id, r); h.classList.toggle('on', on); return; }
    const b = e.target.closest('[data-rest]'); if (b) { const r = list.find(x => x.id === b.dataset.rest); focusRest(r); openRest(r); }
  };
  setTimeout(() => buildMap(list, center), 30);
}
function focusRest(r) { if (!map || !r.lat) return; mapKind === 'gl' ? map.flyTo({ center: [r.lon, r.lat], zoom: 16 }) : map.setView([r.lat, r.lon], 16); }
function pinEl(r, i) { const d = document.createElement('div'); d.className = 'wb-pin2' + (r && r.src === 'google' ? ' g' : ''); d.innerHTML = r ? `<span>${r.rating ? '★' + r.rating : (i + 1)}</span>` : '<span class="me"></span>'; if (!r) d.className = 'wb-me'; return d; }
function buildMap(list, center) {
  const box = $('#map'); if (!box) return;
  const pts = list.filter(r => r.lat && r.lon);
  const webgl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
  if (window.maplibregl && webgl && !state.forceLeaflet) {
    try {
      mapKind = 'gl';
      map = new maplibregl.Map({ container: box, style: 'https://tiles.openfreemap.org/styles/liberty', center: [center.lon, center.lat], zoom: 13, attributionControl: { compact: true }, pitchWithRotate: false, dragRotate: false, fadeDuration: 0 });
      let loaded = false;
      const fb = setTimeout(() => { if (!loaded) { state.forceLeaflet = true; try { map.remove(); } catch (e) {} buildMap(list, center); } }, 9000);
      map.on('load', () => { loaded = true; clearTimeout(fb); });
      new maplibregl.Marker({ element: pinEl(null) }).setLngLat([center.lon, center.lat]).addTo(map);
      pts.forEach((r, i) => { const m = new maplibregl.Marker({ element: pinEl(r, i) }).setLngLat([r.lon, r.lat]).addTo(map); m.getElement().addEventListener('click', e => { e.stopPropagation(); openRest(r); }); });
      if (pts.length) { const b = new maplibregl.LngLatBounds([center.lon, center.lat], [center.lon, center.lat]); pts.forEach(r => b.extend([r.lon, r.lat])); map.fitBounds(b, { padding: 40, maxZoom: 15, duration: 0 }); }
      return;
    } catch (e) { state.forceLeaflet = true; }
  }
  if (typeof L === 'undefined') return;
  mapKind = 'leaflet';
  map = L.map(box, { zoomControl: false });
  L.tileLayer(`https://{s}.basemaps.cartocdn.com/${store.get('dark', false) ? 'dark_all' : 'rastertiles/voyager'}/{z}/{x}/{y}{r}.png`, { maxZoom: 19, subdomains: 'abcd', attribution: '© OpenStreetMap © CARTO' }).addTo(map);
  const ll = [[center.lat, center.lon]];
  L.marker([center.lat, center.lon], { icon: L.divIcon({ className: '', html: pinEl(null).outerHTML, iconSize: [18, 18] }) }).addTo(map);
  pts.forEach((r, i) => { ll.push([r.lat, r.lon]); L.marker([r.lat, r.lon], { icon: L.divIcon({ className: '', html: pinEl(r, i).outerHTML, iconSize: [34, 26], iconAnchor: [17, 26] }) }).on('click', () => openRest(r)).addTo(map); });
  map.invalidateSize(); map.fitBounds(ll, { padding: [30, 30], maxZoom: 15 });
}
function stars(r) { return r.rating ? `<span class="stars">★ ${(+r.rating).toFixed(1)}${r.reviews ? ` <small>(${fmtN(+r.reviews)})</small>` : ''}</span>` : ''; }
function restRow(r, i) {
  return `<div class="rest" data-rest="${r.id}" style="animation-delay:${Math.min(i, 10) * 0.03}s"><div class="ico">${r.src === 'google' ? (i + 1) : (r.local ? '⭐' : '🍽️')}</div>
    <div class="b"><h3>${esc(r.name)}</h3><small>${stars(r)}${r.price ? ' · ' + esc(r.price) : ''}${r.km ? ' · ' + r.km.toFixed(1) + ' km' : ''}${!r.rating ? ' ' + esc(r.cuisine.join(', ') || r.addr || '') : ''}</small>
    ${r.summary ? `<small class="sum">${esc(r.summary)}</small>` : ''}
    <div class="tags">${r.open === true ? `<span class="ok">${t('openNow')}</span>` : r.open === false ? `<span class="no">${t('closed')}</span>` : ''}${r.local && r.src !== 'google' ? `<span>${t('localFood')}</span>` : ''}${r.web ? `<span>🌐 ${t('hasSite')}</span>` : ''}${r.hours ? '<span>🕒</span>' : ''}${r.phone ? '<span>📞</span>' : ''}</div></div>
    <button class="heart ${isFav('rests', r.id) ? 'on' : ''}" data-rfav="${r.id}">${I.heart}</button></div>`;
}
function openRest(r) {
  const dir = r.lat ? `https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lon}` : r.maps;
  openSheet(`<h2>${esc(r.name)}</h2><p class="sub">${stars(r)} ${esc(r.cuisine.join(' · ') || '')}${r.price ? ' · ' + esc(r.price) : ''}${r.km ? ' · ' + r.km.toFixed(1) + ' km' : ''}</p>
    ${r.summary ? `<p class="rsum">${esc(r.summary)}</p>` : ''}
    ${r.addr ? `<div class="kv"><span class="k">📍</span><div><small>${t('addr')}</small>${esc(r.addr)}</div></div>` : ''}
    ${r.hours ? `<div class="kv"><span class="k">🕒</span><div><small>${t('hours')}</small>${esc(r.hours)}</div></div>` : ''}
    ${r.phone ? `<div class="kv"><span class="k">📞</span><div><small>${t('call')}</small>${esc(r.phone)}</div></div>` : ''}
    ${r.web ? `<div class="kv"><span class="k">🌐</span><div><small>Web</small>${esc(r.web.replace(/^https?:\/\//, ''))}</div></div>` : `<p class="note" style="margin-top:12px">${t('noSite')}</p>`}
    ${r.lat ? '<div class="mini-map" id="rMap"></div>' : ''}
    <div class="btn-row">
      ${r.web ? `<a class="btn primary" href="${esc(r.web)}" target="_blank" rel="noopener">🌐 ${t('website')}</a>` : ''}
      <a class="btn ${r.web ? 'ghost' : 'primary'}" href="${esc(dir)}" target="_blank" rel="noopener">🧭 ${t('directions')}</a>
    </div>
    <div class="btn-row">${r.maps ? `<a class="btn line" href="${esc(r.maps)}" target="_blank" rel="noopener">🗺️ ${t('openMaps')}</a>` : ''}${r.phone ? `<a class="btn line" href="tel:${esc(r.phone.split(';')[0].replace(/\s/g, ''))}">📞 ${t('call')}</a>` : ''}
      <button class="btn line" id="rFav">${isFav('rests', r.id) ? '❤️' : '🤍'} ${t('myList')}</button></div>
    ${r.src === 'google' ? `<p class="note" style="margin-top:10px">${t('srcNote')}</p>` : ''}`, s => {
    $('#rFav', s).onclick = () => { const on = toggleFav('rests', r.id, r); $('#rFav', s).innerHTML = `${on ? '❤️' : '🤍'} ${t('myList')}`; const h = $(`[data-rfav="${r.id}"]`); if (h) h.classList.toggle('on', on); if (state.tab === 'list') renderList(); };
    if (!r.lat) return;
    setTimeout(() => {
      const box = $('#rMap', s); if (!box) return;
      const webgl = (() => { try { return !!document.createElement('canvas').getContext('webgl'); } catch (e) { return false; } })();
      if (window.maplibregl && webgl && !state.forceLeaflet) {
        const m = new maplibregl.Map({ container: box, style: 'https://tiles.openfreemap.org/styles/liberty', center: [r.lon, r.lat], zoom: 15.5, attributionControl: false, interactive: true, dragRotate: false });
        new maplibregl.Marker({ element: pinEl(r, 0) }).setLngLat([r.lon, r.lat]).addTo(m);
        setTimeout(() => m.resize(), 400);
      } else if (typeof L !== 'undefined') {
        const m = L.map(box, { zoomControl: false, attributionControl: false }).setView([r.lat, r.lon], 16);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { subdomains: 'abcd' }).addTo(m);
        L.marker([r.lat, r.lon], { icon: L.divIcon({ className: '', html: pinEl(r, 0).outerHTML, iconSize: [34, 26] }) }).addTo(m);
        setTimeout(() => m.invalidateSize(), 400);
      }
    }, 80);
  });
}

function cuisineEn(c) { let n = c.code; try { n = new Intl.DisplayNames(['en'], { type: 'region' }).of(c.code); } catch (e) {} return `${n} (national dishes such as ${c.wiki.replace(/ \(.*\)$/, '')})`; }
/* ---------- PANTRY: "what I have" → what can I cook ---------- */
const STAPLES = /^(tuz|karabiber|su|ılık su|soğuk su|sıcak su|yağ|sıvı yağ|zeytinyağı|tereyağı|ayçiçek yağı|kızartmak için yağ|baharat|maya|kuru maya|kabartma tozu|karbonat|şeker|toz şeker|pul biber|kimyon|kekik|tarçın|vanilya|defne|defne yaprağı|limon|salt|pepper|water|oil|butter|sugar)$/;
function needParts(lines) {
  const out = [];
  lines.filter(l => !/^servis/i.test(l.trim())).forEach(l => l.split(/,(?!\d)|;/).forEach(p => {
    const core = shortIng(p).toLocaleLowerCase('tr').replace(/\s*(veya|ya da|isteğe bağlı).*$/, '').trim();
    if (core && !STAPLES.test(core) && !/isteğe bağlı/.test(p)) out.push(p.trim());
  }));
  return out;
}
const QUICK_ADD = { tr: ['yumurta', 'un', 'süt', 'domates', 'soğan', 'patates', 'tavuk', 'kıyma', 'pirinç', 'peynir', 'makarna', 'yoğurt', 'biber', 'tereyağı', 'sarımsak', 'ekmek', 'havuç', 'patlıcan', 'limon', 'şeker'],
  en: ['egg', 'flour', 'milk', 'tomato', 'onion', 'potato', 'chicken', 'minced meat', 'rice', 'cheese', 'pasta', 'yogurt', 'pepper', 'butter', 'garlic', 'bread', 'carrot', 'eggplant', 'lemon', 'sugar'] };
const EN2TR = { egg: 'yumurta', eggs: 'yumurta', flour: 'un', milk: 'süt', tomato: 'domates', tomatoes: 'domates', onion: 'soğan', potato: 'patates', potatoes: 'patates', chicken: 'tavuk', 'minced meat': 'kıyma', beef: 'dana', rice: 'pirinç', cheese: 'peynir', pasta: 'makarna', noodles: 'erişte', yogurt: 'yoğurt', pepper: 'biber', butter: 'tereyağı', garlic: 'sarımsak', bread: 'ekmek', carrot: 'havuç', eggplant: 'patlıcan', lemon: 'limon', sugar: 'şeker', fish: 'balık', lamb: 'kuzu', beans: 'fasulye', corn: 'mısır', banana: 'muz', honey: 'bal', chocolate: 'çikolata', cream: 'krema', spinach: 'ıspanak', cabbage: 'lahana' };
const pantry = () => store.get('pantry', []);
let pantryFilter = store.get('pantryFilter', { quick: false, easy: false, light: false });
let pantryResults = null;

function allRecipes() {
  const out = COUNTRIES.map(c => { const rc = sigOf(c.code); return { kind: 'c', id: c.code, name: dishName(c), emoji: c.emoji, wiki: c.wiki, country: c.code, ing: rc.ing, t: rc.t, d: rc.d, s: rc.s }; });
  RECIPES.forEach(r => out.push({ kind: 'r', id: r.id, name: recName(r), emoji: r.e, wiki: r.wiki, country: r.country, ing: r.ing.tr, t: r.t, d: r.d, s: r.s }));
  return out;
}
const stemOf = w => { w = norm(EN2TR[norm(w)] || w); return w.length <= 3 ? w : w.slice(0, Math.max(4, w.length - 2)); };
function matchRecipes(items) {
  const stems = pantryStems(items), prefs = store.get('diet', []);
  if (!stems.length) return [];
  return allRecipes().map(r => {
    const need = needParts(r.ing);
    if (!need.length) return null;
    const have = need.filter(l => stems.some(s => norm(l).includes(s)));
    const score = have.length / need.length;
    const n = estimateNutrition(r.ing, r.s, r.kind + r.id), dt = dietTags(r.ing, 'd' + r.kind + r.id);
    if (prefs.some(k => !dt[k])) return null;
    return { r, dt, score, have: have.length, need: need.length, missing: need.filter(l => !have.includes(l)).map(shortIng), n };
  }).filter(x => x && x.have > 0)
    .filter(x => (!pantryFilter.quick || x.r.t <= 30) && (!pantryFilter.easy || x.r.d === 'easy') && (!pantryFilter.light || x.n.kcal <= 500))
    .sort((a, b) => b.score - a.score || b.have - a.have || a.r.t - b.r.t).slice(0, 20);
}
function shortIng(l) { return l.replace(/^[^:]{0,22}:\s*/, '').replace(/\(.*?\)/g, '').replace(/^[\d½¼¾⅓⅔.,\-–\s]+(kg|g|gr|ml|litre|l|su bardağı|yemek kaşığı|tatlı kaşığı|çay kaşığı|paket|demet|diş|baş|dilim|kutu|tutam|avuç|adet|kase)?(?=\s|$)\s*/i, '').trim().slice(0, 28); }

let pickCat = 'veg';
const ingLabel = x => { if (x[0] === '#') { const it = ING_BY_ID[x.slice(1)]; return it ? (it.name[lang] || it.name.tr) : x; } return x; };
const ingIcon = x => { if (x[0] === '#') { const it = ING_BY_ID[x.slice(1)]; return it ? it.emoji : '🥄'; } const i = ingInfo(x); return i ? i.emoji : ingEmoji(x); };
function renderPantry() {
  const items = pantry(), ai = store.get('aiRecipes', []);
  $('#v-pantry').innerHTML = `
    <div class="top"><div><div class="hi">🧺 World Bite</div><h1>${t('pantryTitle')}</h1></div></div>
    <p class="hint">${t('pantryHint')}</p>
    <div class="trow"><label class="search">${I.search}<input id="pIn" placeholder="${t('addIng')}" autocomplete="off"></label><button class="icon-btn" id="pAdd">＋</button></div>
    <button class="btn ghost block fridge-btn" id="pFridge">📸 ${t('fridgeTitle')}</button>
    <div class="picker" id="pPick"></div>
    <div class="basket" id="pBasket"><div class="b-head"><span class="b-ic" id="pBasketIc">🧺</span><b>${t('basket')}</b><small>${items.length}</small>${items.length ? `<button class="link sm" id="pClear">${t('clearAll')}</button>` : ''}</div>
      <div class="p-chips" id="pChips"></div></div>
    <div class="chips" style="margin-top:12px">
      <button class="chip ${pantryFilter.quick ? 'on' : ''}" data-pf="quick">⚡ ${t('quick')}</button>
      <button class="chip ${pantryFilter.easy ? 'on' : ''}" data-pf="easy">🙂 ${t('easyF')}</button>
      <button class="chip ${pantryFilter.light ? 'on' : ''}" data-pf="light">🥗 ${t('light')}</button>
      ${DIETS.map(k => `<button class="chip ${store.get('diet', []).includes(k) ? 'on' : ''}" data-pd="${k}">${DIET_ICON[k]} ${t('diet_' + k)}</button>`).join('')}</div>
    <div class="btn-row"><button class="btn primary" id="pFind" ${items.length ? '' : 'disabled'}>🔍 ${t('whatCook')}</button>
      <button class="btn ghost" id="pAI" ${items.length ? '' : 'disabled'}>✨ ${t('aiCook')}</button></div>
    ${!gemKey() ? `<p class="hint small">💡 ${t('aiNeedKey')}</p>` : ''}
    <div id="pRes"></div>
    ${ai.length ? `<div class="sec"><h2>✨ ${t('recentAi')}</h2><small>${ai.length}</small></div><div id="pAiList">${ai.map((r, i) => aiRow(r, i)).join('')}</div>` : ''}`;
  drawChipsP(); drawPicker('');
  $('#pFridge').onclick = fridgePhoto;
  const input = $('#pIn');
  input.oninput = () => drawPicker(input.value);
  input.onkeydown = e => { if (e.key === 'Enter') { const q = input.value.trim(); if (!q) return; const hit = searchIng(q)[0]; addPantry(hit && norm(hit.name[lang] || hit.name.tr) === norm(q) ? '#' + hit.id : q, null); input.value = ''; drawPicker(''); } };
  $('#pAdd').onclick = () => { const q = input.value.trim(); if (q) { addPantry(q, null); input.value = ''; drawPicker(''); } else input.focus(); };
  const cl = $('#pClear'); if (cl) cl.onclick = () => { store.set('pantry', []); pantryResults = null; renderPantry(); };
  $$('[data-pf]').forEach(b => b.onclick = () => { pantryFilter[b.dataset.pf] = !pantryFilter[b.dataset.pf]; store.set('pantryFilter', pantryFilter); if (pantryResults) pantryResults = matchRecipes(pantry()); renderPantry(); });
  $$('[data-pd]').forEach(b => b.onclick = () => { toggleDiet(b.dataset.pd); if (pantryResults) pantryResults = matchRecipes(pantry()); renderPantry(); });
  $('#pFind').onclick = () => { pantryResults = matchRecipes(pantry()); renderPantry(); setTimeout(() => $('#pRes') && $('#pRes').scrollIntoView({ behavior: 'smooth', block: 'start' }), 60); };
  $('#pAI').onclick = () => gemKey() ? aiRecipe() : (setTab('settings'), toast(t('aiNeedKey')));
  $$('[data-ai]').forEach(b => b.onclick = e => { if (e.target.closest('[data-airm]')) { const a = store.get('aiRecipes', []); a.splice(+e.target.closest('[data-airm]').dataset.airm, 1); store.set('aiRecipes', a); renderPantry(); return; } openAiRecipe(store.get('aiRecipes', [])[+b.dataset.ai]); });
  if (pantryResults) {
    $('#pRes').innerHTML = pantryResults.length ? `<div class="sec"><h2>🍳 ${t('canCook')}</h2><small>${pantryResults.length}</small></div>` + pantryResults.map((x, i) => `
      <div class="match" role="button" data-open="${x.r.kind}:${x.r.id}" style="animation-delay:${i * 0.03}s">${photo(x.r.id, x.r.wiki, x.r.emoji)}
        <div class="b"><small>${flag(x.r.country)} ${esc(cname(x.r.country))} ${DIETS.filter(k => x.dt[k]).map(k => DIET_ICON[k]).join('')}</small><h3>${esc(x.r.name)}</h3>
          <div class="mbar"><i style="width:${Math.round(x.score * 100)}%"></i></div>
          <small><b>${t('match', { p: Math.round(x.score * 100) })}</b> · ⏱ ${fmtTime(x.r.t)} · 🔥 ${x.n.kcal} kcal</small>
          ${x.missing.length ? `<small class="miss">${t('missing')}: ${esc(x.missing.slice(0, 4).join(', '))}${x.missing.length > 4 ? '…' : ''}</small>` : `<small class="okk">✓ ${t('haveAll')}</small>`}</div>
        ${x.missing.length ? `<button class="mshop" data-shopi="${i}" aria-label="shop">🛒</button>` : ''}</div>`).join('')
      : `<div class="empty"><span class="e">🤔</span>${t('noMatch')}</div>`;
    hydrate($('#pRes'));
    $$('[data-shopi]', $('#pRes')).forEach(b => b.addEventListener('click', e => { e.stopPropagation(); const x = pantryResults[+b.dataset.shopi]; const n = addToShop(x.r.ing, x.r.name); toast(n ? t('shopAdded', { n }) : t('shopNone')); b.classList.add('done'); }, true));
  }
}
function searchIng(q) {
  const nq = norm(q); if (!nq) return [];
  return INGREDIENTS.map(it => { const names = [it.name[lang], it.name.tr, it.name.en, it.name.az, it.name.ru, ...it.words].map(norm); const st = names.some(n => n.startsWith(nq)) ? 2 : names.some(n => n.includes(nq)) ? 1 : 0; return { it, st }; })
    .filter(x => x.st).sort((a, b) => b.st - a.st).map(x => x.it).slice(0, 18);
}
function drawPicker(q) {
  const box = $('#pPick'); if (!box) return;
  const have = new Set(pantry());
  const tile = it => `<button class="ptile ${have.has('#' + it.id) ? 'in' : ''}" data-ing="${it.id}">${photo('ing-' + it.id, it.wiki, it.emoji)}<b>${esc(it.name[lang] || it.name.tr)}</b></button>`;
  if (q.trim()) {
    const res = searchIng(q);
    box.innerHTML = `<div class="ptiles">${res.map(tile).join('')}<button class="ptile free" data-free="1"><div class="ph"><span class="em">＋</span></div><b>${esc(t('addFree', { q: q.trim() }))}</b></button></div>`;
  } else {
    box.innerHTML = `<div class="chips pcats">${ING_CATS.map(c => `<button class="chip ${pickCat === c ? 'on' : ''}" data-pc="${c}">${ING_CAT_ICON[c]} ${t('cat_' + c)}</button>`).join('')}</div>
      <div class="ptiles">${INGREDIENTS.filter(i => i.cat === pickCat).map(tile).join('')}</div>`;
    $$('[data-pc]', box).forEach(b => b.onclick = () => { pickCat = b.dataset.pc; drawPicker(''); });
  }
  hydrate(box);
  $$('[data-ing]', box).forEach(b => b.onclick = () => { const id = '#' + b.dataset.ing; if (pantry().includes(id)) { removePantry(id); b.classList.remove('in'); } else { addPantry(id, b); b.classList.add('in'); } });
  const fr = $('[data-free]', box); if (fr) fr.onclick = () => { addPantry(q.trim(), fr); $('#pIn').value = ''; drawPicker(''); };
}
function flyToBasket(from, icon) {
  const to = $('#pBasketIc'); if (!from || !to) return;
  const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
  const f = document.createElement('div'); f.className = 'fly-ing'; f.textContent = icon; document.body.appendChild(f);
  f.animate([{ transform: `translate(${a.left + a.width / 2 - 16}px,${a.top + a.height / 2 - 16}px) scale(1.4)` }, { transform: `translate(${(a.left + b.left) / 2}px,${Math.min(a.top, b.top) - 60}px) scale(1.2)`, offset: .5 }, { transform: `translate(${b.left + b.width / 2 - 16}px,${b.top + b.height / 2 - 16}px) scale(.5)`, opacity: .4 }], { duration: 650, easing: 'cubic-bezier(.3,.7,.4,1)' }).onfinish = () => { f.remove(); to.classList.remove('bump'); void to.offsetWidth; to.classList.add('bump'); };
}
function addPantry(x, fromEl) {
  const p = pantry(); if (!x || p.includes(x)) return;
  p.push(x); store.set('pantry', p); pantryResults = null;
  flyToBasket(fromEl, ingIcon(x)); setTimeout(drawChipsP, fromEl ? 600 : 0);
  ['pFind', 'pAI'].forEach(id => { const b = $('#' + id); if (b) b.disabled = false; });
}
function removePantry(x) { const p = pantry().filter(y => y !== x); store.set('pantry', p); pantryResults = null; drawChipsP(); }
function drawChipsP() {
  const box = $('#pChips'); if (!box) return; const items = pantry();
  box.innerHTML = items.map((x, i) => `<span class="p-chip">${ingIcon(x)} ${esc(ingLabel(x))}<button data-rm="${i}">×</button></span>`).join('') || `<span class="note">${t('pantryEmpty')}</span>`;
  const cnt = $('#pBasket small'); if (cnt) cnt.textContent = items.length;
  $$('[data-rm]', box).forEach(b => b.onclick = () => { removePantry(pantry()[+b.dataset.rm]); drawPicker($('#pIn') ? $('#pIn').value : ''); });
}
function toggleDiet(k) { const d = store.get('diet', []); const i = d.indexOf(k); i < 0 ? d.push(k) : d.splice(i, 1); store.set('diet', d); }
function aiRow(r, i) { return `<div class="saved-item" role="button" data-ai="${i}"><div class="ph" style="border-radius:14px"><span class="em">${r.emoji || '🍽️'}</span></div><div class="b"><h3>${esc(r.name)}</h3><small>⏱ ${r.time_min || '?'} ${t('min')} · 🔥 ${r.kcal_per_serving || '?'} kcal · ${esc((r.have || []).slice(0, 3).join(', '))}</small></div><button class="rm" data-airm="${i}">${I.trash}</button></div>`; }
async function aiRecipe() {
  const items = pantry();
  $('#pRes').innerHTML = `<div class="ai-wait"><div class="ai-orb">✨</div><p>${t('aiWorking')}</p></div>`;
  $('#pRes').scrollIntoView({ behavior: 'smooth', block: 'start' });
  const prompt = `I have these ingredients: ${items.map(ingLabel).join(', ')}.${store.get('diet', []).length ? ' Diet requirements: ' + store.get('diet', []).map(k => I18N.en['diet_' + k]).join(', ') + '.' : ''} Suggest ONE quick, tasty, realistic home recipe that uses mainly these (basic pantry items like salt, pepper, oil, water and common spices are allowed; avoid other extras or mark them optional).${pantryFilter.quick ? ' It must take at most 30 minutes.' : ''}${pantryFilter.light ? ' Keep it under 500 kcal per serving.' : ''}
Write everything in ${LANG_NAME[lang]}. Reply ONLY with JSON: {"name":string,"emoji":string,"cuisine":string,"time_min":number,"servings":number,"difficulty":"easy"|"medium"|"hard","ingredients":[string with amount],"steps":[string],"kcal_per_serving":number,"protein_g":number,"carbs_g":number,"fat_g":number,"fiber_g":number,"tip":string,"serving":string}.
Each step = one clear action starting with the verb (e.g. crack, whisk, chop, fry, boil, bake, rest, garnish, serve), include the time (e.g. "5 min") and the expected consistency/look. Last step = how to plate and serve it.`;
  try {
    const j = await gemini({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } }, 45000);
    const r = gemJSON(gemText(j)); r.have = items.map(ingLabel); r.ts = Date.now();
    const a = store.get('aiRecipes', []); a.unshift(r); store.set('aiRecipes', a.slice(0, 20));
    renderPantry(); openAiRecipe(r);
  } catch (e) { $('#pRes').innerHTML = `<div class="empty"><span class="e">⚠️</span>${t('aiErr')}<br><small>${esc(String(e.message || e).slice(0, 140))}</small></div>`; }
}
function openAiRecipe(r) {
  const rc = { t: r.time_min || 20, s: r.servings || 2, d: r.difficulty || 'easy', ing: r.ingredients || [], st: r.steps || [], tr: false, ai: true,
    n: { kcal: Math.round(r.kcal_per_serving || 0), protein: Math.round(r.protein_g || 0), carbs: Math.round(r.carbs_g || 0), fat: Math.round(r.fat_g || 0), fiber: r.fiber_g } };
  pushPage(`
    <div class="hero ai-hero"><div class="ph"><span class="em">${r.emoji || '🍽️'}</span></div>
      <div class="bar"><button class="round" data-back>${I.back}</button><span class="bar-r"><button class="round" id="shareBtn">${I.share}</button></span></div></div>
    <div class="dbody">
      <div class="country">✨ ${t('aiMade')} · ${esc(r.cuisine || '')}</div>
      <h1>${esc(r.name)}</h1>
      ${r.tip ? `<div class="block"><h3>💡 ${t('tip')}</h3><p>${esc(r.tip)}</p></div>` : ''}
      ${recipeHTML(rc)}
      ${r.serving ? `<div class="block"><h3>🍽️ ${t('serving')}</h3><p>${esc(r.serving)}</p></div>` : ''}
    </div>`, el => {
    bindRecipe(el, rc, r.name, { emoji: r.emoji || '🍽️', country: r.cuisine || '' });
    $('#shareBtn', el).onclick = () => shareRecipe(r.name, r.cuisine || 'World Bite', rc);
  });
}

/* ================= DINNER MENU: two dishes at once + drinks ================= */
let _planAll = null;
function planAll() {
  if (_planAll) return _planAll;
  const out = COUNTRIES.map(c => { const rc = sigOf(c.code); return { kind: 'c', id: c.code, name: dishName(c), emoji: c.emoji, wiki: c.wiki, country: c.code, cat: c.cat, ing: rc.ing, st: rc.st, stShow: rc.st, s: rc.s, key: 'c' + c.code }; });
  RECIPES.forEach(r => out.push({ kind: 'r', id: r.id, name: recName(r), emoji: r.e, wiki: r.wiki, country: r.country, cat: r.cat, ing: r.ing.tr, st: r.st.tr, stShow: r.st[cl()], s: r.s, key: 'r' + r.id }));
  (typeof SALADS !== 'undefined' ? SALADS : []).forEach(r => out.push({ kind: 'r', id: r.id, name: recName(r), emoji: r.e, wiki: r.wiki, country: r.country, cat: r.cat, ing: r.ing.tr, st: r.st.tr, stShow: r.st[cl()] || r.st.en, s: r.s, key: 'r' + r.id, t: r.t }));
  out.forEach(x => { x.plan = planSteps(x.st); x.tot = totalMinutes(x.plan); x.pas = passiveWindow(x.plan); x.act = x.tot - x.pas; x.oven = x.plan.some(p => p.oven); });
  return (_planAll = out);
}
const DRINK_WHY = { home: 'whyHome', red: 'whyRed', chicken: 'whyChicken', fish: 'whyFish', spicy: 'whySpicy', fried: 'whyFried', rice: 'whyRice', dessert: 'whyDessert', pastry: 'whyPastry', cheese: 'whyCheese', grill: 'whyGrill', curry: 'whySpicy', tortilla: 'whySpicy', breakfast: 'whyBreakfast', light: 'whyLight', rich: 'whyRich', meze: 'whyMeze', creamy: 'whyRich', tomato: 'whyRed', soup: 'whyRich', vegetarian: 'whyLight', any: 'whyLight' };
const ageOk = () => ((store.get('session', {}) || {}).age || 0) >= 18;
const alcoholAllowed = () => ageOk() && !store.get('diet', []).includes('halal') && !store.get('noAlcohol', false);
function openMenu(preMainKey) {
  const all = planAll(); const sel = { main: preMainKey ? all.find(x => x.key === preMainKey) : null, side: null, sideCat: 's' };
  pushPage(`<div class="menu-head"><button class="round" data-back>${I.back}</button><div><small>🍽️ World Bite</small><h1>${t('menuTitle')}</h1></div></div>
    <div class="dbody menu-body" id="mBody"></div>`, el => {
    const body = $('#mBody', el);
    const draw = () => {
      const m = sel.main, sd = sel.side;
      let html = `<div class="m-step ${m ? 'done' : 'on'}"><b>1</b><span>${t('menuPickMain')}</span></div>`;
      if (!m) {
        html += `<label class="search">${I.search}<input id="mQ" placeholder="${t('searchExplore')}" autocomplete="off"></label><div id="mList" class="m-list"></div>`;
      } else {
        html += menuCard(m, 'A') + `<button class="link" id="mChMain">${t('change')}</button>
          <div class="m-step ${sd ? 'done' : 'on'}"><b>2</b><span>${t('menuPickSide')}</span></div>`;
        if (!sd) {
          html += `<div class="chips">${['s', 't'].map(c => `<button class="chip ${sel.sideCat === c ? 'on' : ''}" data-sc="${c}">${c === 's' ? '🥗 ' + t('saladMeze') : '🍰 ' + t('quickDessert')}</button>`).join('')}</div><div id="sList" class="m-list"></div>`;
        } else {
          const res = scheduleDual(m.plan, sd.plan);
          html += menuCard(sd, 'B') + `<button class="link" id="mChSide">${t('change')}</button>
            <div class="m-step on"><b>3</b><span>${t('menuPlan')}</span></div>
            <div class="plan-sum"><div><b>${res.total}</b><small>${t('min')} ${t('together')}</small></div><div><b>${res.separate}</b><small>${t('min')} ${t('separately')}</small></div><div class="save"><b>${res.saved}</b><small>${t('min')} ${t('timeSaved')}</small></div></div>
            ${timelineHTML(res, m, sd)}
            <div class="m-step on"><b>4</b><span>🥤 ${t('drinkTitle')}</span></div><div id="mDrinks"></div>
            <button class="btn primary block cta" id="mGo">👩‍🍳 ${t('cookTogether')}</button>
            <button class="btn line block" id="mShare" style="margin-top:8px">📤 ${t('share')}</button>`;
        }
      }
      body.innerHTML = html; hydrate(body);
      if (!m) {
        const q = $('#mQ', el), list = () => {
          const nq = norm(q.value.trim());
          const c = all.filter(x => x.cat !== 't' && x.pas >= 10 && x.pas <= 300 && (!nq || norm(x.name).includes(nq) || norm(cname(x.country)).includes(nq))).sort((a, b) => Math.abs(a.pas - 45) - Math.abs(b.pas - 45)).slice(0, 40);
          $('#mList', el).innerHTML = c.map((x, i) => menuRow(x, `⏳ ${fmtTime(x.pas)} ${t('waitTime')}`, i)).join(''); hydrate($('#mList', el));
          $$('[data-pick]', el).forEach(b => b.onclick = () => { sel.main = all.find(x => x.key === b.dataset.pick); draw(); });
        };
        q.oninput = list; list();
      } else if (!sd) {
        $('#mChMain', el).onclick = () => { sel.main = null; sel.side = null; draw(); };
        $$('[data-sc]', el).forEach(b => b.onclick = () => { sel.sideCat = b.dataset.sc; draw(); });
        const c = all.filter(x => x.cat === sel.sideCat && x.key !== m.key && x.tot <= 45 && !(x.oven && m.oven)).map(x => ({ x, fit: x.act <= m.pas, sal: /^sd-/.test(x.id) ? 1 : 0 })).sort((a, b) => (b.sal - a.sal) || (b.fit - a.fit) || a.x.tot - b.x.tot).slice(0, 30);
        $('#sList', el).innerHTML = c.length ? c.map(({ x, fit }, i) => menuRow(x, fit ? `✓ ${t('fitsWait')}` : `⏱ ${fmtTime(x.tot)}`, i, fit)).join('') : `<div class="empty"><span class="e">🍽️</span>${t('noResults')}</div>`;
        hydrate($('#sList', el));
        $$('[data-pick]', el).forEach(b => b.onclick = () => { sel.side = all.find(x => x.key === b.dataset.pick); draw(); });
      } else {
        $('#mChMain', el).onclick = () => { sel.main = null; sel.side = null; draw(); };
        $('#mChSide', el).onclick = () => { sel.side = null; draw(); };
        drawDrinks($('#mDrinks', el), m, sd);
        $('#mGo', el).onclick = () => openKitchenMenu(m, sd);
        $('#mShare', el).onclick = () => { const res = scheduleDual(m.plan, sd.plan); share(`🍽️ ${t('menuTitle')}: ${m.name} + ${sd.name}`, res.timeline.map(x => `${fmtClock(x.start)} ${x.dish === 'A' ? m.name : sd.name}: ${x.text}`).join('\n')); };
      }
    };
    draw();
  });
}
function menuRow(x, sub, i, fit) {
  return `<div class="m-row ${fit ? 'fit' : ''}" role="button" data-pick="${x.key}" style="animation-delay:${Math.min(i, 12) * 0.03}s">${photo(x.kind === 'c' ? x.id : x.id, x.wiki, x.emoji)}<div class="b"><b>${esc(x.name)}</b><small>${flag(x.country)} ${esc(cname(x.country))} · ⏱ ${fmtTime(x.tot)}</small><small class="${fit ? 'okk' : ''}">${sub}</small></div></div>`;
}
function menuCard(x, lane) { return `<div class="m-card lane-${lane}">${photo(x.id, x.wiki, x.emoji)}<div class="b"><small>${lane === 'A' ? t('mainDish') : t('sideDish')}</small><b>${esc(x.name)}</b><small>${flag(x.country)} ${esc(cname(x.country))} · ⏱ ${fmtTime(x.tot)} · 🔥 ${estimateNutrition(x.ing, x.s, x.key).kcal} kcal</small></div></div>`; }
const fmtClock = m => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
function timelineHTML(res, m, sd) {
  const T = Math.max(1, res.total), bar = (x, cls) => `<i class="${cls}" style="left:${x.start / T * 100}%;width:${Math.max(1.5, x.active / T * 100)}%"></i>` + (x.passive ? `<i class="${cls} pas" style="left:${(x.start + x.active) / T * 100}%;width:${x.passive / T * 100}%"></i>` : '');
  return `<div class="tl"><div class="tl-lane"><span class="tl-l A">A</span><div class="tl-track">${res.timeline.filter(x => x.dish === 'A').map(x => bar(x, 'A')).join('')}</div></div>
    <div class="tl-lane"><span class="tl-l B">B</span><div class="tl-track">${res.timeline.filter(x => x.dish === 'B').map(x => bar(x, 'B')).join('')}</div></div>
    <div class="tl-axis"><span>0:00</span><span>${fmtClock(Math.round(T / 2))}</span><span>${fmtClock(T)}</span></div>
    <p class="note">▮ ${t('activeTime')} · ▯ ${t('passiveTime')}</p></div>`;
}
function drawDrinks(box, m, sd) {
  const taste = store.get('taste', null);
  if (!taste) {
    const tq = { sweet: 1, body: 1, temp: 'any', fizzy: null };
    const row = (k, opts) => `<div class="tq-row"><span>${t('tq_' + k)}</span><div class="chips">${opts.map(([v, l]) => `<button class="chip ${String(tq[k]) === String(v) ? 'on' : ''}" data-tk="${k}" data-tv="${v}">${l}</button>`).join('')}</div></div>`;
    const paint = () => {
      box.innerHTML = `<div class="tq"><p>${t('tasteAsk')}</p>${row('sweet', [[0, t('tq_low')], [1, t('tq_mid')], [2, t('tq_high')]])}${row('body', [[0, t('tq_light')], [1, t('tq_mid')], [2, t('tq_rich')]])}${row('temp', [['cold', '🧊 ' + t('tq_cold')], ['hot', '♨️ ' + t('tq_hot')], ['any', t('tq_any')]])}${row('fizzy', [[true, '🫧 ' + t('yes')], [false, t('no')], [null, t('tq_any')]])}
        ${ageOk() && !store.get('diet', []).includes('halal') ? `<label class="tq-alc"><input type="checkbox" id="tqAlc" ${store.get('noAlcohol', false) ? '' : 'checked'}> ${t('tq_alcohol')}</label>` : ''}
        <button class="btn primary block" id="tqOk">${t('cont')}</button></div>`;
      $$('[data-tk]', box).forEach(b => b.onclick = () => { const v = b.dataset.tv; tq[b.dataset.tk] = v === 'null' ? null : v === 'true' ? true : v === 'false' ? false : isNaN(v) ? v : +v; paint(); });
      $('#tqOk', box).onclick = () => { const a = $('#tqAlc', box); if (a) store.set('noAlcohol', !a.checked); store.set('taste', tq); drawDrinks(box, m, sd); };
    };
    paint(); return;
  }
  const prof = dishProfile(m.ing.concat(sd ? sd.ing : []), m.st, m.cat, m.country);
  const list = pairDrinks(prof, taste, alcoholAllowed());
  box.innerHTML = `<div class="drinks">${list.map((x, i) => `<div class="drink ${x.d.alc ? 'alc' : ''}" style="animation-delay:${i * .1}s"><span class="e">${x.d.emoji}</span><div><b>${esc(x.d.name[lang] || x.d.name.en)}</b><small>${x.d.alc ? '🔞 ' : ''}${[...new Set(x.why.slice(0, 2).map(w => t(DRINK_WHY[w] || 'whyLight')))].join(' · ') || t('whyLight')}</small></div></div>`).join('')}</div>
    ${!ageOk() || store.get('diet', []).includes('halal') ? `<p class="note">${t('noAlcNote')}</p>` : ''}<button class="link" id="tqReset">${t('tasteChange')}</button>`;
  $('#tqReset', box).onclick = () => { store.del('taste'); drawDrinks(box, m, sd); };
}
/* ---------- cook both together, with parallel timers ---------- */
function startDual(m, sd) {
  const res = scheduleDual(m.plan, sd.plan), steps = res.timeline.map(x => Object.assign({}, x, { show: (x.dish === 'A' ? m : sd).stShow[x.i] || x.text, done: false }));
  let k = 0, timers = [], tick = null, t0 = Date.now();
  const el = pushPage(`<div class="dual">
    <div class="k-top"><button class="round" data-back>✕</button><div class="k-title"><b>${esc(m.name)} + ${esc(sd.name)}</b><small id="dClock">0:00 / ${fmtClock(res.total)}</small></div><button class="round" id="dVoice">🎙️</button></div>
    <div class="d-timers" id="dTimers"></div>
    <div class="d-now" id="dNow"></div>
    <h4 class="d-next-h">${t('upNext')}</h4><div class="d-list" id="dList"></div></div>`, () => {}, 'dualpage');
  if (!el) return;
  keepAwake(true);
  const name = d => d === 'A' ? m.name : sd.name;
  const draw = () => {
    const st = steps[k];
    if (!st) {
      $('#dNow', el).innerHTML = `<div class="d-card fin"><div class="big">🎉</div><h2>${t('bonApp')}</h2><p>${t('dualDone', { m: m.name, s: sd.name })}</p><button class="btn primary block" id="dFin">${t('finish')} ✓</button></div>`;
      $('#dFin', el).onclick = () => back();
      onCooked(m.country, m.name, 0, m.key); onCooked(sd.country, sd.name, 0, sd.key);
      SFX.play('success'); if (Voice.on) Voice.speak(t('bonApp'));
    } else {
      $('#dNow', el).innerHTML = `<div class="d-card lane-${st.dish}"><div class="d-tag ${st.dish}">${st.dish} · ${esc(name(st.dish))}</div>
        <small>⏰ ${fmtClock(st.start)} · ${t('stepOf', { i: k + 1, n: steps.length })}</small><p>${esc(st.show)}</p>
        ${st.passive ? `<span class="k-tag c">⏳ ${t('thenWait', { n: st.passive })}</span>` : ''}
        <button class="btn primary block" id="dDone">${st.passive ? '✓ ' + t('doneStartTimer', { n: st.passive }) : '✓ ' + t('doneNext')}</button></div>`;
      $('#dDone', el).onclick = () => { if (st.passive) addTimer(st.passive * 60, name(st.dish), st.dish); st.done = true; k++; SFX.play('pop'); draw(); if (Voice.on) read(); };
    }
    $('#dList', el).innerHTML = steps.slice(k + 1, k + 6).map(x => `<div class="d-row"><span class="d-tag ${x.dish}">${x.dish}</span><small>${fmtClock(x.start)}</small><span>${esc(x.show)}</span></div>`).join('') || '';
  };
  const addTimer = (secs, label, dish) => { timers.push({ end: Date.now() + secs * 1000, label, dish, total: secs }); drawTimers(); };
  const drawTimers = () => {
    const now = Date.now();
    $('#dTimers', el).innerHTML = timers.map((x, i) => { const left = Math.max(0, Math.round((x.end - now) / 1000)); return `<div class="d-timer ${x.dish} ${left === 0 ? 'ring' : ''}"><b>${left === 0 ? '✅' : '⏳'} ${esc(x.label)}</b><span>${left === 0 ? t('ready') : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`}</span><i style="width:${(1 - left / x.total) * 100}%"></i>${left === 0 ? `<button data-tx="${i}">×</button>` : ''}</div>`; }).join('');
    $$('[data-tx]', el).forEach(b => b.onclick = () => { timers.splice(+b.dataset.tx, 1); drawTimers(); });
  };
  tick = setInterval(() => {
    const now = Date.now(); $('#dClock', el).textContent = `${fmtClock(Math.floor((now - t0) / 60000))} / ${fmtClock(res.total)}`;
    timers.forEach(x => { if (!x.rang && now >= x.end) { x.rang = true; SFX.play('ding'); SFX.vibrate([300, 150, 300]); toast(t('timerDone', { n: x.label })); if (Voice.on) Voice.speak(t('timerDone', { n: x.label })); } });
    drawTimers();
  }, 1000);
  const read = () => { const st = steps[k]; if (st) Voice.speak(`${name(st.dish)}. ${st.show}`); };
  $('#dVoice', el).onclick = () => {
    if (Voice.on) { Voice.stop(); $('#dVoice', el).classList.remove('on'); return; }
    Voice.start(lang, cmd => { if (cmd === 'stop') { Voice.stop(); $('#dVoice', el).classList.remove('on'); } else if (cmd === 'next') { const b = $('#dDone', el); b && b.click(); } else if (cmd === 'repeat') read(); });
    $('#dVoice', el).classList.add('on'); toast(t('voiceOn')); read();
  };
  el._onClose = () => { clearInterval(tick); keepAwake(false); Voice.stop(); };
  draw();
}

/* ================= FRIDGE PHOTO → ingredients (Gemini vision) ================= */
function fridgePhoto() {
  if (!gemKey()) { toast(t('aiNeedKey')); setTab('settings'); return; }
  openSheet(`<h2>📸 ${t('fridgeTitle')}</h2><p class="sub">${t('fridgeHint')}</p>
    <div class="btn-row"><button class="btn primary" id="fCam">📷 ${t('camera')}</button><label class="btn line" for="fFile">🖼️ ${t('gallery')}</label></div>
    <input type="file" id="fFile" accept="image/*" class="hide">`, s => {
    $('#fCam', s).onclick = () => { closeSheet(); fridgeCamera(); };
    $('#fFile', s).onchange = e => { const f = e.target.files[0]; if (!f) return; closeSheet(); const img = new Image(); img.onload = () => analyzeFridge(img); img.src = URL.createObjectURL(f); };
  });
}
function fridgeCamera() {
  const ov = document.createElement('div'); ov.className = 'k-cam'; ov.style.position = 'fixed'; ov.style.zIndex = 70;
  ov.innerHTML = `<video autoplay playsinline muted></video><div class="k-cam-top"><button class="round" id="fx">✕</button><span>${t('fridgeHint')}</span></div><div class="k-cam-bot"><button class="k-shutter" id="fShot"></button></div>`;
  document.body.appendChild(ov);
  let stream = null; const vid = ov.querySelector('video');
  const close = () => { if (stream) stream.getTracks().forEach(tr => tr.stop()); ov.remove(); };
  ov.querySelector('#fx').onclick = close;
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } } }).then(s => { stream = s; vid.srcObject = s; }).catch(() => { close(); toast(t('camErr')); });
  ov.querySelector('#fShot').onclick = () => { if (!vid.videoWidth) return; SFX.play('pop'); const c = document.createElement('canvas'); c.width = vid.videoWidth; c.height = vid.videoHeight; c.getContext('2d').drawImage(vid, 0, 0); close(); analyzeFridge(c); };
}
async function analyzeFridge(src) {
  const W = src.videoWidth || src.naturalWidth || src.width, H = src.videoHeight || src.naturalHeight || src.height, k = Math.min(1, 1024 / Math.max(W, H));
  const c = document.createElement('canvas'); c.width = Math.round(W * k); c.height = Math.round(H * k); c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  const b64 = c.toDataURL('image/jpeg', .82).split(',')[1];
  openSheet(`<h2>📸 ${t('fridgeTitle')}</h2><img class="f-prev" src="data:image/jpeg;base64,${b64}"><div class="ai-wait"><div class="ai-orb">✨</div><p>${t('fridgeWorking')}</p></div>`);
  try {
    const prompt = `List every food ingredient you can clearly see in this photo of a fridge, pantry or countertop. Ignore non-food items. Reply ONLY with JSON: {"items":[{"en":"english name, singular, lowercase","name":"name in ${LANG_NAME[lang]}"}]}`;
    const j = await gemini({ contents: [{ role: 'user', parts: [{ inline_data: { mime_type: 'image/jpeg', data: b64 } }, { text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } }, 45000);
    const items = (gemJSON(gemText(j)).items || []).map(x => {
      const en = norm(x.en || ''), it = INGREDIENTS.find(i => norm(i.name.en) === en || norm(i.name.en).replace(/s$/, '') === en || en.includes(norm(i.name.en).replace(/s$/, '')));
      return it ? { v: '#' + it.id, label: it.name[lang] || it.name.tr, icon: it.emoji, it } : { v: x.name || x.en, label: x.name || x.en, icon: ingEmoji(x.name || x.en) };
    }).filter((x, i, a) => x.v && a.findIndex(y => y.v === x.v) === i);
    const sel = new Set(items.map(x => x.v));
    const paint = () => {
      $('#sheet').innerHTML = `<div class="grab"></div><h2>📸 ${t('fridgeFound', { n: items.length })}</h2><p class="sub">${t('fridgePick')}</p>
        <div class="ptiles f-tiles">${items.map(x => `<button class="ptile ${sel.has(x.v) ? 'in' : ''}" data-fv="${esc(x.v)}">${x.it ? photo('ing-' + x.it.id, x.it.wiki, x.icon) : `<div class="ph"><span class="em">${x.icon}</span></div>`}<b>${esc(x.label)}</b></button>`).join('')}</div>
        <button class="btn primary block" id="fAdd" style="margin-top:12px">🧺 ${t('fridgeAdd', { n: sel.size })}</button>`;
      hydrate($('#sheet'));
      $$('[data-fv]', $('#sheet')).forEach(b => b.onclick = () => { const v = b.dataset.fv; sel.has(v) ? sel.delete(v) : sel.add(v); paint(); });
      $('#fAdd').onclick = () => { const p = pantry(); sel.forEach(v => { if (!p.includes(v)) p.push(v); }); store.set('pantry', p); pantryResults = null; closeSheet(); SFX.play('success'); renderPantry(); toast(t('fridgeAdded', { n: sel.size })); };
    };
    if (!items.length) { $('#sheet').innerHTML = `<div class="grab"></div><div class="empty"><span class="e">🤔</span>${t('fridgeNone')}</div>`; return; }
    paint();
  } catch (e) { $('#sheet').innerHTML = `<div class="grab"></div><div class="empty"><span class="e">⚠️</span>${t('aiErr')}<br><small>${esc(String(e.message || e).slice(0, 140))}</small></div>`; }
}

/* ================= PASSPORT, COSTUMES, DAILY QUEST ================= */
const passport = () => store.get('passport', {});
const todayKey = () => new Date().toISOString().slice(0, 10);
function dotdCode() { const c = COUNTRIES[hash(todayKey() + 'dotd') % COUNTRIES.length]; return c.code; }
function onCooked(code, dish, stars, key) {
  if (!code) return;
  const p = passport(), isNew = !p[code];
  p[code] = { ts: Date.now(), dish, stars: Math.max(stars || 0, (p[code] && p[code].stars) || 0) }; store.set('passport', p);
  if (isNew) setTimeout(() => toast(`🛂 ${t('stamped', { c: cname(code) })}`), 600);
  const q = store.get('quest', { date: '', done: false, streak: 0, last: '' });
  if (code === dotdCode() && !(q.date === todayKey() && q.done)) {
    const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    q.streak = q.last === y ? q.streak + 1 : 1; q.last = todayKey(); q.date = todayKey(); q.done = true; store.set('quest', q);
    const g = store.get('gstats', { total: 0, best: {}, games: 0 }); g.total += 5; store.set('gstats', g);
    setTimeout(() => { toast(`🏆 ${t('questDone', { n: q.streak })}`); SFX.play('success'); }, 1500);
  }
  newAccessories();
}
const ACCESSORIES = [
  { id: 'scarf', e: '🧣', slot: 'neck', need: p => contCount(p, 'europe') >= 3, rule: ['europe', 3] },
  { id: 'fan', e: '🪭', slot: 'hand', need: p => contCount(p, 'asia') >= 3, rule: ['asia', 3] },
  { id: 'bow', e: '🎀', slot: 'head', need: p => contCount(p, 'africa') >= 2, rule: ['africa', 2] },
  { id: 'shades', e: '🕶️', slot: 'eyes', need: p => contCount(p, 'americas') >= 3, rule: ['americas', 3] },
  { id: 'flower', e: '🌺', slot: 'head', need: p => contCount(p, 'oceania') >= 1, rule: ['oceania', 1] },
  { id: 'tophat', e: '🎩', slot: 'top', need: p => Object.keys(p).length >= 10, rule: ['all', 10] },
  { id: 'sunhat', e: '👒', slot: 'top', need: p => Object.keys(p).length >= 25, rule: ['all', 25] },
  { id: 'crown', e: '👑', slot: 'top', need: p => Object.keys(p).length >= 50, rule: ['all', 50] }
];
function contCount(p, cont) { return Object.keys(p).filter(c => byCode[c] && byCode[c].cont === cont).length; }
function newAccessories() {
  const p = passport(), seen = store.get('accSeen', []);
  ACCESSORIES.filter(a => a.need(p) && !seen.includes(a.id)).forEach(a => { seen.push(a.id); setTimeout(() => toast(`🎁 ${t('accUnlocked')} ${a.e}`), 2600); });
  store.set('accSeen', seen);
}
function questCard() {
  const code = dotdCode(), c = byCode[code], q = store.get('quest', { date: '', done: false, streak: 0 }), done = q.date === todayKey() && q.done;
  return `<div class="quest ${done ? 'done' : ''}" role="button" data-open="c:${code}"><span class="qi">${done ? '✅' : '🏆'}</span><div><b>${t('questTitle')}</b><small>${done ? t('questDoneShort') : t('questText', { d: dishName(c) })}</small></div><span class="qs">🔥 ${q.streak || 0}</span></div>`;
}
function openPassport() {
  const p = passport(), codes = Object.keys(p).sort((a, b) => p[b].ts - p[a].ts), acc = store.get('acc', '');
  pushPage(`<div class="menu-head"><button class="round" data-back>${I.back}</button><div><small>🛂 World Bite</small><h1>${t('passport')}</h1></div></div>
    <div class="dbody menu-body">
      <div class="pp-cover"><div class="pp-emb">${logoSVG(false)}</div><div><b>${esc(session().name)}</b><small>${t('ppStats', { n: codes.length, t: COUNTRIES.length })}</small></div></div>
      <div class="pp-conts">${CONTINENTS.map(ct => { const n = contCount(p, ct), tot = COUNTRIES.filter(c => c.cont === ct).length; return `<div><span>${t(ct)}</span><i><b style="width:${n / tot * 100}%"></b></i><small>${n}/${tot}</small></div>`; }).join('')}</div>
      <div class="sec"><h2>🎭 ${t('costumes')}</h2></div>
      <div class="acc-grid">${ACCESSORIES.map(a => { const ok = a.need(p); return `<button class="acc ${ok ? '' : 'lock'} ${acc === a.id ? 'on' : ''}" data-acc="${ok ? a.id : ''}"><span>${ok ? a.e : '🔒'}</span><small>${ok ? (acc === a.id ? t('wearing') : t('wear')) : (a.rule[0] === 'all' ? t('ruleAll', { n: a.rule[1] }) : t('ruleCont', { n: a.rule[1], c: t(a.rule[0]) }))}</small></button>`; }).join('')}</div>
      <div class="chef-preview">${chefHTML(currentChef(), 'happy')}</div>
      <div class="sec"><h2>📮 ${t('stamps')}</h2><small>${codes.length}</small></div>
      <div class="stamps">${codes.map((c, i) => `<div class="stamp" role="button" data-open="c:${c}" style="--r:${(hash(c) % 20) - 10}deg;animation-delay:${Math.min(i, 20) * .05}s"><span class="f">${flag(c)}</span><b>${esc(cname(c))}</b><small>${esc(p[c].dish || '')}</small><i>${new Date(p[c].ts).toLocaleDateString(lang)}</i></div>`).join('') || `<div class="empty" style="grid-column:1/-1"><span class="e">🛂</span>${t('ppEmpty')}</div>`}</div>
    </div>`, el => {
    $$('[data-acc]', el).forEach(b => b.onclick = () => { if (!b.dataset.acc) { SFX.play('fail'); return; } store.set('acc', store.get('acc', '') === b.dataset.acc ? '' : b.dataset.acc); SFX.play('pop'); back(); setTimeout(openPassport, 280); });
  });
}

/* ---------- MY LIST ---------- */
let listTab = 'recipes';
function renderList() {
  const f = fav();
  const v = $('#v-list');
  v.innerHTML = `<div class="top"><div><div class="hi">🔖 World Bite</div><h1>${t('myList')}</h1></div></div>
    <div class="seg list-seg" id="lSeg"><span class="knob"></span><button data-m="recipes">🍲 ${t('recipes')} ${f.dishes.length + f.recipes.length + f.cdishes.length}</button><button data-m="rests">🍽️ ${t('savedRest')} ${f.rests.length}</button><button data-m="shop">🛒 ${t('shopping')} ${shop().filter(x => !x.done).length}</button></div>
    <div id="lBody"></div>`;
  const seg = $('#lSeg');
  $$('button', seg).forEach(b => { b.classList.toggle('on', b.dataset.m === listTab); b.onclick = () => { listTab = b.dataset.m; renderList(); }; });
  requestAnimationFrame(() => moveKnob(seg));
  const body = $('#lBody');
  if (listTab === 'recipes') {
    const items = [...f.recipes.map(id => recipeById[id] && { type: 'recipes', id, open: 'r:' + id, ph: photo(id, recipeById[id].wiki, recipeById[id].e), name: recName(recipeById[id]), sub: `${flag(recipeById[id].country)} ${cname(recipeById[id].country)} · ${t(recipeById[id].cat)}` }),
      ...f.cdishes.map(id => { const d = CITY_DISHES.find(x => x.id === id); return d && { type: 'cdishes', id, open: 'd:' + id, ph: photo(d.id, d.wiki, d.emoji), name: d.name, sub: `${flag(d.code)} ${(CITIES.find(c => c.id === d.city) || {}).name} · ${cname(d.code)}` }; }),
      ...f.dishes.map(code => byCode[code] && { type: 'dishes', id: code, open: 'c:' + code, ph: photo(code, byCode[code].wiki, byCode[code].emoji), name: dishName(byCode[code]), sub: `${flag(code)} ${cname(code)} · ${t('signature')}` })].filter(Boolean);
    body.innerHTML = items.length ? items.map((x, i) => `<button class="saved-item" data-open="${x.open}" style="animation-delay:${i * 0.04}s">${x.ph}<div class="b"><h3>${esc(x.name)}</h3><small>${esc(x.sub)}</small></div><span class="rm" data-fav="${x.type}" data-id="${x.id}">${I.heart}</span></button>`).join('')
      : `<div class="empty"><span class="e">🍲</span>${t('emptyRecipes')}</div>`;
    hydrate(body);
  } else if (listTab === 'shop') {
    renderShop(body);
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

function renderShop(body) {
  const list = shop();
  body.innerHTML = `<div class="trow"><label class="search">${I.search}<input id="shIn" placeholder="${t('shopAddPh')}" autocomplete="off"></label><button class="icon-btn" id="shAdd">＋</button></div>
    ${list.length ? `<div class="btn-row"><button class="btn line" id="shShare">📤 ${t('shareList')}</button><button class="btn line" id="shClear">✓ ${t('clearDone')}</button></div>` : ''}
    <div id="shList">${list.length ? ING_CATS.map(c => { const g = list.filter(x => x.cat === c); return g.length ? `<h4 class="shop-cat">${ING_CAT_ICON[c]} ${t('cat_' + c)} <small>${g.filter(x => !x.done).length}</small></h4>` + g.map(x => `<div class="shop-item ${x.done ? 'done' : ''}" data-sid="${x.id}"><span class="box">✓</span><span class="e">${x.emoji}</span><div class="b"><span>${esc(x.text)}</span>${x.src ? `<small>${esc(x.src)}</small>` : ''}</div><button class="x" data-sdel="${x.id}">×</button></div>`).join('') : ''; }).join('')
      : `<div class="empty"><span class="e">🛒</span>${t('shopEmpty')}</div>`}</div>`;
  const add = () => { const v = $('#shIn').value.trim(); if (!v) return; const info = ingInfo(v); const l = shop(); l.push({ id: 's' + Date.now().toString(36), text: v, cat: info ? info.cat : 'other', emoji: info ? info.emoji : ingEmoji(v), src: '', done: false }); store.set('shop', l); renderList(); setTimeout(() => $('#shIn') && $('#shIn').focus(), 30); };
  $('#shAdd').onclick = add; $('#shIn').onkeydown = e => { if (e.key === 'Enter') add(); };
  $('#shList').onclick = e => {
    const del = e.target.closest('[data-sdel]'); const l = shop();
    if (del) { store.set('shop', l.filter(x => x.id !== del.dataset.sdel)); renderList(); return; }
    const it = e.target.closest('[data-sid]'); if (!it) return;
    const x = l.find(y => y.id === it.dataset.sid); x.done = !x.done; store.set('shop', l); it.classList.toggle('done', x.done);
  };
  const sc = $('#shClear'); if (sc) sc.onclick = () => { store.set('shop', shop().filter(x => !x.done)); renderList(); };
  const ss = $('#shShare'); if (ss) ss.onclick = () => share('🛒 ' + t('shopping'), shop().filter(x => !x.done).map(x => `☐ ${x.text}`).join('\n'));
}

/* ---------- SETTINGS ---------- */
function renderSettings() {
  const s = session(), color = store.get('color', SWATCHES[0]), dark = store.get('dark', false);
  $('#v-settings').innerHTML = `<div class="top"><div><div class="hi">⚙️ World Bite</div><h1>${t('settings')}</h1></div></div>
    <div class="profile"><div class="avatar">${esc((s.name[0] || '?').toUpperCase())}</div><div><h3>${esc(s.name)}</h3><small>${esc(s.email || '')} · ${t('provider')[s.provider] || ''}</small></div></div>
    <div class="group"><h4>👩‍🍳 ${t('chefTitle')}</h4>
      <div class="chef-pick">${Object.values(CHEFS).map(ch => `<button class="chef-card ${currentChef() === ch.id ? 'on' : ''}" data-chef="${ch.id}">${currentChef() === ch.id ? chefHTML(ch.id, 'wink') : chefSVG(ch.id, 'happy')}<b>${esc(ch.name[lang] || ch.name.tr)}</b><small>${esc(ch.tag[lang] || ch.tag.tr)}</small></button>`).join('')}</div>
      <div class="chips" style="padding:0 16px 8px;margin:0">${['age', 'dish', 'random'].map(m => `<button class="chip ${store.get('chefMode', 'age') === m ? 'on' : ''}" data-cm="${m}">${t('chef_' + m)}</button>`).join('')}</div>
      ${(g => `<div class="rank-card"><span>🏅</span><div><b>${rankInfo(g.total).rankName}</b><small>${g.total} ★ · ${g.games} ${t('gamesPlayed')}</small><div class="g-rank"><i style="width:${rankInfo(g.total).progress}%"></i></div></div></div>`)(store.get('gstats', { total: 0, games: 0 }))}
      <div class="row" id="sSfx"><span class="ri">🔊</span><span class="lbl">${t('sfxToggle')}</span><span class="toggle ${store.get('sfx', true) ? 'on' : ''}" style="flex:none"></span></div>
      <div class="row" id="sVoiceAuto"><span class="ri">🎙️</span><span class="lbl">${t('voiceAuto')}</span><span class="toggle ${store.get('voiceAuto', false) ? 'on' : ''}" style="flex:none"></span></div>
      <button class="row" id="sPass"><span class="ri">🛂</span><span class="lbl">${t('passport')}</span><small>${Object.keys(passport()).length}/${COUNTRIES.length}</small>${I.chev}</button>
      <button class="row" id="sAge"><span class="ri">🎂</span><span class="lbl">${t('age')}</span><small>${s.age || '—'}</small>${I.chev}</button></div>
    <div class="group"><h4>🥗 ${t('dietTitle')}</h4><div class="chips" style="padding:6px 16px 4px;margin:0;flex-wrap:wrap">${DIETS.map(k => `<button class="chip ${store.get('diet', []).includes(k) ? 'on' : ''}" data-sd="${k}">${DIET_ICON[k]} ${t('diet_' + k)}</button>`).join('')}</div><p class="credits" style="padding-top:8px">${t('dietNote')}</p></div>
    <div class="group"><h4>${t('themeColor')}</h4><div class="swatches">${SWATCHES.map(c => `<button class="sw ${c.toLowerCase() === color.toLowerCase() ? 'on' : ''}" data-c="${c}" style="background:${c}"></button>`).join('')}
      <label class="sw customsw ${SWATCHES.map(x => x.toLowerCase()).includes(color.toLowerCase()) ? '' : 'on'}" title="${t('custom')}"><input type="color" id="cc" value="${color}"></label></div>
      <div class="row" id="darkRow"><span class="ri">${I.moon}</span><span class="lbl">${t('darkMode')}</span><span class="toggle ${dark ? 'on' : ''}" style="flex:none"></span></div></div>
    <div class="group"><h4>${t('language')}</h4><div class="langs">${[['tr', 'Türkçe'], ['az', 'Azərbaycan'], ['en', 'English'], ['ru', 'Русский']].map(([k, n]) => `<button data-l="${k}" class="${k === lang ? 'on' : ''}">${n}</button>`).join('')}</div></div>
    <div class="group"><h4>✨ ${t('gemTitle')}</h4>
      <div class="gem"><p class="credits" style="padding:0 0 10px">${t('gemInfo')}</p>
        <div class="field"><span class="ic">🔑</span><input id="gKey" type="password" placeholder="${t('gemKey')}" value="${esc(store.get('gemKey', ''))}" autocomplete="off"></div>
        <div class="field" style="margin-top:8px"><span class="ic">🤖</span><input id="gModel" placeholder="gemini-flash-latest" value="${esc(store.get('gemModel', ''))}" autocomplete="off"></div>
        <div class="btn-row"><button class="btn ghost" id="gTest">${t('gemTest')}</button><a class="btn line" href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">${t('gemGet')}</a></div>
        <p class="note" id="gRes"></p></div></div>
    <div class="group"><h4>${t('account')}</h4>
      <button class="row" id="sHist"><span class="ri">${I.trash}</span><span class="lbl">${t('clearHistory')}</span>${I.chev}</button>
      <button class="row" id="sIntro"><span class="ri">${I.replay}</span><span class="lbl">${t('replayIntro')}</span>${I.chev}</button>
      <button class="row" id="sCache"><span class="ri">${I.trash}</span><span class="lbl">${t('clearCache')}</span>${I.chev}</button>
      <button class="row danger" id="sOut"><span class="ri">${I.logout}</span><span class="lbl">${t('logout')}</span></button></div>
    <div class="group"><h4>${t('about2')}</h4><div class="row"><span class="ri">${I.info}</span><span class="lbl">World Bite</span><small>${t('version')} 1.8.0</small></div><p class="credits">${t('credits')}</p></div>`;
  $$('[data-chef]').forEach(b => b.onclick = () => { store.set('chefMode', b.dataset.chef); renderSettings(); });
  $$('[data-cm]').forEach(b => b.onclick = () => { store.set('chefMode', b.dataset.cm); renderSettings(); });
  $('#sAge').onclick = () => askAge(true);
  $('#sPass').onclick = openPassport;
  $('#sSfx').onclick = () => { store.set('sfx', !store.get('sfx', true)); renderSettings(); SFX.play('ding'); };
  $('#sVoiceAuto').onclick = () => { store.set('voiceAuto', !store.get('voiceAuto', false)); renderSettings(); };
  $$('[data-sd]').forEach(b => b.onclick = () => { toggleDiet(b.dataset.sd); b.classList.toggle('on'); drawChips && $('#dietChips') && (drawChips(), drawGrid()); });
  $$('.sw[data-c]').forEach(b => b.onclick = () => { store.set('color', b.dataset.c); applyTheme(); renderSettings(); });
  $('#cc').oninput = e => { store.set('color', e.target.value); applyTheme(); };
  $('#cc').onchange = () => renderSettings();
  $('#darkRow').onclick = () => { store.set('dark', !store.get('dark', false)); applyTheme(); renderSettings(); if (map) { map = null; } state.results.length && renderTravel(); };
  $$('.langs button').forEach(b => b.onclick = () => { lang = b.dataset.l; store.set('lang', lang); document.documentElement.lang = lang; enterApp(); setTab('settings'); });
  const saveG = () => { store.set('gemKey', $('#gKey').value.trim()); store.set('gemModel', $('#gModel').value.trim()); renderTravel(); renderPantry(); };
  $('#gKey').onchange = saveG; $('#gModel').onchange = saveG;
  $('#gTest').onclick = async () => {
    saveG(); const out = $('#gRes'); if (!gemKey()) { out.textContent = t('gemKey'); return; }
    out.innerHTML = '<span class="spinner" style="display:inline-block;vertical-align:middle"></span>';
    try { const j = await gemini({ contents: [{ role: 'user', parts: [{ text: 'Reply with the single word: OK' }] }] }, 20000); out.textContent = '✅ ' + t('gemOk') + ' (' + gemModel() + ': ' + gemText(j).trim().slice(0, 20) + ')'; }
    catch (e) { out.textContent = '❌ ' + t('gemFail') + ': ' + String(e.message || e).slice(0, 120); }
  };
  $('#sHist').onclick = () => { try { Object.keys(localStorage).filter(k => /^wb_(rc:|geo:|recent)/.test(k)).forEach(k => localStorage.removeItem(k)); } catch (e) {} state.results = []; renderTravel(); toast(t('historyCleared')); };
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
