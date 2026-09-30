# Emmanuel Brendan — Portfolio

Static portfolio site: plain HTML, CSS and vanilla JavaScript. There is no
framework and no build step at deploy time — the files in this repo are the
site, so any static host can serve it as-is.

## Structure

```
index.html              Home
case-study.html         All work (filterable)
pages/*.html            One page per case study

partials/               Shared markup, single source of truth (see below)
scripts/                Dev tooling (Node, no dependencies)

assets/
  style.css             Global styles, tokens and all shared sections
  project.css           Case-study page layout (pages/*.html only)
  case-study.css        Work index layout (case-study.html only)
  main.js               All behaviour, one init function per feature
  fonts/                Self-hosted Boldonse display font
  images/               Page imagery (WebP for photos/screens, PNG for logos)
    logos/              Personal brand marks and favicon
    logos/clients/      Client logos for the "Trusted By" marquee
    icons/              Tool icons for the stack section
```

## Shared partials

Blocks that appear on every page — `head`, `nav`, `dock`, `testimonials`,
`trusted-by`, `contact`, `footer`, `scripts` — live once in `partials/` and
are copied into each page between marker comments:

```html
<!-- partial:footer -->
…generated, do not edit here…
<!-- /partial:footer -->
```

To change a shared block, edit the file in `partials/` and run:

```sh
npm run sync    # rewrite every page with the current partials
npm run check   # fail if any page is out of date (also runs in CI)
```

Inside a partial, `{{root}}` becomes the relative path to the site root
(`""` for root pages, `"../"` for `pages/`). Other `{{placeholders}}` take
their value from attributes on the page's marker, falling back to the
partial's `<!-- defaults: … -->` line — e.g. the work page swaps the dock's
last link with `<!-- partial:dock dockHref="index.html" dockLabel="HOME" -->`.

## Adding a case study

1. Copy an existing file in `pages/` and replace the page-specific content.
2. Keep the `partial:` markers as they are and run `npm run sync`.
3. Add a card for it to `case-study.html` (and the home work list if featured).
4. Export screenshots as WebP, at most 2400px wide.

## Contact form

The form posts to the EmailJS REST API from `assets/main.js`
(`EMAILJS` config). No SDK is loaded.
