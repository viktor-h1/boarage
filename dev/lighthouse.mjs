// Runs Lighthouse (mobile) against the locally rendered pages. This is a component-level proxy for the
// live check: the store is unreachable from the build environment. Gates: performance ≥ 90, accessibility ≥ 90.
import path from 'node:path';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { startServer } from './serve.mjs';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
process.env.CHROME_PATH = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const { server, url } = await startServer(path.join(ROOT, 'dev/out'));
const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] });
let failed = false;
try {
  for (const page of ['empty-storefront', 'filled-storefront']) {
    const result = await lighthouse(`${url}/${page}.html`, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices'] });
    const cats = result.lhr.categories;
    const perf = Math.round(cats.performance.score * 100), a11y = Math.round(cats.accessibility.score * 100), bp = Math.round(cats['best-practices'].score * 100);
    const audits = result.lhr.audits;
    const cls = audits['cumulative-layout-shift']?.numericValue, lcp = audits['largest-contentful-paint']?.numericValue, tbt = audits['total-blocking-time']?.numericValue;
    console.log(`${page}: performance ${perf}, accessibility ${a11y}, best-practices ${bp} | LCP ${Math.round(lcp)} ms, TBT ${Math.round(tbt)} ms, CLS ${cls?.toFixed(3)}`);
    const a11yFails = Object.values(audits).filter((a) => a.score !== null && a.score < 1 && cats.accessibility.auditRefs.some((r) => r.id === a.id)).map((a) => a.id);
    if (a11yFails.length) console.log(`  accessibility audits below 1: ${a11yFails.join(', ')}`);
    for (const id of a11yFails) for (const item of audits[id].details?.items || []) console.log(`    ${id}: ${item.node?.selector} — ${item.node?.explanation?.split('\n')[0] || ''}`);
    if (perf < 90 || a11y < 90) failed = true;
  }
} finally {
  await chrome.kill();
  server.close();
}
process.exit(failed ? 1 : 0);
