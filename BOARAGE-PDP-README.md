# Boarage PDP (Shopify OS 2.0 product template)

Long-form product page template for boarage.de, modelled on the Auniva "Amla" page: buy box on top, sales
sequence below, **mobile first**. Every piece of copy is an editable setting or block with an **empty default**:
nothing is invented, sections that are still empty render nothing on the storefront and show a labelled
placeholder in the theme editor.

Theme: Shrine 2.1.0 (Dawn-based). The Boarage files live next to the theme's own files and do not modify them,
except for three shared files that carry the theme's content plus the Boarage additions (see *Shared files*).

## Files

| Path | Purpose |
|---|---|
| `templates/product.boarage-pdp.json` | The template: 14 sections in the reference order, all blank |
| `sections/boarage-pdp-01-sale-bar.liquid` … `14-legal.liquid` | The sections (schemas use `t:boarage.*` keys) |
| `snippets/boarage-*.liquid` | Shared pieces: tokens/asset loader, gallery, icon set, stars, rating line, guarantee box, review card, accordion, section head, editor placeholder |
| `blocks/boarage-trust-rating.liquid`, `blocks/boarage-hero-text.liquid` + the snippets of the same name | Hero pieces, built one by one: a theme block (editor settings for content, colours, font, sizes) over a self-contained snippet that a "Custom Liquid" block can also `render` with the same parameters. Trust rating row; title + paragraph |
| `assets/boarage-pdp.css`, `assets/boarage-pdp.js` | **Built** assets (under 25 KB / 10 KB). Edit the sources in `dev/src/` and run `npm run build` |
| `config/settings_schema.json` | Shrine's file + the *Boarage PDP* settings group |
| `locales/en.default.schema.json`, `locales/de.schema.json` | Shrine's files + the `boarage` namespace (English / German editor labels) |
| `locales/en.default.json` | Lint-only snapshot of the live storefront strings, never pushed |
| `dev/` | Sources, locale string table, merge scripts and the local verification harness (not pushed) |
| `dev/preview/` | What the preview theme carries instead of the blank files: a template filled with the copy of the current product page and a `settings_data.json` snapshot with the guarantee text |

## Deploy

The repo is pushed to an **unpublished copy** of the live theme, never to the live theme directly.

```sh
npm ci
npm run check                       # builds the assets and runs shopify theme check
npx shopify theme push --theme <THEME_ID> --nodelete
```

`.shopifyignore` keeps `dev/`, docs and tooling out of the push. After a Shrine update, pull the theme's
`config/settings_schema.json`, `locales/en.default.schema.json` and `locales/de.schema.json` into the repo and run
`node dev/locale-strings.mjs && node dev/merge-shared.mjs` to re-apply the Boarage additions.

**Careful with the template file:** once content has been entered in the editor, a push of
`templates/product.boarage-pdp.json` overwrites it with the blank version. Push with
`--ignore templates/product.boarage-pdp.json` or keep the filled template in the repo.

Assign the template in the admin: Product → *Theme template* → `boarage-pdp`. Do that only on a theme that
contains the files (a product assigned to a missing template falls back to the default product page).
To preview without assigning: append `?view=boarage-pdp` to the product URL.

## Theme settings (Theme settings › Boarage PDP)

| Setting id | Default | Notes |
|---|---|---|
| `boarage_use_theme_fonts` | off | On: the theme's fonts. Off: the two pickers below |
| `boarage_font_heading` | Outfit Bold | Shopify font library |
| `boarage_font_body` | Work Sans | |
| `boarage_base_size` | 18 px | Body size; everything scales from it |
| `boarage_color_primary` / `_primary_ink` | #1D4D36 / #FFFFFF | Headings, selected bundle, seals |
| `boarage_color_cta` / `_cta_ink` | #2FBD44 / #FFFFFF | Buttons, stars, checks, highlighted words |
| `boarage_color_mint` | #5EF09A | Highlights on dark sections |
| `boarage_color_soft` | #EEF7F1 | Light green boxes |
| `boarage_color_line`, `_surface`, `_bg` | #E2E7E4, #FFFFFF, (theme) | Borders, cards, page |
| `boarage_radius` | 8 px | Corner radius |
| `boarage_dark_mode` | Off | Off / Follow system / Always dark (header and footer of the theme have no dark mode) |
| `boarage_guarantee_title`, `boarage_guarantee_text` | empty | The guarantee box shown in the buy box and the timeline |

Headline fields are inline rich text: **italic** words render in green (the reference's highlighted phrases).

## Sections, settings and blocks

Every text setting is empty by default; `[…]` marks non-text settings with a default.

| # | Section (file) | Settings | Blocks |
|---|---|---|---|
| 01 | Sale bar (`01-sale-bar`) | `title`, `subtitle`, `align` [left], `countdown_mode` [off / daily / date], `countdown_end` (`YYYY-MM-DD HH:MM`), `label_hours`, `label_minutes`, `label_seconds` | – |
| 02 | Buy box (`02-buy-box`, product templates only, max. 1) | `gallery_aspect` [4:5], `media_fit` [contain], `sticky_gallery` [on], `show_thumbnails` [on], `seal_1`, `seal_2`, `show_rating` [on], `rating_prefix`, `rating_word`, `description`, `offer_label`, `price_mode` [bundle_total], `per_unit_label`, `stock_text`, `cta_label`, `cta_show_price` [on], `after_add` [drawer], `show_payment_icons` [on], `show_guarantee` [on], `sticky_bar` [on], `sticky_cta_label` | `tile` ×3 (`icon`, `text`), `benefit` ×6 (`lead`, `text`), `bundle` ×6 (`match`, `name`, `subline`, `highlight`, `badge`, `badge_style`, `image`, `cta_label`, `preselect`), `note` ×2 (`icon`, `text`), `trust` ×4 (`icon`, `text`), `accordion` ×6 (`title`, `content`), `@app` |
| 03 | Reviews slider (`03-reviews`) | `heading`, `show_rating` [on], `rating_prefix`, `rating_word` | `review` ×12 (`title`, `text`, `rating` [5], `name`, `meta`, `date`, `image`, `image_alt`), `@app` |
| 04 | FAQ (`04-faq`) | `eyebrow`, `heading` | `qa` ×12 (`question`, `answer`) — FAQPage JSON-LD for filled pairs |
| 05 | Problem (`05-problem`) | `image`, `image_alt`, `heading`, `text` | `point` ×6 (`text`) |
| 06 | Mechanism (`06-mechanism`) | `eyebrow`, `heading`, `text`, `image`, `image_alt` | `item` ×4 (`icon`, `label`) |
| 07 | Stages (`07-stages`) | `heading` | `stage` ×4 (`image`, `image_alt`, `label`, `title`, `text`) |
| 08 | Science (`08-science`) | `eyebrow`, `heading`, `text`, `visual` [chart], `line_1`, `line_2`, `axis_y`, `axis_x`, `chart_alt`, `image`, `image_alt` | – |
| 09 | Timeline (`09-timeline`) | `heading`, `show_guarantee` [on] | `milestone` ×4 (`when`, `title`, `text`, `points` one per line) |
| 10 | Photo strip (`10-photo-strip`) | `show_stars` [on], `heading` | `photo` ×12 (`image`, `alt`) |
| 11 | Comparison (`11-comparison`) | `eyebrow`, `heading`, `image_us`, `label_us`, `image_them`, `label_them`, `sr_yes`, `sr_no` | `row` ×8 (`label`, `us` [yes], `them` [no]) |
| 12 | Results (`12-results`) | `heading`, `subtitle`, `image`, `image_alt`, `image_product`, `image_product_alt`, `guarantee_big`, `guarantee_title`, `guarantee_text`, `guarantee_points` | `stat` ×4 (`value`, `label`, `text`) |
| 13 | Reviews list (`13-reviews-list`) | `eyebrow`, `heading`, `show_rating` [on], `rating_prefix`, `rating_word`, `initial_count` [3], `more_label` | `review` ×24 (as 03), `@app` |
| 14 | Legal (`14-legal`) | `category_line`, `note_1`, `note_2`, `note_3`, `inci_heading`, `inci`, `impressum_label`/`_link`, `widerruf_label`/`_link`, `datenschutz_label`/`_link` | – |

Sections 01 and 03–14 can be added to any template; 02 only to product templates.

## Buy box details

* **Gallery**: swipeable carousel. The first slide is the selected variant's image with up to three dark
  benefit tiles beside it and optional round text seals; the other product images follow. Thumbnails appear on
  desktop. Only image media are shown.
* **Rating line**: reads Shopify's standard `reviews.rating` / `reviews.rating_count` metafields (LAI writes
  them). A reviews app block added to the section replaces the line. Shown as "4.6 / 5.0 | ‘word’ (111)".
* **Bundle cards**: one radio card per variant, in variant order. A `bundle` block matches a variant by its
  title (`match`) or, when empty, by position. Prices always come from the variants:
  * `bundle_total` (default): the variant price is the bundle total; the per-unit line appears when the variant
    metafield `custom.units_per_variant` is set (price ÷ units).
  * `per_unit`: the variant price is per unit; total = price × units, compare-at × units, and the cart quantity
    equals the units. Without the metafield the variant counts as one unit.
  * Metafield definition: Settings → Custom data → Variants → Add definition, key `custom.units_per_variant`,
    type Integer. Fill 1 / 3 / 6 on the variants.
* **Add to cart**: the radios are `name="id"`, so the form works without JavaScript. With JavaScript the item is
  posted with fetch and the theme's cart drawer / notification is re-rendered (Dawn contract), or the visitor
  is sent to the cart page (`after_add`). `?variant=` in the URL is kept in sync and a `boarage:variantchange`
  DOM event fires.
* **Sticky bar** (mobile): mounts after the first scroll past the main button, hidden on desktop.
* **Payment icons**: the shop's enabled payment types (`payment_type_svg_tag`), no images to upload.

## Motion and accessibility

Transform/opacity only (plus `grid-template-rows` for accordions), 220 ms open / 150 ms close, easings
`cubic-bezier(0.23, 1, 0.32, 1)` and `cubic-bezier(0.77, 0, 0.175, 1)`, `:active` scale 0.97, hover effects
gated behind `(hover: hover) and (pointer: fine)`, `@starting-style` for the sticky bar, IntersectionObserver
stagger (50 ms) on stage cards, milestones and statistics, everything collapsed under
`prefers-reduced-motion: reduce`. Native `<details>` accordions, radio-group bundle selector, visible focus
rings, 44 px targets, body text ≥ 18 px, images with width/height (no layout shift), carousels with real
scrolling plus arrow buttons.

## Local verification (`dev/`)

```sh
npm run build          # dev/src → assets (csso + terser)
npm run check          # build + shopify theme check (0 errors)
npm run dev:render     # LiquidJS render of the template into dev/out/*.html (empty / filled, storefront / editor)
npm run dev:test       # Playwright: budgets, empty-state rules, variant switching, cart, carousels, countdown,
                       # accordion timing, reduced motion, keyboard, CLS, tap targets, dark mode
npm run dev:lighthouse # Lighthouse mobile on the rendered pages
node dev/shots.mjs     # viewport screenshots into dev/out/shots
```

The harness proves the markup/CSS/JS contract; it does not reproduce Shopify's money format, CDN images,
fonts, the editor or app blocks. Re-run Lighthouse on the preview URL for the real numbers.

## Known limitations

* The theme's header, footer and cart drawer keep their own design; the Boarage sections only style the page body.
* Video and 3D product media are skipped in the gallery.
* Comparison rows are yes/no only (the reference table has no "partly" state).
* The countdown runs in the visitor's local time.
