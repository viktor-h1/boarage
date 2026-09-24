/* Boarage PDP · assets/boarage-pdp.js — vanilla, dependency-free, idempotent.
   Hooks: [data-bpdp-buybox] [data-bpdp-acc] [data-bpdp-carousel] [data-bpdp-countdown] [data-bpdp-more] [data-bpdp-reveal] */
(function () {
  'use strict';
  if (window.BoaragePDP) return;
  var D = document, W = window, RM = W.matchMedia ? W.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function reduced() { return !!(RM && RM.matches); }
  function q(s, r) { return (r || D).querySelector(s); }
  function qa(s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); }
  function raf2(fn) { requestAnimationFrame(function () { requestAnimationFrame(fn); }); }
  function once(el) { if (el.bpdpInit) return true; el.bpdpInit = true; return false; }
  /* Money strings are pre-formatted by Liquid and written back as HTML. */
  function html(el, v) { if (el) { el.innerHTML = v || ''; el.hidden = !v; } }

  /* Accordion: native <details>, body in a grid wrapper animated 0fr -> 1fr (open 220 ms, close 150 ms). */
  function initAccordion(det) {
    if (once(det)) return;
    var sum = q('summary', det), grid = q('.bpdp-acc__grid', det), timer;
    if (!sum || !grid) return;
    det.setAttribute('data-anim', '');
    if (det.open) det.setAttribute('data-open', '');
    function open() {
      clearTimeout(timer);
      det.open = true;
      raf2(function () { if (det.open) det.setAttribute('data-open', ''); });
    }
    function close() {
      clearTimeout(timer);
      det.removeAttribute('data-open');
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        grid.removeEventListener('transitionend', onEnd);
        if (!det.hasAttribute('data-open')) det.open = false;
      }
      function onEnd(ev) { if (ev.target === grid && ev.propertyName === 'grid-template-rows') finish(); }
      grid.addEventListener('transitionend', onEnd);
      timer = setTimeout(finish, reduced() ? 20 : 220);
    }
    sum.addEventListener('click', function (e) {
      e.preventDefault();
      if (det.open && det.hasAttribute('data-open')) close(); else open();
    });
    det.addEventListener('toggle', function () {
      if (!det.open) det.removeAttribute('data-open');
      else if (!det.hasAttribute('data-open')) open();
    });
    det.bpdpOpen = open;
  }

  /* Carousel: scroll-snap track + optional prev/next buttons and progress bar. */
  function initCarousel(root) {
    if (once(root)) return;
    var track = q('[data-bpdp-track]', root), prev = q('[data-bpdp-prev]', root), next = q('[data-bpdp-next]', root), bar = q('[data-bpdp-bar] i', root);
    if (!track) return;
    function pad() { return parseFloat(getComputedStyle(track).paddingLeft) || 0; }
    function step() { var c = track.children; return c.length > 1 ? c[1].getBoundingClientRect().left - c[0].getBoundingClientRect().left : track.clientWidth; }
    function update() {
      var max = track.scrollWidth - track.clientWidth, x = track.scrollLeft;
      root.toggleAttribute('data-bpdp-static', max <= 1);
      if (prev) prev.disabled = x <= 1;
      if (next) next.disabled = x >= max - 1;
      if (bar) bar.style.setProperty('--bpdp-x', (max > 0 ? (x / max) * (bar.parentNode.clientWidth - bar.offsetWidth) : 0) + 'px');
    }
    if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: reduced() ? 'auto' : 'smooth' }); });
    if (next) next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: reduced() ? 'auto' : 'smooth' }); });
    track.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true });
    W.addEventListener('resize', update);
    update();
    root.bpdpGoTo = function (el) {
      track.scrollTo({ left: el.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft - pad(), behavior: reduced() ? 'auto' : 'smooth' });
    };
  }

  /* Countdown: data-mode "daily" (resets at local midnight) or "date" (data-end "YYYY-MM-DD HH:MM", local time). */
  function initCountdown(el) {
    if (once(el)) return;
    var mode = el.getAttribute('data-mode'), end = el.getAttribute('data-end') || '', h = q('[data-u="h"]', el), m = q('[data-u="m"]', el), s = q('[data-u="s"]', el), t;
    function target() { if (mode === 'daily') { var d = new Date(); d.setHours(24, 0, 0, 0); return d; } var e = new Date(end.replace(' ', 'T')); return isNaN(e) ? null : e; }
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function tick() {
      var d = Math.floor((t - Date.now()) / 1000);
      if (d < 0 && mode === 'daily') { t = target(); d = Math.floor((t - Date.now()) / 1000); }
      if (d < 0) { el.hidden = true; return; }
      h.textContent = pad(Math.floor(d / 3600)); m.textContent = pad(Math.floor(d % 3600 / 60)); s.textContent = pad(d % 60);
      setTimeout(tick, 1000);
    }
    t = target();
    if (!t || !h || !m || !s) { el.hidden = true; return; }
    tick();
  }

  /* Staggered reveal: decorative, once; off for reduced motion or without IntersectionObserver. */
  var io;
  function initReveal(group) {
    if (once(group)) return;
    if (reduced() || !('IntersectionObserver' in W) || !q('[data-bpdp-reveal-item]', group)) return;
    group.setAttribute('data-bpdp-reveal-ready', '');
    io = io || new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        qa('[data-bpdp-reveal-item]', en.target).forEach(function (it, i) { it.style.setProperty('--bpdp-delay', i * 50 + 'ms'); it.setAttribute('data-shown', ''); });
        io.unobserve(en.target);
      });
    }, { rootMargin: '-80px' });
    io.observe(group);
  }

  /* Mobile sticky bar: mounts after the first scroll past the main CTA. */
  function initSticky(bar, anchor) {
    if (!bar) return;
    var shown = false, ticking = false, hideTimer;
    function update() {
      ticking = false;
      var past = anchor.getBoundingClientRect().bottom < 0;
      if (past === shown) return;
      shown = past;
      clearTimeout(hideTimer);
      if (past) { bar.hidden = false; raf2(function () { if (shown) bar.setAttribute('data-mounted', ''); }); }
      else { bar.removeAttribute('data-mounted'); hideTimer = setTimeout(function () { if (!shown) bar.hidden = true; }, 260); }
    }
    W.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  }

  /* Buy box: radio cards (name="id") drive price, unit line, CTA, stock line, sticky bar, gallery; fetch add-to-cart. */
  function initBuyBox(box) {
    if (once(box)) return;
    function g(s) { return q(s, box); }
    function attr(n) { return box.getAttribute('data-bpdp-' + n) || ''; }
    var radios = qa('input[type="radio"][data-bpdp-variant]', box), thumbs = qa('[data-bpdp-thumb]', box), gal = g('[data-bpdp-gallery]');
    var qty = g('input[name="quantity"]'), price = g('[data-bpdp-price]'), was = g('[data-bpdp-was]'), unit = g('[data-bpdp-unit]'), unitVal = g('[data-bpdp-unit-value]'), stock = g('[data-bpdp-stock]');
    var cta = g('[data-bpdp-cta]'), ctaLabel = g('[data-bpdp-cta-label]'), ctaPrice = g('[data-bpdp-cta-price]'), stPrice = g('[data-bpdp-sticky-price]'), stWas = g('[data-bpdp-sticky-was]'), stLabel = g('[data-bpdp-sticky-label]');
    var form = g('form[data-bpdp-form]'), err = g('[data-bpdp-error]');

    function showMedia(id) {
      if (!id) return;
      thumbs.forEach(function (t) { t.setAttribute('aria-current', t.getAttribute('data-bpdp-thumb') === id ? 'true' : 'false'); });
      var slide = g('[data-bpdp-media="' + id + '"]');
      if (slide && gal && gal.bpdpGoTo) gal.bpdpGoTo(slide);
    }
    thumbs.forEach(function (t) { t.addEventListener('click', function () { showMedia(t.getAttribute('data-bpdp-thumb')); }); });

    function swapLabel(t, instant) {
      if (!ctaLabel) return;
      if (instant || reduced() || ctaLabel.textContent === t) { ctaLabel.textContent = t; return; }
      ctaLabel.setAttribute('data-swap', '');
      setTimeout(function () { ctaLabel.textContent = t; ctaLabel.removeAttribute('data-swap'); }, 100);
    }

    function apply(r, first) {
      var d = r.dataset, avail = d.available === 'true', label = avail ? (d.cta || attr('cta-default')) : attr('soldout');
      radios.forEach(function (x) { var l = x.closest('.bpdp-bundle'); if (l) l.classList.toggle('is-selected', x === r); });
      if (qty) qty.value = d.qty || '1';
      html(price, d.price);
      html(was, d.was);
      html(unitVal, d.unit);
      if (unit) unit.hidden = !d.unit;
      swapLabel(label, first);
      html(ctaPrice, avail ? '• ' + d.price : '');
      if (cta) { cta.disabled = !avail; cta.setAttribute('aria-disabled', String(!avail)); }
      if (stock) stock.hidden = !avail;
      html(stPrice, d.price);
      html(stWas, d.was);
      if (stLabel) stLabel.textContent = avail ? (attr('sticky-default') || label) : attr('soldout');
      if (first) return;
      showMedia(d.media);
      try { var u = new URL(W.location.href); u.searchParams.set('variant', d.bpdpVariant); W.history.replaceState(null, '', u.toString()); } catch (e) {}
      box.dispatchEvent(new CustomEvent('boarage:variantchange', { bubbles: true, detail: { variantId: Number(d.bpdpVariant), available: avail } }));
    }
    radios.forEach(function (r) { r.addEventListener('change', function () { if (r.checked) apply(r, false); }); });
    var checked = radios.filter(function (r) { return r.checked; })[0] || radios[0];
    if (checked) { checked.checked = true; apply(checked, true); }

    function showError(msg) { if (err) { err.textContent = msg || ''; err.hidden = !msg; } }
    function busy(on) { if (cta) { cta.setAttribute('aria-busy', on ? 'true' : 'false'); cta.setAttribute('aria-disabled', on || cta.disabled ? 'true' : 'false'); } }
    if (form) {
      form.addEventListener('submit', function (e) {
        if (!W.fetch || attr('after') === 'cart') return; /* plain POST: Shopify redirects to the cart page */
        e.preventDefault();
        if (cta && (cta.disabled || cta.getAttribute('aria-busy') === 'true')) return;
        showError('');
        var fd = new FormData(form), cart = q('cart-notification') || q('cart-drawer');
        if (cart && typeof cart.getSectionsToRender === 'function') {
          try {
            fd.append('sections', cart.getSectionsToRender().map(function (s) { return s.id; }).join(','));
            fd.append('sections_url', W.location.pathname);
            if (cart.setActiveElement) cart.setActiveElement(D.activeElement);
          } catch (e2) { cart = null; }
        }
        busy(true);
        fetch(form.getAttribute('action'), { method: 'POST', body: fd, headers: { Accept: 'application/javascript', 'X-Requested-With': 'XMLHttpRequest' } })
          .then(function (res) { return res.json(); })
          .then(function (res) {
            if (res.status) { showError(res.description || res.message || attr('error-text')); return; }
            if (W.publish && W.PUB_SUB_EVENTS) { try { W.publish(W.PUB_SUB_EVENTS.cartUpdate, { source: 'boarage-pdp', productVariantId: res.variant_id, cartData: res }); } catch (e3) {} }
            if (cart && typeof cart.renderContents === 'function') { cart.classList.remove('is-empty'); cart.renderContents(res); }
            else W.location.href = attr('cart-url') || '/cart';
          })
          .catch(function () { showError(attr('error-text')); })
          .then(function () { busy(false); });
      });
    }
    initSticky(g('[data-bpdp-sticky]'), cta || box);
  }

  function init(root) {
    root = root && root.querySelectorAll ? root : D;
    qa('[data-bpdp-acc]', root).forEach(initAccordion);
    qa('[data-bpdp-carousel]', root).forEach(initCarousel);
    qa('[data-bpdp-countdown]', root).forEach(initCountdown);
    qa('[data-bpdp-reveal]', root).forEach(initReveal);
    qa('[data-bpdp-buybox]', root).forEach(initBuyBox);
  }
  D.addEventListener('click', function (e) {
    var c = e.target.closest ? e.target.closest.bind(e.target) : function () { return null; };
    var more = c('[data-bpdp-more]');
    if (more) {
      var list = q('[data-bpdp-more-target]', more.closest('.bpdp'));
      qa('[data-bpdp-hidden]', list).forEach(function (x) { x.hidden = false; x.removeAttribute('data-bpdp-hidden'); });
      more.parentNode.hidden = true;
      return;
    }
    var a = c('a[href$="#boarage-buy-box"]'), t = a && D.getElementById('boarage-buy-box');
    if (!t) return;
    e.preventDefault();
    t.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    try { t.focus({ preventScroll: true }); } catch (e4) {}
  });
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', function () { init(); }); else init();
  D.addEventListener('shopify:section:load', function (e) { init(e.target); });
  D.addEventListener('shopify:block:select', function (e) {
    var det = e.target.closest && e.target.closest('details[data-bpdp-acc]');
    if (det && det.bpdpOpen && !det.hasAttribute('data-open')) det.bpdpOpen();
  });
  W.BoaragePDP = { init: init };
})();
