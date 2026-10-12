// Playwright checks for the Boarage PDP against the locally rendered pages (run `node dev/render.mjs` first).
// Covers the build spec's acceptance checks 2-6 plus byte budgets, layout shift, dark mode, carousels,
// countdown, load-more and structured data.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { startServer } from './serve.mjs';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const results = [];
function check(name, pass, detail = '') { results.push({ name, pass: !!pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); }

const { server, url } = await startServer(path.join(ROOT, 'dev/out'));
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const MOBILE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
const DESKTOP = { viewport: { width: 1280, height: 900 } };
const SHOTS = path.join(ROOT, 'dev/out/shots');
fs.mkdirSync(SHOTS, { recursive: true });

try {
  // ---------- budgets ----------
  const css = fs.statSync(path.join(ROOT, 'assets/boarage-pdp.css')).size, js = fs.statSync(path.join(ROOT, 'assets/boarage-pdp.js')).size;
  check('CSS under 25 KB', css < 25000, `${css} bytes`);
  check('JS under 10 KB', js < 10000, `${js} bytes`);

  // ---------- check 2: empty template ----------
  {
    const ctx = await browser.newContext(MOBILE); const page = await ctx.newPage();
    const errors = []; page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${url}/empty-storefront.html`);
    const info = await page.evaluate(() => {
      const sections = [...document.querySelectorAll('.shopify-section')];
      return {
        total: sections.length,
        nonEmpty: sections.filter((s) => s.textContent.trim() !== '' || s.querySelector('img')).map((s) => s.dataset.sectionType),
        placeholders: document.querySelectorAll('.bpdp-ph').length,
        text: document.body.innerText,
        hasBuyBox: !!document.querySelector('#boarage-buy-box .bpdp-btn--cta'),
      };
    });
    check('Empty storefront: only the buy box renders', info.total === 14 && info.nonEmpty.length === 1 && info.nonEmpty[0] === 'boarage-pdp-02-buy-box', info.nonEmpty.join(','));
    check('Empty storefront: buy box has a working button', info.hasBuyBox);
    check('Empty storefront: no placeholders leak', info.placeholders === 0);
    check('No "undefined" / lorem / missing translations in output', !/undefined|lorem|missing translation/i.test(info.text), '');
    check('No page errors on load', errors.length === 0, errors.join('; '));
    await page.screenshot({ path: path.join(SHOTS, 'empty-mobile.png'), fullPage: true });
    await page.goto(`${url}/empty-editor.html`);
    const ed = await page.evaluate(() => ({
      sectionsWithPlaceholder: [...document.querySelectorAll('.shopify-section')].filter((s) => s.querySelector('.bpdp-ph')).length,
      labels: [...document.querySelectorAll('.bpdp-ph')].map((e) => e.textContent.trim()).filter((t) => /^\d\d ·/.test(t)).length,
    }));
    check('Empty editor: every section shows a labeled placeholder', ed.sectionsWithPlaceholder === 14, `${ed.sectionsWithPlaceholder}/14`);
    check('Empty editor: 13 numbered section labels (all but the buy box)', ed.labels === 13, `${ed.labels}`);
    await page.screenshot({ path: path.join(SHOTS, 'empty-editor-mobile.png'), fullPage: true });
    await ctx.close();
  }

  // ---------- check 3: variant switching, sticky bar, add to cart ----------
  {
    const ctx = await browser.newContext(MOBILE); const page = await ctx.newPage();
    const errors = []; page.on('pageerror', (e) => errors.push(e.message));
    let cartPost = null;
    await page.route('**/cart/add', async (route) => {
      cartPost = route.request().postDataBuffer().toString();
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 2002, variant_id: 2002, quantity: 1, sections: {} }) });
    });
    await page.goto(`${url}/filled-storefront.html`);
    await page.waitForFunction(() => window.BoaragePDP);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SHOTS, 'filled-mobile.png'), fullPage: true });
    const st = () => page.evaluate(() => {
      const q = (s) => document.querySelector(s);
      return {
        id: q('[data-bpdp-id]').value, plan: q('[data-bpdp-plan]').value, planOff: q('[data-bpdp-plan]').disabled,
        price: q('[data-bpdp-price]').textContent, was: q('[data-bpdp-was]').hidden ? '' : q('[data-bpdp-was]').textContent,
        subPrice: q('[data-bpdp-sub-price]').textContent, oncePrice: q('[data-bpdp-once-price]').textContent,
        points: !q('[data-bpdp-points]').hidden && q('[data-bpdp-points]').offsetHeight > 0, supplies: !q('[data-bpdp-supplies]').hidden && q('[data-bpdp-supplies]').offsetHeight > 0,
        cta: q('[data-bpdp-cta-label]').textContent, ctaPrice: q('[data-bpdp-cta-price]').textContent, ctaOff: q('[data-bpdp-cta]').disabled,
        stickyPrice: q('[data-bpdp-sticky-price]').textContent, stickyLabel: q('[data-bpdp-sticky-label]').textContent,
        stockHidden: q('[data-bpdp-stock]').hidden, url: location.search, nav: performance.getEntriesByType('navigation').length,
        saves: [...document.querySelectorAll('[data-bpdp-save]')].map((e) => (e.hidden ? '' : e.textContent)),
        supplyPrices: [...document.querySelectorAll('[data-bpdp-sp]')].map((e) => e.textContent),
        selected: [...document.querySelectorAll('.bpdp-opt')].filter((l) => l.querySelector(':checked')).map((l) => getComputedStyle(l).borderColor).length,
        scroll: q('[data-bpdp-gallery] [data-bpdp-track]').scrollLeft,
        groups: [...document.querySelectorAll('fieldset.bpdp-opts')].map((f) => f.getAttribute('role')),
        live: q('[data-bpdp-price]').closest('[aria-live]').getAttribute('aria-live'),
      };
    });
    const counts = await page.evaluate(() => ({ w: document.querySelectorAll('[data-bpdp-w]').length, p: document.querySelectorAll('[data-bpdp-p]').length, s: document.querySelectorAll('[data-bpdp-s]').length }));
    check('Purchase selector: 3 weight cards, subscribe + one-time cards, 3 supply cards', counts.w === 3 && counts.p === 2 && counts.s === 3, JSON.stringify(counts));
    const s0 = await st();
    check('On load: subscription selected, points shown, supply cards hidden, 1-month variant with the selling plan', s0.id === '2001' && s0.plan === '501' && !s0.planOff && s0.points && !s0.supplies && /25,49/.test(s0.price) && /29,99/.test(s0.was) && /25,49/.test(s0.ctaPrice), JSON.stringify({ id: s0.id, price: s0.price, was: s0.was, points: s0.points, supplies: s0.supplies }));
    check('Option groups are radiogroups and the price has a polite live region', s0.groups.length === 3 && s0.groups.every((r) => r === 'radiogroup') && s0.live === 'polite');
    await page.locator('label.bpdp-wopt').nth(1).click(); await page.waitForTimeout(700);
    const s1 = await st();
    check('Weight switch updates the subscription and one-time prices without reload', s1.id === '2004' && /33,99/.test(s1.subPrice) && /39,99/.test(s1.oncePrice) && /33,99/.test(s1.price) && /33,99/.test(s1.ctaPrice) && s1.nav === 1, `${s0.subPrice} → ${s1.subPrice} / ${s1.oncePrice}`);
    check('Weight switch updates ?variant= and ?selling_plan= in the URL', /variant=2004/.test(s1.url) && /selling_plan=501/.test(s1.url), s1.url);
    check('Weight switch scrolls the gallery to the variant image', s1.scroll > s0.scroll, `${s0.scroll} → ${s1.scroll}`);
    check('Weight switch updates the sticky bar', /33,99/.test(s1.stickyPrice) && s1.stickyLabel === (await page.evaluate(() => document.querySelector('[data-bpdp-buybox]').getAttribute('data-bpdp-sticky-default'))), `${s1.stickyPrice} / ${s1.stickyLabel}`);
    await page.locator('label.bpdp-popt').nth(1).click(); await page.waitForTimeout(300);
    const s2 = await st();
    check('One-time: points hide, supply cards appear, selling plan is dropped, one-time price', !s2.points && s2.supplies && s2.planOff && s2.id === '2004' && /39,99/.test(s2.price) && !s2.was && !/selling_plan/.test(s2.url), JSON.stringify({ points: s2.points, supplies: s2.supplies, planOff: s2.planOff, price: s2.price, url: s2.url }));
    check('Supply cards show this weight\'s prices and the computed saving (Save [percent]%)', /39,99/.test(s2.supplyPrices[0]) && /69,99/.test(s2.supplyPrices[1]) && /93,99/.test(s2.supplyPrices[2]) && s2.saves[0] === '' && s2.saves[1] === 'Save 12%' && s2.saves[2] === 'Save 22%', `${s2.supplyPrices.join(' / ')} | ${s2.saves.join(' / ')}`);
    await page.locator('[data-bpdp-supplies] label').nth(2).click(); await page.waitForTimeout(300);
    const s3 = await st();
    check('Supply card selects the 3-month variant and updates price, CTA and sticky bar', s3.id === '2006' && /93,99/.test(s3.price) && /93,99/.test(s3.ctaPrice) && /93,99/.test(s3.stickyPrice) && /variant=2006/.test(s3.url), `${s3.id} ${s3.price}`);
    await page.locator('label.bpdp-wopt').nth(2).click(); await page.waitForTimeout(300);
    const s4 = await st();
    check('Sold-out variant disables the CTA with the sold-out label and hides the stock line', s4.id === '2009' && s4.ctaOff && s4.cta === 'Ausverkauft' && s4.stockHidden && /117,99/.test(s4.supplyPrices[2]), `${s4.id} ${s4.cta}`);
    check('Exactly one card is selected per group', s4.selected === 3, String(s4.selected));
    const beforeScroll = await page.evaluate(() => document.querySelector('[data-bpdp-sticky]').hidden);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2)); await page.waitForTimeout(400);
    const afterScroll = await page.evaluate(() => { const b = document.querySelector('[data-bpdp-sticky]'); const cs = getComputedStyle(b); return { hidden: b.hidden, mounted: b.hasAttribute('data-mounted'), opacity: cs.opacity, transform: cs.transform, bottom: b.getBoundingClientRect().bottom <= innerHeight + 1 }; });
    check('Sticky bar hidden on load, mounted after the first scroll past the CTA', beforeScroll && !afterScroll.hidden && afterScroll.mounted && afterScroll.opacity === '1' && afterScroll.bottom, JSON.stringify(afterScroll));
    await page.screenshot({ path: path.join(SHOTS, 'filled-mobile-sticky.png') });
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(400);
    check('Sticky bar hides again when the CTA is back in view', await page.evaluate(() => document.querySelector('[data-bpdp-sticky]').hidden));
    const field = (n) => { const m = (cartPost || '').match(new RegExp(`name="${n}"\\r?\\n\\r?\\n([^\\r\\n]*)`)); return m ? m[1] : null; };
    await page.locator('label.bpdp-wopt').nth(1).click(); await page.locator('[data-bpdp-supplies] label').nth(1).click(); await page.waitForTimeout(150);
    await page.locator('[data-bpdp-cta]').click();
    await page.waitForFunction(() => window.__cartRendered);
    check('Add to cart (one-time) posts the 2-month variant without a selling plan and renders the cart drawer', field('id') === '2005' && field('selling_plan') === null && field('quantity') === '1' && field('sections') === 'cart-drawer,cart-icon-bubble', `id=${field('id')} selling_plan=${field('selling_plan')} sections=${field('sections')}`);
    await page.evaluate(() => { window.__cartRendered = null; });
    await page.locator('label.bpdp-popt').nth(0).click(); await page.waitForTimeout(150);
    await page.locator('[data-bpdp-cta]').click();
    await page.waitForFunction(() => window.__cartRendered);
    check('Add to cart (subscription) posts the 1-month variant with the selling plan', field('id') === '2004' && field('selling_plan') === '501', `id=${field('id')} selling_plan=${field('selling_plan')}`);
    // gallery, tiles, payment icons, guarantee, accordions inside the buy box
    const buy = await page.evaluate(() => ({
      tiles: document.querySelectorAll('.bpdp-gal__hero .bpdp-tile').length,
      slides: document.querySelectorAll('[data-bpdp-gallery] .bpdp-gal__slide').length,
      seals: document.querySelectorAll('.bpdp-seal').length,
      pay: document.querySelectorAll('.bpdp-pay svg').length,
      guarantee: !!document.querySelector('#boarage-buy-box .bpdp-guarantee'),
      accordions: document.querySelectorAll('#boarage-buy-box details[data-bpdp-acc]').length,
      thumbsVisible: getComputedStyle(document.querySelector('.bpdp-thumbs')).display !== 'none',
    }));
    check('Buy box: hero slide with 3 tiles + 3 more image slides, 2 seals, 4 payment icons, guarantee, 4 accordions, no thumbnails on mobile', buy.tiles === 3 && buy.slides === 4 && buy.seals === 2 && buy.pay === 4 && buy.guarantee && buy.accordions === 4 && !buy.thumbsVisible, JSON.stringify(buy));
    // countdown
    const c1 = await page.evaluate(() => document.querySelector('[data-bpdp-countdown] [data-u="s"]').textContent);
    await page.waitForTimeout(1100);
    const c2 = await page.evaluate(() => ({ s: document.querySelector('[data-bpdp-countdown] [data-u="s"]').textContent, hidden: document.querySelector('[data-bpdp-countdown]').hidden }));
    check('Countdown ticks every second', /^\d\d$/.test(c1) && /^\d\d$/.test(c2.s) && c1 !== c2.s && !c2.hidden, `${c1} → ${c2.s}`);
    // reviews carousel controls
    const car = await page.evaluate(async () => {
      const root = document.querySelector('#shopify-section-boarage_reviews [data-bpdp-carousel]');
      const track = root.querySelector('[data-bpdp-track]'), next = root.querySelector('[data-bpdp-next]'), prev = root.querySelector('[data-bpdp-prev]'), bar = root.querySelector('[data-bpdp-bar] i');
      const before = { x: track.scrollLeft, prevDisabled: prev.disabled, bar: getComputedStyle(bar).transform };
      next.click();
      await new Promise((r) => setTimeout(r, 700));
      return { before, after: { x: track.scrollLeft, prevDisabled: prev.disabled, bar: getComputedStyle(bar).transform }, cards: track.children.length };
    });
    check('Reviews carousel: next scrolls the track, enables prev and moves the progress bar', car.before.x === 0 && car.before.prevDisabled && car.after.x > 0 && !car.after.prevDisabled && car.after.bar !== car.before.bar && car.cards === 4, JSON.stringify(car));
    const navMobile = await page.evaluate(() => getComputedStyle(document.querySelector('#shopify-section-boarage_reviews .bpdp-nav')).display !== 'none');
    check('Reviews carousel arrows are visible on mobile', navMobile);
    // load more reviews
    const lm = await page.evaluate(async () => {
      const list = document.querySelector('[data-bpdp-more-target]'), btn = document.querySelector('[data-bpdp-more]');
      const before = [...list.children].filter((li) => !li.hidden).length;
      btn.click();
      await new Promise((r) => setTimeout(r, 50));
      return { before, after: [...list.children].filter((li) => !li.hidden).length, btnHidden: btn.parentNode.hidden, total: list.children.length };
    });
    check('Reviews list: "load more" reveals the hidden reviews', lm.before === 2 && lm.after === 3 && lm.total === 3 && lm.btnHidden, JSON.stringify(lm));
    check('No page errors during interaction', errors.length === 0, errors.join('; '));
    await ctx.close();
  }

  // ---------- ?variant= of a multi-month supply opens on one-time ----------
  {
    const ctx = await browser.newContext(MOBILE); const page = await ctx.newPage();
    await page.goto(`${url}/filled-storefront-onetime.html`);
    await page.waitForFunction(() => window.BoaragePDP);
    const r = await page.evaluate(() => ({ id: document.querySelector('[data-bpdp-id]').value, planOff: document.querySelector('[data-bpdp-plan]').disabled, once: document.querySelector('[data-bpdp-p][value="once"]').checked, w: document.querySelector('[data-bpdp-w]:checked').value, s: document.querySelector('[data-bpdp-s]:checked').value, price: document.querySelector('[data-bpdp-price]').textContent, supplies: !document.querySelector('[data-bpdp-supplies]').hidden }));
    check('?variant=2005 opens on one-time with 21–50 lb and the 2-month card', r.id === '2005' && r.planOff && r.once && r.w === '21–50 lb' && r.s === '2-month supply' && /69,99/.test(r.price) && r.supplies, JSON.stringify(r));
    await ctx.close();
  }

  // ---------- check 4: accordion timing, desktop layout ----------
  {
    const ctx = await browser.newContext(DESKTOP); const page = await ctx.newPage();
    await page.goto(`${url}/filled-storefront.html`);
    await page.waitForFunction(() => window.BoaragePDP);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SHOTS, 'filled-desktop.png'), fullPage: true });
    const t = await page.evaluate(async () => {
      const det = document.querySelector('#shopify-section-boarage_faq details[data-bpdp-acc]');
      const grid = det.querySelector('.bpdp-acc__grid'), sum = det.querySelector('summary');
      const wait = (prop) => new Promise((res) => { const t0 = performance.now(); grid.addEventListener('transitionend', function h(e) { if (e.propertyName === prop) { grid.removeEventListener('transitionend', h); res(performance.now() - t0); } }); });
      sum.click(); const openMs = await wait('grid-template-rows');
      const openDur = getComputedStyle(grid).transitionDuration;
      const openState = { open: det.open, rows: getComputedStyle(grid).gridTemplateRows, opacity: getComputedStyle(grid).opacity };
      sum.click(); const closedDur = getComputedStyle(grid).transitionDuration; const closeMs = await wait('grid-template-rows');
      await new Promise((r) => setTimeout(r, 50));
      return { closedDur, openDur, openMs, closeMs, openState, closedNow: !det.open, iconTransform: getComputedStyle(det.querySelector('.bpdp-acc__icon')).transform };
    });
    check('Accordion open uses 220 ms, close uses 150 ms (grid-template-rows + opacity)', t.openDur.startsWith('0.22s') && t.closedDur.startsWith('0.15s'), `${t.openDur} / ${t.closedDur}`);
    check('Accordion close is faster than open and ends with details closed', t.closeMs < t.openMs && t.closedNow && t.openState.open && t.openState.opacity === '1', `open ${t.openMs.toFixed(0)} ms, close ${t.closeMs.toFixed(0)} ms`);
    check('Accordion plus icon rotates with transform (no glyph swap)', t.iconTransform === 'none' || t.iconTransform.startsWith('matrix'));
    const jsonld = await page.evaluate(() => { const s = document.querySelector('#shopify-section-boarage_faq script[type="application/ld+json"]'); return s ? JSON.parse(s.textContent) : null; });
    check('FAQ emits FAQPage JSON-LD for the 6 filled entries', jsonld && jsonld['@type'] === 'FAQPage' && jsonld.mainEntity.length === 6);
    const desk = await page.evaluate(() => {
      const gal = document.querySelector('.bpdp-gal').getBoundingClientRect(), info = document.querySelector('.bpdp-buy__info').getBoundingClientRect();
      return { sideBySide: info.left > gal.right - 1, thumbs: getComputedStyle(document.querySelector('.bpdp-thumbs')).display !== 'none', faqCols: getComputedStyle(document.querySelector('.bpdp-faq__grid')).gridTemplateColumns.split(' ').length, stickyHidden: getComputedStyle(document.querySelector('.bpdp-sticky')).display === 'none', navHidden: getComputedStyle(document.querySelector('#shopify-section-boarage_reviews .bpdp-nav')).display === 'none' };
    });
    check('Desktop: gallery and info side by side, thumbnails visible, FAQ in two columns, no sticky bar, no idle carousel arrows', desk.sideBySide && desk.thumbs && desk.faqCols === 2 && desk.stickyHidden && desk.navHidden, JSON.stringify(desk));
    const ldEmpty = await (async () => { const p2 = await ctx.newPage(); await p2.goto(`${url}/empty-storefront.html`); const n = await p2.evaluate(() => document.querySelectorAll('script[type="application/ld+json"]').length); await p2.close(); return n; })();
    check('Empty FAQ emits no JSON-LD', ldEmpty === 0);
    await ctx.close();
  }

  // ---------- check 5: reduced motion ----------
  {
    const ctx = await browser.newContext({ ...MOBILE, reducedMotion: 'reduce' }); const page = await ctx.newPage();
    await page.goto(`${url}/filled-storefront.html`);
    await page.waitForFunction(() => window.BoaragePDP);
    const rm = await page.evaluate(() => {
      const cs = (sel) => getComputedStyle(document.querySelector(sel));
      const itemsHidden = [...document.querySelectorAll('[data-bpdp-reveal-item]')].some((el) => getComputedStyle(el).opacity !== '1');
      return { card: cs('.bpdp-rev').transform, revealReady: !!document.querySelector('[data-bpdp-reveal-ready]'), itemsHidden, stickyTransform: cs('.bpdp-sticky').transform, pressDur: cs('.bpdp-btn').transitionDuration };
    });
    check('Reduced motion: no transforms, no reveal stagger, transitions collapsed', rm.card === 'none' && !rm.revealReady && !rm.itemsHidden && rm.stickyTransform === 'none' && /^0\.001s/.test(rm.pressDur), JSON.stringify(rm));
    const sum = page.locator('#shopify-section-boarage_faq details[data-bpdp-acc] summary').first();
    await sum.click(); await page.waitForTimeout(100);
    check('Reduced motion: accordion still opens', await page.evaluate(() => document.querySelector('#shopify-section-boarage_faq details[data-bpdp-acc]').open));
    await ctx.close();
  }

  // ---------- check 6: keyboard ----------
  {
    const ctx = await browser.newContext(DESKTOP); const page = await ctx.newPage();
    await page.goto(`${url}/filled-storefront.html`);
    await page.waitForFunction(() => window.BoaragePDP);
    await page.keyboard.press('Tab');
    const focused = new Set();
    for (let i = 0; i < 140; i++) {
      const info = await page.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; if (e.hasAttribute('data-bpdp-thumb')) return 'thumb'; if (e.hasAttribute('data-bpdp-next')) return 'nav'; if (e.hasAttribute('data-bpdp-more')) return 'more'; return (e.className && String(e.className).split(' ')[0]) || e.tagName; });
      if (info) focused.add(info);
      await page.keyboard.press('Tab');
    }
    check('Tab reaches option radios, thumbnails, CTA, accordions, load-more and links (carousel arrows are disabled when nothing overflows on desktop)', ['bpdp-opt__in', 'thumb', 'bpdp-btn', 'bpdp-acc__summary', 'more', 'A'].every((c) => focused.has(c)), [...focused].join(','));
    await page.locator('#shopify-section-boarage_faq details[data-bpdp-acc] summary').first().focus();
    await page.keyboard.press('Enter'); await page.waitForTimeout(300);
    const opened = await page.evaluate(() => document.querySelector('#shopify-section-boarage_faq details[data-bpdp-acc]').open);
    await page.keyboard.press('Space'); await page.waitForTimeout(300);
    const closed = await page.evaluate(() => !document.querySelector('#shopify-section-boarage_faq details[data-bpdp-acc]').open);
    check('Enter opens and Space closes an accordion', opened && closed);
    await page.locator('[data-bpdp-w]').first().focus();
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(250);
    const kb = await page.evaluate(() => ({ checked: document.querySelectorAll('[data-bpdp-w]')[1].checked, id: document.querySelector('[data-bpdp-id]').value, price: document.querySelector('[data-bpdp-price]').textContent }));
    check('Arrow keys move between weight cards and update the variant and price', kb.checked && kb.id === '2004' && /33,99/.test(kb.price), JSON.stringify(kb));
    const focusRing = await page.evaluate(() => getComputedStyle(document.querySelectorAll('[data-bpdp-w]')[1].closest('.bpdp-opt')).outlineStyle);
    check('Focused option card shows a visible outline', focusRing !== 'none', focusRing);
    await ctx.close();
  }

  // ---------- layout shift, tap targets, font sizes, dark mode ----------
  {
    const ctx = await browser.newContext(MOBILE); const page = await ctx.newPage();
    await page.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
    await page.goto(`${url}/filled-storefront.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    for (let y = 0; y < 9000; y += 800) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(120); }
    await page.waitForTimeout(400);
    const m = await page.evaluate(() => {
      const bodyPx = [...document.querySelectorAll('.bpdp-rte p, .bpdp-rev__text, .bpdp-stage__body p, .bpdp-tl__item > p, .bpdp-benefits li, .bpdp-acc__inner p')].filter((e) => !e.closest('.bpdp-legal')).map((e) => parseFloat(getComputedStyle(e).fontSize));
      const targets = [...document.querySelectorAll('.bpdp button, .bpdp summary, .bpdp a.bpdp-btn, .bpdp-opt, .bpdp-legal__links a')].filter((e) => e.offsetParent !== null).map((e) => { const r = e.getBoundingClientRect(); return { h: r.height, w: r.width, c: e.className }; });
      const tooSmall = targets.filter((t) => t.h < 44 || t.w < 44);
      const wide = document.documentElement.scrollWidth > innerWidth + 1;
      return { cls: window.__cls, minBody: Math.min(...bodyPx), tooSmall, targets: targets.length, wide };
    });
    check('Cumulative layout shift is 0 through load and scroll', m.cls < 0.01, `CLS ${m.cls.toFixed(4)}`);
    check('Body text is at least 18 px on mobile', m.minBody >= 18, `${m.minBody}px`);
    check('Every tap target is at least 44×44 px', m.tooSmall.length === 0, m.tooSmall.map((t) => `${t.c} ${t.w.toFixed(0)}×${t.h.toFixed(0)}`).join('; '));
    check('No horizontal page scroll on mobile', !m.wide);
    await ctx.close();
    const dark = await browser.newContext({ ...MOBILE, colorScheme: 'dark' }); const dp = await dark.newPage();
    await dp.goto(`${url}/filled-storefront.html`);
    const lightBg = await dp.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await dp.goto(`${url}/filled-storefront-system.html`);
    const darkBg = await dp.evaluate(() => ({ bg: getComputedStyle(document.body).backgroundColor, theme: document.documentElement.getAttribute('data-theme') }));
    check('Dark mode: off by default (data-theme=light), follows the system when enabled', lightBg === 'rgb(247, 243, 234)' && darkBg.theme === null && darkBg.bg === 'rgb(22, 32, 27)', `${lightBg} → ${darkBg.bg}`);
    await dark.close();
  }
} finally {
  await browser.close();
  server.close();
}
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
