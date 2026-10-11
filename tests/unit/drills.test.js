// Every drill prompt must be possible: after the coach runs the item's ensure(), pressing its keys has to
// change the desktop. A prompt that does nothing ("Move focus left" with nothing on the left) teaches nothing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../../src/actions/index.js';
import { ACTS, runAction } from '../../src/actions/act.js';
import { prep } from '../../src/actions/ensure.js';
import { fresh, S } from '../../src/model/desktop.js';
import { rnd } from '../../src/lib/util.js';
import { CFG } from '../../src/config.js';

const DRILLS = ACTS.filter(a => a.drill && a.ask);
// These only flash a message in the simulation.
const MESSAGE_ONLY = new Set(['paste', 'cut']);
// Same order as the coach: ensure() (or prep()), then the key press.
const drill = a => { if (a.ensure) a.ensure(); else prep(); };
// The desktop plus settings a shortcut can change (the background lives in CFG). On-screen messages don't count.
const snapshot = () => JSON.stringify({ S, CFG }, (k, v) => (k === 'osd' ? undefined : v));

test('the drill pool covers every deck', () => {
  assert.deepEqual([...new Set(DRILLS.map(a => a.deck))].sort(), ['apps', 'basics', 'groups', 'system', 'tiling', 'workspaces']);
});

for (const a of DRILLS) {
  test(`drill "${a.id}" (${a.keys[0]}) changes the desktop after ensure()`, () => {
    for (let trial = 0; trial < 15; trial++) {
      // Start from a lived-in desktop: a few earlier drills, as in a real session.
      fresh();
      const history = Array.from({ length: trial % 4 }, () => rnd(DRILLS));
      for (const h of history) { drill(h); runAction(h); }
      drill(a);
      const ask = typeof a.ask === 'function' ? a.ask() : a.ask;
      assert.ok(ask, 'prompt text is empty');
      const before = snapshot();
      runAction(a);
      if (MESSAGE_ONLY.has(a.id)) continue;
      assert.ok(snapshot() !== before, `"${ask}" did nothing after: ${history.map(h => h.id).join(', ') || 'a fresh desktop'}`);
    }
  });
}
