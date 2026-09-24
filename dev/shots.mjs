// Captures viewport-sized screenshots of the filled render (mobile segments + desktop segments) into dev/out/shots.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { startServer } from './serve.mjs';
const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const OUT = path.join(ROOT, 'dev/out/shots');
fs.mkdirSync(OUT, { recursive: true });
const { server, url } = await startServer(path.join(ROOT, 'dev/out'));
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = process.argv[2] || 'filled-storefront';
for (const [tag, ctxOpts, w, h] of [['mobile', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }, 390, 844], ['desktop', { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 }, 1280, 900]]) {
  const ctx = await browser.newContext(ctxOpts); const p = await ctx.newPage();
  await p.goto(`${url}/${page}.html`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
  const total = await p.evaluate(() => document.documentElement.scrollHeight);
  let i = 0;
  for (let y = 0; y < total && i < 30; y += h, i++) {
    await p.evaluate((yy) => window.scrollTo(0, yy), y);
    await p.waitForTimeout(350);
    await p.screenshot({ path: path.join(OUT, `${page}-${tag}-${String(i).padStart(2, '0')}.png`) });
  }
  console.log(`${tag}: ${i} shots (${total}px)`);
  await ctx.close();
}
await browser.close(); server.close();
