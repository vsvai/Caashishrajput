# Change Log — October 2026 redesign & compliance pass

Date: **3 October 2026**. Audit and rationale: `WEBSITE-AUDIT-2026-10.md`. Nothing here has been committed or deployed; review with `git diff`, then commit and push to publish.

## Major changes

| # | File / page | Change | Reason | SEO impact | UX impact | Performance | Compliance | Testing |
|---|---|---|---|---|---|---|---|---|
| 1 | `scripts/lib/site-chrome.js` → all 49 pages | Firm "AJA" monogram removed from header, footer, favicon, OG image and schema. The firm name is now plain text beside the unaltered CA India logo | Monograms prohibited | Neutral; OG image is now a proper 1200×630 card | Clearer brand line ("Ashish Jayalata & Associates · Chartered Accountants") | Header logo 9 KB PNG | Code of Ethics 2026 §2.14.1.7(xvii), §3.1.3(G) | Validator rule; visual check |
| 2 | `index.html` | Google reviews embed, "Client Reviews" heading, review invitation and footer "Client Feedback" link removed | Testimonials and endorsements prohibited | None (iframe content was not indexable) | — | Removes one Google Maps iframe | §3.1.3(E) | Validator rule |
| 3 | 9 service pages, `services.html`, `seo-data.js` | Fee and comparative-cost claims reworded ("no hidden charges", "modest fee", "fraction of the cost"); `priceRange: "Reasonable and transparent"` removed from schema on 42 pages | Fee claims and exaggeration | FAQ schema still word-for-word identical to the visible text | Neutral, factual tone | — | §3.1.3(B), §3.3.7(xiii) | Validator FAQ parity and fee rule |
| 4 | `services/business-advisory.html` | Loan FAQ now says documents only: "We do not arrange loans or act for any lender" | Loan arrangement is outside permitted scope | — | Sets clear expectations | — | ICAI 2020 website advisory | Grep |
| 5 | Header (all pages) | Pulsing and shining gold "Call Now" replaced by a calm "Call the office" button | Attention-seeking styling; tone | — | Calmer | Two infinite animations removed | §3.3.14, §3.3.17 | Visual |
| 6 | `404.html` (new, root); `pages/404.html` removed | Real 404 page that GitHub Pages actually serves, using `<base href="/">` so links work at any depth | Visitors saw GitHub's generic 404 | Correct 404 status | Navigation and popular links | — | — | `curl` → 404; crawler |
| 7 | `scripts/seo-overhaul.js` | Refuses to run without `--force` | Running it would revert 27+ pages | Prevents regressions | — | — | — | Run → exits 1 |
| 8 | `css/style.css` (rewritten) | New design system: ink navy on warm paper, one brass accent, Source Serif 4 headings with the system UI font for text, consistent buttons, cards, focus rings and spacing; no gradients or pulsing; `prefers-reduced-motion`; print styles | Template-like, gradient-heavy look | — | Premium, calm, consistent | 50 KB raw / 10 KB gzip | — | Screenshots on desktop and mobile; contrast check |
| 9 | `index.html` (rebuilt) | Hero states what, where and who, with two CTAs and a practice card (passport photo, ICAI membership, established 2023, languages, address). Services grouped into 4 needs (17 links). Who we work with, a 4-step process, founder section, newest 3 insights, contact block with click-to-load map | Failed the 5-second test; full-screen logo carousel | H1 now "Chartered Accountants in Sahibabad, Ghaziabad"; 17 contextual service links; newest posts linked | Mobile page height similar (9,908 → 9,596 px) but the carousel screen is replaced with services, process and credentials; trust content above the fold | See measurements | All particulars from §3.2.1 permitted list | Screenshots; JS checks |
| 10 | `scripts/blog-build.js` | Home "Recent updates" is generated from the 3 newest posts (`npm run blog:home`; also runs on publish/rebuild). Post template's `<h2>Blog</h2>` before the H1 replaced by a kicker paragraph; 14 existing posts fixed | Stale home links; heading order | Fresh internal links to new content | Correct outline for screen readers | — | — | Validator heading-order rule |
| 11 | Core pages | Descriptive H1s: About, Contact, Insights, Compliance calendar, Services, Privacy | Generic one-word H1s | Clearer topical/local signals | Clearer orientation | — | — | Validator (1 H1 per page) |
| 12 | 17 service pages | Hero CTA ("Enquire about this service", "Call the office") and closing CTA with enquiry, phone and WhatsApp (service-specific pre-filled text). Enquiry links pre-select the service on the contact form | One generic CTA at the bottom | — | Context-specific next step | — | Pull mode: visitor-initiated | Crawler; form test |
| 13 | `contact.html`, `js/enquiry.js` | Accessible inline validation (`aria-invalid`, error text, focus to first error), status message after hand-off, `?service=` pre-selection, LEI option, inline `<style>` and `onclick` removed, click-to-load map | `alert()` errors, no confirmation | — | Fewer failed submissions | Map iframe deferred | DPDP consent kept | Scripted form test |
| 14 | `js/main.js` | Accessible menu (aria-expanded, aria-controls, Escape, outside click), click-only services accordion, click-to-load maps, `contact_click` hooks (inactive unless analytics is added), carousel code removed | A11y; hover accordion | — | Predictable | Smaller JS | — | Scripted checks |
| 15 | All pages (chrome) | Skip link, `<main id="main-content">`, `aria-current` on nav, mobile contact bar (Call · WhatsApp · Enquire) replacing the floating circle on phones | A11y, mobile CRO | — | One-tap contact on every page | — | Visitor-initiated | 320 / 375 px overflow test |
| 16 | `services.html` | All four groups open by default; hover-to-open removed | Content jumped on hover; links hidden | All 17 links visible | Scannable | — | — | Screenshot |
| 17 | `images/` | Added `ca-india-logo.png`, `favicon-32.png`, `apple-touch-icon.png`, `icon-512.png`, `og-image.jpg`, `founder-152.jpg`, `founder-440.jpg`; removed `logo.*`, `logo-96.png`, `home-slide-*` | Compliance; right-sized images | OG card for sharing | — | Founder 110 KB → 7 KB / 39 KB | — | Crawler: all assets 200 |
| 18 | `scripts/validate-seo.js` | New rules: monogram images, testimonials and reviews, fee claims, superlatives, heading before H1 | Lock in compliance | — | — | — | — | Verified to flag the old pages |
| 19 | `scripts/serve.js`, `package.json` | `npm run serve`: local server with GitHub-Pages-like 404 and gzip | Repeatable local testing | — | — | — | — | Used for all tests |
| 20 | `sitemap.xml` | `lastmod` set to 2026-10-03 on the 23 main and service pages that changed materially; blog dates left alone | Accurate recrawl hints | — | — | — | — | Validator sitemap check |

## Testing performed

| Test | Tool | Result |
|---|---|---|
| SEO validation (titles, descriptions, 1 H1, JSON-LD parse, FAQ parity, internal links, NAP, sitemap/robots, new ICAI rules) | `node scripts/validate-seo.js` | **PASS**: 50 pages, 168 JSON-LD blocks, 19 FAQ pages, 40 sitemap URLs |
| New validator rules actually catch the old problems | Rules run against the `HEAD` versions of `index.html`, `gst.html` and a blog post | Monogram, reviews and fee flagged on all three; heading-order flagged on the post |
| Link / asset / anchor crawl | Custom crawler against the local server | 49 pages, 1,808 internal references, 75 unique targets: **all 200**, all `#anchors` exist |
| Unknown URL | `curl /services/does-not-exist` | **404** with the new 404 page |
| Console errors / broken images / H1 count | Browser pane, 12 key pages | 0 errors, 0 broken images, exactly 1 H1 each |
| Horizontal overflow | Browser pane, 27 pages at 320 px and 375 px | One overflow found (contact page at 320 px, long email in grid) → **fixed** → 0 |
| Mobile menu | Scripted: toggle, aria-expanded, Escape | Pass |
| Contact form | Scripted: empty submit, invalid phone, valid submit, `?service=` pre-select, message text (`window.open` stubbed, nothing sent) | Pass |
| Click-to-load map | Scripted | No Maps requests before click; iframe inserted on click |
| Idempotent chrome stamping | `npm run chrome` twice | Second run: 0 pages changed |
| Colour contrast | WCAG formula on every text/background pair | All text ≥ 5.4:1; form borders fixed from 1.69:1 to 4.07:1 |
| Performance | Headless Chrome via DevTools Protocol, 375 px mobile, 4× CPU slowdown, 150 ms RTT / 1.6 Mbps, gzip on, cache off, full scroll; median of 3, previous commit vs now | See below |

No automated accessibility engine (axe/Lighthouse) or unit-test suite exists in the project, and none was installed.

## Performance (lab, measured, median of 3)

| Page | Version | FCP | LCP | CLS | Requests (after full scroll) | Transfer (KB) | Third-party requests / KB |
|---|---|---|---|---|---|---|---|
| Home | before | 1,244 ms | 1,392 ms | 0 | 41 | 971 | 32 / 897 |
| Home | after | 1,420 ms | 1,420 ms | 0 | **9** | **128** | **2 / 52** |
| GST service | before | 1,300 ms | 1,300 ms | 0 | 6 | 85 | 0 / 0 |
| GST service | after | 1,308 ms | 1,308 ms | 0 | 8 | 84 | 2 / 52 |
| Contact | before | 1,064 ms | 1,064 ms | 0 | 33 | 735 | 27 / 651 |
| Contact | after | 1,432 ms | 1,432 ms | 0.0006 | **9** | **85** | **2 / 52** |
| About | before | 1,104 ms | 2,004 ms | 0 | 6 | 178 | 0 / 0 |
| About | after | 1,232 ms | **1,232 ms** | 0 | 8 | 178 | 2 / 52 |

FCP/LCP differences under ~300 ms are within run-to-run noise: repeated runs of the same contact page ranged 1,140–1,432 ms. The two extra requests are the one web font (Source Serif 4, ~50 KB), loaded without blocking rendering. INP was not measured (lab tooling can't measure it meaningfully without real interactions).

## Follow-up — compliance calendar redesign (3 Oct 2026)

| File | Change | Testing |
|---|---|---|
| `resources.html` | Calendar data (95 due dates) converted to semantic, crawlable markup (`.cc-month` / `.cc-item` with `<time datetime>`); "22/24" dates carry a state-dependent note; old tabs script removed | Validator PASS; crawler 1,808 refs OK |
| `js/compliance-calendar.js` (new) | Interactive view built from that markup: live countdown to the next deadline (IST, 23:59 cut-off), working law filters (click isolates a law, further clicks combine), animated 12-month stacked chart (click opens a month), month grid with law-coloured markers and today ring, day filter, "in N days / Due today / Passed" badges, per-item and bulk `.ics` export with a 2-day reminder (RFC 5545 line folding) | Scripted: filters, month nav, bar click, day filter, countdown value, .ics content (47 upcoming events, max line 70) |
| `css/style.css` | New `.cc-*` styles; distinct icons per law (receipt-rupee, percent badge, piggy bank, heart-pulse, building, handshake); scrollable chip row on phones; reduced-motion respected | 320/375/768 px: no overflow |
| `resources.html` | Useful-links icons replaced with portal-specific icons; "Articles & updates" now generated from the newest posts by `blog-build.js` | `npm run blog:home` updates index and resources |
