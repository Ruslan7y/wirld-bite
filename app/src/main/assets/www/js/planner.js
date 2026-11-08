/* Dinner planner: cook two dishes at the same time.
   Each step gets an estimated "active" time (you are busy) and "passive" time (it simmers / bakes / rests).
   The side dish's steps are slotted into the main dish's passive windows. */
const ACTIVE_MIN = { crack: 1, whisk: 3, mix: 2, chop: 5, knead: 8, roll: 6, fry: 6, boil: 3, bake: 3, grill: 10, steam: 3, wrap: 10, layer: 8, rest: 1, garnish: 2, serve: 2 };
const PASSIVE_ACTS = ['boil', 'bake', 'rest', 'steam'];
function planSteps(st) {
  return st.map(text => {
    const a = Kitchen.detect(text).id, d = Math.round(Kitchen.duration(text) / 60);
    const act = ACTIVE_MIN[a] || 3;
    let passive = 0, active = act;
    if (PASSIVE_ACTS.includes(a) && d >= 6) { passive = d; active = Math.min(act, 3); }
    else if (d) active = Math.max(1, Math.min(d, 25));
    return { text, act: a, active, passive, oven: a === 'bake' };
  });
}
function totalMinutes(steps) { return steps.reduce((s, x) => s + x.active + x.passive, 0); }
function passiveWindow(steps) { return steps.reduce((s, x) => s + x.passive, 0); }
/* returns { timeline:[{dish:'A'|'B', start, active, passive, text, act, i}], total, separate, saved, ok, ovenClash } */
function scheduleDual(A, B) {
  const ovenA = A.filter(x => x.oven), ovenB = B.filter(x => x.oven);
  const timeline = []; let t = 0, readyA = 0, j = 0, readyB = 0;
  const putB = limit => {
    while (j < B.length) {
      const s = B[j], start = Math.max(t, readyB);
      if (limit != null && start + s.active > limit + 2) break;
      timeline.push({ dish: 'B', start, active: s.active, passive: s.passive, text: s.text, act: s.act, i: j });
      t = start + s.active; readyB = t + s.passive; j++;
    }
  };
  A.forEach((s, i) => {
    const start = Math.max(t, readyA);
    timeline.push({ dish: 'A', start, active: s.active, passive: s.passive, text: s.text, act: s.act, i });
    t = start + s.active; readyA = t + s.passive;
    if (s.passive >= 6 && i < A.length - 1) putB(readyA);
  });
  const last = A[A.length - 1];
  // the main dish's final step (serving) happens once everything is ready
  putB(null);
  const total = Math.max(readyA, readyB, t);
  const separate = totalMinutes(A) + totalMinutes(B);
  return { timeline: timeline.sort((x, y) => x.start - y.start || (x.dish < y.dish ? -1 : 1)), total, separate, saved: Math.max(0, separate - total), ovenClash: ovenA.length > 0 && ovenB.length > 0 };
}
