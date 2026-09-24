# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Marketing site for **Aerios** — "the Airport Operating System" from Blunav System Private Ltd. As of the v2 rewrite it is a **single self-contained page**: one `index.html` with inline `<style>` and inline `<script>`, plus photographs. No build system, no package manager, no backend.

```text
blunav-website/
├── index.html            # the entire site — inline CSS + inline JS
├── _config.yml           # GitHub Pages: keeps legacy/ and docs out of the published site
├── CNAME                 # blunav.in
├── favicon.ico
├── privacy-policy.pdf
├── assets/
│   ├── img/              # hero + section photographs, Blunav wordmark
│   └── icons/            # favicon.svg, apple-icon, android-chrome 192/512
├── brochures/            # aerios-{ams,orbis,vecta}.pdf, linked from the suite blocks
├── tools/                # local diagnostics, not published
└── legacy/
    └── v1/               # the previous five-page site, archived, not published
```

The v1 site (multi-page, extracted `shared.css`/`home.css`/`shared.js`, suite mega-menu, canvas orbital animation) lives in [legacy/v1/](legacy/v1/) for reference only. `_config.yml` excludes it from the GitHub Pages build, so nothing under `legacy/` is reachable from blunav.in. It is also on the `version-1` remote branch. Don't edit it; don't copy patterns out of it without checking they still fit the single-page structure.

## Running / previewing

No dev server, no build. Every internal link is either an in-page `#anchor` or a root-absolute file path, so a plain static server at the repo root is enough:

```sh
python3 -m http.server 8777    # then open http://127.0.0.1:8777/
```

Opening `index.html` from the filesystem also works, except that root-absolute paths (`/favicon.ico`, `/privacy-policy.pdf`) won't resolve.

## Architecture

### Everything is in index.html, on purpose

Tokens, layout, components, nav behaviour and the booking form all live in that one file — two `<style>`/`<script>` regions rather than separate asset files. Keep it that way unless the site grows past one page again. The v1 convention of one CSS file per page does not apply here.

### Design tokens

The `:root` custom properties at the top of the inline `<style>` are the whole palette: `--brand-500/600/700/900`, `--navbar`, `--coral`, the `--green-*`/`--amber-*`/`--slate-*` status triplets, `--sans` (IBM Plex Sans), `--mono` (IBM Plex Mono), `--w` (1160px content width). Border radius is 0 by product decision except on `.btn` and form fields (4px). Fonts come from Google Fonts with a preconnect; there is no dark theme.

### Section structure

Each `<section>` gets 96px vertical padding (64px under 900px) and, where it is a nav target, an `id` matching the nav link: `#suites`, `#platform`, `#how-we-work`, `#people`, `#contact`. The 96px padding is what keeps a section's heading clear of the 72px sticky header after an anchor jump — if you reduce it, add `scroll-margin-top` instead.

### Responsive

One breakpoint, `max-width: 900px`, which collapses every multi-column grid to a single column and swaps the nav for a `.nav-toggle` button. A second small breakpoint at 520px only stacks the modal's paired fields. Verified free of horizontal overflow at 390 / 768 / 1440px.

## The booking form

"Book a walkthrough" opens `#walkthrough-modal` (the only interactive feature on the site). Four triggers carry `data-open-modal`: nav CTA, hero CTA, contact card, footer link.

Delivery is **Web3Forms**, because GitHub Pages has no server:

- `WEB3FORMS_KEY` in the second inline `<script>` holds the access key. While it is still the `REPLACE_WITH_...` placeholder the form skips the network call entirely and goes straight to the mail fallback.
- **Two transports.** It POSTs JSON first (Web3Forms' documented AJAX shape), which is a preflighted CORS request. If that `fetch` rejects — a refused `OPTIONS`, or any network error — it retries once as `FormData`, which is a CORS *simple request* and needs no preflight. Don't collapse this back to one attempt without checking the preflight actually succeeds from the live origin.
- **`botcheck` is asymmetric between the two.** JSON sends `botcheck: false`; the multipart retry omits the field entirely, because form data would carry it as the *string* `"false"`, which the server-side spam check reads as a filled-in honeypot and silently drops. The hidden input is also named `botcheck` — that exact name is what Web3Forms looks for. Don't rename it or "tidy up" the asymmetry.
- **Failure is visible, never silent.** A reachable-but-refused response (bad key, quota, spam rules) shows the service's own message. Any failure renders a real clickable `mailto:` link plus both addresses as text, and deliberately does *not* reset the form. Programmatic `window.location.href = 'mailto:'` is attempted but never relied on — browsers block external-protocol navigation without a fresh user gesture, and many machines have no mail client registered.
- **Web3Forms cannot be tested from curl or a datacenter IP**: the whole domain 403s ("use our API in client side"), so live delivery can only be confirmed from a real browser on a normal connection. [tools/web3forms-check.html](tools/web3forms-check.html) does exactly that — open it locally, press the button, and it prints the raw response for both transports. It is excluded from the published build.

If the form ever needs a real backend, that means leaving GitHub Pages — there is no `/api/*` here.

## Known gaps

- Live email delivery has **not** been confirmed end to end — see the Web3Forms note above. Every code path is covered by the browser tests against a mocked endpoint, but no real message has been sent through the live service.
- `assets/img/blipper.jpg`, `fids-board.jpg`, `vecta-screen.jpg` and `blunav-logo.png` are unreferenced; they are kept for future sections.
- Sign-in points at `https://aerios.blunav.cloud` (no `www`). The `www.aerios.blunav.cloud` host resolves but its TLS certificate covers only the apex name, so the `www` form throws a browser security warning. Don't "fix" it back to `www` unless the certificate is reissued with that SAN.

## Editing conventions

- Keep CSS and JS inline in `index.html`; don't extract asset files for a single page.
- Prefix new selectors by section (`.layer-`, `.stack-`, `.work-`, `.pcell`, `.foot-`) to avoid collisions in the shared stylesheet.
- Below-the-fold `<img>` tags carry `loading="lazy"` and explicit `width`/`height`. Keep both.
- The JS is deliberately ES5-style (`var`, no arrow functions, no optional chaining) with no build step. Match it.
- `index.html` is ~680 lines with the CSS included. Use `Grep` with tight patterns + `-n` to locate sections rather than reading the whole file.
