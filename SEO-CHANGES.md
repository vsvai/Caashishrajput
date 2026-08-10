# SEO Changes — Ashish Jayalata & Associates

Date applied: **2026-08-10** — static site at `https://caashishrajput.com`.

All changes were generated from the content model in **`scripts/seo-data.js`** by **`scripts/seo-overhaul.js`** (`node scripts/seo-overhaul.js`), with a few documented hand-edits below. Verification is automated by **`scripts/validate-seo.js`** (`node scripts/validate-seo.js`) → current result: **PASS** (see `SEO-VALIDATION-REPORT.md`).

---

## 1. Head metadata (every page, 30 pages)

- `html lang="en"` → `html lang="en-IN"`.
- `<title>` rewritten to the keyword-first format from the brief (max 60 chars, brand/name last). Examples:
  - Home: `Chartered Accountant Sahibabad, Ghaziabad | CA Ashish Rajput`
  - `services/gst.html`: `GST Registration & Return Filing in Sahibabad, Ghaziabad`
  - Blog: `GST Due Dates July 2026 | CA Ashish Rajput, Ghaziabad`
- `meta name="description"` rewritten to 140–158 chars, location + service + phone CTA.
- `og:title`, `og:description`, `twitter:title`, `twitter:description` synced to the same values.
- `pages/404.html`: added `<meta name="robots" content="noindex, nofollow">` plus description meta. (This file still returns HTTP 200 — a server-side 404 status is required; see §7.)
- Canonical links were already present and correct on all pages; left unchanged.

## 2. JSON-LD structured data (rebuilt on every page)

All previous `application/ld+json` blocks were stripped and regenerated from one source of truth:

- **AccountingService** (`@id` `/#practice`) — on every page except `pages/404.html`. Contains the canonical NAP (see `NAP-AUDIT.md`), geo, opening hours (Mon–Sat 10:00–19:00), and `sameAs` (Google Maps, Instagram, Facebook, LinkedIn, Justdial, Sulekha).
- **Person** (`@id` `/#person`) — CA Ashish Rajput, `worksFor` → `#practice`.
- **Service** — on all 17 service pages (name = new H1, `serviceType`, `provider` → `#practice`).
- **FAQPage** — on the 20 FAQ pages (see `FAQ-CONTENT.md`). Visible `<details>` text and FAQPage `Question`/`Answer` text are identical, word-for-word (machine-verified).
- **BreadcrumbList** — on every page that has breadcrumbs (core pages, service pages, blog posts, privacy policy). IDs resolved to absolute canonical URLs.
- **Article** — on the 5 blog posts (`headline`, `datePublished`, `dateModified` from the data file; `dateModified` updated to 2026-08-10).

## 3. On-page content

- **H1** rewritten (exactly one per page, verified): e.g. Home → `Chartered Accountant in Sahibabad, Ghaziabad`; `services.html` → `CA Services in Sahibabad, Ghaziabad`; service pages → `… in Sahibabad, Ghaziabad` (or `in Ghaziabad` where the title uses that). Blog/utility H1s untouched.
- **FAQ accordions** — new canonical items injected into the existing `.faq-section` on all 17 service pages (old items replaced), and new FAQ sections created on `index.html`, `services.html`, and `contact.html`.
- **Related-services** blocks — rewritten on all 17 service pages with 3–4 cross-links to other service pages.
- **Breadcrumbs** — `data-breadcrumbs` attribute added to `about.html`, `services.html`, `contact.html`, `blog.html`, `resources.html` so the existing JS breadcrumb component renders (previously only service pages, blog posts, and privacy had it).
- **Home page hand-edits:**
  - Contact-strip address corrected to canonical order (see `NAP-AUDIT.md`) and a landmark line added ("Krishna Plaza, near the Sahibabad main road…").
  - About-snapshot paragraph now lists service areas: Sahibabad, Vaishali, Vasundhara, Indirapuram, Rajendra Nagar.
  - Map iframe replaced with the Google business-place embed (same CID as the reviews embed), `title` + `loading="lazy"` retained.
  - The 10 service cards now deep-link directly to the individual service pages (e.g. `services/gst.html`) instead of `services.html#svc-…` anchors.
- **Contact page hand-edit:** address card corrected to canonical street order.
- **Privacy policy hand-edit:** NAP in the "Contact Us" section corrected to canonical order.
- **Service pages:** first-paragraph keyword+location checks — already contain "Ghaziabad / Sahibabad" within the first 100 words on all pages; no change needed.
- **Blog posts:** bodies untouched; each already links internally to a relevant service page from its opening paragraph (verified).

## 4. JavaScript / UX

- **`js/faq.js`** (new): single-open accordion with smooth height animation, URL-hash deep-linking (e.g. `…/services/gst.html#faq-gst-cost`), and `aria-expanded` on summaries. Included only on the 20 FAQ pages.
- **`js/main.js`**: old FAQ toggle animation removed (now handled by `js/faq.js`); nav, smooth-anchor, services-accordion, and slideshow logic unchanged.
- **`js/components.js`**: footer now contains a semantic `<address class="nap">` block — `nap-name`, `nap-street` (LG-3, S-14, Krishna Plaza), `nap-locality` (Vrindavan Garden, Sahibabad), `nap-region` (Ghaziabad, Uttar Pradesh 201005), phone, email, and hours. This makes the canonical NAP consistent across the whole site from a single injection point.

## 5. robots.txt / sitemap.xml

- `robots.txt`: removed `Disallow: /pages/` (it was blocking the privacy policy that is listed in the sitemap). `Allow: /` and the `Sitemap:` directive retained.
- `sitemap.xml`: 29 URLs — unchanged set, `lastmod` updated to 2026-08-10. The Google Search Console verification file is intentionally **not** included. `pages/404.html` is intentionally not included (noindex).

## 6. Content pipeline (new)

- `scripts/seo-data.js` — the single content model (titles, descriptions, H1s, breadcrumbs, related services, FAQs).
- `scripts/seo-overhaul.js` — applies the model to the HTML files. Idempotent: re-running converges to the same output.
- `scripts/validate-seo.js` — automated checks (valid JSON-LD, one H1, title/description lengths, FAQ visible-vs-schema match, internal links, sitemap/robots consistency).
- Removed obsolete `scripts/seo-update.js` (it would have re-applied the old title format if run).

## 7. Not done / requires server or third-party action

- **404 status**: `pages/404.html` is a static page; the server must return HTTP 404 for unknown URLs (currently returns 200).
- **FAQ rich results**: Google's FAQ rich-result presentation is no longer generally available in standard search results; the accordion + FAQPage schema are still worthwhile for on-page UX and entity clarity. Do not expect FAQ stars in SERPs.
- **No `aggregateRating`** was added (consistent with Google policy for review snippets without genuine on-site reviews).
- **No new service+location pages** were created and no existing URL was changed — per the brief.
- **Verify facts**: thresholds, due dates, and fee statements in FAQ answers must be confirmed by a practising CA before launch (note included in `FAQ-CONTENT.md`).
- **Recrawl**: after deploying, request indexing of `sitemap.xml` in Google Search Console and resubmit the address change / NAP updates to the Google Business Profile.

## 8. Verification

Run `node scripts/validate-seo.js`. Full output and methodology in `SEO-VALIDATION-REPORT.md`.
