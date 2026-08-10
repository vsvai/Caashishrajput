# SEO Validation Report — Ashish Jayalata & Associates

Run date: **2026-08-10** · Node v24.19.0 · Source site root `C:\Users\priya\Desktop\Projects\Caashishrajput\`

## Result

```
=== SEO Validation Report — 2026-08-10 ===

Pages checked      : 31
JSON-LD blocks     : 128 (all parsed OK)
FAQ pages verified : 20 (visible text matches FAQPage schema)
Sitemap URLs       : 29 (expected 29)

--- Pages with problems ---

RESULT: PASS — no problems found.
```

## How to reproduce

```powershell
cd C:\Users\priya\Desktop\Projects\Caashishrajput
node scripts/validate-seo.js
```

## What is checked

| # | Check | Scope | Failure mode |
|---|-------|-------|--------------|
| 1 | `<h1>` count | every HTML page except the Google verification file | must equal 1 |
| 2 | `<title>` length | every page | decoded length ≤ 60 |
| 3 | `meta description` length | every page | decoded length 140–158 |
| 4 | `html lang="en-IN"` | every page | present |
| 5 | JSON-LD parse | every `application/ld+json` script | must `JSON.parse` cleanly |
| 6 | Internal links | every `href` to a `.html` resource (relative), `../`-resolved against page dir | target file must exist; `pages/404.html` not linked |
| 7 | FAQ visible-vs-schema parity | the 20 FAQ pages | item count and word-for-word Q/A text must match FAQPage `mainEntity` |
| 8 | NAP street order | visible HTML on all pages except 404 | `S-14, Krishna Plaza, LG-3` order absent |
| 9 | Home phone call link | `index.html` | `tel:+918802586988` present |
| 10 | Google Maps links | all pages | only the canonical `https://maps.app.goo.gl/cMPY7JuiWfou4Ym1A` |
| 11 | Footer component inclusion | all pages | `js/components.js` script tag present (injects `<address class="nap">` at runtime) |
| 12 | Footer NAP block | `js/components.js` | `<address class="nap">` present with `nap-name`, `nap-street`, `nap-locality`, `nap-region`, `nap-phone`, `nap-email` |
| 13 | robots.txt | file | no `Disallow: /pages/`; `Sitemap:` URL present |
| 14 | Sitemap consistency | file vs. on-disk pages | every page except `pages/404.html` and the Google verification file is present; no extras |

## Counts behind the numbers

- **31 pages** = 30 indexed pages + `google128025df570a1c7b.html` (skipped from checks).
- **128 JSON-LD blocks**: AccountingService + Person on 29 pages (all but 404) = 58; Service on 17 service pages = 17; FAQPage on 20 pages = 20; Article on 5 blog posts = 5; BreadcrumbList on 28 pages = 28. Total = 58 + 17 + 20 + 5 + 28 = 128.
- **20 FAQ pages** = `index.html`, `services.html`, `contact.html` + the 17 service pages; visible `<details class="faq-item">` text matches the FAQPage schema word-for-word.
- **29 sitemap URLs** = 6 core + 17 services + 5 blog + 1 privacy (`pages/privacy-policy.html`); excludes `pages/404.html` (noindex) and the Google verification file.

## Verified separately (not in the script)

- Breadcrumb `data-breadcrumbs` attributes on `about.html`, `services.html`, `contact.html`, `blog.html`, `resources.html` (required by the existing breadcrumb component) — added 2026-08-10.
- `js/faq.js` `<script defer>` present on exactly the 20 FAQ pages and no other page.
- All 10 home service-card anchors now point at direct service pages (hand-verified; no `services.html#svc-` anchors remain in the service cards).
- Blog posts already contain internal links to relevant service pages (verified by grep, no edits needed).
