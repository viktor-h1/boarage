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
| `snippets/boarage-*.liquid` | Shared pieces: tokens/asset loader, gallery, purchase selector, icon set, stars, rating line, guarantee box, review card, accordion, section head, editor placeholder |
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
| `boarage_color_primary` / `_primary_ink` | #23382E Kelp / #F7F3EA Sea Salt | Headings on light, selected card border, badges, check marks |
| `boarage_color_cta` / `_cta_ink` | #E07B4F Dawn / #16201B Ink | The one accent: buttons, stars, sale/guarantee strip (fill only) |
| `boarage_color_mint` | #E07B4F Dawn | Highlights, big numbers and icons on Kelp sections |
| `boarage_color_soft` | #DCE6E1 Mist | Selected option cards, info panels: FAQ, trust box, chart fill |
| `boarage_color_warm` | #E8DCC4 Oat | Secondary panels: benefits, purchase panel, guarantee box, stage cards, gallery, saving badges |
| `boarage_color_line`, `_surface`, `_bg` | #DED5C3, #F7F3EA, #F7F3EA | Borders, cards, page (Sea Salt replaces pure white) |
| `boarage_radius` | 8 px | Corner radius |
| `boarage_dark_mode` | Off | Off / Follow system / Always dark (header and footer of the theme have no dark mode) |
| `boarage_guarantee_title`, `boarage_guarantee_text` | empty | The guarantee box shown in the buy box and the timeline |

Headline fields are inline rich text: **italic** words are highlighted (Dawn Deep on light, Dawn on Kelp, Oat on Tide).

## Brand styling (Dog Dental Powder palette, brand kit v1)

The layout and elements are the Auniva skeleton; the styling follows the brand palette and the UI/UX playbook rules:

* **Surfaces**: Sea Salt page and cards; Kelp for dark sections (problem, mechanism, legal, results card, comparison
  "us" column); Tide for secondary dark panels (reviews slider, timeline, mechanism card); Oat for secondary panels
  (benefits, guarantee box, stage cards, gallery, "them" column); Mist for info panels (FAQ, trust box).
* **Dawn is a fill only**: buttons, sale/guarantee strip, stars, guarantee box edge, timeline dots — always with
  Ink text (5.7:1), never Sea Salt on Dawn (2.7:1) and never Dawn text on a light background.
* **Small text**: Ink body, Tide secondary text and icons, Dawn Deep for small emphasis — Tide and Dawn Deep only on
  Sea Salt or Mist; inside Oat panels small text stays Ink/Kelp.
* **Playbook**: one primary action per view, selected option cards marked by a thicker border (and a check on the
  weight cards) as well as the fill (state not by colour alone), one corner radius everywhere, 4 px spacing scale,
  body line height 1.55 / headings 1.2, Kelp-tinted soft shadows, thin light borders.
* Dark mode maps to Ink page / Kelp panels with Sea Salt text. Its tokens are written by `snippets/boarage-tokens.liquid`
  (through the `--bpdp-c-*` layer) only when the dark-mode setting is on, so light-only stores don't load them.
* `npm run build` shortens CSS custom properties used only inside the stylesheet (`--bpdp-ink` → `--_ink`) to stay
  under the 25 KB budget; names that Liquid or the script use keep the `--bpdp-` prefix.

Existing themes that already saved values for the colour settings keep them: reset the colours under
Theme settings › Boarage PDP to pick up the brand defaults.

## Sections, settings and blocks

Every text setting is empty by default; `[…]` marks non-text settings with a default.

| # | Section (file) | Settings | Blocks |
|---|---|---|---|
| 01 | Sale bar (`01-sale-bar`) | `title`, `subtitle`, `align` [left], `countdown_mode` [off / daily / date], `countdown_end` (`YYYY-MM-DD HH:MM`), `label_hours`, `label_minutes`, `label_seconds` | – |
| 02 | Buy box (`02-buy-box`, product templates only, max. 1) | `gallery_aspect` [4:5], `media_fit` [contain], `sticky_gallery` [on], `show_thumbnails` [on], `seal_1`, `seal_2`, `show_rating` [on], `rating_prefix`, `rating_word`, `description`, `offer_label`, `weight_label`, `weight_option`, `supply_option`, `default_plan` [sub], `sub_badge`, `sub_label`, `sub_note`, `once_label`, `once_note`, `supply_badge`, `stock_text`, `cta_label`, `cta_show_price` [on], `after_add` [drawer], `show_payment_icons` [on], `show_guarantee` [on], `sticky_bar` [on], `sticky_cta_label` | `tile` ×3 (`icon`, `text`), `benefit` ×6 (`lead`, `text`), `weight` ×6 (`match`, `label`, `dose`, `image`), `point` ×3 (`text`), `note` ×2 (`icon`, `text`), `trust` ×4 (`icon`, `text`), `accordion` ×6 (`title`, `content`), `@app` |
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
* **Product setup** for the purchase selector:
  * Two options: the dog's weight (it sets the dose) and the supply length. Supply values start with the number of
    months, e.g. `1-month supply`, `2-month supply`, `3-month supply`. Every weight × supply pair is a variant with
    its own price (3 weights × 3 supplies = 9 variants). `weight_option` / `supply_option` name the options; empty
    = the first option is the weight, the other one the supply.
  * Subscription: add a monthly selling plan to the product with a subscription app (e.g. Shopify Subscriptions),
    at least on the 1-month variants. The subscription card uses the weight's 1-month variant with the product's
    first selling plan; its price is the plan price. Without a selling plan the subscription card, the points and the
    one-time card are skipped and only the supply cards show. "Sell as subscription only" hides the one-time card.
* **Weight cards**: one card per weight value, in option order. A `weight` block matches a value by `match` or,
  when empty, by position; `label` renames it, `dose` adds a line (e.g. "1 scoop a day"), `image` shows a round
  picture (empty: a paw icon that grows with the weight). Switching weight re-prices every card.
* **Purchase panel**: subscribe / one-time cards (badge, title, price, note). While the subscription is selected
  the `point` blocks show; with one-time they hide and the supply cards appear, each with this weight's price and a
  saving badge: `supply_badge` with `[percent]` = the saving against buying that many 1-month supplies (computed per
  weight, hidden when there is none).
* **Add to cart**: hidden `id` and `selling_plan` inputs (the latter disabled for one-time) carry the choice. Without
  JavaScript the form adds the selection shown on load. With JavaScript the item is posted with fetch and the theme's
  cart drawer / notification is re-rendered (Dawn contract), or the visitor is sent to the cart page (`after_add`).
  `?variant=` and `?selling_plan=` in the URL are kept in sync (a link reopens the same choice) and a
  `boarage:variantchange` DOM event fires with `variantId`, `available` and `sellingPlan`.
* **Sticky bar** (mobile): mounts after the first scroll past the main button, hidden on desktop.
* **Payment icons**: the shop's enabled payment types (`payment_type_svg_tag`), no images to upload.

## Motion and accessibility

Transform/opacity only (plus `grid-template-rows` for accordions), 220 ms open / 150 ms close, easings
`cubic-bezier(0.23, 1, 0.32, 1)` and `cubic-bezier(0.77, 0, 0.175, 1)`, `:active` scale 0.97, hover effects
gated behind `(hover: hover) and (pointer: fine)`, `@starting-style` for the sticky bar, IntersectionObserver
stagger (50 ms) on stage cards, milestones and statistics, everything collapsed under
`prefers-reduced-motion: reduce`. Native `<details>` accordions, radio-group option cards (arrow keys move within a group), visible focus
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
