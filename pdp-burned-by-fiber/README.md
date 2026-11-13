# Doo Diligence PDP: "Burned by fiber"

Static, mobile-first product page for one avatar: people a fiber supplement already bloated. The section
structure follows the repo's Auniva skeleton (buy box on top, sales sequence below), restyled to the brief.
It uses plain HTML with inline CSS and JS, with no framework and no build step.

| File | What it is |
|---|---|
| `index.html` | Layout, styles and the small runtime that renders the page from `content.json` |
| `content.json` | **All copy, numbers and toggles.** Edit this, not the HTML |
| `PLACEHOLDERS.md` | Every `[[PLACEHOLDER]]` and image slot to fill before launch |
| `netlify.toml` | Netlify settings (static, nothing to build) |

## Preview and deploy

`content.json` is fetched at runtime, so open the page over http, not by double-clicking the file:

```bash
npx serve pdp-burned-by-fiber
```

Netlify, either way:

- **Drag and drop:** drop the `pdp-burned-by-fiber` folder on https://app.netlify.com/drop.
- **From Git:** connect the repo and set **Base directory** to `pdp-burned-by-fiber`. Leave the build command
  empty. `netlify.toml` publishes the folder as-is.

## Editing

- **Copy:** `content.json`. `{TOKENS}` are filled from `config` (for example `{GUARANTEE_DAYS}`, `{FIBER_G}`,
  `{FIBER_TYPE}`). `*text*` renders in the accent colour, `**text**` bold. Prices per day, per box, savings and
  subscription prices are computed from `config`, never typed into copy.
- **Config:** `content.json → config` holds the brief's variables (`FIBER_TYPE`, `PRICE_1..3`, `SUB_DISCOUNT`,
  `GUARANTEE_DAYS`, `SHOW_REVIEWS`, `PREORDER_MODE`, `SALE_MODE`, `COA_URL`, …). `config._help` explains each toggle.
- **Fiber type:** `FIBER_TYPE` switches the texture line, fermentation line, mixing step, comparison texture and, for
  psyllium, the full-glass-of-water warning and the Prop 65 slot (plus a "WARNING" link under the button).
- **Section order:** `content.json → sections`. Remove a name to hide a section.
- **Accent colour:** `--dd-accent` (and its tints right below it) at the top of the `<style>` block.
- **Images:** set `src`, `width` and `height` on the gallery items. The first one is the LCP image and gets
  `fetchpriority="high"`. The others lazy-load.

## Headline test

`config.HEADLINE_VARIANT` picks A, B or C. A URL parameter overrides it per ad: `…/?h=B`. Every tracking event
carries `headline_variant`.

## Tracking

Elements carry `data-track` attributes, and every interaction fires a `dd:track` CustomEvent (bubbles to
`document` and `window`). The `detail` always contains `event`, `headline_variant`, `fiber_type` and `ts`.

| `event` | When | Extra fields |
|---|---|---|
| `page_view` | Page rendered | `placeholders` (count still on the page) |
| `offer_select` | Box option picked (buy box or final CTA) | `location`, `boxes`, `subscribe` |
| `subscribe_toggle` | Subscribe & save toggled | `on`, `boxes` |
| `cta_click` | Any CTA (buy box, sticky bar, guarantee, final) | `location`, `boxes`, `subscribe`, `price`, `option` |
| `faq_open` | FAQ item opened | `index`, `question` |
| `email_submit` | Valid email submitted | `email_domain` |

```js
document.addEventListener('dd:track', (e) => { /* send e.detail to your analytics */ });
```

The CTA is in prototype mode while `config.CTA_URLS` is empty: it logs the selected option and shows a short note.
Put a cart link per box count there (and in `CTA_URLS_SUBSCRIBE`) to send buyers somewhere real.

## Cloning for another avatar

Copy the folder (for example `pdp-glp1/`), rewrite `content.json`, deploy. No code changes needed.
