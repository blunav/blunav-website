# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Marketing/product site for **Aerios** — "the operating system for airports." Five static HTML pages with extracted CSS and JS — no build system, no package manager, no tests, no backend.

```text
website/
├── home.html, about.html, contact.html, demo.html, login.html
├── assets/
│   ├── css/
│   │   ├── shared.css   # tokens, reset, nav, suite mega-menu, buttons, footer (4 pages, not login)
│   │   ├── home.css     # hero, proof bar, platform/module/arch/metric/quote/cta sections, suite cards
│   │   ├── about.css, contact.css, demo.css   # page-specific
│   │   └── login.css    # standalone — own design tokens, no nav
│   └── js/
│       ├── shared.js    # mega-menu IIFE + IntersectionObserver reveal (4 pages, not login)
│       ├── home.js      # platform-canvas orbital animation
│       ├── contact.js, demo.js   # form preventDefault + show success state
│       └── login.js     # password toggle, validation, fake submit
└── CLAUDE.md
```

## Running / previewing

No dev server, no build. Open files directly in a browser, or serve statically:

```sh
cd website && python -m http.server 8000
# then http://localhost:8000/home.html
```

Cross-page navigation links currently point to `href="#"` (placeholders) — pages are not wired together yet.

## Architecture: things that span multiple files

### Nav HTML is still duplicated across 4 pages

`home.html`, `about.html`, `demo.html`, and `contact.html` each contain an identical `<nav>` block in the body — sticky top nav with a multi-pane "product suite" mega-menu (the `.suite-rail-item` / `.suite-pane` rail-and-pane structure). [login.html](login.html) is the exception — stripped-down layout, no nav.

The nav's **CSS and JS are deduplicated** (shared.css + shared.js), but the **HTML markup is not**. Any nav HTML change (new link, new product module, copy edit) must be applied to all four files.

### Design tokens live in `shared.css` only

The `:root` custom properties — `--navy`, `--accent`, `--gold`, `--text` family, `--font` (DM Sans), `--mono` (DM Mono), `--r`, `--r-lg`, `--sh*`, `--tr` — are declared once in `assets/css/shared.css`. Changing a token changes it everywhere. login.css declares its own (different) tokens.

### Reveal-on-scroll pattern

Elements with class `reveal` or `reveal-fast` start hidden/translated; an `IntersectionObserver` in `shared.js` adds `.visible` as they enter the viewport (threshold 0.1, `-40px` bottom rootMargin). Add new sections with this pattern rather than inventing a new one.

### Fonts

`shared.css`-loading pages use DM Sans + DM Mono + Instrument Sans. login.html uses just DM Sans + DM Mono (different `<link>` URL). All pages preconnect to `fonts.googleapis.com` and `fonts.gstatic.com`.

## Page-specific behavior

- [home.html](home.html) — Canvas animation (`#platformCanvas`) in [home.js](assets/js/home.js): the orbital "platform visual" with 6 satellite cards around a central AODB hub. The `MODULES` array is the source of truth for which products appear; edit there, not in the canvas drawing code.
- [login.html](login.html) — only page with a real form interaction in [login.js](assets/js/login.js): password show/hide, live email/password validation, simulated submit (always shows an error after 1.8s — it's a demo), fake forgot-password success.
- [contact.html](contact.html) and [demo.html](demo.html) — forms call `e.preventDefault()` and toggle an inline success state. They don't post anywhere.

## Editing conventions

- All `<script src>` tags use `defer`. Keep that when adding new scripts.
- One CSS file per page (`<page>.css`) plus `shared.css`. Keep selectors prefixed by section (`.about-`, `.contact-`, `.demo-`, `.suite-`) to avoid collisions.
- Don't reintroduce inline `<style>` or `<script>` blocks in HTML pages.
- Files are still large in places (home.html body is ~2k lines of markup). Use `Grep` with tight patterns + `-n` rather than reading whole files when locating sections.
