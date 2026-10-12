// The can't-train-here table: every entry must name a real Omarchy binding, and the drill pool must never
// ask for a shortcut the user's OS takes before the page sees it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BIND } from '../../src/actions/index.js';
import { canon } from '../../src/lib/keys.js';
import { CFG } from '../../src/config.js';
import { availKeys, blocked, CONFLICTS, host, trainable } from '../../src/input/host.js';
import { poolActs } from '../../src/coach/state.js';

const withSettings = (o, fn) => {
  const saved = { plat: CFG.plat, input: CFG.input, keylock: host.keylock };
  Object.assign(CFG, { plat: o.plat ?? null, input: o.input ?? 'keys' });
  host.keylock = !!o.keylock;
  try { fn(); } finally { CFG.plat = saved.plat; CFG.input = saved.input; host.keylock = saved.keylock; }
};

for (const [plat, table] of Object.entries(CONFLICTS)) {
  test(`${plat}: every conflict is a canonical, bound Omarchy shortcut`, () => {
    for (const combo of Object.keys(table)) {
      assert.equal(canon(combo), combo, `${combo} is not canonical`);
      assert.ok(BIND[combo], `${combo} is not bound to any action`);
    }
  });

  test(`${plat}: the drill pool only holds shortcuts that reach the page`, () => {
    withSettings({ plat }, () => {
      CFG.decks = ['basics', 'tiling', 'workspaces', 'groups', 'apps', 'system'];
      const pool = poolActs();
      assert.ok(pool.length > 20, `only ${pool.length} drills left on ${plat}`);
      for (const a of pool) assert.ok(availKeys(a).length, `${a.id} has no key that reaches the page`);
    });
  });
}

test('mac: Cmd+Q and Cmd+W are dangerous, so "Close window" cannot be trained', () => {
  withSettings({ plat: 'mac' }, () => {
    assert.equal(blocked('super+q').danger, true);
    assert.equal(blocked('super+w').danger, true);
    assert.equal(trainable(BIND['super+w']), false);
    assert.equal(blocked('super+return'), null);
  });
});

test('a shortcut with one free key stays trainable on that key', () => {
  withSettings({ plat: 'mac' }, () => {
    const scratch = BIND['super+s'];
    assert.deepEqual(availKeys(scratch), ['super+s']);
    assert.equal(trainable(scratch), true);
  });
});

test('windows: Lock keys frees lockable shortcuts but never Win+L or Ctrl+Alt+Delete', () => {
  withSettings({ plat: 'win', keylock: true }, () => {
    assert.equal(blocked('super+tab'), null);
    assert.equal(blocked('alt+tab'), null);
    assert.ok(blocked('super+l'));
    assert.ok(blocked('ctrl+alt+delete'));
  });
  withSettings({ plat: 'win' }, () => assert.ok(blocked('super+tab')));
});

test('tap mode ignores conflicts', () => {
  withSettings({ plat: 'mac', input: 'taps' }, () => assert.equal(blocked('super+q'), null));
});
