# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Marketing/product site for **Aerios** — "the operating system for airports." Five standalone HTML pages, no build system, no package manager, no tests, no backend. Each page is a single file containing its own CSS (in a `<style>` block in `<head>`) and JS (in a `<script>` block before `</body>`).

Pages: [home.html](home.html) (~2.4k lines), [about.html](about.html), [demo.html](demo.html), [contact.html](contact.html), [login.html](login.html).

## Running / previewing

There is no dev server, no `npm install`, no build step. Open the files directly in a browser, or serve the directory statically — e.g. `python -m http.server` from [d:/claude-code/website](.) and visit `http://localhost:8000/home.html`.

All cross-page navigation links currently point to `href="#"` (placeholders) — the pages are not yet wired together. If you add real navigation, update every page's nav block (see below).

## Architecture: things that span multiple files

### The nav is copy-pasted across 4 pages

`home.html`, `about.html`, `demo.html`, and `contact.html` each contain an identical sticky top nav with a multi-pane "product suite" mega-menu (the `.suite-rail-item` / `.suite-pane` rail-and-pane structure). [login.html](login.html) is the exception — it uses a stripped-down layout with no nav.

**Implication:** any nav change (new link, new product module, copy edit, logo tweak) must be applied to all four files. There is no template system. Use `Grep` to find the exact block in each file before editing, and verify the four files stay in sync afterward.

The mega-menu is driven by a small IIFE that toggles `is-active`/`is-visible` classes when a `.suite-rail-item` is hovered or focused. That same IIFE is also duplicated across the four pages.

### Design tokens are duplicated, not shared

Every page redeclares the same `:root` custom properties at the top of its `<style>` block:

- Colors: `--navy` (#1a3c6e), `--navy-dark`, `--accent` (#3b6fd4), `--gold` (#ef4847), `--green`, `--surface`, `--page-bg`, `--border`, `--text` / `--text-2` / `--text-3`
- Type: `--font` (DM Sans), `--mono` (DM Mono); display headings use Instrument Sans
- Geometry: `--r` (10px), `--r-lg` (16px), `--sh` / `--sh-lg` (shadow tokens), `--tr` (220ms cubic-bezier transition)

If a token changes, change it in every page. Don't introduce new colors ad-hoc — reach for an existing token first.

### Reveal-on-scroll is a shared pattern

Each page uses the same idiom: elements with class `reveal` or `reveal-fast` start hidden/translated, and an `IntersectionObserver` adds `.visible` as they enter the viewport (threshold 0.1, `-40px` bottom rootMargin). When adding new sections, follow this pattern rather than inventing a new one.

### Fonts

All pages load DM Sans, DM Mono, and Instrument Sans from Google Fonts via a single `<link>` in `<head>`. Keep the font list aligned across pages so a new page doesn't ship without a face it uses.

## Page-specific behavior

- [home.html](home.html) has a custom Canvas animation (`#platformCanvas`) — the orbital "platform visual" with 6 satellite module cards around a central AODB hub, animated pulses, and rotating telemetry strings. The module list (`MODULES` array) is the source of truth for which products appear in the visual; edit there, not in the canvas drawing code.
- [login.html](login.html) is the only page with a real form interaction: password show/hide toggle, live email/password validation, simulated submit (always shows an error after 1.8s — it's a demo), and a "forgot password" flow that fakes a success message. No actual auth backend.
- [contact.html](contact.html) and [demo.html](demo.html) forms call `e.preventDefault()` and show an inline success state — they don't post anywhere.

## Editing conventions

- HTML, CSS, and JS all live in one file per page. Don't extract into separate `.css`/`.js` files unless the user asks — the single-file-per-page structure is intentional for this project's stage.
- Keep CSS selectors scoped to the section they belong to (the existing code uses block prefixes like `.nav-`, `.suite-`, `.contact-`, `.demo-`). Avoid generic class names that could collide.
- Files are large (1.8k–2.4k lines). Use `Grep` with a tight pattern + `-n` to locate sections; reading whole files wastes context.
