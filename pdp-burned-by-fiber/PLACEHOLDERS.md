# Placeholders: Doo Diligence PDP, "Burned by fiber"

Everything below renders on the page with a **yellow background** (`[[PLACEHOLDER: …]]`) or as a grey
"PLACEHOLDER IMAGE" box, so nothing can ship by accident. Fill them all in `content.json` (the path is given
for each one), reload, and check that the browser console no longer prints
`N placeholders still on this page`.

**Fill these 3 config values first.** Each one appears in several sections, so one edit clears many yellow marks.

| # | Where it shows | `content.json` path | What goes here |
|---|---|---|---|
| 1 | 4.2 sub-headline, 4.9 Report, 4.11 Comparison (fiber per serving) | `config.FIBER_G` | Grams of fiber per stick (target ≥5). Number, e.g. `5` |
| 2 | 4.9 Report (per stick) | `config.FILL_G` | Grams of powder per stick. Number, e.g. `6` |
| 3 | 4.9 Report (made in), 4.15 FAQ 10 | `config.MADE_IN` | Where it's made, e.g. `"USA"` |

## By section

| # | Section | `content.json` path | What goes here |
|---|---|---|---|
| 4 | 4.1 Announcement bar (only when `SALE_MODE` is on) | `announcement.sale_text` | What the real sale is, e.g. launch price. Also set `config.SALE_END_DATE` (YYYY-MM-DD), or a date placeholder shows |
| 5 | 4.2 Buy box (only when `PREORDER_MODE` is on) | `config.PREORDER_SHIP_DATE` | Real ship date, YYYY-MM-DD. Empty shows a placeholder |
| 6 | 4.10 Offer, free gift card | `buybox.gift.value` | Dollar value of the Slow-Start Kit (`$[[…]] value`). Only state a value you can support |
| 7 | 4.5 The fix, item 1 | `fix.items[0].text` | Confirm "no sugar alcohols" against the final spec sheet, then delete the placeholder |
| 8 | 4.9 Report | `report.rows[1].v` | Other ingredients |
| 9 | 4.9 Report | `report.rows[2].v` | Sweeteners / sugar alcohols in the "Not in here" list (confirm) |
| 10 | 4.11 Comparison: fiber per serving, gummy | `compare.rows[0].values[1]` | Verified typical number for the category |
| 11 | 4.11 Comparison: fiber per serving, powder | `compare.rows[0].values[2]` | Verified typical number |
| 12 | 4.11 Comparison: fiber type, gummy | `compare.rows[1].values[1]` | Often inulin/chicory: verify |
| 13 | 4.11 Comparison: fiber type, powder | `compare.rows[1].values[2]` | Verify |
| 14 | 4.11 Comparison: texture, powder | `compare.rows[3].values[2]` | Verify |
| 15 | 4.11 Comparison: added sugar, Doo Diligence | `compare.rows[4].values[0]` | Added sugar per stick (from the spec sheet) |
| 16 | 4.11 Comparison: added sugar, gummy | `compare.rows[4].values[1]` | Verify |
| 17 | 4.11 Comparison: added sugar, powder | `compare.rows[4].values[2]` | Verify |
| 18 | 4.12 Founder note (shown while `SHOW_REVIEWS` is false) | `proof.founder.body` | Viktor writes this. Real story only |
| 19 | 4.12 Founder note | `proof.founder.signoff` | Name and role |
| 20 | 4.15 FAQ 5 "Why {fiber}?" | `faq.items[4].a` | Short, factual paragraph once the formula is final |
| 21 | 4.15 FAQ 10 "Where is it made?" | `faq.items[9].a` | Facility details (FDA-registered, GMP…), **only if true**. Otherwise delete the placeholder |
| 22 | 4.16 Email capture | `config.KLAVIYO_FORM_ID` (and `email.klaviyo_placeholder`) | Klaviyo form ID. Setting it swaps the prototype form for the Klaviyo embed div. The Klaviyo onsite script still has to be added (no third-party scripts yet, per the brief) |
| 23 | 4.18 Footer links ×4 | `footer.links[*].href` | URLs for Shipping, Returns, Subscription terms, Contact. Contact falls back to `config.SUPPORT_EMAIL` |
| 24 | 4.18 Footer, Prop 65 (shown for psyllium, or when `PROP65_WARNING` is `true`) | `footer.prop65_text` | Exact Prop 65 warning text from the lab results and counsel |

## Reviews (only when `SHOW_REVIEWS` is true)

Keep `SHOW_REVIEWS` false until these are real. Each slot is tagged with the objection it should answer, so pick
real reviews that fit it.

| # | `content.json` path | Objection tag | What goes here |
|---|---|---|---|
| 25 | `proof.reviews.rating` + `proof.reviews.count` (numbers; while null, `rating_placeholder` shows) | – | Real average rating and review count |
| 26–28 | `proof.reviews.items[0]` `.title` `.text` `.name` (+ optional `.rating`) | `gas` | Review that answers "will I get gas?" |
| 29–31 | `proof.reviews.items[1]` | `taste` | Review about taste / texture |
| 32–34 | `proof.reviews.items[2]` | `never_worked` | Review from someone fiber burned before |
| 35–37 | `proof.reviews.items[3]` | `timeline` | Review about how long results took |

## Images (grey boxes)

Set `src` (plus `width`/`height`, and optionally `srcset`/`sizes` and `thumb`) on each item. The hero is the LCP
element: keep it at ~150 KB or less (WebP/AVIF) to stay well under 2.5 s on 4G.

| # | `content.json` path | Shot |
|---|---|---|
| 38 | `buybox.gallery.items[0]` | Box + a few sticks on a bathroom counter (**hero**, loads with `fetchpriority="high"`) |
| 39 | `buybox.gallery.items[1]` | A stick being poured into a glass (shows the texture) |
| 40 | `buybox.gallery.items[2]` | The 7-day Slow Start card/timeline |
| 41 | `buybox.gallery.items[3]` | The Doo Diligence Report label close-up |
| 42 | `buybox.gallery.items[4]` | Stick in a jeans pocket / travel bag (portability) |
| 43 | `buybox.gallery.items[5]` | "What's in the box" incl. the Slow-Start Kit |
| 44 | `buybox.gift.image` | Slow-Start Kit (gift card thumbnail). Name and image are editable for the later physical canister |

## Settings to decide before launch (not yellow, but check them)

- `config.SUPPORT_EMAIL`: turns every "email us" (honesty block, FAQ 2, guarantee) into a mailto link.
- `config.COA_URL`: adds the "View the lab report (COA)" link and the VERIFIED stamp. Leave empty until a real COA exists.
- `buybox.offer.options[1].badge` = "Most popular": until there are sales, nothing backs this. Consider "Our pick" until real data exists.
- `config.CTA_URLS` / `CTA_URLS_SUBSCRIBE`: empty = prototype mode (the click is logged and a note is shown). Fill with cart links to take orders.
- Psyllium only: the full-glass-of-water warning (`water_warning`) uses the standard choking-warning wording. Have it confirmed for the final label.
