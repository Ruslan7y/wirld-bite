/* World Bite — explore world map (offline: country shapes bundled, no tiles, no internet).
   Tap a country → it turns red, camera glides to it, its cities pop in. Tap a city → callback. */
const WorldMap = (() => {
  let map = null, geo = null, loading = null, selected = '', markers = [], opts = {};
  const BOUNDS_FIX = { US: [-125, 24, -66, 50], RU: [27, 41, 180, 78], FJ: [176, -20, 182, -12], NZ: [166, -47.5, 179, -34], KI: [-175, -12, -150, 5], FR: [-5.5, 41, 10, 51.5], NL: [3.2, 50.7, 7.3, 53.6], NO: [4, 57.8, 31.5, 71.3], ES: [-9.6, 35.8, 4.4, 43.9], PT: [-9.6, 36.9, -6.1, 42.2], CL: [-76, -56, -66, -17.5], EC: [-81.2, -5.1, -75, 1.5], DK: [8, 54.5, 12.8, 57.8], GB: [-8.2, 49.9, 1.8, 58.7], CA: [-141, 41.7, -52, 70], AU: [112, -44, 154, -10], CN: [73, 18, 135, 53.6], JP: [129, 30, 146, 45.6], ID: [95, -11, 141, 6] };
  const WORLD = [[-168, -56], [190, 78]];
  const webgl = () => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } };
  const supported = () => !!window.maplibregl && webgl();

  function loadGeo() {
    if (geo) return Promise.resolve(geo);
    if (!loading) loading = fetch('geo/world.json').then(r => r.json()).then(topo => {
      const fc = topojson.feature(topo, topo.objects.countries);
      fc.features = fc.features.filter(f => f.id).map(f => { f.properties = { iso: f.id }; return f; });
      geo = fc; return fc;
    });
    return loading;
  }
  function bboxOf(f) {
    if (BOUNDS_FIX[f.id]) return BOUNDS_FIX[f.id];
    let x0 = 180, y0 = 90, x1 = -180, y1 = -90;
    const walk = c => { if (typeof c[0] === 'number') { if (c[0] < x0) x0 = c[0]; if (c[0] > x1) x1 = c[0]; if (c[1] < y0) y0 = c[1]; if (c[1] > y1) y1 = c[1]; } else c.forEach(walk); };
    walk(f.geometry.coordinates);
    return [x0, y0, x1, y1];
  }
  function colors() {
    const dark = document.documentElement.classList.contains('dark');
    const p = getComputedStyle(document.documentElement).getPropertyValue('--p').trim() || '#1E6BD6';
    return dark ? { sea: '#0F1A26', land: '#2A3441', rich: '#33465A', line: '#0F141B', p } : { sea: '#DCEBF7', land: '#F4F1EA', rich: '#E9E2D2', line: '#FFFFFF', p };
  }

  async function mount(container, o) {
    opts = o || {};
    if (!supported()) return false;
    const fc = await loadGeo();
    const rich = new Set(opts.rich || []);
    fc.features.forEach(f => (f.properties.rich = rich.has(f.id) ? 1 : 0));
    const c = colors();
    if (map) { try { map.remove(); } catch (e) {} map = null; }
    map = new maplibregl.Map({
      container, attributionControl: false, dragRotate: false, pitchWithRotate: false, touchPitch: false,
      renderWorldCopies: false, minZoom: 0.6, maxZoom: 9, center: opts.center || [30, 30], zoom: opts.zoom || 1.1, fadeDuration: 0,
      style: { version: 8, sources: { world: { type: 'geojson', data: fc, promoteId: 'iso', tolerance: 0.45 } }, layers: [
        { id: 'sea', type: 'background', paint: { 'background-color': c.sea } },
        { id: 'land', type: 'fill', source: 'world', paint: {
          'fill-color': ['case', ['boolean', ['feature-state', 'sel'], false], '#E5484D', ['boolean', ['feature-state', 'hover'], false], c.p, ['==', ['get', 'rich'], 1], c.rich, c.land],
          'fill-opacity': ['case', ['boolean', ['feature-state', 'sel'], false], 0.92, ['boolean', ['feature-state', 'hover'], false], 0.35, 1],
          'fill-color-transition': { duration: 500 }, 'fill-opacity-transition': { duration: 500 } } },
        { id: 'border', type: 'line', source: 'world', paint: { 'line-color': c.line, 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 0.4, 6, 1.2] } },
        { id: 'sel-line', type: 'line', source: 'world', filter: ['==', ['get', 'iso'], ''], paint: { 'line-color': '#B91C1C', 'line-width': 2 } }
      ] }
    });
    map.touchZoomRotate.disableRotation();
    map.on('click', 'land', e => { const iso = e.features[0] && e.features[0].properties.iso; if (iso) select(iso, true); });
    map.on('click', e => { if (!map.queryRenderedFeatures(e.point, { layers: ['land'] }).length) clear(); });
    map.on('mouseenter', 'land', () => (map.getCanvas().style.cursor = 'pointer'));
    await new Promise(res => map.once('load', res));
    if (!selected) map.fitBounds(WORLD, { padding: 10, duration: 0 });
    if (selected) { const s = selected; selected = ''; select(s, false); }
    return true;
  }
  function select(iso, fromTap) {
    if (!map || !geo) { selected = iso; return; }
    const f = geo.features.find(x => x.id === iso);
    if (!f) { opts.onCountry && opts.onCountry(iso, fromTap); return; }
    if (selected && selected !== iso) map.setFeatureState({ source: 'world', id: selected }, { sel: false });
    selected = iso;
    map.setFeatureState({ source: 'world', id: iso }, { sel: true });
    map.setFilter('sel-line', ['==', ['get', 'iso'], iso]);
    const b = bboxOf(f);
    map.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: { top: 50, left: 40, right: 40, bottom: 190 }, maxZoom: 6.2, duration: 1300, essential: true, curve: 1.3 });
    clearMarkers();
    const cities = (opts.citiesOf && opts.citiesOf(iso)) || [];
    map.once('moveend', () => {
      if (selected !== iso) return;
      cities.forEach((c, i) => {
        // MapLibre positions the marker element with transform, so animate an inner wrapper instead
        const el = document.createElement('div'); el.className = 'wm-city';
        el.innerHTML = `<button class="wm-pin" style="animation-delay:${(i * 0.09).toFixed(2)}s"><span>${c.name}</span><i></i></button>`;
        el.addEventListener('click', ev => { ev.stopPropagation(); markers.forEach(m => m.getElement().classList.remove('on')); el.classList.add('on'); opts.onCity && opts.onCity(c); });
        markers.push(new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([c.lon, c.lat]).addTo(map));
      });
    });
    opts.onCountry && opts.onCountry(iso, fromTap);
  }
  function focusCity(c) {
    if (!map) return;
    map.flyTo({ center: [c.lon, c.lat], zoom: Math.max(map.getZoom(), 6), duration: 900, essential: true, offset: [0, -90] });
    setTimeout(() => markers.forEach(m => { const on = m.getLngLat().lng === c.lon && m.getLngLat().lat === c.lat; m.getElement().classList.toggle('on', on); }), 950);
  }
  function clearMarkers() { markers.forEach(m => m.remove()); markers = []; }
  function clear() {
    if (map && selected) { map.setFeatureState({ source: 'world', id: selected }, { sel: false }); map.setFilter('sel-line', ['==', ['get', 'iso'], '']); }
    selected = ''; clearMarkers(); opts.onClear && opts.onClear();
    if (map) map.fitBounds(WORLD, { padding: 10, duration: 900 });
  }
  return { mount, select, clear, focusCity, supported, resize: () => map && map.resize(), get selected() { return selected; }, get ready() { return !!map; } };
})();
