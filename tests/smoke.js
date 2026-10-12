// Smoke test: plays every lesson and a batch of drill prompts with real key events on Linux, Mac and Windows.
// Usage: npm install && npx playwright install chromium && npm run smoke
// Set CHROMIUM_PATH to use an existing Chromium binary instead.
import { chromium } from 'playwright';
import { serve } from '../scripts/serve.js';

const KEY = { super: 'Meta', ctrl: 'Control', alt: 'Alt', shift: 'Shift', return: 'Enter', space: 'Space',
  escape: 'Escape', tab: 'Tab', backspace: 'Backspace', delete: 'Delete', minus: 'Minus', equal: 'Equal',
  slash: 'Slash', comma: 'Comma', period: 'Period', backquote: 'Backquote',
  left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown' };
const toPw = combo => combo.split('+').map(k => KEY[k] || (/^\d$/.test(k) ? 'Digit' + k : 'Key' + k.toUpperCase())).join('+');

(async () => {
  const server = await serve();
  const url = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage({ viewport: { width: 1300, height: 860 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url + '#debug');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(300);

  // Every lesson and 40 drill prompts on each platform. A lesson step the OS would take must offer
  // "Do it for me"; a drill must never ask for a shortcut that can't reach the page.
  async function run(plat) {
    await page.evaluate(plat => localStorage.setItem('omadojo.cfg', JSON.stringify({ plat, seenSetup: true })), plat);
    await page.reload();
    await page.waitForFunction(() => window.__od);
    const lessons = await page.evaluate(() => __od.lessons);
    let autos = 0;
    for (let i = 0; i < lessons; i++) {
      await page.evaluate(i => __od.startLesson(i), i);
      for (let s = 0; s < 40; s++) {
        const combo = await page.evaluate(() => __od.L.done ? null : __od.lessonKey());
        if (!combo) break;
        if (combo === 'blocked') { await page.click('[data-auto]'); autos++; }
        else await page.keyboard.press(toPw(combo));
        await page.waitForTimeout(60);
      }
      if (!await page.evaluate(() => __od.L.done)) errors.push(`${plat}: lesson ${i + 1} did not finish`);
    }

    await page.click('[data-mode="drill"]');
    for (const deck of ['groups', 'apps', 'system']) {
      if (await page.getAttribute(`[data-deck="${deck}"]`, 'aria-pressed') !== 'true') await page.click(`[data-deck="${deck}"]`);
    }
    let ok = 0;
    for (let i = 0; i < 40; i++) {
      // Wait for the next prompt rather than a fixed delay; the engine moves on 650 ms after a hit.
      const ready = await page.waitForFunction(() => __od.D.item && !__od.D.cool, null, { timeout: 5000 }).catch(() => null);
      if (!ready) { errors.push(`${plat}: no drill prompt after answer ${i}`); break; }
      const [keys, avail, right] = await page.evaluate(() => [__od.D.item.keys, __od.D.item.keys.filter(k => !__od.blocked(k)), __od.D.right]);
      if (!avail.length) { errors.push(`${plat}: drill asked for ${keys[0]}, which can't reach the page`); break; }
      await page.keyboard.press(toPw(avail[0]));
      // Count the hit itself; D.cool resets as soon as the next prompt appears.
      if (await page.evaluate(r => __od.D.right > r, right)) ok++;
      else errors.push(`${plat}: drill prompt not accepted: ${avail[0]}`);
    }

    // Every mode and the Key setup drawer must render on this platform.
    for (const mode of ['keys', 'free', 'blitz', 'learn']) await page.click(`[data-mode="${mode}"]`);
    await page.click('#bSetup');
    const listed = await page.$$eval('#blist > div', d => d.length);
    await page.click('#bSetup');
    console.log(`${plat}: ${lessons} lessons (${autos} steps done for you), drill ${ok}/40, ${listed} can't-train shortcuts listed`);
  }
  for (const plat of ['linux', 'mac', 'win']) await run(plat);

  // Phone width must not scroll sideways.
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await phone.goto(url);
  const sw = await phone.evaluate(() => document.documentElement.scrollWidth);
  if (sw > 390) errors.push('horizontal scroll at 390px: ' + sw);

  await browser.close();
  server.close();
  if (errors.length) { console.error('FAIL\n' + errors.join('\n')); process.exit(1); }
  console.log('PASS');
})();
