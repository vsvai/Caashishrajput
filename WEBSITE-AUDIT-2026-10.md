# Website Audit & Improvement Plan — caashishrajput.com

Audit date: **3 October 2026** · Site: static HTML on GitHub Pages (custom domain `caashishrajput.com`), Node build scripts, Supabase-backed careers admin.

This document is the Phase 1–6 output (discovery, audit, ICAI review, plan). What was implemented, and how it was tested, is recorded in `CHANGELOG-2026-10.md`.

---

## 1. Discovery summary

| Area | Finding |
|---|---|
| Framework / build | Hand-written static HTML. No bundler. `npm run chrome` stamps header/breadcrumbs/footer from `scripts/lib/site-chrome.js`; `npm run blog:*` and `npm run careers:*` generate pages from Markdown; `npm run seo:validate` runs `scripts/validate-seo.js`. |
| Hosting | GitHub Pages (`CNAME`, `.nojekyll`). `_headers` / `_redirects` exist but are **ignored by GitHub Pages** (they only work on Cloudflare Pages / Netlify). |
| Pages | 50 HTML files: 6 core, 17 service pages, 14 blog posts, privacy, 404, 6 careers, 4 admin, Google verification file. 40 URLs in the sitemap; 8 noindex (admin + careers app). |
| CSS | One `style.css` (38 KB, unminified) + `careers.css`. System font stack. Heavy use of inline `style=""` attributes in pages. |
| JS | `main.js` (nav, accordion, blog filter, slideshow), `faq.js`, careers/admin modules. No framework. |
| Analytics | **None.** No GA4, no Search Console API data available in this environment (only the GSC verification file exists). |
| Structured data | AccountingService + Person on every page, Service on service pages, FAQPage, BreadcrumbList, Article. All JSON-LD parses. |
| Third-party | Two Google Maps iframes on the home page (map + "reviews" embed of the same place), one on contact. WhatsApp deep links. |
| Images | AVIF/WebP/JPEG triplets already generated. Hero is the CA India logo; a 2-slide carousel shows the CA India logo and the firm's "AJA" monogram. |

### Page inventory

| Page | Purpose | Target search intent | Current issues | SEO issues | UX issues | Priority |
|---|---|---|---|---|---|---|
| `/` (home) | Gateway | "chartered accountant Sahibabad / Ghaziabad", "CA near me" | Hero says only the firm name; full-screen logo carousel; reviews embed; stale "latest updates" (May–July posts while September posts exist) | H1 is the firm name, not what/where; 2 heavy map iframes | First screen doesn't say what the firm does or where; 10 equal cards; 4 "stats" of little value | **P0/P1** |
| `/about.html` | Founder & firm profile | "CA Ashish Rajput", brand | Good factual copy; generic H1 "About" | Weak H1 | Founder photo framed in gold; layout acceptable | P2 |
| `/services.html` | Service hub | "CA services Ghaziabad" | Accordion that opens on hover (desktop) — content shifts as the cursor moves | H1 "Our Services" | Hover-driven accordion is surprising | P2 |
| `/services/*` (17) | Service detail | Service + location | Good depth (800–1,300 words), FAQs, related links | Titles/metas already sound | Single CTA box at the bottom; long pages with no persistent contact path on mobile | P1/P2 |
| `/contact.html` | Conversion | "CA office Sahibabad contact" | Form opens WhatsApp / email (no backend) — fine; validation uses `alert()` | H1 "Contact" | `alert()` errors, no inline field errors | P1 |
| `/blog.html` + 14 posts | Education / topical authority | Informational | Post pages put `<h2>Blog</h2>` **before** the `<h1>` | Heading order | — | P1 |
| `/resources.html` | Compliance calendar | "GST due dates", "compliance calendar FY 2026-27" | Useful | H1 "Resources" | — | P2 |
| `/pages/privacy-policy.html` | Legal | — | Fine | — | — | P3 |
| `/pages/404.html` | Error page | — | **GitHub Pages never serves it** — it only serves `/404.html` at the site root, so unknown URLs show GitHub's generic 404 | — | Visitors who mistype a URL lose the site navigation | **P0** |
| `/career/*` | Vacancies (permitted under ICAI 3.3.7(x)) | "article assistant vacancy Ghaziabad" | Fine | — | — | P3 |

---

## 2. ICAI compliance review

**Source checked:** ICAI *Code of Ethics, 13th edition (Volume I, 2026)*, applicable from **1 April 2026** — §2.14.1.7(xvii) "Use of Logo", §2.14.1.7(xviii) "CA India Logo", §3.1 Advertisement guidelines (conditions A–I), §3.2 permitted write-up particulars, §3.3 Website guidelines (3.3.1–3.3.21). Text extracted from the published PDF on 3 Oct 2026. Earlier references: ICAI advisory on website guidelines (14 Oct 2020); ICAI Council press release of 12 Dec 2025 (447th meeting) announcing the liberalisation.

What changed in 2026 that matters here: websites may now run in **push and pull** mode, **except** that services exclusively reserved for Chartered Accountants (statutory audit, tax audit, attest functions) remain **pull-only** (3.3.3–3.3.4). Client names may be shown only with client permission (3.3.7(xiii)). Photos of professional events are allowed. **Unchanged:** no testimonials or endorsements, no monograms or catch-words, no awards/accreditations, no fee claims, no banner advertisements, and nothing that amounts to solicitation.

| Element | Current status | Risk / issue | Applicable rule | Action |
|---|---|---|---|---|
| "AJA" monogram logo (header, footer, favicon, carousel, OG image, Article schema publisher logo) | Used site-wide | **High.** A firm monogram / name styled as a logo is prohibited | §2.14.1.7(xvii) (Council, Dec 1997, reaffirmed in the 2026 Code); §3.1.3(G) "Monogram of any kind … is not permissible" | **Removed.** Firm name set in plain text; the CA India logo is used instead (permitted in write-ups and websites, §3.2.1(B)(x)) |
| CA India logo | Used in hero, cropped into a gold-bordered circle; alt text says "ICAI logo" | Medium: the logo guidelines forbid altering design, proportions or the white background; the alt text misidentifies it | §2.14.1.7(xviii), Appendix L | Shown uncropped on its white background at its original proportions; alt text corrected to "CA India logo" |
| Google reviews embed + "Client Reviews" heading + "leave a review" invitation + footer "Client Feedback" link | On home page | **High.** Displays third-party endorsements of the member and invites them | §3.1.3(E) "should not contain testimonials or endorsements" | **Removed.** The office map stays (location is permitted information) and loads only on request |
| Fee statements ("no hidden charges", "we keep the professional fee modest", "keep registration low", "at a fraction of the cost") | Several service FAQs and the services hub | Medium: fee claims and comparative cost claims | §3.1.3(B) no exaggerated claims; §3.3.7(xiii) "Fee charged cannot be given"; ICAI 2020 advisory "mention of professional fees" | **Rephrased** to neutral, factual process language ("we confirm the scope and fee in writing before starting") |
| "Call Now" button with infinite pulse and shine animation | Header on every page | Low–medium: attention-seeking styling edges toward solicitation and is out of character for a professional firm | §3.3.14 (site must not be designed to solicit); §3.3.17 "befitting the profession" | Animation removed; the button now reads "Call the office" |
| Stats: "3+ Years of Practice", "16+ Service Areas" | Home page | Low: "16+" is a catch-number and doesn't match the actual 17 services | §3.1.3(A)(B) | Replaced with permitted factual particulars: "Established 2023", "ICAI member, holds Certificate of Practice", languages |
| Statutory audit / tax audit pages | Pull-mode web pages | Compliant: a website a visitor chooses to visit is pull mode. **Do not** email these pages or promote them in ads or social posts | §3.3.3–3.3.4 | No change. Recorded so that future marketing stays pull-only for these services |
| Social links in footer | Plain links | Compliant, as long as there is no "Follow / Like us" call to action | §3.3.12 | Kept; no follow prompts added |
| Government / ICAI links | Footer "Important links" | Compliant | §3.3.18 | Kept |
| Founder photograph | Passport-style headshot | Compliant | §3.2.1(A)(xiv), §3.3.11 | Kept; decorative gold frame removed |
| Careers / articleship vacancy | Pages under `/career/` | Compliant | §3.3.7(x) | Kept |
| Blog and compliance calendar | Educational content | Compliant | §3.3.11 | Kept |
| Disclaimer in footer | Present | Good practice | — | Kept, tightened |
| WhatsApp / online enquiry | Floating button plus form | Compliant: the visitor initiates contact, and online advice to clients who request it is permitted | §3.3.11 (chat, with confidentiality), §3.3.13 | Kept; the floating button becomes a calm mobile contact bar |
| Business plan / advisory FAQ: "Can you help me get funding or a business loan?" | Answer prepares projections and reviews loan files | Low–medium: arranging loans is outside the permitted scope (2020 advisory item 9); preparing projections is fine | 2020 advisory: "services exceeding permitted authority (e.g. loan arrangement)" | Wording checked: the page describes preparing documents, not arranging finance. Keep it that way |
| Asset valuation page | Valuation reports for banks | **Needs owner confirmation**: some valuations legally require an IBBI Registered Valuer (Companies Act s.247) or bank-empanelled valuer, and "empanelment" itself cannot be advertised | Companies Act s.247; 2020 advisory item 25 | **Flagged for you**, not changed |
| Justdial / Sulekha listings (in schema `sameAs`) | Third-party directory listings | **Needs review**: listing on app-based service aggregators is not permitted for services reserved for CAs (audit/attest). Directory presence for non-exclusive services is allowed | Code of Ethics §3.6 "Application based Service provider Aggregators" | **Flagged for you**: check what those listings say. Schema left unchanged |
| Firm Registration Number (FRN), membership number | Not shown | Optional permitted particulars | §3.2.1(A)(ii), (B)(ii) | Not shown, by owner decision (3 Oct 2026) |

---

## 3. SEO audit

**Technical:** the foundation is strong. Unique titles (≤60 characters), descriptions of 140–158 characters, canonicals, valid JSON-LD, a sitemap that matches the files on disk, and a sensible robots.txt. Issues found:

1. **404 handling** (P0): GitHub Pages serves `/404.html` with a real 404 status; `pages/404.html` is never used.
2. **Stale generator** (P0, maintainability): running `scripts/seo-overhaul.js` today rewrites 27 pages back to older content (it was verified, and the changes reverted, during this audit). It is a trap for the next person who runs it.
3. **Generic H1s** on About / Contact / Blog / Resources / Services ("About", "Contact" …), and the home H1 is the firm name only.
4. **Heading order** on all 14 blog posts (`<h2>Blog</h2>` appears before the `<h1>`).
5. **Home internal links** to blog posts point at May–July content; the six newest posts (September) are not linked from the home page.
6. **OG image** is the monogram (compliance) at 58 KB; Twitter card `summary`.
7. **Article schema** publisher logo is the monogram.
8. Every meta description ends with "Call +91 88025 86988". This is not wrong, but it spends about 25 characters per snippet on the same text. **Left as is**: without Search Console data there is no evidence to justify rewriting 40 snippets (see §5).

**Local SEO:** NAP is consistent everywhere (previous audit, `NAP-AUDIT.md`). AccountingService schema has geo, opening hours and `sameAs`. Service areas (Vaishali, Vasundhara, Indirapuram, Rajendra Nagar) are mentioned in copy rather than as doorway pages, which is correct. No new location pages are proposed.

### Keyword → page map (current, validated)

| Page | Primary keyword | Secondary | Intent | Title (kept/changed) | H1 |
|---|---|---|---|---|---|
| Home | chartered accountant Sahibabad Ghaziabad | CA in Ghaziabad, CA near me, CA firm Sahibabad | Local / navigational | Kept | **Changed →** "Chartered Accountants in Sahibabad, Ghaziabad" |
| services.html | CA services Ghaziabad | GST, ITR, audit, ROC | Commercial | Kept | **Changed →** "Chartered Accountant services in Ghaziabad" |
| gst.html | GST registration Ghaziabad | GST return filing, GST consultant Ghaziabad | Transactional | Kept | Kept |
| income-tax.html | ITR filing Ghaziabad | income tax consultant Ghaziabad | Transactional | Kept | Kept |
| tax-audit.html | tax audit Ghaziabad | 44AB, Form 3CD | Commercial | Kept | Kept |
| statutory-audit.html | statutory audit Ghaziabad | company audit | Commercial | Kept | Kept |
| company-llp-registration.html | company registration Ghaziabad | LLP registration Ghaziabad | Transactional | Kept | Kept |
| accounting-bookkeeping.html | accounting services Ghaziabad | bookkeeping Sahibabad | Commercial | Kept | Kept |
| about.html | CA Ashish Rajput | Ashish Jayalata & Associates | Navigational / trust | Kept | **Changed →** "CA Ashish Rajput and Ashish Jayalata & Associates" |
| contact.html | CA office Sahibabad | contact chartered accountant Ghaziabad | Navigational | Kept | **Changed →** "Contact the office in Sahibabad, Ghaziabad" |
| blog.html | — | tax updates | Informational | Kept | **Changed →** "Tax, GST and compliance updates" |
| resources.html | compliance calendar FY 2026-27 | GST due dates | Informational | Kept | **Changed →** "Compliance calendar and resources" |

No new pages target an intent that an existing page already covers. TDS, payroll and PF/ESI are handled inside existing pages; a dedicated **TDS / payroll compliance page** is the strongest new-page candidate *if* Search Console shows impressions for it (see next steps).

---

## 4. UX / design audit (highlights)

- **First screen fails the 5-second test**: it shows the firm name, "(Chartered Accountants)", three buttons and a large logo. It never says what the firm does, for whom, or where.
- **Second screen** is a 960 px carousel of two logos, a full viewport of no information on mobile (the home page is 9,900 px tall on a phone).
- **Visual language** is navy + gold *gradient* buttons, a pulsing gold CTA, and a gold-ringed circular logo. It reads as template-like rather than premium.
- **Typography**: system fonts, heavy 800-weight headings, no typographic hierarchy between display and body type.
- **Services**: 10 equal cards with long, similar descriptions; hard to scan.
- **Trust**: the founder's credentials, the strongest legitimate trust signal, are absent from the home page.
- **Mobile**: no persistent contact path apart from a floating WhatsApp circle that covers content.
- **Forms**: `alert()` validation; no inline errors; no confirmation message after the WhatsApp/email hand-off.
- **Services hub accordion** opens on mouse hover, so content jumps as the cursor moves over it.

## 5. CTR / Search Console

**No Search Console data was available** in this environment: no API connector and no exported files on the machine. A GSC property exists (verification file). So:

- No CTR-driven title/meta rewrites were made; existing titles are already intent-matched and ≤60 characters.
- The home H1 and on-page relevance changes are implemented improvements, **not** measured CTR gains.
- To unlock §16 of the brief, export *Performance → Pages* and *Queries* (last 3 months, web) as CSV into the repo or connect GSC; the opportunity matrix can then be produced from real numbers.

## 6. Performance (baseline, measured locally)

Home page before: two Google Maps iframes (each pulls ~1–1.5 MB of Google JS once in view), a carousel with two 1280 px images, 38 KB unminified CSS, 4.6 KB JS. LCP element: hero logo image (preloaded). Measured numbers are in `CHANGELOG-2026-10.md`.

## 7. Accessibility (baseline)

- Nav toggle: no `aria-expanded`, inline `onclick`, no `aria-controls`.
- Blog posts: heading-level skip (h2 before h1).
- Carousel auto-advances every 4 s with no pause control on touch devices (WCAG 2.2.2).
- Header gold-on-navy and gold gradient button text pass contrast; "Learn more →" links on cards are repetitive, though each has an `aria-label`.
- No `prefers-reduced-motion` handling for the pulsing CTA / carousel.
- Focus styles only on `.btn`.

---

## 8. Prioritised implementation plan

### P0 — Critical (compliance, broken behaviour)
1. Remove the firm monogram everywhere; replace it with the CA India logo plus the firm name in plain text (header, footer, favicon, OG image, blog Article schema, builders).
2. Remove the Google reviews section, the review invitation and the "Client Feedback" links.
3. Correct the CA India logo presentation (uncropped, white background) and its alt text.
4. Rephrase fee and comparative-cost claims.
5. Add a root `/404.html` that GitHub Pages actually serves (root-absolute links).
6. Disarm the stale `seo-overhaul.js` (refuse to run without `--force`, with an explanation).

### P1 — High (SEO, conversion, mobile, performance)
7. Rebuild the home page around the 5-second test: what, where, who, how to contact, plus the founder's credentials.
8. Descriptive H1s on core pages; fix blog post heading order (existing posts and the builder template).
9. Home "Latest updates" generated from the real newest posts by `blog-build.js` (it can't go stale again).
10. Click-to-load map (removes ~2–3 MB of third-party JS from the home page).
11. Mobile contact bar (Call · WhatsApp · Enquire), replacing the floating circle on phones.
12. Contact form: inline, accessible validation and a confirmation message.
13. Accessible nav toggle (`aria-expanded`, `aria-controls`, Escape to close, no inline JS).

### P2 — Design system
14. New tokens: ink-navy and warm-paper palette with a single restrained brass accent; no gradients on buttons.
15. Typography: Source Serif 4 for display headings (one web font, non-blocking, `display=swap`), the platform UI font for body text. Inter was trialled and dropped after measurement because it delayed first paint.
16. Consistent buttons, cards, focus rings, spacing scale, section rhythm; restrained motion with `prefers-reduced-motion` respected.
17. Page hero, service page, FAQ, related-services, footer and services hub restyled; services hub accordion opens on click only.

### P3 — Enhancements / owner input needed
18. ~~FRN and membership number~~: not shown, by owner decision.
19. Search Console export → CTR opportunity matrix.
20. Privacy-respecting analytics (needs your decision; see the final report).
