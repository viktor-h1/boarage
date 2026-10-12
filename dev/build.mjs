// Builds the two shipped assets from their readable sources in dev/src:
//   dev/src/boarage-pdp.css -> assets/boarage-pdp.css (csso)
//   dev/src/boarage-pdp.js  -> assets/boarage-pdp.js  (terser)
// The sources are what you edit; the assets must stay under the theme-check budgets (25 KB CSS, 10 KB JS).
import fs from 'node:fs';
import { minify as minifyCss } from 'csso';
import { minify as minifyJs } from 'terser';

// Custom properties used only inside the stylesheet are shortened (--bpdp-ink -> --_ink) to stay within the budget.
// Names that Liquid or the script read or set (the --bpdp-c-* settings, --bpdp-x, --bpdp-cols, …) keep their full name.
const external = new Set();
for (const dir of ['sections', 'snippets']) {
  for (const f of fs.readdirSync(dir)) for (const m of fs.readFileSync(`${dir}/${f}`, 'utf8').matchAll(/--bpdp-[a-z0-9-]+/g)) external.add(m[0]);
}
for (const m of fs.readFileSync('dev/src/boarage-pdp.js', 'utf8').matchAll(/--bpdp-[a-z0-9-]+/g)) external.add(m[0]);
const cssSrc = fs.readFileSync('dev/src/boarage-pdp.css', 'utf8')
  .replace(/--bpdp-[a-z0-9-]+/g, (name) => (external.has(name) || name.startsWith('--bpdp-c-') ? name : '--_' + name.slice(7)));
const css = minifyCss(cssSrc, { restructure: true }).css;
const cssHead = '/* Boarage PDP styles. Built from dev/src/boarage-pdp.css by `npm run build`; edit the source, not this file. */\n';
fs.writeFileSync('assets/boarage-pdp.css', cssHead + css + '\n');

const jsSrc = fs.readFileSync('dev/src/boarage-pdp.js', 'utf8');
const js = (await minifyJs(jsSrc, { compress: { passes: 2 }, mangle: true, format: { comments: false } })).code;
const jsHead = '/* Boarage PDP script. Built from dev/src/boarage-pdp.js by `npm run build`; edit the source, not this file. */\n';
fs.writeFileSync('assets/boarage-pdp.js', jsHead + js + '\n');

for (const f of ['assets/boarage-pdp.css', 'assets/boarage-pdp.js']) console.log(`${f}: ${fs.statSync(f).size} bytes`);
