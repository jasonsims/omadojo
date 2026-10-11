// Smoke test: plays every lesson and a batch of drill prompts with real key events.
// Usage: npm i -D playwright && npx playwright install chromium && node tests/smoke.js
// Set CHROMIUM_PATH to use an existing Chromium binary instead.
const { chromium } = require('playwright');
const path = require('path');

const KEY = { super: 'Meta', ctrl: 'Control', alt: 'Alt', shift: 'Shift', return: 'Enter', space: 'Space',
  escape: 'Escape', tab: 'Tab', backspace: 'Backspace', delete: 'Delete', minus: 'Minus', equal: 'Equal',
  slash: 'Slash', comma: 'Comma', period: 'Period', backquote: 'Backquote',
  left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown' };
const toPw = combo => combo.split('+').map(k => KEY[k] || (/^\d$/.test(k) ? 'Digit' + k : 'Key' + k.toUpperCase())).join('+');

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage({ viewport: { width: 1300, height: 860 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html') + '#debug');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(300);

  // Lessons: press the first listed key for every step and expect the lesson to finish.
  const lessons = await page.evaluate(() => __od.lessons);
  for (let i = 0; i < lessons; i++) {
    await page.evaluate(i => __od.startLesson(i), i);
    for (let s = 0; s < 40; s++) {
      const combo = await page.evaluate(() => __od.L.done ? null : __od.lessonKey());
      if (!combo) break;
      await page.keyboard.press(toPw(combo));
      await page.waitForTimeout(60);
    }
    const done = await page.evaluate(() => __od.L.done);
    console.log(`lesson ${i + 1}: ${done ? 'ok' : 'FAILED'}`);
    if (!done) errors.push(`lesson ${i + 1} did not finish`);
  }

  // Drill: answer 40 prompts correctly across every deck.
  await page.click('[data-mode="drill"]');
  for (const deck of ['groups', 'apps', 'system']) await page.click(`[data-deck="${deck}"]`);
  let ok = 0;
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(700);
    const combo = await page.evaluate(() => __od.D.item && __od.D.item.keys[0]);
    if (!combo) continue;
    await page.keyboard.press(toPw(combo));
    await page.waitForTimeout(40);
    if (await page.evaluate(() => __od.D.cool)) ok++;
    else errors.push('drill prompt not accepted: ' + combo);
  }
  console.log(`drill: ${ok}/40`);

  // Phone width must not scroll sideways.
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await phone.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  const sw = await phone.evaluate(() => document.documentElement.scrollWidth);
  if (sw > 390) errors.push('horizontal scroll at 390px: ' + sw);

  await browser.close();
  if (errors.length) { console.error('FAIL\n' + errors.join('\n')); process.exit(1); }
  console.log('PASS');
})();
