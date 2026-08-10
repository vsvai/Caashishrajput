# NAP Audit — Ashish Jayalata & Associates

Date: **2026-08-10**. Purpose: reconcile the Name, Address, Phone used across the website, the JSON-LD, and the Google Business Profile.

## Canonical values (source of truth)

Stored once in `scripts/seo-data.js` and injected into JSON-LD and the footer component (`js/components.js`).

| Field | Canonical value |
|---|---|
| **Name** | Ashish Jayalata & Associates |
| **Street** | LG-3, S-14, Krishna Plaza, Vrindavan Garden |
| **City/Area** | Sahibabad, Ghaziabad |
| **State/Postcode** | Uttar Pradesh 201005 |
| **Country** | India |
| **Phone (display)** | +91 88025 86988 |
| **Phone (tel:)** | +918802586988 |
| **Email** | ca.ashishrajput@outlook.com |
| **Hours** | Mon–Sat 10:00–19:00 (Sun closed) |
| **Geo** | 28.6809421, 77.3457167 |
| **Place CID** | the same CID used by the Google reviews embed (unified map embed) |

Full street as one line (used in copy): **LG-3, S-14, Krishna Plaza, Vrindavan Garden, Sahibabad, Ghaziabad, Uttar Pradesh 201005, India**.

## Findings and fixes

1. **Street order was wrong in two places.** `index.html` (contact strip) and `contact.html` and `pages/privacy-policy.html` originally read `S-14, Krishna Plaza, LG-3, Vrindavan Garden, …` (a vertical order flipped to horizontal). Corrected to `LG-3, S-14, Krishna Plaza, Vrindavan Garden, …` on all three. Grep confirms no occurrence of `S-14, Krishna Plaza, LG-3` remains.
2. **Footer NAP was freeform.** `js/components.js` now renders a semantic `<address class="nap">` block with `nap-name / nap-street / nap-locality / nap-region / nap-phone / nap-email` classes — one canonical string across every page.
3. **JSON-LD `address`** now uses `streetAddress: "LG-3, S-14, Krishna Plaza"`, `addressLocality: "Vrindavan Garden, Sahibabad"`, `addressRegion: "Ghaziabad, Uttar Pradesh"`, `postalCode: "201005"`. (`addressLocality` carries the sub-area, matching Google's neighbourhood field; see operator note below.)
4. **Phone** is consistently `+91 88025 86988` (display) / `tel:+918802586988` (links) everywhere; no other number found.
5. **Map embed** on the home page was replaced with the Google business embed for the exact CID so the map and the reviews embed agree on the place.

## Validation checks (automated)

`scripts/validate-seo.js` checks, per HTML page:

- Old street order `S-14, Krishna Plaza, LG-3` is absent from visible HTML.
- A semantic `<address class="nap">` block is present and contains all six `nap-*` parts (`nap-name`, `nap-street`, `nap-locality`, `nap-region`, `nap-phone`, `nap-email`).
- On the home page, the phone call link is `tel:+918802586988`.
- Every `https://maps.app.goo.gl/…` occurrence equals the canonical maps link (no stale alternate links).
- JSON-LD `AccountingService.address` uses the canonical street order and the site's `sameAs` set is stable.

## Verified / not changeable from the repo

- `sameAs` set matches the links already live in the site header/footer. **Operator action:** log into Google Business Profile and confirm the profile address order reads exactly `LG-3, S-14, Krishna Plaza, Vrindavan Garden, Sahibabad` and the phone matches `+91 88025 86988` — then leave the address unchanged for at least 2–4 weeks so Google merges/revalidates the listing.
- `pages/404.html`, the Google Search Console verification file, and the sitemap are intentionally excluded from NAP checks.
