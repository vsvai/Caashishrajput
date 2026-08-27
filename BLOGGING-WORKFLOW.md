# Weekly Blog Content Pipeline

This folder + scripts give the site a repeatable weekly blog workflow for `caashishrajput.com`.
It turns Markdown drafts into fully-SEO'd HTML blog posts that match the existing site, then
regenerates the blog listing and sitemap. **Publishing to GitHub Pages is always a step you run
yourself** — nothing is pushed automatically.

## One-time setup

You already have Node.js installed. No dependencies to install — the scripts use only Node's
built-in modules.

## The weekly loop (4 steps)

### 1. Draft an article

```powershell
node scripts/blog-build.js new gst-invoice-requirements "GST Invoice Requirements in 2026"
```

This creates `blog/drafts/gst-invoice-requirements.md` with front matter you fill in:

```yaml
---
title: GST Invoice Requirements in 2026
slug: gst-invoice-requirements
category: GST
date: 2026-08-27
description: <short meta description ~155 chars with keyword + location>
---
```

Write the body in Markdown. Supported: `##` / `###` headings, paragraphs, `**bold**`,
`[links](url)`, `-` bullet / `1.` numbered lists, and Markdown tables
(`| a | b |` with a `---` separator row — rendered with the site's `.due-dates-table` style).

> **Accuracy matters (you are a practising CA).** Every due date, threshold, and penalty figure
> must be verified by you before publishing — the same rule the rest of this site follows.

### 2. Preview it (optional)

```powershell
node scripts/blog-build.js preview gst-invoice-requirements
```

Writes a render preview to a temp HTML file (printed in the output) you can open in a browser.

### 3. Publish it

```powershell
node scripts/blog-build.js publish gst-invoice-requirements
```

This:
- generates `blog/gst-invoice-requirements.html` (full SEO head, Article JSON-LD, breadcrumbs,
  author bio — matching the existing posts),
- moves the Markdown draft to `blog/_published/` as an archive,
- rebuilds the card grid in `blog.html` (newest first),
- adds/updates the post's `<url>` entry in `sitemap.xml`.

The script deliberately does **not** commit or push.

### 4. Deploy to GitHub Pages (you run this)

```powershell
git add -A
git commit -m "Publish blog: gst-invoice-requirements"
git push
```

Pushing to `main` triggers GitHub Pages to rebuild the live site at `https://caashishrajput.com`.

## Other commands

```powershell
node scripts/blog-build.js list      # show published posts and pending drafts
node scripts/blog-build.js rebuild   # re-generate blog.html + sitemap from existing posts
```

Or use the npm aliases: `npm run blog:new`, `blog:preview`, `blog:publish`, `blog:rebuild`, `blog:list`.
(If `npm` is blocked by the PowerShell execution policy, call `node scripts/blog-build.js ...` directly.)

## Where things live

- `blog/drafts/*.md` — drafts waiting for your review
- `blog/*.html` — the live, published posts
- `blog/_published/*.md` — archive of Markdown sources for posts you've published
- `blog.html` — the blog listing page (auto-updated on publish)
- `sitemap.xml` — blog URLs kept in sync on publish

## About "make me number 1"

Fresh, keyword-targeted, location-specific blog content published weekly is a genuine and
effective part of local SEO. But ranking is never guaranteed — Google ranks based on authority,
backlinks, page quality, and competition for each query. This pipeline gives you a reliable,
low-effort way to keep publishing consistently, which is the part that's fully in your control.
Review your Google Search Console performance regularly to see which topics are gaining traction.
