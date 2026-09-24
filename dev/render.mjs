// Renders templates/product.boarage-pdp.json with LiquidJS and Shopify shims into static HTML pages
// for local verification. This proves the markup/CSS/JS contract of the sections; it does not
// reproduce Shopify's money format, image CDN, fonts, the theme editor or app blocks.
import fs from 'node:fs';
import path from 'node:path';
import { Liquid } from 'liquidjs';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const OUT = path.join(ROOT, 'dev/out');
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

const product = readJson('dev/fixtures/product.json');
const translations = readJson('dev/fixtures/translations.json');
const template = readJson('templates/product.boarage-pdp.json');
const settingsSchema = readJson('config/settings_schema.json');

// ---------- theme settings (defaults from the Boarage PDP group) ----------
function themeSettings(overrides = {}) {
  const out = {};
  for (const group of settingsSchema) for (const s of group.settings || []) if (s.id && 'default' in s) out[s.id] = s.default;
  return { ...out, ...overrides };
}

// ---------- section schemas ----------
const sectionSources = {};
const sectionSchemas = {};
for (const file of fs.readdirSync(path.join(ROOT, 'sections'))) {
  const type = file.replace(/\.liquid$/, '');
  const src = fs.readFileSync(path.join(ROOT, 'sections', file), 'utf8');
  const m = src.match(/{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/);
  sectionSchemas[type] = m ? JSON.parse(m[1]) : {};
  sectionSources[type] = src.replace(/{%\s*schema\s*%}[\s\S]*?{%\s*endschema\s*%}/, '');
}

const FIXTURE_IMAGE = { src: '/img/photo.svg', width: 800, height: 600, alt: '', id: 'photo' };
function sampleValue(setting, mode, n) {
  const id = setting.id;
  const isText = ['text', 'textarea', 'richtext', 'inline_richtext', 'url', 'image_picker'].includes(setting.type);
  if (!isText) return 'default' in setting ? setting.default : (setting.type === 'checkbox' ? false : undefined);
  if (mode === 'empty') return setting.type === 'image_picker' ? null : '';
  if (id === 'match') return '';
  const tag = n == null ? id : `${id} ${n}`;
  switch (setting.type) {
    case 'richtext': return `<p>${tag} sample</p>`;
    case 'inline_richtext': return `${tag} <em>sample</em>`;
    case 'textarea': return /points/.test(id) ? `${tag} line one\n${tag} line two` : `${tag} sample`;
    case 'url': return `#${id}`;
    case 'image_picker': return { ...FIXTURE_IMAGE };
    default: return `${tag} sample`;
  }
}
function buildSection(id, entry, mode, design) {
  const schema = sectionSchemas[entry.type];
  if (!schema) throw new Error(`unknown section type ${entry.type}`);
  const settings = {};
  for (const s of schema.settings || []) if (s.id) settings[s.id] = sampleValue(s, mode);
  Object.assign(settings, entry.settings || {});
  const blocks = (entry.block_order || []).map((bid, n) => {
    const b = entry.blocks[bid];
    const attrs = design ? `data-shopify-editor-block="{&quot;id&quot;:&quot;${bid}&quot;,&quot;type&quot;:&quot;${b.type}&quot;}"` : '';
    if (b.type.startsWith('shopify://apps/')) return { id: bid, type: '@app', settings: {}, shopify_attributes: attrs, app_html: `<div class="fixture-app" data-app-block="${bid}">app block ${bid}</div>` };
    const def = (schema.blocks || []).find((x) => x.type === b.type);
    if (!def) throw new Error(`unknown block type ${b.type} in ${entry.type}`);
    const bs = {};
    for (const s of def.settings || []) if (s.id) bs[s.id] = sampleValue(s, mode, n + 1);
    Object.assign(bs, b.settings || {});
    return { id: bid, type: b.type, settings: bs, shopify_attributes: attrs };
  });
  return { id, type: entry.type, schema, settings, blocks };
}

// ---------- Liquid engine with Shopify shims ----------
const imageDims = new Map();
const missingKeys = new Set();
function kw(args) { const o = {}; for (const a of args) if (Array.isArray(a)) o[a[0]] = a[1]; return o; }
function money(cents) { const n = Number(cents) || 0; return (n / 100).toFixed(2).replace('.', ',') + ' €'; }
function preprocess(src) {
  return src
    .replace(/{%-?\s*style\s*-?%}/g, '<style data-shopify>')
    .replace(/{%-?\s*endstyle\s*-?%}/g, '</style>')
    .replace(/{%-?\s*render\s+block\s*-?%}/g, '{{ block.app_html }}')
    .replace(/{%-?\s*form\s+'product'\s*,\s*product\s*,\s*([^%]*?)\s*-?%}/g, (_, argstr) => {
      const attrs = argstr.split(/,(?![^']*'[^']*(?:'[^']*'[^']*)*$)/).map((s) => s.trim()).filter(Boolean).map((pair) => {
        const i = pair.indexOf(':');
        const k = pair.slice(0, i).trim(), v = pair.slice(i + 1).trim();
        return `${k}="${v.startsWith("'") ? v.slice(1, -1) : `{{ ${v} }}`}"`;
      }).join(' ');
      return `<form method="post" action="/cart/add" accept-charset="UTF-8" enctype="multipart/form-data" ${attrs}><input type="hidden" name="form_type" value="product"><input type="hidden" name="utf8" value="✓">`;
    })
    .replace(/{%-?\s*endform\s*-?%}/g, '</form>');
}
const engine = new Liquid({
  root: [path.join(ROOT, 'snippets')],
  partials: [path.join(ROOT, 'snippets')],
  extname: '.liquid',
  strictFilters: true,
  fs: {
    readFileSync: (p) => preprocess(fs.readFileSync(p, 'utf8')),
    readFile: async (p) => preprocess(await fs.promises.readFile(p, 'utf8')),
    existsSync: (p) => fs.existsSync(p),
    exists: async (p) => fs.existsSync(p),
    resolve: (root, file, ext) => path.resolve(root, path.extname(file) ? file : file + ext),
    contains: (root, file) => path.resolve(file).startsWith(path.resolve(root)),
    sep: path.sep,
    dirname: path.dirname,
  },
});
engine.registerFilter('money', money);
engine.registerFilter('money_with_currency', (c) => money(c) + ' EUR');
engine.registerFilter('image_url', (img, ...args) => {
  const src = typeof img === 'string' ? img : img && img.src;
  if (img && typeof img === 'object') imageDims.set(src, { width: img.width, height: img.height });
  void args;
  return src || '';
});
engine.registerFilter('image_tag', (src, ...args) => {
  const o = kw(args);
  const dims = imageDims.get(src) || { width: 800, height: 800 };
  const attrs = [`src="${src}"`, `width="${o.width || dims.width}"`, `height="${o.height || dims.height}"`, `alt="${String(o.alt ?? '').replace(/"/g, '&quot;')}"`];
  if (o.loading) attrs.push(`loading="${o.loading}"`);
  if (o.fetchpriority) attrs.push(`fetchpriority="${o.fetchpriority}"`);
  if (o.class) attrs.push(`class="${o.class}"`);
  if (o.sizes) attrs.push(`sizes="${o.sizes}"`);
  if (o.widths) attrs.push(`srcset="${String(o.widths).split(',').map((w) => `${src} ${w.trim()}w`).join(', ')}"`);
  return `<img ${attrs.join(' ')}>`;
});
engine.registerFilter('asset_url', (name) => `/assets/${name}`);
engine.registerFilter('payment_type_svg_tag', (type) => `<svg class="icon icon--full-color" viewBox="0 0 38 24" width="38" height="24" role="img" aria-labelledby="pi-${type}"><title id="pi-${type}">${type}</title><rect width="38" height="24" rx="3" fill="#dfe3e0"/></svg>`);
engine.registerFilter('stylesheet_tag', (href) => `<link rel="stylesheet" href="${href}">`);
engine.registerFilter('font_face', () => '');
engine.registerFilter('t', (key, ...args) => {
  const o = kw(args);
  let s = translations[key];
  if (s == null) { missingKeys.add(key); return `[missing translation: ${key}]`; }
  return s.replace(/{{\s*(\w+)\s*}}/g, (_, k) => (o[k] == null ? '' : String(o[k])));
});

// ---------- page assembly ----------
function svgMedia(label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="1200" height="1200"><rect width="240" height="240" fill="#d6ebe1"/><rect x="44" y="92" width="152" height="112" rx="18" fill="#fff" stroke="#1f4a3d" stroke-width="3"/><rect x="38" y="60" width="164" height="40" rx="10" fill="#1f4a3d"/><text x="120" y="152" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#1f4a3d">${label}</text></svg>`;
}
function shell({ title, body, mode, design }) {
  return `<!DOCTYPE html>
<html class="no-js" lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<style>
  /* Dawn/Shrine environment stub: 62.5% root font-size (1rem = 10px), theme colour/font variables on :root */
  :root { --font-body-family: Georgia, serif; --font-heading-family: Georgia, serif; --color-base-text: 29, 41, 37; --color-base-background-1: 255, 255, 255; }
  html { font-size: 62.5%; box-sizing: border-box; }
  *, *::before, *::after { box-sizing: inherit; }
  body { margin: 0; font-size: 1.5rem; font-family: var(--font-body-family); }
  details > summary { list-style: none; }
  .stub-header, .stub-footer { padding: 24px; background: #eee; font-family: sans-serif; }
  .stub-footer { min-height: 60vh; }
</style>
<script>
  /* Shrine/Dawn globals stubbed for the harness */
  window.PUB_SUB_EVENTS = { cartUpdate: 'cart-update', variantChange: 'variant-change' };
  window.__pub = []; window.publish = function (n, d) { window.__pub.push([n, d]); };
  window.__harness = { mode: ${JSON.stringify(mode)}, design: ${design} };
  customElements.define('cart-drawer', class extends HTMLElement {
    getSectionsToRender() { return [{ id: 'cart-drawer' }, { id: 'cart-icon-bubble' }]; }
    setActiveElement(el) { this.activeElement = el; }
    renderContents(res) { window.__cartRendered = res; this.setAttribute('data-rendered', '1'); }
  });
</script>
</head>
<body>
<header class="stub-header">Theme header stub</header>
<cart-drawer class="is-empty"></cart-drawer>
<main>
${body}
</main>
<footer class="stub-footer">Theme footer stub</footer>
</body>
</html>`;
}

async function renderPage({ name, mode, design, themeOverrides = {}, selectedVariant = null }) {
  const settings = themeSettings(themeOverrides);
  const request = { design_mode: design, locale: { iso_code: 'de' } };
  const routes = { cart_add_url: '/cart/add', cart_url: '/cart', root_url: '/' };
  const shop = { name: 'Fixture shop', money_format: '{{amount_with_comma_separator}} €', enabled_payment_types: ['visa', 'master', 'paypal', 'klarna'] };
  const prod = {
    ...product,
    selected_variant: selectedVariant ? product.variants.find((v) => v.id === selectedVariant) : null,
    selected_or_first_available_variant: product.variants.find((v) => v.available) || product.variants[0],
  };
  const rating = prod.metafields.reviews.rating.value;
  rating.toString = () => String(rating.rating);
  let body = '';
  for (const sid of template.order) {
    const section = buildSection(sid, template.sections[sid], mode, design);
    const html = await engine.parseAndRender(preprocess(sectionSources[section.type]), { section, product: prod }, { globals: { settings, request, routes, shop } });
    const tag = section.schema.tag || 'div';
    body += `<${tag} id="shopify-section-${sid}" class="shopify-section ${section.schema.class || ''}" data-section-type="${section.type}">${html}</${tag}>\n`;
  }
  const html = shell({ title: `Boarage PDP harness · ${name}`, body, mode, design });
  fs.writeFileSync(path.join(OUT, `${name}.html`), html);
  return html;
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'img'), { recursive: true });
for (const f of fs.readdirSync(path.join(ROOT, 'assets'))) fs.copyFileSync(path.join(ROOT, 'assets', f), path.join(OUT, 'assets', f));
for (const m of product.media) fs.writeFileSync(path.join(OUT, 'img', `media-${m.id}.svg`), svgMedia(`Fixture media ${m.id}`));
fs.writeFileSync(path.join(OUT, 'img', 'photo.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600"><rect width="800" height="600" fill="#f6e5cb"/><circle cx="400" cy="300" r="120" fill="#1f4a3d"/></svg>`);

const FILLED_THEME = { boarage_guarantee_title: 'Guarantee title sample', boarage_guarantee_text: '<p>Guarantee text sample</p>' };
const pages = [
  { name: 'empty-storefront', mode: 'empty', design: false },
  { name: 'empty-editor', mode: 'empty', design: true },
  { name: 'filled-storefront', mode: 'filled', design: false, themeOverrides: FILLED_THEME },
  { name: 'filled-editor', mode: 'filled', design: true, themeOverrides: FILLED_THEME },
  { name: 'filled-storefront-system', mode: 'filled', design: false, themeOverrides: { ...FILLED_THEME, boarage_dark_mode: 'system' } },
  { name: 'filled-storefront-perunit', mode: 'filled', design: false, selectedVariant: null, perUnit: true, themeOverrides: FILLED_THEME },
];
for (const p of pages) {
  if (p.perUnit) template.sections.boarage_buy_box.settings = { ...(template.sections.boarage_buy_box.settings || {}), price_mode: 'per_unit' };
  if (p.mode === 'filled') { template.sections.boarage_sale_bar.settings = { countdown_mode: 'daily' }; template.sections.boarage_reviews_list.settings = { initial_count: 2 }; }
  await renderPage(p);
  if (p.perUnit) delete template.sections.boarage_buy_box.settings.price_mode;
  template.sections.boarage_sale_bar.settings = {};
  template.sections.boarage_reviews_list.settings = {};
  console.log(`rendered dev/out/${p.name}.html`);
}
if (missingKeys.size) { console.error('missing translations:', [...missingKeys].join(', ')); process.exit(1); }
