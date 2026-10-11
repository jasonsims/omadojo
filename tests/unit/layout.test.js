// Geometry: tileRects must tile the work area exactly, and neighbor() must pick the window a user would expect.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setAspect, tileRects } from '../../src/model/layout.js';
import { fresh, neighbor, openApp, S } from '../../src/model/desktop.js';

const EPS = 1e-9;
const workspace = (n, o = {}) => ({
  slots: Array.from({ length: n }, (_, i) => ({ wins: [i + 1], active: 0, grouped: false })),
  floats: [], focus: n, layout: 'dwindle', flips: {}, ratios: {}, colW: {}, scroll: 0, ...o,
});
const overlap = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) *
  Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

test('dwindle covers the work area with no gaps or overlaps', () => {
  for (let n = 1; n <= 6; n++) {
    for (let trial = 0; trial < 50; trial++) {
      setAspect(0.5 + Math.random() * 2);
      const flips = {}, ratios = {};
      for (let i = 0; i < n; i++) { flips[i] = Math.random() < 0.5; ratios[i] = 0.2 + Math.random() * 0.6; }
      const rects = Object.values(tileRects(workspace(n, { flips, ratios })).rects);
      assert.equal(rects.length, n);
      for (const r of rects) {
        assert.ok(r.x >= -EPS && r.y >= -EPS && r.x + r.w <= 1 + EPS && r.y + r.h <= 1 + EPS, `out of bounds: ${JSON.stringify(r)}`);
      }
      const area = rects.reduce((s, r) => s + r.w * r.h, 0);
      assert.ok(Math.abs(area - 1) < 1e-6, `area ${area} with ${n} windows`);
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) assert.ok(overlap(rects[i], rects[j]) < EPS, 'windows overlap');
    }
  }
});

test('dwindle splits the longer side, and a flip turns it', () => {
  setAspect(16 / 10);
  const side = tileRects(workspace(2)).rects;
  assert.deepEqual([side[1].x, side[2].x, side[1].h], [0, 0.5, 1]);
  const stacked = tileRects(workspace(2, { flips: { 0: true } })).rects;
  assert.deepEqual([stacked[1].y, stacked[2].y, stacked[1].w], [0, 0.5, 1]);
});

test('scrolling keeps the focused column on screen', () => {
  for (let focus = 1; focus <= 5; focus++) {
    const ws = workspace(5, { layout: 'scrolling', focus });
    const r = tileRects(ws).rects[focus];
    assert.ok(r.x >= -EPS && r.x + r.w <= 1 + EPS, `column ${focus} at x=${r.x}`);
  }
});

test('neighbor() finds the window in each direction', () => {
  // Three windows at 16:10: 1 fills the left half, 2 is top right, 3 is bottom right.
  setAspect(16 / 10);
  fresh();
  const [a, b, c] = ['terminal', 'browser', 'files'].map(app => openApp(app));
  const from = (id, dir) => { S.ws[1].focus = id; return neighbor(dir); };
  assert.equal(from(b, 'down'), c);
  assert.equal(from(b, 'left'), a);
  assert.equal(from(c, 'up'), b);
  assert.equal(from(c, 'left'), a);
  assert.equal(from(c, 'right'), null);
  assert.equal(from(a, 'left'), null);
  assert.equal(from(a, 'up'), null);
});
