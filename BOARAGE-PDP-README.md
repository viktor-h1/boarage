# Boarage PDP skeleton

A long-form product page template for boarage.de, built as Shopify Online Store 2.0 sections for the
live **Shrine 2.1.0** theme (Dawn-based). The structure follows a buy box on top and a sales sequence
below it. **Every piece of copy is an empty theme setting**: nothing is written into the code, so the
storefront shows only the buy box until the partners fill the sections in the Theme Editor.

- Template: `templates/product.boarage-pdp.json`, assigned per product.
- Sections: `sections/boarage-pdp-01-…` to `sections/boarage-pdp-14-…` (they sort in order in the editor).
- Snippets: `snippets/boarage-*.liquid`.
- Assets: `assets/boarage-pdp.css` (< 25 KB) and `assets/boarage-pdp.js` (< 10 KB, vanilla, no jQuery).
- Theme settings group **Boarage PDP** in `config/settings_schema.json`; editor labels in
  `locales/en.default.schema.json` (English) and `locales/de.schema.json` (German).
- Local verification harness in `dev/` (never pushed to the theme).

## 1. Deploying the files

The repo holds only the Boarage files plus full copies of three Shrine files that cannot be shipped as
fragments: `config/settings_schema.json`, `locales/en.default.schema.json` and `locales/de.schema.json`
(live content as of 2026-09-24 + the Boarage additions). `locales/en.default.json` is a lint-only snapshot
of the storefront strings and is excluded from every push by `.shopifyignore`.

From a machine with store access:

```bash
npm ci
npx shopify theme check                      # must be clean
npx shopify theme push --theme <THEME_ID> --nodelete
```

`--nodelete` keeps everything else in the target theme. Push to an unpublished copy first, preview it,
then repeat for the live theme. `.shopifyignore` already excludes `dev/`, `node_modules/`, the README,
package files and the storefront locale snapshot.

**After a Shrine update:** pull the new theme's three shared files into this repo (overwriting the copies),
run `node dev/merge-shared.mjs` (re-adds the settings group and both locale namespaces from
`dev/shared/`) and `node dev/check-keys.mjs` (verifies every editor label key exists in both languages).

## 2. Assigning the template

Shopify admin → Products → *Magnesium B3 Relief* → right-hand column **Theme template** → choose
`boarage-pdp` → Save. In the Theme Editor the page is then listed under Products → "boarage-pdp".
Assign it per product; other products keep their current templates.

## 3. Theme settings (Theme settings → Boarage PDP)

| Setting id | Type | Default | What it does |
|---|---|---|---|
| `boarage_use_theme_fonts` | checkbox | on | Inherit Shrine's heading and body fonts. |
| `boarage_font_heading` | font picker | Assistant | Heading, button and label font when theme fonts are off. |
| `boarage_font_body` | font picker | Assistant | Body font when theme fonts are off. |
| `boarage_base_size` | range 18–22 px | 18 | Body text size. 18 px is the floor for the 60+ audience. |
| `boarage_color_accent` | colour | `#1F4A3D` | Buttons, links, highlights. |
| `boarage_color_accent_ink` | colour | `#FFFFFF` | Text on the accent colour. |
| `boarage_color_surface` | colour | `#FFFFFF` | Cards and bands. |
| `boarage_color_line` | colour | `#D0DBD4` | Borders and rules. |
| `boarage_color_cool` | colour | `#D6EBE1` | Cool tint (sensation panel left half, icon circles). |
| `boarage_color_warm` | colour | `#F6E5CB` | Warm tint (sensation panel right half). |
| `boarage_color_bg` | colour | empty | Page background; empty keeps the theme background. |
| `boarage_radius` | range 0–24 px | 14 | Corner radius for cards and buttons. |
| `boarage_dark_mode` | select | Off | Off / follow system / always dark. Off is the default because Shrine's header and footer have no dark scheme. |

All values become CSS custom properties (`--bpdp-*`) defined once on `:root` in `assets/boarage-pdp.css`
and overridden by `snippets/boarage-tokens.liquid`. The sections keep working if the group is missing.

## 4. Sections, settings and blocks

Conventions that apply everywhere:

- Empty settings render **nothing** on the storefront (no empty headings, no empty wrappers with
  padding). In the editor an empty setting shows a dashed placeholder with its name, and a section with
  no content at all shows one labelled box at the top.
- Labels are English in the schema and German in the editor when the admin language is German.
- `@app` blocks (reviews app etc.) are accepted where listed.

### 01 Announcement strip (`boarage-pdp-01-announcement`)

| Setting | Type | Notes |
|---|---|---|
| `style` | select: accent / surface | Background style. |

Blocks: `item` (max 4): `text` (text), `link` (url, optional), `icon` (select from the icon set, default none).

### 02 Buy box (`boarage-pdp-02-buy-box`, product templates only, one per page)

| Setting | Type | Notes |
|---|---|---|
| `gallery_aspect` | select 1:1 / 4:5 / 3:4 | Reserved image frame ratio (no layout shift). |
| `media_fit` | select cover / contain | How images sit in the frame. |
| `sticky_gallery` | checkbox (on) | Gallery stays in view on desktop. |
| `show_thumbnails` | checkbox (on) | Thumbnail row under the main image. |
| `show_rating` | checkbox (on) | Native stars from the `reviews.rating` / `reviews.rating_count` metafields; hidden when an `@app` block is present or the metafield is empty. Never a hardcoded rating. |
| `subtitle` | textarea | Lede under the product title. |
| `bundle_legend` | text | Label above the variant cards. |
| `price_mode` | select | `bundle_total` (default) or `per_unit`, see section 5. |
| `per_unit_label` | text | Word after the computed unit price, e.g. "pro Dose". |
| `cta_label` | text | Add-to-cart text; empty = theme default ("In den Warenkorb legen"). |
| `after_add` | select | Open Shrine's cart drawer/notification (fallback: cart page) or always go to the cart page. |
| `sticky_bar` | checkbox (on) | Mobile sticky buy bar (hidden on desktop, respects the safe-area inset, appears after the first scroll past the button). |
| `sticky_cta_label` | text | Sticky bar button text; empty = add-to-cart text. |

Blocks:

- `benefit` (max 4): `icon` (select), `text` (text). Icon-benefit lines under the subtitle.
- `bundle` (max 6): `match` (variant title, optional), `name`, `subline`, `badge`, `cta_label`,
  `preselect` (checkbox). Decorates one variant card; matched by title or by position when `match` is empty.
- `trust` (max 4): `icon` (select), `text` (inline rich text). Trust lines under the button.
- `@app`: rendered in the rating slot above the title (the template pre-wires the LAI Reviews star block).

Product data (title, images, prices, compare-at prices, availability, variants) always comes from Shopify.
Compare-at prices render only from the native `compare_at_price`.

### 03 Accordions (`boarage-pdp-03-accordions`)

`heading` (text, optional), `first_open` (checkbox, on). Blocks `item` (max 8): `title` (text), `content` (rich text).
Native `<details>`; an item renders only when title and text are filled.

### 04 Reviews (`boarage-pdp-04-reviews`)

`heading` (text). Blocks: `@app` and `review`: `text` (textarea), `name`, `location`, `image` (image
picker), `image_alt`. Renders nothing when there is no filled manual review and no app block. To show the
LAI Reviews widget here: in the editor select the section → Add block → Apps → LAI Product Reviews
(the template deliberately ships without it so an unfilled page shows only the buy box).

### 05 FAQ (`boarage-pdp-05-faq`)

`heading` (text). Blocks `qa` (max 12): `question` (text), `answer` (rich text). Accordion behaviour;
`FAQPage` JSON-LD is emitted only for entries with both fields filled.

### 06 Problem reframe (`boarage-pdp-06-problem`)

`heading` (text), `intro` (rich text). Blocks `stage` (max 3): `label`, `title`, `text` (textarea).
Three-up on desktop, stacked on mobile, staggered entrance.

### 07 Mechanism (`boarage-pdp-07-mechanism`)

`heading` (text), `text` (rich text), sensation panel: `left_title`, `left_text`, `right_title`,
`right_text`, `axis_start`, `axis_end`. Blocks `ingredient` (max 8): `name`, `role`.

### 08 Science / explainer (`boarage-pdp-08-science`)

`heading` (text), `text` (rich text), `disclaimer` (textarea), `visual` (none / image / panel),
`image` + `image_alt`, and the same six sensation-panel fields as 07.

### 09 Journey timeline (`boarage-pdp-09-journey`)

`heading` (text), `intro` (rich text); card: `card_enabled` (checkbox, on), `card_title`, `card_hint`,
`scale_1_label`, `scale_2_label`, `line_1`, `line_2`. Blocks `milestone` (max 5): `when`, `title`,
`text` (textarea). Vertical timeline with a gradient rail; the card is purely visual (mirrors the printed card).

### 10 Comparison table (`boarage-pdp-10-comparison`)

`heading` (text), `note` (textarea). Blocks: `column` (max 5): `label` (first column = you, styled
differently); `row`: `label`, `value_1` … `value_5`. Values `yes` / `no` / `varies` (also `ja` / `nein` /
`teils`) become styled tokens; anything else is plain text. The table scrolls horizontally inside its own
container on mobile.

### 11 Guarantee (`boarage-pdp-11-guarantee`)

`badge_number`, `badge_word` (the round seal), `heading` (text), `text` (rich text), `cta_label`,
`cta_link` (optional; empty = scroll to the buy box).

### 12 Photo wall (`boarage-pdp-12-photo-wall`)

`heading` (text, optional), `columns` (2–4). Blocks `photo` (max 12): `image`, `alt`, `caption`. Renders
nothing without images.

### 13 Closing reviews + final CTA (`boarage-pdp-13-closing`)

`heading` (text), `guarantee_line` (text), `cta_label`, `cta_link`. Blocks: `@app` and `review` (as in 04).

### 14 Legal strip (`boarage-pdp-14-legal`)

`category_line` (text), `inci_heading` (text), `inci` (rich text), `impressum_label` + `impressum_link`,
`widerruf_label` + `widerruf_link`, `datenschutz_label` + `datenschutz_link`. A link shows only when both
its label and its link are set.

## 5. Bundle selector and price modes

The bundle selector is driven by the product's variants (one radio card per variant, `role="radiogroup"`).
Selecting a variant updates the price, the per-unit line, the button label, the URL (`?variant=`) and the
sticky bar without a reload. The radios carry `name="id"`, so the form also works without JavaScript.

- **Bundle total** (default, the model from the build spec): the variant price is the price of the whole
  bundle. Per-unit price = price ÷ the variant metafield `custom.units_per_variant`. The cart receives
  1 × variant.
- **Per unit** (matches today's KaChing-style prices in the store): the variant price is per unit. Total =
  price × units, compare-at × units, per-unit = variant price, and the cart receives *units* × variant.
  Variants without the metafield count as 1 unit.

The per-unit line is hidden until the metafield exists. Create it once: Shopify admin → Settings →
Custom data → Variants → Add definition → name "Units per variant", namespace and key
`custom.units_per_variant`, type *Integer*. Then fill it per variant (1, 3, 6 …).

## 6. Motion and accessibility

Only `transform` and `opacity` are animated (accordions animate `grid-template-rows: 0fr → 1fr` on a
wrapper plus opacity; open 220 ms, close 150 ms, interruptible). Every pressable element scales to 0.97 on
press. Entrances start at opacity 0 and 8 px, staggered by 50 ms via IntersectionObserver for the stages
and milestones, and never block interaction. Hover effects only apply on hover-capable, fine pointers.
`prefers-reduced-motion` removes all transforms and keeps opacity/colour transitions. The sticky bar mounts
with `@starting-style` and a `data-mounted` fallback. Focus is visible on every control, the price is an
`aria-live="polite"` region, accordions use `<details>/<summary>`, and every image block has an alt-text
setting. Minimum body size is 18 px and tap targets are at least 44 × 44 px.

## 7. Local verification harness (`dev/`)

The build environment could not reach the store, so the acceptance checks run against a local render:

```bash
npm run check           # shopify theme check
npm run dev:render      # LiquidJS render of the template with fixtures → dev/out/*.html
npm run dev:test        # Playwright: empty/editor rendering, variant switching, sticky bar, add to cart,
                        # accordion timing, reduced motion, keyboard, CLS, tap targets, font sizes, dark mode, JSON-LD
npm run dev:lighthouse  # Lighthouse mobile on the rendered pages (performance and accessibility ≥ 90)
```

`dev/render.mjs` shims Shopify's `money`, `image_url`, `image_tag`, `asset_url`, `t`, `form`, `style`
and app blocks and mimics the Dawn/Shrine root font-size (62.5 %). It proves the markup, CSS and JS
contract; it does not reproduce Shopify's money format, the image CDN, the theme editor, app blocks or the
cart drawer. Re-run Lighthouse on the preview theme URL for the real numbers.

## 8. Notes and known limitations

- Video and 3D media are skipped in the gallery (images only).
- Editor placeholder texts are English (editor-only, never on the storefront).
- `locales/en.default.schema.json` had a stray trailing comma and `locales/de.schema.json` lacked nine
  Shrine keys; both are corrected in the repo copies so theme check passes.
- Theme check reports two pre-existing warnings about deprecated Harmonia Sans fonts in Shrine's own
  settings schema.
